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

    let type = "TOPUP";
    let userId = "";
    let amountPaid = 0; // We will extract it from orderNumber
    let productId = "";
    let quantity = 1;

    const orderParts = orderNumber.split('_');
    if (orderParts[0] === "PROD") {
      type = "PROD";
      userId = orderParts[1];
      amountPaid = Number(orderParts[3]);
      productId = orderParts[4];
      quantity = Number(orderParts[5] || 1);
    } else if (orderParts[0] === "TOPUP") {
      type = "TOPUP";
      userId = orderParts[1];
      amountPaid = Number(orderParts[3]);
    } else {
      return NextResponse.json({ error: "Invalid order format" }, { status: 400 });
    }

    if (isNaN(amountPaid) || amountPaid <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    // Idempotency check via accounts_data containing txnId
    const { data: existingTx } = await supabaseAdmin
      .from("orders")
      .select("id")
      .like("accounts_data", `%${txnId}%`)
      .limit(1);

    if (existingTx && existingTx.length > 0) {
      return new NextResponse("ok", { status: 200 });
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

        await supabaseAdmin
          .from("orders")
          .insert({
            user_id: userId,
            product_id: "topup",
            quantity: 1,
            total_price: amountPaid,
            status: "completed",
            accounts_data: `Balance Top-up (Crypto) [${txnId}]`
          });
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
        await supabaseAdmin
          .from("orders")
          .insert({
            user_id: userId,
            product_id: productId,
            quantity: quantity,
            total_price: amountPaid,
            status: "completed",
            accounts_data: `${accountsStr}\n\n[OxaPay Txn: ${txnId}]`,
          });
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

          await supabaseAdmin
            .from("orders")
            .insert({
              user_id: userId,
              product_id: productId,
              quantity: quantity,
              total_price: amountPaid,
              status: "refunded",
              accounts_data: `Refund — out of stock [Txn: ${txnId}]`,
            });
        }
      }
    }

    return new NextResponse("ok", { status: 200 });
  } catch (err: any) {
    console.error("OxaPay Webhook Error:", err);
    return NextResponse.json({ error: "Webhook Error" }, { status: 500 });
  }
}
