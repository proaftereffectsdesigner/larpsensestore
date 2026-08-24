import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from "@supabase/supabase-js";
import { processAffiliateCommission } from "@/lib/affiliate";
import { sendOrderNotification } from "@/lib/discord";

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key_for_build', {
    apiVersion: "2025-01-27.acacia" as any,
  });

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
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
        if (error) {
          console.error("Error updating balance in webhook:", error);
        } else {
          // Record top-up in orders table so it shows up in dashboard
          await supabaseAdmin.from("orders").insert({
            user_id: userId,
            product_id: "topup",
            quantity: 1,
            total_price: addedAmount,
            status: "completed",
            accounts_data: `Balance Top-up (Stripe) [${session.id}]`
          });

          // Process affiliate commission
          const appliedPromoCode = session.metadata?.appliedPromoCode;
          await processAffiliateCommission(supabaseAdmin, userId, addedAmount, appliedPromoCode);

          // Push updated Discord metadata (total_spent, spent_10_eur) after balance top-up
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
    } else if (type === "product_checkout") {
      const productId = session.metadata?.productId;
      const quantity = Number(session.metadata?.quantity || 1);
      const totalPrice = Number(session.metadata?.totalPrice || 0);

      const { products } = await import("@/lib/products");
      const product = products.find(p => p.id === productId);
      const nfaEndpoint = product ? product.endpoint : "cs2";
      const nfaType = product ? product.type : productId!;

      console.log(`Fulfilling product checkout for user ${userId}, product ${productId}, quantity ${quantity}`);

      // Use Stripe session ID as idempotency key — safe to retry
      const { buyNfaAccounts } = await import("@/lib/nfa");
      let accountsStr = "";
      let fulfilled = false;

      try {
        const nfaResult = await buyNfaAccounts(
          nfaEndpoint,
          nfaType,
          quantity,
          `stripe-${session.id}` // unique per Stripe session → no double charges
        );
        accountsStr = nfaResult.accounts.join("\n");
        fulfilled = nfaResult.accounts.length > 0;
        console.log(`NFA delivered ${nfaResult.accounts.length} accounts for ${productId}`);
      } catch (nfaErr) {
        console.error("NFA API error during Stripe fulfillment:", nfaErr);
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
        } else {
          // Process affiliate commission
          const appliedPromoCode = session.metadata?.appliedPromoCode;
          const isStandardPromo = session.metadata?.isStandardPromo === "true";
          const promoCodeId = session.metadata?.promoCodeId;

          if (isStandardPromo && promoCodeId) {
            const { data: codeData } = await supabaseAdmin.from("promo_codes").select("current_uses").eq("id", promoCodeId).single();
            if (codeData) {
              await supabaseAdmin.from("promo_codes").update({ current_uses: codeData.current_uses + 1 }).eq("id", promoCodeId);
              await supabaseAdmin.from("promo_code_usages").insert({ user_id: userId, promo_code_id: promoCodeId });
            }
          } else {
            await processAffiliateCommission(supabaseAdmin, userId, totalPrice, appliedPromoCode);
          }

          // Send discord notification
          await sendOrderNotification(supabaseAdmin, userId, productId as string, quantity, totalPrice, "Stripe", session.id);
        }
      } else {
        // Refund to balance if NFA failed or returned no accounts
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
              accounts_data: `Refund — NFA fulfillment failed [Stripe: ${session.id}]`,
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
