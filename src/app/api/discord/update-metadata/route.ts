import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!profile || !profile.discord_access_token) {
      return NextResponse.json({ message: 'No discord connection found' }, { status: 200 });
    }

    const { data: orders } = await supabase.from('orders').select('*').eq('user_id', userId);
    
    let totalSpent = 0;
    let ordersCount = 0;
    
    if (orders && orders.length > 0) {
      ordersCount = orders.length;
      totalSpent = orders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
    }
    
    const isElite = totalSpent >= 100 ? 1 : 0; // Discord boolean is represented as 0/1 in metadata payload

    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const url = `https://discord.com/api/v10/users/@me/applications/${clientId}/role-connection`;

    const body = {
      platform_name: 'LarpSense Store',
      platform_username: profile.display_name || profile.email,
      metadata: {
        orders_count: ordersCount,
        total_spent: Math.floor(totalSpent),
        is_elite: isElite,
      },
    };

    const response = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${profile.discord_access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Discord Metadata Error:', errorText);
      return NextResponse.json({ error: 'Failed to push metadata' }, { status: 500 });
    }

    return NextResponse.json({ success: true, metadata: body.metadata });
  } catch (error: any) {
    console.error('Update metadata exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
