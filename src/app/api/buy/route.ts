import { NextRequest, NextResponse } from "next/server";
import { products } from "@/lib/products";
import { supabase } from "@/lib/supabase";

const NFA_API_KEY = process.env.NFA_API_KEY || "rsk_test_uMKWV_LizLQdCUkG-ht7V7Bq8gr2zbe6bhEpE8DSs8M";

export async function POST(req: NextRequest) {
  try {
    const { productId, quantity } = await req.json();

    // 1. Walidacja produktu
    const product = products.find((p) => p.id === productId);
    if (!product) {
      return NextResponse.json({ ok: false, error: "Product not found" }, { status: 400 });
    }

    // W prawdziwej aplikacji sprawdzilibyśmy sesję użytkownika z Supabase
    // const authHeader = req.headers.get('Authorization');
    // const { data: { user } } = await supabase.auth.getUser(authHeader?.split(' ')[1] || '');
    // if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    
    // Dla testów używamy anonimowego użytkownika, jeżeli nie skonfigurowano poprawnie auth
    const dummyUserId = "00000000-0000-0000-0000-000000000000";

    // 2. Zapytanie do NFA API
    const nfaRes = await fetch(`https://www.nfa.pub/api/v1/cs2?type=${product.type}&quantity=${quantity}&result=json`, {
      method: "POST",
      headers: {
        "X-Api-Key": NFA_API_KEY,
      },
    });

    let nfaData;
    const rawText = await nfaRes.text();
    try {
      nfaData = JSON.parse(rawText);
    } catch (e) {
      // Jeśli NFA zwróci plain text error np. "E1102"
      return NextResponse.json(
        { ok: false, error: rawText || "Invalid response from NFA API" },
        { status: 400 }
      );
    }

    if (!nfaRes.ok || !nfaData.ok) {
      return NextResponse.json(
        { ok: false, error: nfaData.error || nfaData.code || "NFA API Error" },
        { status: nfaRes.status || 400 }
      );
    }

    // 3. Zapisanie zamówienia do bazy danych (Supabase)
    // Omijamy błędy jeśli supabase nie został podpięty poprawnie w env
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { error: dbError } = await supabase
        .from('orders')
        .insert({
          user_id: dummyUserId, // user.id w prawdziwym scenariuszu
          product_type: product.type,
          quantity: quantity,
          total_price: product.price * quantity,
          status: 'completed',
          account_details: nfaData.accounts.join("\n")
        });

      if (dbError) {
        console.error("Supabase insert error:", dbError);
        // Nie przerywamy, konto zostało kupione z NFA, jedynie logujemy błąd.
      }
    }

    // Zwracamy konta do frontend'u
    return NextResponse.json({ ok: true, accounts: nfaData.accounts });
  } catch (error: any) {
    console.error("Buy route error:", error);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}
