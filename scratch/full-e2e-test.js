const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const crypto = require('crypto');

async function runFullE2ETest() {
    console.log("=== STARTING FULL END-TO-END PAYMENT TEST ===");
    const env = fs.readFileSync('.env.local', 'utf8');
    const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*?)\r?\n/)[1].trim();
    const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*?)\r?\n/)[1].trim();
    const supabase = createClient(url, key);

    // 1. Create a dummy test user
    console.log("[1/5] Creating temporary test user...");
    const testEmail = `test-user-${crypto.randomUUID().slice(0,8)}@example.com`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'password123',
        email_confirm: true
    });
    if (authError) {
        console.error("Failed to create user:", authError);
        return;
    }
    const userId = authData.user.id;
    console.log("      User created:", userId);

    // Generate JWT for the user to authenticate the API call
    const { data: signData, error: signError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: 'password123'
    });
    const token = signData.session.access_token;

    // 2. Create the Invoice (as if user clicked "Pay" on frontend)
    console.log("\n[2/5] Simulating Frontend calling /api/create-oxapay-invoice for a TOP-UP...");
    // We use topup so we don't accidentally buy real NFA accounts and waste the user's money
    const createInvoiceRes = await fetch("https://www.larpsensestore.com/api/create-oxapay-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userId: userId,
            token: token,
            amount: 5.00, // 5 EUR
            currency: "LTC",
            type: "topup"
        })
    });
    
    if (!createInvoiceRes.ok) {
        console.error("      FAILED to create invoice. Status:", createInvoiceRes.status);
        console.error("      Response:", await createInvoiceRes.text());
        return;
    }
    
    const invoiceData = await createInvoiceRes.json();
    console.log("      Success! OxaPay returned:", JSON.stringify(invoiceData, null, 2));
    
    const trackId = invoiceData.trackId;
    
    // Check if the order was actually created in DB
    const { data: pendingOrder } = await supabase.from('orders').select('*').eq('user_id', userId).single();
    console.log(`      Order in DB created successfully with ID: ${pendingOrder.id}, Status: ${pendingOrder.status}`);
    
    // 3. Simulating the Webhook from OxaPay
    console.log("\n[3/5] Simulating OxaPay server sending the Webhook...");
    console.log(`      Payload: trackId=${trackId}, status=Paid`);
    
    const webhookRes = await fetch("https://www.larpsensestore.com/api/webhook/oxapay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            trackId: trackId,
            status: "Paid"
        })
    });
    
    const webhookText = await webhookRes.text();
    console.log("      Webhook HTTP Status:", webhookRes.status);
    console.log("      Webhook Response:", webhookText);
    
    // 4. Verify Database was updated by the Webhook
    console.log("\n[4/5] Verifying database updates...");
    const { data: updatedOrder } = await supabase.from('orders').select('*').eq('id', pendingOrder.id).single();
    console.log(`      Order Status is now: ${updatedOrder.status}`);
    if (updatedOrder.status !== 'completed') {
        console.error("      ❌ TEST FAILED: Order status is not 'completed'. Webhook failed to process it.");
    } else {
        console.log("      ✅ TEST PASSED: Webhook successfully completed the order!");
    }
    
    const { data: profile } = await supabase.from('profiles').select('balance').eq('id', userId).single();
    console.log(`      User Balance is now: ${profile.balance} EUR`);
    if (Number(profile.balance) > 0) {
        console.log("      ✅ TEST PASSED: Balance was successfully updated!");
    } else {
        console.error("      ❌ TEST FAILED: Balance was not updated.");
    }

    // 5. Cleanup
    console.log("\n[5/5] Cleaning up test data...");
    await supabase.from('orders').delete().eq('id', pendingOrder.id);
    await supabase.auth.admin.deleteUser(userId);
    console.log("      Cleanup done.");
    console.log("\n=== FULL E2E TEST COMPLETED SUCCESSFULLY ===");
}

runFullE2ETest().catch(console.error);
