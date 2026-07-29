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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized or invalid session token." }, { status: 401 });
    }

    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check restrictions first
    const { data: profileCheck } = await supabaseAdmin.from("profiles").select("is_banned, can_purchase").eq("id", userId).single();
    if (profileCheck?.is_banned) {
      return NextResponse.json({ error: "Your account has been banned." }, { status: 403 });
    }
    if (profileCheck?.can_purchase === false) {
      return NextResponse.json({ error: "You are currently restricted from purchasing." }, { status: 403 });
    }

    const totalPrice = product.price * quantity;

    if (paymentMethod === "balance") {
      const { data: profile } = await supabaseAdmin.from("profiles").select("balance").eq("id", userId).single();
      const currentBalance = profile ? Number(profile.balance) : 0;
      
      if (currentBalance < totalPrice) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
      }

      const { error: updateError } = await supabaseAdmin.from("profiles").update({ balance: currentBalance - totalPrice }).eq("id", userId);
      if (updateError) {
        return NextResponse.json({ error: "Failed to deduct balance" }, { status: 500 });
      }
    }

    if (paymentMethod === "crypto") {
      return NextResponse.json({ url: "/crypto-mock" });
    }

    if (paymentMethod === "polar") {
      const feeMultiplier = 0.05;
      const fixedFee = 0.50;
      const cardFee = Number((totalPrice * feeMultiplier + fixedFee).toFixed(2));
      const finalAmount = totalPrice + cardFee;

      if (!process.env.POLAR_TOPUP_PRODUCT_ID) {
        console.error("Missing POLAR_TOPUP_PRODUCT_ID in environment variables");
        return NextResponse.json({ error: "Polar configuration missing." }, { status: 500 });
      }

      try {
        const response = await fetch("https://api.polar.sh/v1/checkouts/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.POLAR_ACCESS_TOKEN}`
          },
          body: JSON.stringify({
            payment_processor: "stripe",
            products: [process.env.POLAR_TOPUP_PRODUCT_ID], // We use the same base product, overriding price
            amount: Math.round(finalAmount * 100),
            success_url: `${req.headers.get("origin")}/dashboard?order=success`,
            metadata: {
              type: "product_checkout",
              userId: userId,
              productId: product.id,
              quantity: quantity.toString(),
              totalPrice: totalPrice.toString()
            }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Polar Checkout Error:", errorText);
          return NextResponse.json({ error: "Failed to create Polar checkout" }, { status: 500 });
        }

        const session = await response.json();
        return NextResponse.json({ url: session.url });
      } catch (err: any) {
        console.error("Polar Checkout Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
    }

    // Jeśli zapłacono przez Balance, kontynuujemy z realizacją natychmiastową

    let accountsStr = "";
    
    // TRYB PRAWDZIWY: STRIPE / BALANCE -> NFA API
    let fulfilled = false;
    try {
      const { buyNfaAccounts } = await import("@/lib/nfa");
      // Use timestamp + userId as idempotency key for balance checkouts
      const nfaResult = await buyNfaAccounts(
        product.type,
        quantity,
        `balance-${userId}-${Date.now()}`
      );
      accountsStr = nfaResult.accounts.join("\n");
      fulfilled = nfaResult.accounts.length > 0;
    } catch (nfaErr) {
      console.error("NFA API error during Balance fulfillment:", nfaErr);
    }

    if (!fulfilled) {
      // Jeśli NFA zawiodło (brak kont, zły klucz), musimy ZWRÓCIĆ ŚRODKI na saldo
      const { data: profile } = await supabaseAdmin.from("profiles").select("balance").eq("id", userId).single();
      if (profile) {
        const newBalance = Number(profile.balance) + totalPrice;
        await supabaseAdmin.from("profiles").update({ balance: newBalance }).eq("id", userId);
      }

      // Zapisz zamówienie jako zrefundowane
      const { data: orderData } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          product_id: product.id,
          quantity: quantity,
          total_price: totalPrice,
          status: "refunded",
          accounts_data: "Refund — NFA fulfillment failed",
        })
        .select()
        .single();
        
      return NextResponse.json({ url: `/order/${orderData?.id || 'error'}` });
    }

    // Zapis do Supabase używając prawdziwego ID użytkownika
    const { data: orderData, error: dbError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        product_id: product.id,
        quantity: quantity,
        total_price: totalPrice,
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

    // Push updated metadata to Discord if user is linked
    fetch(new URL('/api/discord/update-metadata', req.url).toString(), {
      method: 'POST',
      body: JSON.stringify({ userId }),
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VERIFICATION_JWT_SECRET}`
      }
    }).catch(console.error);

    // Przekierowanie na stronę zamówienia po "udanym powrocie ze Stripe"
    return NextResponse.json({ url: `/order/${orderData.id}` });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
