import { NextResponse } from 'next/server';
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const payload = await req.text();
  const headers = req.headers;
  
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error("Missing POLAR_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Configuration error" }, { status: 500 });
  }

  let event;
  try {
    event = validateEvent(payload, Object.fromEntries(headers.entries()), webhookSecret);
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      console.error(`⚠️ Webhook signature verification failed.`, error.message);
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }

  // Handle the event
  // Depending on Polar API version, it's checkout.updated or order.created
  if (event.type === 'checkout.updated') {
    const session = event.data;
    
    // Process only succeeded checkouts
    if (session.status !== 'succeeded') {
      return NextResponse.json({ received: true });
    }

    const type = session.metadata?.type || "topup"; // default to topup
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
        if (error) {
          console.error("Error updating balance in webhook:", error);
        } else {
          await supabaseAdmin.from("orders").insert({
            user_id: userId,
            product_id: "topup",
            quantity: 1,
            total_price: addedAmount,
            status: "completed",
            accounts_data: `Balance Top-up (Polar) [${session.id}]`
          });
        }
      }
    } else if (type === "product_checkout") {
      const productId = session.metadata?.productId;
      const quantity = Number(session.metadata?.quantity || 1);
      const totalPrice = Number(session.metadata?.totalPrice || 0);

      console.log(`Fulfilling product checkout for user ${userId}, product ${productId}, quantity ${quantity}`);

      const { buyNfaAccounts } = await import("@/lib/nfa");
      let accountsStr = "";
      let fulfilled = false;

      try {
        const nfaResult = await buyNfaAccounts(
          String(productId),
          quantity,
          `polar-${session.id}` // unique idempotency key
        );
        accountsStr = nfaResult.accounts.join("\n");
        fulfilled = nfaResult.accounts.length > 0;
        console.log(`NFA delivered ${nfaResult.accounts.length} accounts for ${productId}`);
      } catch (nfaErr) {
        console.error("NFA API error during Polar fulfillment:", nfaErr);
      }

      if (fulfilled) {
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
          console.error("Supabase error saving completed order in webhook:", dbError);
          // FALLBACK
          console.error("FALLBACK ALERT: Saving accounts locally or to Discord webhook because DB failed!");
        }
      } else {
        // Refund to balance if NFA failed
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("balance")
          .eq("id", userId)
          .single();

        if (profile) {
          const newBalance = Number(profile.balance) + totalPrice;
          await supabaseAdmin
            .from("profiles")
            .update({ balance: newBalance })
            .eq("id", userId);

          await supabaseAdmin
            .from("orders")
            .insert({
              user_id: userId,
              product_id: productId,
              quantity: quantity,
              total_price: totalPrice,
              status: "refunded",
              accounts_data: `Refund — NFA fulfillment failed [Polar: ${session.id}]`,
            });
        }
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
    }
  }

  return NextResponse.json({ received: true });
}
