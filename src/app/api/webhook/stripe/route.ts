import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia" as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    if (!signature || !endpointSecret) throw new Error("Missing signature or webhook secret");
    event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  } catch (err: any) {
    console.error(`⚠️ Webhook signature verification failed.`, err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const type = session.metadata?.type || "topup"; // default to topup for backward compatibility
    
    const userId = session.metadata?.userId;
    
    if (!userId) {
      console.error("No userId in session metadata", session.id);
      return NextResponse.json({ received: true });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (type === "topup") {
      const addedAmount = Number(session.metadata?.addedAmount);
      if (addedAmount) {
        console.log(`Fulfilling topup for user ${userId} amount ${addedAmount}`);
        
        const { data: profile } = await supabaseAdmin.from("profiles").select("balance").eq("id", userId).single();
        const currentBalance = profile ? Number(profile.balance) : 0;
        const newBalance = currentBalance + addedAmount;

        const { error } = await supabaseAdmin.from("profiles").update({ balance: newBalance }).eq("id", userId);
        if (error) console.error("Error updating balance in webhook:", error);
      }
    } else if (type === "product_checkout") {
      const productId = session.metadata?.productId;
      const quantity = Number(session.metadata?.quantity || 1);
      const totalPrice = Number(session.metadata?.totalPrice || 0);

      console.log(`Fulfilling product checkout for user ${userId}, product ${productId}, quantity ${quantity}`);

      // TEMPORARY MOCK FOR NFA API (same as checkout route)
      const accounts = Array.from({ length: quantity }, (_, i) => `mock_account_${i + 1}@example.com:password123`);
      const accountsStr = accounts.join("\n");

      const { error: dbError } = await supabaseAdmin
        .from("orders")
        .insert({
          user_id: userId,
          product_id: productId,
          quantity: quantity,
          total_price: totalPrice,
          status: "completed",
          accounts_data: accountsStr,
        });

      if (dbError) {
        console.error("Supabase error saving order in webhook:", dbError);
      } else {
        // Push updated metadata to Discord if user is linked
        fetch(new URL('/api/discord/update-metadata', req.url).toString(), {
          method: 'POST',
          body: JSON.stringify({ userId }),
          headers: { 'Content-Type': 'application/json' }
        }).catch(console.error);
      }
    }
  }

  return NextResponse.json({ received: true });
}
