const { createClient } = require('@supabase/supabase-js');
const URL = 'https://wminzezolovkswuqwmnq.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaW56ZXpvbG92a3N3dXF3bW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDE1MzY0OCwiZXhwIjoyMDk5NzI5NjQ4fQ.FGW-anT5zNzEqqvYqXmS9Qa1tM6Dcffht3oEunIXoeA';

const supabaseAdmin = createClient(URL, KEY);

async function run() {
  const id = '3dc47f0c-1d9d-4314-aac8-acd4b3369743';
  const res = await fetch(`http://localhost:3000/api/users/${id}`);
  const json = await res.json();
  console.log("API Data:", json);
}
run();
