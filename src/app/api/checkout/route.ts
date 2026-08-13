import { NextResponse } from "next/server";
import { products } from "@/lib/products";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // Rate limit: max 10 checkout attempts per minute per IP
    const ip = getClientIp(req);
    const rl = rateLimit(`checkout-balance:${ip}`, { maxRequests: 10, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${rl.resetInSeconds}s.` },
        { status: 429 }
      );
    }

    const { productId, quantity: clientQuantity, userId, token, paymentMethod } = await req.json();
    const quantity = Math.max(1, Math.floor(Number(clientQuantity || 1)));

    if (!productId || !quantity || quantity < 1 || quantity > 100 || !userId || !token) {
      return NextResponse.json({ error: "Invalid parameters or not logged in" }, { status: 400 });
    }

    const product = products.find((p) => p.id === productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized or invalid session token." }, { status: 401 });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check restrictions first
    const { data: profileCheck } = await supabaseAdmin.from("profiles").select("is_banned, can_purchase").eq("id", userId).single();
    if (profileCheck?.is_banned) {
      return NextResponse.json({ error: "Your account has been banned." }, { status: 403 });
    }
    if (profileCheck?.can_purchase === false) {
      return NextResponse.json({ error: "You are currently restricted from purchasing." }, { status: 403 });
    }

    const totalPrice = product.price * quantity;

    if (paymentMethod === "balance") {
      const { data: profile } = await supabaseAdmin.from("profiles").select("balance").eq("id", userId).single();
      const currentBalance = profile ? Number(profile.balance) : 0;
      
      if (currentBalance < totalPrice) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
      }

      const { error: updateError } = await supabaseAdmin.from("profiles").update({ balance: currentBalance - totalPrice }).eq("id", userId);
      if (updateError) {
        return NextResponse.json({ error: "Failed to deduct balance" }, { status: 500 });
      }
    }

    if (paymentMethod === "crypto") {
      return NextResponse.json({ url: "/crypto-mock" });
    }

    if (paymentMethod === "stripe") {
      const Stripe = require('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-01-27.acacia" as any });

      const feeMultiplier = 0.015;
      const fixedFee = 0.25;
      const cardFee = Number((totalPrice * feeMultiplier + fixedFee).toFixed(2));
      const finalAmount = totalPrice + cardFee;

      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `LarpSense Store - ${product.name} (x${quantity})`,
              },
              unit_amount: Math.round(finalAmount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        client_reference_id: userId,
        metadata: {
          type: "product_checkout",
          userId: userId,
          productId: product.id,
          quantity: quantity.toString(),
          totalPrice: totalPrice.toString()
        },
        success_url: `${req.headers.get("origin")}/dashboard?order=success`,
        cancel_url: `${req.headers.get("origin")}/product/${product.id}`,
      });

      return NextResponse.json({ url: session.url });
    }

    // Balance payment — proceed to NFA fulfillment
    let accountsStr = "";
    let fulfilled = false;
    try {
      const { buyNfaAccounts } = await import("@/lib/nfa");
      const nfaResult = await buyNfaAccounts(
        product.type,
        quantity,
        `balance-${userId}-${Date.now()}`
      );
      accountsStr = nfaResult.accounts.join("\n");
      fulfilled = nfaResult.accounts.length > 0;
    } catch (nfaErr) {
      console.error("NFA API error during Balance fulfillment:", nfaErr);
    }

    if (!fulfilled) {
      // Refund if NFA failed
      const { data: profile } = await supabaseAdmin.from("profiles").select("balance").eq("id", userId).single();
      if (profile) {
        const newBalance = Number(profile.balance) + totalPrice;
        await supabaseAdmin.from("profiles").update({ balance: newBalance }).eq("id", userId);
      }

      const { data: orderData } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          product_id: product.id,
          quantity: quantity,
          total_price: totalPrice,
          status: "refunded",
          accounts_data: "Refund — NFA fulfillment failed",
        })
        .select()
        .single();
        
      return NextResponse.json({ url: `/order/${orderData?.id || 'error'}` });
    }

    const { data: orderData, error: dbError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        product_id: product.id,
        quantity: quantity,
        total_price: totalPrice,
        status: "completed",
        accounts_data: accountsStr,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Supabase error saving order:", dbError);
      return NextResponse.json({ 
        url: `/order/error?accounts=${encodeURIComponent(accountsStr)}` 
      });
    }

    // Push updated metadata to Discord if user is linked
    fetch(new URL('/api/discord/update-metadata', req.url).toString(), {
      method: 'POST',
      body: JSON.stringify({ userId }),
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VERIFICATION_JWT_SECRET}`
      }
    }).catch(console.error);

    return NextResponse.json({ url: `/order/${orderData.id}` });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
