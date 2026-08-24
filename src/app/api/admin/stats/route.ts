import { NextResponse } from "next/server";
import { requireAdmin } from '@/lib/auth';
import { products } from '@/lib/products';

export async function GET(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if ('error' in authResult) return authResult.error;
    const { supabaseAdmin } = authResult;

    // Only count COMPLETED orders for revenue and count
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("status", "completed");

    const { count: usersCount, error: usersError } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (ordersError) throw ordersError;
    if (usersError) throw usersError;

    let totalEarned = 0;
    let totalCost = 0;

    if (orders) {
      orders.forEach((o: any) => {
        totalEarned += Number(o.total_price || 0);
        
        const product = products.find(p => p.id === o.product_id);
        if (product && product.cost) {
          totalCost += (product.cost * Number(o.quantity || 1));
        }
      });
    }

    const totalOrders = orders?.length || 0;
    const totalProfit = totalEarned - totalCost;

    return NextResponse.json({
      totalEarned,
      totalProfit,
      totalOrders,
      totalUsers: usersCount || 0
    });
  } catch (err: any) {
    console.error("Admin Stats Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
