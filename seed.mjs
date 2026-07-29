import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';

const supabaseUrl = 'https://wminzezolovkswuqwmnq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaW56ZXpvbG92a3N3dXF3bW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDE1MzY0OCwiZXhwIjoyMDk5NzI5NjQ4fQ.FGW-anT5zNzEqqvYqXmS9Qa1tM6Dcffht3oEunIXoeA';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  console.log("Generating 200 fake reviews...");
  const productTypes = ['premier', 'prime', 'tenyear'];
  
  for (let i = 0; i < 200; i++) {
    try {
      // 1. Create a fake user
      const email = faker.internet.email();
      const { data: userAuth, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: 'Password123!',
        email_confirm: true
      });

      if (authError) {
        console.error(`Failed to create user ${i}:`, authError.message);
        continue;
      }

      const userId = userAuth.user.id;
      
      const avatarUrl = faker.image.avatar();
      const displayName = faker.internet.username();
      
      // Update profile with avatar and display name
      const { error: profileError } = await supabase.from('profiles').update({
        display_name: displayName,
        avatar_url: avatarUrl
      }).eq('id', userId);

      if (profileError) {
        // If trigger didn't create profile, insert it
        await supabase.from('profiles').insert({
          id: userId,
          email: email,
          display_name: displayName,
          avatar_url: avatarUrl
        });
      }

      // 2. Create a completed order for this user
      const productType = faker.helpers.arrayElement(productTypes);
      const { data: order, error: orderError } = await supabase.from('orders').insert({
        user_id: userId,
        product_id: productType,
        quantity: 1,
        total_price: faker.number.int({ min: 5, max: 20 }),
        status: 'completed',
        accounts_data: 'fake:account:details'
      }).select().single();

      if (orderError) {
        console.error(`Failed to create order ${i}:`, orderError.message);
        continue;
      }

      // 3. Create a review for this order
      const rating = faker.helpers.weightedArrayElement([
        { weight: 70, value: 5 },
        { weight: 20, value: 4 },
        { weight: 5, value: 3 },
        { weight: 3, value: 2 },
        { weight: 2, value: 1 }
      ]);
      
      const content = faker.lorem.sentences(faker.number.int({ min: 1, max: 3 }));
      
      const { error: reviewError } = await supabase.from('reviews').insert({
        order_id: order.id,
        user_id: userId,
        rating: rating,
        comment: content,
        product_type: productType,
        is_published: true
      });

      if (reviewError) {
        console.error(`Failed to create review ${i}:`, reviewError.message);
      } else {
        console.log(`Successfully created review ${i + 1}/200 for user ${displayName}`);
      }
      
      // Small delay to prevent rate limits
      await new Promise(res => setTimeout(res, 50));

    } catch (e) {
      console.error(`Error on iteration ${i}:`, e);
    }
  }
  
  console.log("Done!");
}

run();
