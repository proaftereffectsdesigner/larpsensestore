import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// This endpoint can be called by Vercel Cron or manually
// It auto-cancels pending orders that are older than 2 hours
export async function GET(req: Request) {
  try {
    // Allow calls from Vercel Cron (check Authorization header)
    const authHeader = req.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    // Fetch all orders that are still pending and older than 2 hours
    const { data: expiredOrders, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, total_price, created_at')
      .eq('status', 'pending')
      .lt('created_at', twoHoursAgo);

    if (fetchError) {
      console.error('Error fetching expired orders:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    if (!expiredOrders || expiredOrders.length === 0) {
      return NextResponse.json({ message: 'No pending orders to expire', cancelled: 0 });
    }

    // Batch update all expired orders to 'cancelled'
    const expiredIds = expiredOrders.map((o: any) => o.id);
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled' })
      .in('id', expiredIds);

    if (updateError) {
      console.error('Error cancelling expired orders:', updateError);
      return NextResponse.json({ error: 'Failed to cancel orders' }, { status: 500 });
    }

    console.log(`Auto-cancelled ${expiredIds.length} pending orders older than 2h`);
    return NextResponse.json({ 
      message: `Successfully cancelled ${expiredIds.length} expired pending orders`,
      cancelled: expiredIds.length,
      orderIds: expiredIds
    });

  } catch (err: any) {
    console.error('Expire-pending-orders error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
