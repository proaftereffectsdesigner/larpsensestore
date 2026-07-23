import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { accountStr, orderId, accountIdx, type, userId, token } = await req.json();

    if (!accountStr || !orderId || accountIdx === undefined || !type || !userId || !token) {
      return NextResponse.json({ error: "Missing parameters or unauthorized" }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabaseAuth = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized or invalid session token." }, { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verify order belongs to user
    const { data: orderData, error: fetchError } = await supabase
      .from("orders")
      .select("accounts_data, user_id")
      .eq("id", orderId)
      .single();

    if (fetchError || !orderData) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    
    if (orderData.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden: You do not own this order." }, { status: 403 });
    }

    const NFA_API_KEY = process.env.NFA_API_KEY!;
    const NFA_API_URL = process.env.NFA_API_URL || "https://www.nfa.pub/api/v1";

    // 1. Zlecenie wymiany do NFA API
    // NFA API /replace oczekuje parametru "account" oraz "type" (np. premier-15k)
    // Co ważne, NFA weryfikuje na żywo (check), więc osobny endpoint check nie jest wymagany
    const nfaRes = await fetch(`${NFA_API_URL}/replace?account=${encodeURIComponent(accountStr)}&type=${type}`, {
      method: "POST",
      headers: {
        "X-Api-Key": NFA_API_KEY,
      },
    });

    let nfaData;
    const rawText = await nfaRes.text();
    
    // Zawsze wyświetlaj przyjazny komunikat dla klienta
    const friendlyErrorMsg = "We couldn't replace the account. It's likely still working, or your 6-hour warranty has expired.";
    
    try {
      nfaData = JSON.parse(rawText);
    } catch(e) {
      // NFA API sometimes returns plain text error codes like "E1601"
      if (rawText.trim().startsWith("E")) {
        return NextResponse.json({ error: friendlyErrorMsg, raw: rawText.trim() }, { status: 400 });
      }
      return NextResponse.json({ error: friendlyErrorMsg, raw: rawText }, { status: 400 });
    }

    if (!nfaRes.ok || !nfaData.ok) {
      return NextResponse.json({ error: friendlyErrorMsg, raw: nfaData.error || nfaData.code || "Replacement failed" }, { status: 400 });
    }

    // Nowe dane konta
    const newAccountStr = nfaData.account;

    // 2. Aktualizacja w bazie danych (Supabase)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Pobranie bieżącego zamówienia by zaktualizować właściwe konto w tablicy
    const { data: orderData, error: fetchError } = await supabase
      .from("orders")
      .select("accounts_data")
      .eq("id", orderId)
      .single();

    if (fetchError || !orderData) {
      return NextResponse.json({ error: "Order not found in DB, but replaced at NFA." }, { status: 500 });
    }

    const accounts = orderData.accounts_data.split("\n");
    accounts[accountIdx] = newAccountStr; // Nadpisujemy wymienione konto
    const newAccountsData = accounts.join("\n");

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
