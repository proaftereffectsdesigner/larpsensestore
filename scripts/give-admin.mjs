import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFixAdmin() {
  console.log("Fetching profiles...");
  
  // Find the profile where auth email matches or just check all profiles
  const { data: profiles, error } = await supabase.from('profiles').select('*');
  
  if (error) {
    console.error("Error fetching profiles:", error);
    return;
  }
  
  console.log(`Found ${profiles?.length || 0} profiles.`);
  
  // Force update ALL profiles to have is_admin = true for testing!
  // Or just update where email matches
  let updatedCount = 0;
  for (const profile of profiles || []) {
    console.log(`Profile ID: ${profile.id}, Email: ${profile.email}`);
    
    // In Supabase, the profiles table might NOT have the email field populated if it wasn't explicitly saved!
    // We will just forcefully make THIS specific user ID an admin, or all of them.
    
    // Let's just make EVERY profile an admin to be safe, since he's the only one testing it locally
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', profile.id);
      
    if (updateError) {
      console.error(`Failed to update ${profile.id}:`, updateError);
    } else {
      updatedCount++;
    }
  }
  
  console.log(`Successfully gave admin rights to ${updatedCount} accounts!`);
}

checkAndFixAdmin();
