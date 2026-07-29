import { NextResponse } from "next/server";
import { requireAdmin } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if ('error' in authResult) return authResult.error;
    const { supabaseAdmin } = authResult;

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
