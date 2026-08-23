import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch the user's affiliate code
    const { data: code, error: codeError } = await supabase
      .from("affiliate_codes")
      .select("*")
      .eq("owner_id", userId)
      .maybeSingle();

    if (codeError) throw codeError;

    if (!code) {
      return NextResponse.json({ code: null });
    }

    // Calculate stats
    // 1. Get users referred by this owner
    const { data: referredProfiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("referred_by", userId);

    const referredIds = referredProfiles?.map(p => p.id) || [];
    let ownerOrders: any[] = [];
    
    if (referredIds.length > 0) {
      const { data: ord } = await supabase
        .from("orders")
        .select("user_id, total_price, quantity")
        .eq("status", "completed")
        .in("user_id", referredIds);
        
      if (ord) ownerOrders = ord;
    }

    const totalRevenue = ownerOrders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
    const totalProductsBought = ownerOrders.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);
    const totalEarned = totalRevenue * (code.commission_pct / 100);

    return NextResponse.json({
      code: code.code,
      created_at: code.created_at,
      commission_pct: code.commission_pct,
      discount_pct: code.discount_pct || 10,
      stats: {
        usersReferred: referredIds.length,
        totalRevenue,
        totalProductsBought,
        totalEarned
      }
    });

  } catch (err: any) {
    console.error("Fetch affiliate stats error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
