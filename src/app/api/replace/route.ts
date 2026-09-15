import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // Rate limit: max 5 replace attempts per minute per IP
    const ip = getClientIp(req);
    const rl = rateLimit(`replace:${ip}`, { maxRequests: 5, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${rl.resetInSeconds}s.` },
        { status: 429 }
      );
    }

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
      .select("accounts_data, user_id, nfa_order_id")
      .eq("id", orderId)
      .single();

    if (fetchError || !orderData) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    
    if (orderData.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden: You do not own this order." }, { status: 403 });
    }

    if (!orderData.nfa_order_id) {
      return NextResponse.json({ error: "This order is too old and cannot be replaced automatically. Please open a support ticket on our Discord." }, { status: 400 });
    }

    const NFA_API_KEY = process.env.NFA_API_KEY!;
    const NFA_API_URL = process.env.NFA_API_URL || "https://www.nfa.pub/api/v1";

    // Extract Steam ID from account string
    // Format is typically 76561198295292480----eyAidHlw... or login:password or steamid:password
    const steamIdMatch = accountStr.match(/^(\d{17})/);
    const accountIdentifier = steamIdMatch ? steamIdMatch[1] : accountStr.split(/[:\-]/)[0].trim();

    // 1. Zlecenie wymiany do NFA API z ?result=json
    const nfaRes = await fetch(`${NFA_API_URL}/replace?result=json`, {
      method: "POST",
      headers: {
        "X-Api-Key": NFA_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        order: orderData.nfa_order_id,
        account: accountIdentifier,
        reason: "User requested replacement via dashboard"
      })
    });

    let nfaData: any;
    const rawText = await nfaRes.text();
    
    try {
      nfaData = JSON.parse(rawText);
    } catch (e) {
      console.error("NFA Replace parse error:", rawText);
      return NextResponse.json({ error: "Replacement service returned an invalid response. Please contact support." }, { status: 502 });
    }

    if (!nfaRes.ok || !nfaData.ok) {
      const code = nfaData.code || (rawText.trim().startsWith("E") ? rawText.trim() : null);

      const errorMessages: Record<string, string> = {
        "E1601": "Replacement access is not enabled on this API key. Please contact support.",
        "E1602": "Order reference not found in supplier records.",
        "E1603": "Order reference does not match supplier account.",
        "E1604": "This order has not been delivered yet.",
        "E1605": "Your 6-hour warranty window for this order has expired.",
        "E1606": "Account identifier was not found on this order.",
        "E1607": "This account was already replaced once.",
        "E1608": "You have reached the maximum limit of 3 replacements for this order.",
        "E1609": "No replacement stock available right now. Please try again in a few minutes.",
        "E1610": "The account is still working. Our automated checker verified that login works.",
        "E1611": "The automated checker could not reach Steam. Please try again in a few seconds.",
      };

      const errorMsg = (code && errorMessages[code]) || nfaData.error || "We couldn't replace the account. It's likely still working or the warranty expired.";
      return NextResponse.json({ error: errorMsg, code, raw: rawText }, { status: 400 });
    }

    // Nowe dane konta
    const newAccountStr = nfaData.account;

    // 2. Aktualizacja w bazie danych (Supabase)
    let newAccountsData = orderData.accounts_data || "";
    if (newAccountsData.includes(accountStr)) {
      newAccountsData = newAccountsData.replace(accountStr, newAccountStr);
    } else if (newAccountsData.includes(accountStr.trim())) {
      newAccountsData = newAccountsData.replace(accountStr.trim(), newAccountStr);
    } else {
      // Fallback: match by line containing the steam ID or account string
      const lines = newAccountsData.split("\n");
      const matchedIdx = lines.findIndex((line: string) => 
        line.trim() === accountStr.trim() || (steamIdMatch && line.includes(steamIdMatch[1]))
      );
      if (matchedIdx !== -1) {
        lines[matchedIdx] = newAccountStr;
        newAccountsData = lines.join("\n");
      } else {
        newAccountsData = `${newAccountsData}\n${newAccountStr}`.trim();
      }
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({ accounts_data: newAccountsData })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to update order after replacement:", updateError);
      return NextResponse.json({ error: "Failed to save new account to database" }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      newAccount: newAccountStr,
      replaced: nfaData.replaced,
      remaining: nfaData.remaining 
    });
  } catch (err) {
    console.error("Replace route error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
