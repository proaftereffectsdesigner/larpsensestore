import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Rate limit: max 20 per minute per IP
    const ip = getClientIp(req);
    const rl = rateLimit(`store-stats:${ip}`, { maxRequests: 20, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json({ orders: 0, avgRating: 5.0, reviewCount: 0, reviews: [] });
    }
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get total completed orders
    const { count: orderCount } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    // Get average rating and reviews count (we can just calculate from reviews)
    const { data: allReviews } = await supabaseAdmin
      .from('reviews')
      .select('rating')
      .eq('is_published', true);

    let avgRating = 5.0;
    let reviewCount = 0;
    
    if (allReviews && allReviews.length > 0) {
      reviewCount = allReviews.length;
      const totalStars = allReviews.reduce((acc, curr) => acc + curr.rating, 0);
      avgRating = Number((totalStars / reviewCount).toFixed(1));
    }

    // Get up to 200 latest reviews for the homepage carousel
    const { data: reviews } = await supabaseAdmin
      .from('reviews')
      .select('rating, comment, created_at, product_type, profiles!inner(id, display_name, avatar_url, is_private)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(200);

    return NextResponse.json({
      orders: orderCount || 0,
      avgRating,
      reviewCount,
      reviews: reviews || []
    });
  } catch (err) {
    console.error("store-stats error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
