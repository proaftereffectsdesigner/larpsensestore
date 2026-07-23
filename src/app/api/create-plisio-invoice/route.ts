import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PLISIO_SECRET_KEY = process.env.PLISIO_SECRET_KEY;

export async function POST(req: Request) {
  try {
    const { userId, token, amount, currency, type = "topup", productId, quantity } = await req.json();

    if (!userId || !token || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!PLISIO_SECRET_KEY) {
      console.error("Missing PLISIO_SECRET_KEY in environment variables");
      return NextResponse.json({ error: "Crypto payments are currently disabled" }, { status: 503 });
    }

    // Verify user
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is banned or can_topup/can_purchase
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

    // Generate unique order number encoding metadata for the webhook
    // TOPUP: TOPUP_userId_timestamp_amount
    // PROD: PROD_userId_timestamp_amount_productId_quantity
    const timestamp = Date.now();
    const orderNumber = type === "product_checkout" 
      ? `PROD_${userId}_${timestamp}_${amount}_${productId}_${quantity}`
      : `TOPUP_${userId}_${timestamp}_${amount}`;
    
    const baseUrl = new URL(req.url).origin;

    let orderName = type === "product_checkout" 
      ? `LarpSense Store - Product Purchase (x${quantity})` 
      : "LarpSense Balance Top-up";

    // Create Plisio Invoice
    const plisioApiUrl = new URL("https://api.plisio.net/api/v1/invoices/new");
    plisioApiUrl.searchParams.append("api_key", PLISIO_SECRET_KEY);
    plisioApiUrl.searchParams.append("source_currency", "EUR");
    plisioApiUrl.searchParams.append("source_amount", totalAmount.toString());
    plisioApiUrl.searchParams.append("order_name", orderName);
    plisioApiUrl.searchParams.append("order_number", orderNumber);
    if (currency) {
      plisioApiUrl.searchParams.append("currency", currency);
      // Restrict to one currency so Plisio skips the "Choose Currency" screen
      plisioApiUrl.searchParams.append("allowed_psys_cids", currency);
    }
    plisioApiUrl.searchParams.append("callback_url", `${baseUrl}/api/webhook/plisio`);
    // Redirect URLs
    if (type === "product_checkout") {
      plisioApiUrl.searchParams.append("success_url", `${baseUrl}/dashboard?order=success`);
      plisioApiUrl.searchParams.append("fail_url", `${baseUrl}/category/${productId}`);
    }

    const plisioRes = await fetch(plisioApiUrl.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    const plisioData = await plisioRes.json();

    if (plisioData.status === "success" && plisioData.data && plisioData.data.invoice_url) {
      return NextResponse.json({ url: plisioData.data.invoice_url });
    } else {
      console.error("Plisio Invoice Error:", plisioData);
      const errorMsg = plisioData?.data?.message || plisioData?.message || "Failed to create crypto invoice";
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

  } catch (err: any) {
    console.error("Create Plisio Session Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
