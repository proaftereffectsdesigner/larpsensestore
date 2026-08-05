const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function testWebhookWithRealTx() {
    console.log("=== STARTING REAL-TX WEBHOOK TEST ===");
    const env = fs.readFileSync('.env.local', 'utf8');
    const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*?)\r?\n/)[1].trim();
    const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*?)\r?\n/)[1].trim();
    const supabase = createClient(url, key);

    const trackId = "162517014"; // The real txn the user paid for at 16:49 UTC
    const orderId = "dbdf851c-f4d8-4264-8e2d-1473c1ef3416";
    // We will use my admin account or the user's account ID. We need a valid user ID.
    // Let's create a temporary user for this.
    const { data: authData } = await supabase.auth.admin.createUser({
        email: 'test-webhook-verify@example.com',
        password: 'password123',
        email_confirm: true
    });
    const userId = authData.user.id;

    console.log("[1/4] Re-creating the deleted order as a TOPUP to avoid NFA charges...");
    const { error: insertError } = await supabase
        .from('orders')
        .insert({
            id: orderId,
            user_id: userId,
            product_id: 'topup', // TOPUP ensures it doesn't call NFA API
            quantity: 1,
            total_price: 0.69,
            status: 'pending',
            accounts_data: 'Pending OxaPay Payment'
        });
        
    if (insertError) {
        console.error("Failed to insert:", insertError);
        return;
    }

    console.log("[2/4] Triggering Live Webhook on Vercel...");
    const webhookRes = await fetch("https://www.larpsensestore.com/api/webhook/oxapay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            trackId: trackId,
            status: "Paid",
            orderId: orderId
        })
    });
    
    console.log("      Webhook HTTP Status:", webhookRes.status);
    console.log("      Webhook Response:", await webhookRes.text());

    console.log("[3/4] Verifying the database changes...");
    const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
    console.log(`      Order Status: ${order.status}`);
    
    const { data: profile } = await supabase.from('profiles').select('balance').eq('id', userId).single();
    console.log(`      User Balance: ${profile.balance} EUR`);

    console.log("[4/4] Cleaning up...");
    await supabase.from('orders').delete().eq('id', orderId);
    await supabase.auth.admin.deleteUser(userId);
    
    console.log("=== TEST FINISHED ===");
}

testWebhookWithRealTx().catch(console.error);
