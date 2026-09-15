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

    const cleanCode = promoCode.trim();

    // 1. Get the promo code (check affiliate_codes first, case-insensitively)
    const { data: codeData } = await supabaseAdmin
      .from("affiliate_codes")
      .select("*")
      .ilike("code", cleanCode)
      .maybeSingle();

    if (!codeData) {
      // Check standard promo_codes (case-insensitively)
      const { data: standardCode } = await supabaseAdmin
        .from("promo_codes")
        .select("*")
        .ilike("code", cleanCode)
        .maybeSingle();

      if (!standardCode) {
        return NextResponse.json({ error: "Invalid promo code" }, { status: 404 });
      }

      const isExpired = standardCode.expires_at && new Date(standardCode.expires_at).getTime() < Date.now();
      const isDepleted = standardCode.max_uses && standardCode.current_uses >= standardCode.max_uses;

      if (isExpired) {
        return NextResponse.json({ error: "Promo code has expired" }, { status: 400 });
      }
      if (isDepleted) {
        return NextResponse.json({ error: "Promo code usage limit reached" }, { status: 400 });
      }

      if (Number(standardCode.min_spent) > 0) {
        const { data: profile } = await supabaseAdmin.from("profiles").select("total_spent").eq("id", userId).single();
        const totalSpent = profile ? Number(profile.total_spent) : 0;
        if (totalSpent < Number(standardCode.min_spent)) {
          return NextResponse.json({ error: `Minimum spent of €${standardCode.min_spent} required` }, { status: 400 });
        }
      }

      const { data: usage } = await supabaseAdmin
        .from("promo_code_usages")
        .select("id")
        .eq("user_id", userId)
        .eq("promo_code_id", standardCode.id)
        .maybeSingle();

      if (usage) {
        return NextResponse.json({ error: "You have already used this promo code" }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        message: `Promo code applied! ${standardCode.discount_pct}% off.`,
        discountPct: standardCode.discount_pct,
        code: standardCode.code
      });
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
