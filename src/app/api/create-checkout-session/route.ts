import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Initialize Stripe with the secret key from env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia" as any, // using any to bypass strict version typings if needed, but it's fine
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const { userId, amount, paymentMethod, token } = await req.json();

    if (!userId || !amount || amount < 0.50 || !token) {
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

    // Calculate fees (currently only Card/Stripe uses this gateway in checkout)
    const feeMultiplier = 0.015;
    const fixedFee = 0.25;

    const cardFee = Number((amount * feeMultiplier + fixedFee).toFixed(2));
    const totalAmount = amount + cardFee;

    // Create Checkout Sessions from body params.
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'LarpSense Store Balance Top-Up',
              description: `Top up €${amount.toFixed(2)} to your balance.`,
            },
            unit_amount: Math.round(totalAmount * 100), // Stripe expects amounts in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Pass the userId in metadata so we can identify the user in the webhook
      client_reference_id: userId,
      metadata: {
        userId: userId,
        addedAmount: amount.toString(), // Store the pure amount without fee to add to balance
      },
      // Redirect URLs
      success_url: `${req.headers.get("origin")}/dashboard?topup=success`,
      cancel_url: `${req.headers.get("origin")}/`,
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
