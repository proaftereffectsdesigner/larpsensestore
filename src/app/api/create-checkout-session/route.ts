import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { convertToCurrency } from "@/lib/exchangeRates";

export async function POST(req: Request) {
  try {
    // Initialize Stripe with the secret key from env
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key_for_build', {
      apiVersion: "2025-01-27.acacia" as any, // using any to bypass strict version typings if needed, but it's fine
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    // Rate limit: max 10 checkout sessions per minute per IP
    const ip = getClientIp(req);
    const rl = rateLimit(`checkout:${ip}`, { maxRequests: 10, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${rl.resetInSeconds}s.` },
        { status: 429 }
      );
    }
    const { userId, amount, paymentMethod, token, currency, promoCode } = await req.json();

    if (!userId || !amount || amount < 2 || !token) {
      return NextResponse.json({ error: "Invalid parameters or unauthorized" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized or invalid session token." }, { status: 401 });
    }

    // Check restrictions
    const { data: profile } = await supabaseAdmin.from("profiles").select("is_banned, can_topup").eq("id", userId).single();
    if (profile?.is_banned) {
      return NextResponse.json({ error: "Your account has been banned." }, { status: 403 });
    }
    if (profile?.can_topup === false) {
      return NextResponse.json({ error: "You are currently restricted from adding balance." }, { status: 403 });
    }

    // Handle Promo Code
    let discountPct = 0;
    let appliedPromoCode = "";

    if (promoCode) {
      const { data: profile } = await supabaseAdmin.from("profiles").select("used_first_discount, referred_by").eq("id", userId).single();
      if (profile && !profile.used_first_discount && !profile.referred_by) {
        const { data: codeData } = await supabaseAdmin.from("affiliate_codes").select("*").eq("code", promoCode.toUpperCase()).single();
        if (codeData && codeData.owner_id !== userId) {
          discountPct = codeData.discount_pct || 10;
          appliedPromoCode = codeData.code;
        }
      }
    }

    let costAmount = amount;
    if (discountPct > 0) {
      costAmount = Number((costAmount * (1 - discountPct / 100)).toFixed(2));
    }

    // Calculate fees (currently only Card/Stripe uses this gateway in checkout)
    // Calculate cost and bonus
    const costInEur = Number((amount * 1.015 + 0.25).toFixed(2));
    const finalAmountAdded = Number((amount * (1 + discountPct / 100)).toFixed(2));
    const targetCurrencyAmount = await convertToCurrency(costInEur, 'EUR', currency || 'EUR');

    // Create Checkout Sessions from body params.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: (currency || "eur").toLowerCase(),
            product_data: {
              name: "Balance Top-up",
              description: discountPct > 0 ? `Includes +${discountPct}% bonus from promo code!` : "Add funds to your LarpSense wallet",
            },
            unit_amount: Math.round(targetCurrencyAmount * 100), // Stripe expects amounts in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      client_reference_id: userId,
      metadata: {
        userId: userId,
        addedAmount: finalAmountAdded.toString(),
        type: "topup",
        promoCode: appliedPromoCode || ""
      },
      success_url: `${req.headers.get("origin")}/dashboard?topup=success`,
      cancel_url: `${req.headers.get("origin")}/`,
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
