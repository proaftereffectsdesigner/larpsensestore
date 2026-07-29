import { NextResponse } from "next/server";
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if ('error' in authResult) return authResult.error;
    const { supabaseAdmin } = authResult;

    // 2. Fetch all users from profiles table
    // Note: To get the actual Auth emails, we would need to query auth.users, 
    // but we saved email in profiles table during webhook or trigger hopefully.
    // If not, we can join with auth.users (which requires service role) or just return profiles.
    
    // We also want to fetch their orders to compute total spent
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) throw profilesError;

    // Fetch all orders to compute total spent manually (avoids schema cache issues)
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("user_id, total_price, status");

    if (ordersError) throw ordersError;

    // Fetch auth users to get correct emails and display names if missing
    const { data: authData, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
    if (authUsersError) throw authUsersError;
    const authUsers = authData.users;

    const authMap: Record<string, any> = {};
    authUsers.forEach(u => {
      authMap[u.id] = {
        email: u.email,
        display_name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0]
      };
    });

    // Group orders by user_id
    const ordersByUser: Record<string, any[]> = {};
    if (orders) {
      orders.forEach(o => {
        if (!ordersByUser[o.user_id]) ordersByUser[o.user_id] = [];
        ordersByUser[o.user_id].push(o);
      });
    }

    // Calculate total spent for each user
    const usersWithStats = profiles?.map((p) => {
      const userOrders = ordersByUser[p.id] || [];
      const completedOrders = userOrders.filter((o: any) => o.status === 'completed' || o.status === 'pending');
      const totalSpent = completedOrders.reduce((sum: number, o: any) => sum + Number(o.total_price || 0), 0);
      
      const authInfo = authMap[p.id] || {};

      return {
        ...p,
        email: p.email || authInfo.email,
        display_name: p.display_name || authInfo.display_name,
        total_orders: completedOrders.length,
        total_spent: totalSpent
      };
    }) || [];

    return NextResponse.json(usersWithStats);
  } catch (err: any) {
    console.error("Admin Users Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
