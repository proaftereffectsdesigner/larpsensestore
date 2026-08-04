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
  
  const { data: traffic30, error: e30 } = await supabaseAdmin.from('page_views').select('id, created_at, ip_address').gte('created_at', start30.toISOString());
  const { data: trafficToday, error: eT } = await supabaseAdmin.from('page_views').select('id, created_at, ip_address').gte('created_at', startToday.toISOString());
  
  console.log("30 Days Raw Count:", traffic30?.length, e30);
  console.log("Today Raw Count:", trafficToday?.length, eT);
  
  console.log("Difference between arrays. Are all Today elements inside 30Days?");
  if (trafficToday && traffic30) {
      let missing = 0;
      const ids30 = new Set(traffic30.map(t => t.id));
      trafficToday.forEach(t => {
          if (!ids30.has(t.id)) missing++;
      });
      console.log("Missing elements from 30Days that are in Today:", missing);
  }
}
run();
