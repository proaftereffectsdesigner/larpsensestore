import { NextResponse } from "next/server";
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if ('error' in authResult) return authResult.error;
    const { supabaseAdmin } = authResult;

    const { data: codes, error } = await supabaseAdmin
      .from("affiliate_codes")
      .select("*, profiles:owner_id(display_name, email)");

    if (error) throw error;

    return NextResponse.json(codes || []);
  } catch (err: any) {
    console.error("Fetch affiliates error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if ('error' in authResult) return authResult.error;
    const { supabaseAdmin } = authResult;

    const body = await req.json();
    const { targetUserId, promoCode, commissionPct } = body;

    if (!targetUserId || !promoCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cleanCode = promoCode.trim().toUpperCase();
    const commPct = Number(commissionPct) || 10;

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("affiliate_codes")
      .select("code")
      .eq("code", cleanCode)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Promo code already exists" }, { status: 400 });
    }

    const { error: insertError } = await supabaseAdmin
      .from("affiliate_codes")
      .insert({
        code: cleanCode,
        owner_id: targetUserId,
        commission_pct: commPct
      });

    if (insertError) throw insertError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Assign affiliate error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
