import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { promoCode, userId } = await request.json();

    if (!promoCode || !userId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Get the promo code
    const { data: codeData, error: codeError } = await supabaseAdmin
      .from("affiliate_codes")
      .select("*")
      .eq("code", promoCode.toUpperCase())
      .single();

    if (codeError || !codeData) {
      return NextResponse.json({ error: "Invalid promo code" }, { status: 404 });
    }

    // You cannot use your own code
    if (codeData.owner_id === userId) {
      return NextResponse.json({ error: "You cannot use your own promo code" }, { status: 400 });
    }

    // 2. Check the user's profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("used_first_discount, referred_by")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // If they already used their first discount, they don't get a discount
    if (profile.used_first_discount) {
       return NextResponse.json({ 
         ok: true, 
         message: "Code applied (No discount available for subsequent purchases)", 
         discountPct: 0,
         code: codeData.code
       });
    }

    // If they are not referred by anyone yet, they get the discount
    return NextResponse.json({
      ok: true,
      message: `Promo code applied! ${codeData.discount_pct}% off your first purchase.`,
      discountPct: codeData.discount_pct,
      code: codeData.code
    });

  } catch (error: any) {
    console.error("Redeem code error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
