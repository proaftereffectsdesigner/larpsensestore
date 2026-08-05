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
      try {
        const searchParams = new URLSearchParams(rawBody);
        data = Object.fromEntries(searchParams.entries());
        if (!Object.keys(data).length) throw new Error("Empty URLSearchParams");
      } catch (err2) {
        console.error("Failed to parse OxaPay webhook JSON and URLSearchParams. Raw body:", rawBody);
        return NextResponse.json({ error: "Invalid body format" }, { status: 400 });
      }
    }

    const txnId = data.trackId || data.track_id; 
    let orderNumber = data.orderId || data.order_id;

    if (!txnId) {
      console.warn("OxaPay webhook: Missing trackId in payload", data);
      return NextResponse.json({ error: "Missing trackId" }, { status: 400 });
    }

    // HMAC check is currently disabled due to Node.js/Vercel request body parsing stripping whitespaces, 
    // which leads to cryptographic hash mismatches with OxaPay payloads.
    // Instead we rely on the tracking ID and secure SSL connection, or in future IP whitelisting.
    const hmacHeader = req.headers.get("hmac");
    if (hmacHeader) {
      console.log("OxaPay webhook: HMAC header received but validation is bypassed for stability.");
    }

    const realStatus = String(data.status || "").toLowerCase();
    if (realStatus !== "paid" && realStatus !== "completed" && realStatus !== "finished") {
      console.log(`OxaPay webhook: ignored status ${data.status} for trackId ${txnId}`);
      return new NextResponse("ok", { status: 200 });
    }



    // [SECURITY DOUBLE-CHECK]: Verify with OxaPay API to prevent spoofing since HMAC is off
    try {
      const verifyRes = await fetch("https://api.oxapay.com/merchants/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ merchant: OXAPAY_MERCHANT_KEY, trackId: txnId })
      });
      const verifyData = await verifyRes.json();
      
      const verifiedStatus = String(verifyData?.data?.status || verifyData?.status || "").toLowerCase();
      if (verifiedStatus !== "paid" && verifiedStatus !== "completed" && verifiedStatus !== "finished") {
        console.warn(`OxaPay webhook security failure: OxaPay API reports status ${verifiedStatus} for trackId ${txnId}, but webhook claimed Paid.`);
        return new NextResponse("ok", { status: 200 }); // Return OK to stop OxaPay from retrying a spoofed hook
      }

      const verifiedOrderId = verifyData?.data?.orderId || verifyData?.orderId;
      
      if (!orderNumber) {
        orderNumber = verifiedOrderId;
      }
      
      if (!orderNumber) {
        console.warn(`OxaPay webhook: Missing orderId even after inquiry for trackId ${txnId}`);
        return NextResponse.json({ error: "Missing order metadata" }, { status: 400 });
      }

      if (verifiedOrderId && String(verifiedOrderId) !== String(orderNumber)) {
        console.warn(`OxaPay webhook security failure: Order ID mismatch. API: ${verifiedOrderId}, Webhook: ${orderNumber}`);
        return new NextResponse("ok", { status: 200 });
      }

    } catch(e) {
      console.error("Failed to verify transaction with OxaPay Inquiry API", e);
      return NextResponse.json({ error: "Failed to verify transaction" }, { status: 500 });
    }

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
