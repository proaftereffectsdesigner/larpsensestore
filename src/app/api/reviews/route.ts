import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { createClient } from '@supabase/supabase-js';
import { products } from '@/lib/products';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { orderId, rating, comment } = await req.json();
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token || !orderId || !rating) {
      return NextResponse.json({ error: "Missing parameters or token" }, { status: 400 });
    }

    const authenticatedSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } }
      }
    );

    const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the order belongs to this user and is completed
    const { data: order, error: orderError } = await authenticatedSupabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found or not owned by you" }, { status: 403 });
    }

    if (order.status !== 'completed') {
      return NextResponse.json({ error: "Only completed orders can be reviewed" }, { status: 400 });
    }

    // Insert the review
    const { error: insertError } = await authenticatedSupabase
      .from('reviews')
      .insert({
        user_id: user.id,
        order_id: order.id,
        product_type: order.product_id || 'premier', // Fallback to product_id since product_type isn't in orders table
        rating: Number(rating),
        comment: comment || null,
        is_published: true
      });

    if (insertError) {
      if (insertError.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: "You have already reviewed this order." }, { status: 400 });
      }
      return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
    }

    // Try to notify Discord silently (if bot token exists)
    try {
      const botToken = process.env.DISCORD_BOT_TOKEN;
      const reviewsChannelId = process.env.DISCORD_REVIEWS_CHANNEL_ID;
      
      if (botToken && reviewsChannelId) {
        const product = products.find(p => p.id === order.product_id) || { name: order.product_id };
        const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
        
        const { data: profile } = await authenticatedSupabase.from('profiles').select('id, display_name, avatar_url').eq('id', user.id).single();
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://larpsensestore.com';
        
        await fetch(`https://discord.com/api/v10/channels/${reviewsChannelId}/messages`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            embeds: [{
              title: `New Review for ${product.name}`,
              description: comment || '*No comment provided*',
              color: 0x2ecc71,
              author: profile ? {
                name: profile.display_name || 'Anonymous',
                icon_url: profile.avatar_url || undefined,
                url: `${baseUrl}/user/${profile.id}`
              } : undefined,
              fields: [
                { name: 'Rating', value: stars, inline: true }
              ],
              timestamp: new Date().toISOString()
            }]
          })
        });
      }
    } catch (e) {
      console.error("Discord webhook failed", e);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productType = searchParams.get('product_type');

    let query = supabase
      .from('reviews')
      .select('rating, comment, created_at, profiles!inner(id, display_name, email, avatar_url, is_private)')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (productType) {
      query = query.eq('product_type', productType);
    }

    const { data: reviews, error } = await query.limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reviews });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
