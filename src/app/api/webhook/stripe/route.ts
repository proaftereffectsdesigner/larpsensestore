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
    
    // Fulfill the purchase...
    const userId = session.metadata?.userId;
    const addedAmount = Number(session.metadata?.addedAmount);

    if (userId && addedAmount) {
      console.log(`Fulfilling topup for user ${userId} amount ${addedAmount}`);
      
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // fallback to anon if service role not set (not ideal but works for testing)

      // We need to bypass RLS here because this is a server-to-server webhook without a user's Auth token.
      // We must use the SERVICE_ROLE_KEY to update the profile directly.
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Fetch current balance
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("balance")
        .eq("id", userId)
        .single();

      const currentBalance = profile ? Number(profile.balance) : 0;
      const newBalance = currentBalance + addedAmount;

      // Update balance
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", userId);

      if (error) {
        console.error("Error updating balance in webhook:", error);
        return NextResponse.json({ error: "Failed to update balance" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
