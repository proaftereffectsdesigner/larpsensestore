import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log("Fetching orders from today...");
  const { data: orders, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5);
  console.log("Recent orders:", orders);
  
  console.log("Fetching oxapay-related logs/orders (if any failed)...");
  // Assuming no specific log table, check user's orders
  // The username in image is 'drogba'
  const { data: profiles } = await supabase.from('profiles').select('id, username').eq('username', 'drogba').limit(1);
  if (profiles && profiles.length > 0) {
      console.log("Drogba Profile:", profiles[0]);
      const { data: drogOrders } = await supabase.from('orders').select('*').eq('user_id', profiles[0].id);
      console.log("Drogba Orders:", drogOrders);
  } else {
      console.log("Drogba not found by username");
  }
}

check();
