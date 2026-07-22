import { NextResponse } from "next/server";
import { products } from "@/lib/products";
import { createClient } from "@supabase/supabase-js";

// Symulacja integracji Stripe Checkout
export async function POST(req: Request) {
  try {
    const { productId, quantity, userId, token, paymentMethod } = await req.json();

    if (!productId || !quantity || quantity < 1 || quantity > 100 || !userId || !token) {
      return NextResponse.json({ error: "Invalid parameters or not logged in" }, { status: 400 });
    }

    const product = products.find((p) => p.id === productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Inicjalizacja Supabase wraz z przekazaniem access_token, aby ominąć błąd RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const totalPrice = product.price * quantity;

    if (paymentMethod === "balance") {
      const { data: profile } = await supabase.from("profiles").select("balance").eq("id", userId).single();
      const currentBalance = profile ? Number(profile.balance) : 0;
      
      if (currentBalance < totalPrice) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
      }

      const { error: updateError } = await supabase.from("profiles").update({ balance: currentBalance - totalPrice }).eq("id", userId);
      if (updateError) {
        return NextResponse.json({ error: "Failed to deduct balance" }, { status: 500 });
      }
    }

    let accountsStr = "";
    const NFA_API_KEY = process.env.NFA_API_KEY;
    const NFA_API_URL = process.env.NFA_API_URL || "https://www.nfa.pub/api/v1";

    if (!NFA_API_KEY) {
      return NextResponse.json({ error: "Missing NFA_API_KEY in environment" }, { status: 500 });
    }

    // TRYB PRAWDZIWY: STRIPE / BALANCE -> NFA API
    const nfaRes = await fetch(`${NFA_API_URL}/cs2?type=${product.type}&quantity=${quantity}&result=json`, {
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
      // Jeśli pobrano kasę, a API NFA nie działa - idealnie byłoby zwrócić środki.
      return NextResponse.json({ error: "Invalid NFA API Response", raw: rawText }, { status: 400 });
    }

    if (!nfaRes.ok || !nfaData.ok) {
      return NextResponse.json({ error: nfaData.error || nfaData.code || "Failed at NFA API" }, { status: 400 });
    }

    accountsStr = nfaData.accounts.join("\\n");

    // Zapis do Supabase używając prawdziwego ID użytkownika
    const { data: orderData, error: dbError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        product_id: product.id,
        quantity: quantity,
        total_price: product.price * quantity,
        status: "completed",
        accounts_data: accountsStr,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Supabase error saving order:", dbError);
      // Mimo błędu zapisu, klient zapłacił i pobraliśmy konto - przekierujemy go z kontami w query dla ratunku
      return NextResponse.json({ 
        url: `/order/error?accounts=${encodeURIComponent(accountsStr)}` 
      });
    }

    // Przekierowanie na stronę zamówienia po "udanym powrocie ze Stripe"
    return NextResponse.json({ url: `/order/${orderData.id}` });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
