import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { userId, amount, token } = await req.json();

    if (!userId || !amount || amount < 0.50 || !token) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    // Fetch current balance
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", userId)
      .single();

    if (fetchError) {
      // If profile doesn't exist, maybe trigger hasn't run. Let's create it.
      await supabase.from("profiles").insert({ id: userId, balance: 0 });
    }

    const currentBalance = profile ? Number(profile.balance) : 0;
    const newBalance = currentBalance + Number(amount);

    // Update balance
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update balance: " + updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, balance: newBalance });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
