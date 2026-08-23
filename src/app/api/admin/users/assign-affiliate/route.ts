import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Missing auth header" }, { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "");
    
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
      
    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserId, promoCode, commissionPct } = body;

    if (!targetUserId || !promoCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cleanCode = promoCode.trim().toUpperCase();
    const commPct = Number(commissionPct) || 10;

    // Check if code already exists
    const { data: existing } = await supabaseAdmin
      .from("affiliate_codes")
      .select("code")
      .eq("code", cleanCode)
      .single();

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
