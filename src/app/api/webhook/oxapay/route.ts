import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import crypto from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OXAPAY_MERCHANT_KEY = process.env.OXAPAY_MERCHANT_KEY;

// removed local verifyOxaPayWebhook function

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`oxapay-webhook:${ip}`, { maxRequests: 100, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (!OXAPAY_MERCHANT_KEY) {
      return NextResponse.json({ error: "Missing OXAPAY_MERCHANT_KEY" }, { status: 500 });
    }

    const rawBody = await req.text();
    let data: any;
    try {
      data = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const txnId = data.trackId || data.track_id; 
    let orderNumber = data.orderId || data.order_id;

    if (!orderNumber || !txnId) {
      console.warn("OxaPay webhook: Missing order metadata", data);
      return NextResponse.json({ error: "Missing order metadata" }, { status: 400 });
    }

    // Reverse Verification: Ask OxaPay API about this trackId to guarantee it's Paid
    try {
      const verifyRes = await fetch("https://api.oxapay.com/v1/payment/paymentInfo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "merchant_api_key": OXAPAY_MERCHANT_KEY
        },
        body: JSON.stringify({ trackId: txnId, merchant_api_key: OXAPAY_MERCHANT_KEY })
      });
      const verifyData = await verifyRes.json();
      
      const realStatus = verifyData?.data?.status || verifyData?.status;
      if (realStatus !== "Paid") {
        console.warn(`OxaPay webhook: verified status is ${realStatus}, ignoring.`);
        return new NextResponse("ok", { status: 200 });
      }
      
      // CRITICAL SECURITY FIX: Override the user-provided orderNumber with the trusted one from OxaPay API
      const trustedOrderId = verifyData?.data?.orderId || verifyData?.orderId;
      if (trustedOrderId) {
        orderNumber = trustedOrderId;
      }
    } catch (verifyErr) {
      console.error("OxaPay webhook: Reverse verification failed", verifyErr);
      return NextResponse.json({ error: "Verification failed" }, { status: 500 });
    }

    // We already verified via reverse call above that status is Paid.

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    // Fetch the pending order using the orderNumber (which is now a 36-char UUID)
    const { data: pendingOrder } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderNumber)
      .single();

    if (!pendingOrder) {
      console.error("OxaPay webhook: Pending order not found", orderNumber);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Idempotency check: if order is not pending, it was already processed
    if (pendingOrder.status !== "pending") {
      return new NextResponse("ok", { status: 200 });
    }

    const type = pendingOrder.product_id === "topup" ? "TOPUP" : "PROD";
    const userId = pendingOrder.user_id;
    const amountPaid = Number(pendingOrder.total_price);
    const productId = pendingOrder.product_id;
    const quantity = Number(pendingOrder.quantity);

    if (isNaN(amountPaid) || amountPaid <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (type === "TOPUP") {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("balance")
        .eq("id", userId)
        .single();

      if (profile) {
        const newBalance = Number(profile.balance) + amountPaid;
        await supabaseAdmin
          .from("profiles")
          .update({ balance: newBalance })
          .eq("id", userId);

        // Update the existing pending order instead of inserting a new one
        await supabaseAdmin
          .from("orders")
          .update({
            status: "completed",
            accounts_data: `Balance Top-up (Crypto) [${txnId}]`
          })
          .eq("id", orderNumber);
      }
    } else if (type === "PROD") {
      const { products } = await import("@/lib/products");
      const product = products.find(p => p.id === productId);

      let fulfilled = false;
      let accountsStr = "";

      const expectedPrice = product ? product.price * quantity : Infinity;
      if (product && amountPaid >= expectedPrice) {
        try {
          const { buyNfaAccounts } = await import("@/lib/nfa");
          const nfaResult = await buyNfaAccounts(
            product.type,
            quantity,
            `oxapay-${txnId}`
          );

          accountsStr = nfaResult.accounts.join("\n");
          fulfilled = nfaResult.accounts.length > 0;
        } catch (nfaErr) {
          console.error("NFA API error during OxaPay fulfillment:", nfaErr);
        }
      }

      if (fulfilled) {
        // Update the pending order to completed and attach account details
        await supabaseAdmin
          .from("orders")
          .update({
            status: "completed",
            accounts_data: `${accountsStr}\n\n[OxaPay Txn: ${txnId}]`,
          })
          .eq("id", orderNumber);
      } else {
        // Refund
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("balance")
          .eq("id", userId)
          .single();

        if (profile) {
          const newBalance = Number(profile.balance) + amountPaid;
          await supabaseAdmin
            .from("profiles")
            .update({ balance: newBalance })
            .eq("id", userId);

          // Update the pending order to refunded due to out-of-stock
          await supabaseAdmin
            .from("orders")
            .update({
              status: "refunded",
              accounts_data: `Refund — out of stock [Txn: ${txnId}]`,
            })
            .eq("id", orderNumber);
        }
      }
    }

    return new NextResponse("ok", { status: 200 });
  } catch (err: any) {
    console.error("OxaPay Webhook Error:", err);
    return NextResponse.json({ error: "Webhook Error" }, { status: 500 });
  }
}
