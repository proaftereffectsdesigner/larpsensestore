import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { accountStr, orderId, accountIdx } = await req.json();

    if (!accountStr || !orderId || accountIdx === undefined) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const NFA_API_KEY = process.env.NFA_API_KEY!;
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const NFA_API_URL = process.env.NFA_API_URL || "https://www.nfa.pub/api/v1";

    // 1. Zlecenie wymiany do NFA API
    // NFA API /replace oczekuje parametru "account"
    const nfaRes = await fetch(`${NFA_API_URL}/replace?account=${encodeURIComponent(accountStr)}`, {
      method: "POST",
      headers: {
        "X-Api-Key": NFA_API_KEY,
      },
    });

    let nfaData;
    const rawText = await nfaRes.text();
    try {
      nfaData = JSON.parse(rawText);
    } catch(e) {
      return NextResponse.json({ error: "Invalid response from NFA API", raw: rawText }, { status: 400 });
    }

    if (!nfaRes.ok || !nfaData.ok) {
      return NextResponse.json({ error: nfaData.error || nfaData.code || "Replacement failed at NFA" }, { status: 400 });
    }

    // Nowe dane konta
    const newAccountStr = nfaData.account;

    // 2. Aktualizacja w bazie danych (Supabase)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Pobranie bieżącego zamówienia by zaktualizować właściwe konto w tablicy
    const { data: orderData, error: fetchError } = await supabase
      .from("orders")
      .select("accounts_data")
      .eq("id", orderId)
      .single();

    if (fetchError || !orderData) {
      return NextResponse.json({ error: "Order not found in DB, but replaced at NFA." }, { status: 500 });
    }

    const accounts = orderData.accounts_data.split("\\n");
    accounts[accountIdx] = newAccountStr; // Nadpisujemy wymienione konto
    const newAccountsData = accounts.join("\\n");

    const { error: updateError } = await supabase
      .from("orders")
      .update({ accounts_data: newAccountsData })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to update order after replacement:", updateError);
      return NextResponse.json({ error: "Failed to save new account to database" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, newAccount: newAccountStr });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
