import { createClient } from "@supabase/supabase-js";
import path from 'path';
import dotenv from 'dotenv';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Adding flags to profiles table...");
  
  // Since we cannot easily run ALTER TABLE over PostgREST without an RPC, 
  // I will just use the REST API to execute SQL if possible, or I will rely on the user.
  // Actually, wait, Supabase doesn't let you run arbitrary SQL via the JS client easily unless you use RPC.
  console.log("Please run this in SQL Editor:");
  console.log(`
    alter table public.profiles add column if not exists is_banned boolean default false;
    alter table public.profiles add column if not exists can_topup boolean default true;
    alter table public.profiles add column if not exists can_purchase boolean default true;
    alter table public.profiles add column if not exists can_update_profile boolean default true;
  `);
}

run();
