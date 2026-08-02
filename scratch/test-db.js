require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBucket() {
  const { data, error } = await supabase.storage.updateBucket('transcripts', {
    public: true
  });
  console.log("Update bucket result:", data, error);
}

fixBucket();
