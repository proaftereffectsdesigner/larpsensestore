require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function manualFulfill() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const NFA_API_KEY = process.env.NFA_API_KEY;
  const NFA_BASE = "https://www.nfa.pub/api/v1";

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
  const orderId = "0fc6c929-b08a-4c86-80ad-244d80e8a814";
  const txnId = "185956275"; 
  
  try {
    const url = `${NFA_BASE}/cs2?type=prime&quantity=1&result=json`;
    console.log("Fetching NFA...");
    const nfaRes = await fetch(url, {
      method: "POST",
      headers: {
        "X-Api-Key": NFA_API_KEY,
        "Idempotency-Key": `oxapay-${txnId}`
      }
    });

    const nfaData = await nfaRes.json();
    console.log("NFA Response:", nfaData);

    if (nfaData.ok && nfaData.accounts) {
      const accountsStr = nfaData.accounts.join("\n");
      console.log("Got accounts, updating order...");
      
      const { error } = await supabaseAdmin
        .from("orders")
        .update({
          status: "completed",
          accounts_data: `${accountsStr}\n\n[OxaPay Txn: ${txnId}]`,
        })
        .eq("id", orderId);
        
      if (error) console.error("Update error:", error);
      else console.log("Success!");
    } else {
      console.error("Failed to get NFA accounts");
    }
  } catch (e) {
    console.error("Error:", e);
  }
}
manualFulfill();
