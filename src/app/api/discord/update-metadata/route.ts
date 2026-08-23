import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Refreshes a Discord OAuth2 access token using the stored refresh token.
 * Discord access tokens expire after 7 days — this ensures metadata pushes always work.
 * Returns the new access token, or null if refresh failed (e.g. user revoked access).
 */
async function refreshDiscordToken(refreshToken: string, userId: string): Promise<string | null> {
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET!;

  const res = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[Discord] Token refresh failed for user ${userId}:`, errText);
    return null;
  }

  const data = await res.json();
  const newAccessToken: string = data.access_token;
  const newRefreshToken: string = data.refresh_token;

  // Persist the refreshed tokens so future calls also work
  await supabase.from('profiles').update({
    discord_access_token: newAccessToken,
    discord_refresh_token: newRefreshToken,
  }).eq('id', userId);

  return newAccessToken;
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!process.env.VERIFICATION_JWT_SECRET || authHeader !== `Bearer ${process.env.VERIFICATION_JWT_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const daysRegistered = profile.created_at
      ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // spent_10_eur: 1 if the user has spent >= 10 EUR total, 0 otherwise.
    // Configure Discord role to require this value >= 1.
    const spent10Eur = totalSpent >= 10 ? 1 : 0;

    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const discordUrl = `https://discord.com/api/v10/users/@me/applications/${clientId}/role-connection`;

    const body = {
      platform_name: 'LarpSense Store',
      platform_username: profile.display_name || profile.email,
      metadata: {
        orders_count: ordersCount,
        total_spent: Math.floor(totalSpent),
        days_registered: daysRegistered,
        spent_10_eur: spent10Eur,
      },
    };

    // --- Attempt push with current token ---
    let accessToken: string = profile.discord_access_token;
    let response = await fetch(discordUrl, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // --- If 401 Unauthorized, try to refresh the token and retry once ---
    if (response.status === 401 && profile.discord_refresh_token) {
      console.log(`[Discord] Access token expired for user ${userId}, attempting refresh...`);
      const newToken = await refreshDiscordToken(profile.discord_refresh_token, userId);

      if (!newToken) {
        // Refresh also failed — user likely revoked access; clear their Discord link
        await supabase.from('profiles').update({
          discord_access_token: null,
          discord_refresh_token: null,
        }).eq('id', userId);
        return NextResponse.json({ error: 'Discord token expired and refresh failed. User must re-link their Discord account.' }, { status: 401 });
      }

      accessToken = newToken;
      response = await fetch(discordUrl, {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Discord] Metadata push failed for user ${userId} (HTTP ${response.status}):`, errorText);
      return NextResponse.json({ error: 'Failed to push metadata to Discord', details: errorText }, { status: 500 });
    }

    console.log(`[Discord] Metadata pushed for user ${userId}:`, body.metadata);
    return NextResponse.json({ success: true, metadata: body.metadata });
  } catch (error: any) {
    console.error('[Discord] Update metadata exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
