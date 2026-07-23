import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
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

    const { targetUserId, amount, type } = await req.json();

    if (!targetUserId || amount === undefined || !type) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Fetch current balance
    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from("profiles")
      .select("balance")
      .eq("id", targetUserId)
      .single();

    if (targetError || !targetProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let currentBalance = Number(targetProfile.balance) || 0;
    let newBalance = currentBalance;

    if (type === 'add') {
      newBalance += Number(amount);
    } else if (type === 'subtract') {
      newBalance -= Number(amount);
      if (newBalance < 0) newBalance = 0;
    } else if (type === 'set') {
      newBalance = Number(amount);
    }

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", targetUserId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, newBalance });
  } catch (err: any) {
    console.error("Admin Update Balance Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
