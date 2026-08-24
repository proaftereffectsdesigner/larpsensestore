import { NextResponse } from "next/server";
import { products } from "@/lib/products";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { convertToCurrency } from "@/lib/exchangeRates";

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

    const { productId, quantity: clientQuantity, userId, token, paymentMethod, currency, promoCode } = await req.json();
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

    let totalPrice = product.price * quantity;
    let discountPct = 0;
    let appliedPromoCode = "";
    let affiliateOwnerId = null;
    let commissionPct = 10;

    let isStandardPromo = false;
    let promoCodeId = "";
    let standardCodeData: any = null;

    if (promoCode) {
      const codeUpper = promoCode.toUpperCase();
      
      // 1. Check if it's a standard promo code
      const { data: standardCode } = await supabaseAdmin.from("promo_codes").select("*").eq("code", codeUpper).single();
      
      if (standardCode) {
        const isExpired = standardCode.expires_at && new Date(standardCode.expires_at).getTime() < Date.now();
        const isDepleted = standardCode.max_uses && standardCode.current_uses >= standardCode.max_uses;
        
        if (!isExpired && !isDepleted) {
          const { data: profile } = await supabaseAdmin.from("profiles").select("total_spent").eq("id", userId).single();
          const totalSpent = profile ? Number(profile.total_spent) : 0;
          
          if (totalSpent >= Number(standardCode.min_spent)) {
            const { data: usage } = await supabaseAdmin.from("promo_code_usages").select("*").eq("user_id", userId).eq("promo_code_id", standardCode.id).single();
            if (!usage) {
              discountPct = standardCode.discount_pct;
              appliedPromoCode = codeUpper;
              isStandardPromo = true;
              promoCodeId = standardCode.id;
              standardCodeData = standardCode;
            }
          }
        }
      }

      // 2. If not a standard promo, check if it's an affiliate code
      if (!appliedPromoCode) {
        const { data: profile } = await supabaseAdmin.from("profiles").select("used_first_discount, referred_by").eq("id", userId).single();
        if (profile && !profile.used_first_discount && !profile.referred_by) {
          const { data: codeData } = await supabaseAdmin.from("affiliate_codes").select("*").eq("code", codeUpper).single();
          if (codeData && codeData.owner_id !== userId) {
            discountPct = codeData.discount_pct || 10;
            commissionPct = codeData.commission_pct || 10;
            appliedPromoCode = codeData.code;
            affiliateOwnerId = codeData.owner_id;
          }
        }
      }
    }

    if (discountPct > 0) {
      totalPrice = Number((totalPrice * (1 - discountPct / 100)).toFixed(2));
    }

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

      const targetCurrency = (currency || "eur").toLowerCase();
      const finalAmountInTarget = await convertToCurrency(finalAmount, targetCurrency);

      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: targetCurrency,
              product_data: {
                name: `LarpSense Store - ${product.name} (x${quantity})`,
              },
              unit_amount: Math.round(finalAmountInTarget * 100),
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
          totalPrice: totalPrice.toString(),
          appliedPromoCode,
          isStandardPromo: isStandardPromo ? "true" : "false",
          promoCodeId: promoCodeId || ""
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
        product.endpoint,
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

    // Apply affiliate commission for Balance payment
    if (appliedPromoCode && affiliateOwnerId) {
      // Link the user
      await supabaseAdmin.from("profiles").update({ 
        referred_by: affiliateOwnerId,
        used_first_discount: true
      }).eq("id", userId);

      // Give commission to affiliate
      const commission = Number((totalPrice * (commissionPct / 100)).toFixed(2));
      if (commission > 0) {
        const { data: affProfile } = await supabaseAdmin.from("profiles").select("balance").eq("id", affiliateOwnerId).single();
        if (affProfile) {
          const newAffBalance = Number(affProfile.balance) + commission;
          await supabaseAdmin.from("profiles").update({ balance: newAffBalance }).eq("id", affiliateOwnerId);
        }
      }
    } else {
      // Regular lifetime commission
      const { data: profile } = await supabaseAdmin.from("profiles").select("referred_by").eq("id", userId).single();
      if (profile && profile.referred_by) {
        const commission = Number((totalPrice * 0.10).toFixed(2)); // default 10% lifetime
        if (commission > 0) {
          const { data: affProfile } = await supabaseAdmin.from("profiles").select("balance").eq("id", profile.referred_by).single();
          if (affProfile) {
            const newAffBalance = Number(affProfile.balance) + commission;
            await supabaseAdmin.from("profiles").update({ balance: newAffBalance }).eq("id", profile.referred_by);
          }
        }
      }
    }

    // Apply promo code usage if standard
    if (isStandardPromo && promoCodeId && standardCodeData) {
      await supabaseAdmin.from("promo_codes").update({ current_uses: standardCodeData.current_uses + 1 }).eq("id", promoCodeId);
      await supabaseAdmin.from("promo_code_usages").insert({ user_id: userId, promo_code_id: promoCodeId });
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
