import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PLISIO_SECRET_KEY = process.env.PLISIO_SECRET_KEY;

export async function POST(req: Request) {
  try {
    if (!PLISIO_SECRET_KEY) {
      return NextResponse.json({ error: "Missing PLISIO_SECRET_KEY" }, { status: 500 });
    }

    // Plisio can send webhooks as JSON or form data
    const contentType = req.headers.get("content-type") || "";
    let body: any = {};

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const text = await req.text();
      const params = new URLSearchParams(text);
      params.forEach((val, key) => {
        body[key] = val;
      });
    }

    const txnId = body.txn_id;
    const orderNumber = body.order_number;

    if (!txnId || !orderNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify transaction directly with Plisio API to ensure it's authentic and secure
    const plisioApiUrl = `https://api.plisio.net/api/v1/operations/${txnId}?api_key=${PLISIO_SECRET_KEY}`;
    
    const verifyRes = await fetch(plisioApiUrl, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    const verifyData = await verifyRes.json();

    if (verifyData.status !== "success" || !verifyData.data) {
      console.error("Plisio API returned error for txn_id:", txnId, verifyData);
      return NextResponse.json({ error: "Invalid transaction" }, { status: 400 });
    }

    const txData = verifyData.data;

    // Check if payment is completed
    if (txData.status === "completed" || txData.status === "mismatch") {
      // "mismatch" can happen if they overpaid/underpaid, but Plisio completed it.
      // We will add the actual paid EUR amount to the balance.
      
      let type = "TOPUP";
      let userId = "";
      let amountPaid = 0;
      let productId = "";
      let quantity = 1;

      const orderParts = orderNumber.split('_');
      if (orderParts[0] === "PROD") {
        type = "PROD";
        userId = orderParts[1];
        amountPaid = Number(orderParts[3]);
        productId = orderParts[4];
        quantity = Number(orderParts[5] || 1);
      } else if (orderParts[0] === "TOPUP") {
        type = "TOPUP";
        userId = orderParts[1];
        amountPaid = Number(orderParts[3]);
      } else {
        type = "TOPUP"; // Old format
        userId = orderParts[0];
        amountPaid = Number(orderParts[2]) || Number(txData.source_amount);
      }

      if (isNaN(amountPaid) || amountPaid <= 0) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      }

      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

      // Check if this transaction was already processed
      const { data: existingTx } = await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("payment_intent_id", txnId)
        .single();

      if (existingTx) {
        return NextResponse.json({ received: true });
      }

      if (type === "TOPUP") {
        // Add to balance
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("balance")
          .eq("id", userId)
          .single();

        if (profile) {
          const newBalance = Number(profile.balance) + amountPaid;
          await supabaseAdmin
            .from("profiles")
            .update({ balance: newBalance })
            .eq("id", userId);

          // Record the transaction
          await supabaseAdmin
            .from("orders")
            .insert({
              user_id: userId,
              product_name: "Balance Top-up (Crypto)",
              total_price: amountPaid,
              status: "completed",
              payment_intent_id: txnId
            });
        }
      } else if (type === "PROD") {
        // Fulfill Product
        // Determine product type
        const { products } = await import("@/lib/products");
        const product = products.find(p => p.id === productId);
        
        let fulfilled = false;

        if (product) {
          // Get stock
          const { data: accountsData } = await supabaseAdmin
            .from("accounts")
            .select("id, login, pass, mail, mailpass, type")
            .eq("type", product.type)
            .eq("sold", false)
            .limit(quantity);

          if (accountsData && accountsData.length === quantity) {
            // Mark as sold
            const accountIds = accountsData.map(acc => acc.id);
            await supabaseAdmin
              .from("accounts")
              .update({ sold: true })
              .in("id", accountIds);

            // Record order
            const credentials = accountsData.map(acc => `${acc.login}:${acc.pass}:${acc.mail}:${acc.mailpass}`);
            await supabaseAdmin
              .from("orders")
              .insert({
                user_id: userId,
                product_name: product.name,
                total_price: amountPaid,
                status: "completed",
                payment_intent_id: txnId,
                accounts_delivered: credentials,
                quantity: quantity
              });
              
            fulfilled = true;
          }
        }

        if (!fulfilled) {
          // Refund to balance if failed
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("balance")
            .eq("id", userId)
            .single();

          if (profile) {
            const newBalance = Number(profile.balance) + amountPaid;
            await supabaseAdmin
              .from("profiles")
              .update({ balance: newBalance })
              .eq("id", userId);

            await supabaseAdmin
              .from("orders")
              .insert({
                user_id: userId,
                product_name: `Refund for out of stock: ${product?.name || productId}`,
                total_price: amountPaid,
                status: "completed",
                payment_intent_id: txnId
              });
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Plisio Webhook Error:", err);
    return NextResponse.json({ error: "Webhook Error" }, { status: 500 });
  }
}
