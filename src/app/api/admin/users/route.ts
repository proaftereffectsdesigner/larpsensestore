import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// We use the service role key to bypass RLS and fetch all users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  try {
    // 1. Verify caller is admin
    // We expect the client to send their Authorization token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if the user is an admin in the profiles table
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.is_admin) {
      return NextResponse.json({ error: "Forbidden: Not an admin" }, { status: 403 });
    }

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
