import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PLISIO_SECRET_KEY = process.env.PLISIO_SECRET_KEY;

export async function POST(req: Request) {
  try {
    const { userId, token, amount } = await req.json();

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

    // Check if user is banned or can_topup
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_banned, can_topup")
      .eq("id", userId)
      .single();

    if (profile?.is_banned || profile?.can_topup === false) {
      return NextResponse.json({ error: "Account restricted" }, { status: 403 });
    }

    const feeMultiplier = 0.005; // 0.5%
    const cryptoFee = Number((amount * feeMultiplier).toFixed(2));
    const totalAmount = amount + cryptoFee;

    // Generate unique order number (user ID + timestamp + original amount)
    // We will extract the UUID and original amount from the order_number in the webhook
    const orderNumber = `${userId}_${Date.now()}_${amount}`;
    const baseUrl = new URL(req.url).origin;

    // Create Plisio Invoice
    const plisioApiUrl = new URL("https://api.plisio.net/api/v1/invoices/new");
    plisioApiUrl.searchParams.append("api_key", PLISIO_SECRET_KEY);
    plisioApiUrl.searchParams.append("source_currency", "EUR");
    plisioApiUrl.searchParams.append("source_amount", totalAmount.toString());
    plisioApiUrl.searchParams.append("order_name", "LarpSense Balance Top-up");
    plisioApiUrl.searchParams.append("order_number", orderNumber);
    plisioApiUrl.searchParams.append("callback_url", `${baseUrl}/api/webhook/plisio`);
    // Optional overrides, but it's better to configure these in the Plisio dashboard or let Plisio use default:
    // plisioApiUrl.searchParams.append("success_url", `${baseUrl}/dashboard?tab=orders&payment=success`);
    // plisioApiUrl.searchParams.append("fail_url", `${baseUrl}/dashboard?tab=orders&payment=failed`);

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
      return NextResponse.json({ error: "Failed to create crypto invoice" }, { status: 500 });
    }

  } catch (err: any) {
    console.error("Create Plisio Session Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
