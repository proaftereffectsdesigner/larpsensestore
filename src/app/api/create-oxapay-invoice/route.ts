import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OXAPAY_MERCHANT_KEY = process.env.OXAPAY_MERCHANT_KEY;

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`oxapay-invoice:${ip}`, { maxRequests: 10, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${rl.resetInSeconds}s.` },
        { status: 429 }
      );
    }

    const { userId, token, amount: clientAmount, currency, type = "topup", productId, quantity: clientQuantity } = await req.json();

    let amount = Number(clientAmount);
    let quantity = Number(clientQuantity || 1);

    if (!userId || !token || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (type === "product_checkout" && productId) {
      const { products } = await import("@/lib/products");
      const product = products.find(p => p.id === productId);
      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      amount = product.price * quantity;
    }

    if (!OXAPAY_MERCHANT_KEY) {
      console.error("Missing OXAPAY_MERCHANT_KEY in environment variables");
      return NextResponse.json({ error: "Crypto payments are currently disabled" }, { status: 503 });
    }

    // Verify user
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_banned, can_topup, can_purchase")
      .eq("id", userId)
      .single();

    if (profile?.is_banned) {
      return NextResponse.json({ error: "Account banned" }, { status: 403 });
    }
    if (type === "topup" && profile?.can_topup === false) {
      return NextResponse.json({ error: "Topups restricted" }, { status: 403 });
    }
    if (type === "product_checkout" && profile?.can_purchase === false) {
      return NextResponse.json({ error: "Purchases restricted" }, { status: 403 });
    }

    const feeMultiplier = 0.005; // 0.5%
    const cryptoFee = Number((amount * feeMultiplier).toFixed(2));
    const totalAmount = amount + cryptoFee;

    const timestamp = Date.now();
    const orderId = type === "product_checkout" 
      ? `PROD_${userId}_${timestamp}_${amount}_${productId}_${quantity}`
      : `TOPUP_${userId}_${timestamp}_${amount}`;
    
    const baseUrl = new URL(req.url).origin;

    let description = type === "product_checkout" 
      ? `LarpSense Store - Product Purchase (x${quantity})` 
      : "LarpSense Balance Top-up";

    const oxapayPayload: any = {
      amount: totalAmount,
      currency: "EUR",
      order_id: orderId,
      description: description,
      callback_url: `${baseUrl}/api/webhook/oxapay`,
    };

    if (currency) {
        oxapayPayload.to_currency = currency; 
    }

    if (type === "product_checkout") {
      oxapayPayload.return_url = `${baseUrl}/dashboard?order=success`;
    } else {
      oxapayPayload.return_url = `${baseUrl}/dashboard`;
    }

    const oxapayRes = await fetch("https://api.oxapay.com/v1/payment/invoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "merchant_api_key": OXAPAY_MERCHANT_KEY
      },
      body: JSON.stringify(oxapayPayload)
    });

    const oxapayData = await oxapayRes.json();

    if (oxapayData.result === 100 && oxapayData.payLink) {
      return NextResponse.json({ url: oxapayData.payLink });
    } else {
      console.error("OxaPay Invoice Error:", oxapayData);
      const errorMsg = oxapayData?.message || "Failed to create crypto invoice";
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

  } catch (err: any) {
    console.error("Create OxaPay Session Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
