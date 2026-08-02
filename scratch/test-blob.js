require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const html = "<html><body><h1>Hello World Blob</h1></body></html>";
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  
  const { data, error } = await supabase.storage.from('transcripts').upload('test-blob.html', blob, {
    contentType: 'text/html;charset=utf-8',
    upsert: true
  });
  
  console.log("Upload result:", data, error);
}

test();
