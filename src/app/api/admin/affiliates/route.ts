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
    if (!codes || codes.length === 0) return NextResponse.json([]);

    const { data: referredProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id, referred_by")
      .not("referred_by", "is", null);

    const referredUsersByOwner: Record<string, string[]> = {};
    if (referredProfiles) {
      for (const p of referredProfiles) {
        if (!p.referred_by) continue;
        if (!referredUsersByOwner[p.referred_by]) referredUsersByOwner[p.referred_by] = [];
        referredUsersByOwner[p.referred_by].push(p.id);
      }
    }

    const allReferredIds = referredProfiles?.map(p => p.id) || [];
    let orders: any[] = [];
    if (allReferredIds.length > 0) {
      const { data: ord } = await supabaseAdmin
        .from("orders")
        .select("user_id, total_price, quantity")
        .eq("status", "completed")
        .in("user_id", allReferredIds);
      if (ord) orders = ord;
    }

    const codesWithStats = codes.map(code => {
      const ownerId = code.owner_id;
      const referredIds = referredUsersByOwner[ownerId] || [];
      const ownerOrders = orders.filter(o => referredIds.includes(o.user_id));

      const totalRevenue = ownerOrders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
      const totalProductsBought = ownerOrders.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);
      const totalEarned = totalRevenue * (code.commission_pct / 100);

      return {
        ...code,
        stats: {
          usersReferred: referredIds.length,
          totalRevenue,
          totalProductsBought,
          totalEarned
        }
      };
    });

    return NextResponse.json(codesWithStats);
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
    const { targetUserId, promoCode, commissionPct, discountPct } = body;

    if (!targetUserId || !promoCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cleanCode = promoCode.trim().toUpperCase();
    const commPct = Number(commissionPct) || 10;
    const discPct = Number(discountPct) || 10;

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("affiliate_codes")
      .select("code")
      .eq("code", cleanCode)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: "DB Error existing check: " + existingError.message }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ error: "Promo code already exists" }, { status: 400 });
    }

    const { error: insertError } = await supabaseAdmin
      .from("affiliate_codes")
      .insert({
        code: cleanCode,
        owner_id: targetUserId,
        commission_pct: commPct,
        discount_pct: discPct
      });

    if (insertError) {
      return NextResponse.json({ error: "Insert Error: " + insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Assign affiliate error:", err);
    return NextResponse.json({ error: "Catch Error: " + (err.message || String(err)) }, { status: 500 });
  }
}
