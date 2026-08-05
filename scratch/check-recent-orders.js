const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkRecentOrders() {
    const env = fs.readFileSync('.env.local', 'utf8');
    const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*?)\r?\n/)[1].trim();
    const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*?)\r?\n/)[1].trim();
    
    const supabase = createClient(url, key);
    
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
        
    if (error) console.error(error);
    else console.log(orders);
}

checkRecentOrders();
