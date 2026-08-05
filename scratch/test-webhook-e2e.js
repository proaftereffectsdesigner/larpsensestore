const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function testWebhookLocally() {
    const env = fs.readFileSync('.env.local', 'utf8');
    const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*?)\r?\n/)[1].trim();
    const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*?)\r?\n/)[1].trim();
    const supabase = createClient(url, key);
    
    // Insert a dummy pending order
    const { data: pendingOrder, error: insertError } = await supabase
        .from('orders')
        .insert({
            user_id: '8bdbfbb5-1d85-4c31-8ab6-f21edb7760a7',
            product_id: 'prime',
            quantity: 1,
            total_price: 0.69,
            status: 'pending',
            accounts_data: 'Pending OxaPay Payment'
        })
        .select('id')
        .single();
        
    if (insertError) {
        console.error("Insert error:", insertError);
        return;
    }
    
    console.log("Created test order:", pendingOrder.id);
    
    // Hit webhook on Vercel endpoint
    const res = await fetch("https://www.larpsensestore.com/api/webhook/oxapay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            trackId: "999999999", // Fake track ID
            status: "Paid",
            orderId: pendingOrder.id
        })
    });
    
    console.log("Status:", res.status);
    console.log("Text:", await res.text());
    
    // Cleanup
    await supabase.from('orders').delete().eq('id', pendingOrder.id);
}
testWebhookLocally();
