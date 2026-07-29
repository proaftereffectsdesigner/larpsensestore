import { NextResponse } from "next/server";
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if ('error' in authResult) return authResult.error;
    const { supabaseAdmin } = authResult;

    // Fetch stats
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .in("status", ["completed", "pending"]);

    const { count: usersCount, error: usersError } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (ordersError) throw ordersError;
    if (usersError) throw usersError;

    const totalEarned = orders?.reduce((sum: number, o: any) => sum + Number(o.total_price || 0), 0) || 0;
    const totalOrders = orders?.length || 0;

    return NextResponse.json({
      totalEarned,
      totalOrders,
      totalUsers: usersCount || 0
    });
  } catch (err: any) {
    console.error("Admin Stats Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
