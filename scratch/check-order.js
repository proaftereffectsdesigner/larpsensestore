const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkOrder() {
    const env = fs.readFileSync('.env.local', 'utf8');
    const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*?)\r?\n/)[1].trim();
    const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*?)\r?\n/)[1].trim();
    
    const supabase = createClient(url, key);
    
    const { data: order } = await supabase.from('orders').select('*').eq('id', 'c84210ff-e165-4743-b7f0-3e81674f9dca').single();
    console.log(order);
}

checkOrder();
