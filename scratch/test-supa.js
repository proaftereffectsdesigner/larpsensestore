const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function test() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*?)\r?\n/)[1].trim();
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*?)\r?\n/)[1].trim();

  const supabaseAdmin = createClient(url, key);

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .order('created_at', { ascending: false })
    .limit(5);

  console.log(data);
}
test();
