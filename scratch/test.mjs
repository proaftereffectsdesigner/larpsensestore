import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const now = new Date();
  const start30 = new Date(now); start30.setDate(start30.getDate() - 30);
  const startToday = new Date(now); startToday.setHours(startToday.getHours() - 24);
  
  const { data: traffic30 } = await supabaseAdmin.from('page_views').select('id, created_at, session_id, ip_address').gte('created_at', start30.toISOString());
  const { data: trafficToday } = await supabaseAdmin.from('page_views').select('id, created_at, session_id, ip_address').gte('created_at', startToday.toISOString());
  
  const { data: allProfiles } = await supabaseAdmin.from('profiles').select('id, email, is_admin');
  const adminProfiles = allProfiles?.filter(p => p.is_admin) || [];
  const adminIds = adminProfiles.map(p => p.id);
  const { data: adminLogins } = await supabaseAdmin.from('login_activity').select('ip_address').in('user_id', adminIds);
  const adminIps = new Set(adminLogins?.map(l => l.ip_address).filter(Boolean) || []);
  
  const filtered30 = traffic30?.filter(t => !adminIps.has(t.ip_address)) || [];
  const filteredToday = trafficToday?.filter(t => !adminIps.has(t.ip_address)) || [];
  
  console.log("30 Days Count:", filtered30.length, "Unique:", new Set(filtered30.map(t=>t.session_id)).size);
  console.log("Today Count:", filteredToday.length, "Unique:", new Set(filteredToday.map(t=>t.session_id)).size);
}
run();
