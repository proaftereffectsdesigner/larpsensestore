import { NextResponse } from "next/server";
import { products } from "@/lib/products";
import { createClient } from "@supabase/supabase-js";

// Symulacja integracji Stripe Checkout
export async function POST(req: Request) {
  try {
    const { productId, quantity, userId, token, paymentMethod } = await req.json();

    if (!productId || !quantity || quantity < 1 || quantity > 100 || !userId || !token) {
      return NextResponse.json({ error: "Invalid parameters or not logged in" }, { status: 400 });
    }

    const product = products.find((p) => p.id === productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Inicjalizacja Supabase wraz z przekazaniem access_token, aby ominąć błąd RLS
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

    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
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
        cancel_url: `${req.headers.get("origin")}/category/${product.id}`,
      });

      return NextResponse.json({ url: session.url });
    }

    // Jeśli zapłacono przez Balance, kontynuujemy z realizacją natychmiastową

    let accountsStr = "";
    const NFA_API_KEY = process.env.NFA_API_KEY;
    const NFA_API_URL = process.env.NFA_API_URL || "https://www.nfa.pub/api/v1";

    if (!NFA_API_KEY) {
      return NextResponse.json({ error: "Missing NFA_API_KEY in environment" }, { status: 500 });
    }

    // TEMPORARY MOCK FOR NFA API
    // TODO: Replace with real NFA API fetch when documentation and keys are ready
    const nfaData = {
      ok: true,
      accounts: Array.from({ length: quantity }, (_, i) => `mock_account_${i + 1}@example.com:password123`)
    };

    /*
    // TRYB PRAWDZIWY: STRIPE / BALANCE -> NFA API
    const nfaRes = await fetch(`${NFA_API_URL}/cs2?type=${product.type}&quantity=${quantity}&result=json`, {
      method: "POST",
      headers: {
        "X-Api-Key": NFA_API_KEY,
      },
    });

    let nfaData;
    const rawText = await nfaRes.text();
    try {
      nfaData = JSON.parse(rawText);
    } catch(e) {
      // Jeśli pobrano kasę, a API NFA nie działa - idealnie byłoby zwrócić środki.
      return NextResponse.json({ error: "Invalid NFA API Response", raw: rawText }, { status: 400 });
    }

    if (!nfaRes.ok || !nfaData.ok) {
      return NextResponse.json({ error: nfaData.error || nfaData.code || "Failed at NFA API" }, { status: 400 });
    }
    */

    accountsStr = nfaData.accounts.join("\n");

    // Zapis do Supabase używając prawdziwego ID użytkownika
    const { data: orderData, error: dbError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        product_id: product.id,
        quantity: quantity,
        total_price: product.price * quantity,
        status: "completed",
        accounts_data: accountsStr,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Supabase error saving order:", dbError);
      // Mimo błędu zapisu, klient zapłacił i pobraliśmy konto - przekierujemy go z kontami w query dla ratunku
      return NextResponse.json({ 
        url: `/order/error?accounts=${encodeURIComponent(accountsStr)}` 
      });
    }

    // Push updated metadata to Discord if user is linked
    fetch(new URL('/api/discord/update-metadata', req.url).toString(), {
      method: 'POST',
      body: JSON.stringify({ userId }),
      headers: { 'Content-Type': 'application/json' }
    }).catch(console.error);

    // Przekierowanie na stronę zamówienia po "udanym powrocie ze Stripe"
    return NextResponse.json({ url: `/order/${orderData.id}` });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
