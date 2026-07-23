import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.is_admin) {
      return NextResponse.json({ error: "Forbidden: Not an admin" }, { status: 403 });
    }

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
