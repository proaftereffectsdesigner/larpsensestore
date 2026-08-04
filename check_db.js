const { createClient } = require('@supabase/supabase-js');
const url = 'https://wminzezolovkswuqwmnq.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaW56ZXpvbG92a3N3dXF3bW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDE1MzY0OCwiZXhwIjoyMDk5NzI5NjQ4fQ.FGW-anT5zNzEqqvYqXmS9Qa1tM6Dcffht3oEunIXoeA';
const supabase = createClient(url, key);

async function run() {
  const startISO = new Date('2026-07-29T00:00:00.000Z').toISOString();
  console.log('--- FETCH ORDERS ---');
  const { data: orders, error: ordersError } = await supabase.from('orders').select('created_at, total_price, product_id, status, profiles(email)').gte('created_at', startISO);
  if (ordersError) console.error('ORDERS ERR:', ordersError);
  else console.log('ORDERS DATA:', JSON.stringify(orders, null, 2));

  console.log('--- FETCH TRAFFIC ---');
  const { data: traffic, error: trafficError } = await supabase.from('page_views').select('created_at, session_id, path, device_type, ip_address, referer').gte('created_at', startISO);
  if (trafficError) console.error('TRAFFIC ERR:', trafficError);
  else {
      console.log('TRAFFIC COUNT:', traffic.length);
      const fiveMinsAgoTime = Date.now() - 5 * 60 * 1000;
      const recent = traffic.filter(t => {
         let dStr = t.created_at;
         if (!dStr.includes('Z') && !dStr.includes('+')) dStr += 'Z';
         return new Date(dStr).getTime() >= fiveMinsAgoTime;
      });
      console.log('RECENT 5MIN VIEWS COUNT:', recent.length);
      if(recent.length > 0) console.log('SAMPLE:', recent[0]);
  }
}
run();
