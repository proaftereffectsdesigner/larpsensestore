import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import crypto from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OXAPAY_MERCHANT_KEY = process.env.OXAPAY_MERCHANT_KEY;

function verifyOxaPayWebhook(rawBody: string, receivedHmac: string, apiKey: string): boolean {
  try {
    const calculatedHmac = crypto
      .createHmac("sha512", apiKey)
      .update(rawBody)
      .digest("hex");
      
    return crypto.timingSafeEqual(
      Buffer.from(calculatedHmac), 
      Buffer.from(receivedHmac)
    );
  } catch (e) {
    return false;
  }
}

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
    const receivedHmac = req.headers.get("HMAC") || req.headers.get("hmac");

    if (!receivedHmac) {
      console.warn("OxaPay webhook: missing HMAC header");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    if (!verifyOxaPayWebhook(rawBody, receivedHmac, OXAPAY_MERCHANT_KEY)) {
      console.warn("OxaPay webhook: invalid signature from IP", ip);
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const data = JSON.parse(rawBody);

    const status = data.status; // 'Paid', 'Expired', etc.
    const txnId = data.trackId; // OxaPay uses trackId as the transaction ID.
    const orderNumber = data.order_id;
    const amountStr = data.amount;

    if (!orderNumber || !txnId) {
      return NextResponse.json({ error: "Missing order metadata" }, { status: 400 });
    }

    if (status !== "Paid") {
      return new NextResponse("ok", { status: 200 });
    }

    let type = "TOPUP";
    let userId = "";
    let amountPaid = Number(amountStr);
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
