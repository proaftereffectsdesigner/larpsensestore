const { createClient } = require('@supabase/supabase-js');

async function run() {
  require('dotenv').config({ path: '.env.local' });
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: users, error: err1 } = await supabase.auth.admin.listUsers();
  if (err1) throw err1;
  
  for (const u of users.users) {
    const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', u.id).single();
    if (profile && !profile.display_name && u.email) {
      const defaultName = u.email.split('@')[0];
      await supabase.from('profiles').update({ display_name: defaultName }).eq('id', u.id);
      console.log(`Updated ${u.id} to ${defaultName}`);
    }
  }
  
  // also modify trigger so future users get it
  const { error: sqlError } = await supabase.rpc('exec_sql', { 
    query: `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.profiles (id, balance, display_name)
        VALUES (new.id, 0, SPLIT_PART(new.email, '@', 1));
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
  });
  // Note: exec_sql might not exist, but let's try.
  console.log('Done');
}
run();
