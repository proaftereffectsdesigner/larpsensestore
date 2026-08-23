import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const authenticatedSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Fetch the user's affiliate code
    const { data: code, error: codeError } = await authenticatedSupabase
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
    const { data: referredProfiles } = await authenticatedSupabase
      .from("profiles")
      .select("id")
      .eq("referred_by", userId);

    const referredIds = referredProfiles?.map((p: any) => p.id) || [];
    let ownerOrders: any[] = [];
    
    if (referredIds.length > 0) {
      const { data: ord } = await authenticatedSupabase
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
