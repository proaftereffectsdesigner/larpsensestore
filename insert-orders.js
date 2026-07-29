require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const userId = '6b496005-a6ad-430c-ac19-3ff355abaacf';
  const { data, error } = await supabase.from('orders').insert([
    {
      user_id: userId,
      product_id: 'premier-ready',
      status: 'completed',
      total_price: 14.99,
      quantity: 1,
    },
    {
      user_id: userId,
      product_id: 'prime',
      status: 'completed',
      total_price: 0.69,
      quantity: 1,
    },
    {
      user_id: userId,
      product_id: 'premier-rating',
      status: 'failed',
      total_price: 45.00,
      quantity: 1,
    }
  ]);
  console.log('Insert Orders:', error || 'Success');
})();
