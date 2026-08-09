import { NextResponse } from "next/server";
import { Polar } from "@polar-sh/sdk";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Initialize Polar with the secret key from env
const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN || "",
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    // Rate limit: max 10 checkout sessions per minute per IP
    const ip = getClientIp(req);
    const rl = rateLimit(`checkout:${ip}`, { maxRequests: 10, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${rl.resetInSeconds}s.` },
        { status: 429 }
      );
    }
    const { userId, amount, paymentMethod, token } = await req.json();

    if (!userId || !amount || amount < 0.20 || !token) {
      return NextResponse.json({ error: "Invalid parameters or unauthorized" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized or invalid session token." }, { status: 401 });
    }

    // Check restrictions
    const { data: profile } = await supabaseAdmin.from("profiles").select("is_banned, can_topup").eq("id", userId).single();
    if (profile?.is_banned) {
      return NextResponse.json({ error: "Your account has been banned." }, { status: 403 });
    }
    if (profile?.can_topup === false) {
      return NextResponse.json({ error: "You are currently restricted from adding balance." }, { status: 403 });
    }

    // Fee: 3.5% + €0.30 (covers Stripe/Polar processing costs)
    const feeMultiplier = 0.035;
    const fixedFee = 0.30;

    const cardFee = Number((amount * feeMultiplier + fixedFee).toFixed(2));
    const totalAmount = amount + cardFee;

    if (!process.env.POLAR_TOPUP_PRODUCT_ID) {
      console.error("Missing POLAR_TOPUP_PRODUCT_ID in environment variables");
      return NextResponse.json({ error: "Polar configuration missing." }, { status: 500 });
    }

    // Create Checkout Session using Polar API directly to avoid type mismatches
    const response = await fetch("https://api.polar.sh/v1/checkouts/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.POLAR_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        payment_processor: "stripe", // Polar uses Stripe under the hood
        products: [process.env.POLAR_TOPUP_PRODUCT_ID],
        amount: Math.round(totalAmount * 100), // Polar expects cents
        success_url: `${req.headers.get("origin")}/dashboard?topup=success`,
        metadata: {
          userId: userId,
          addedAmount: amount.toString(), // Store the pure amount without fee to add to balance
          type: "topup"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Polar Checkout Error:", errorText);
      return NextResponse.json({ error: "Failed to create Polar checkout" }, { status: 500 });
    }

    const session = await response.json();
    return NextResponse.json({ id: session.id, url: session.url });
  } catch (err: any) {
    console.error("Polar Checkout Error:", err);
    return NextResponse.json({ error: "Payment gateway error" }, { status: 500 });
  }
}
