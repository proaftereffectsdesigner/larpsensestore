import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const userId = searchParams.get('state');
  
  if (!code || !userId) {
    return NextResponse.redirect(new URL('/dashboard?tab=security&error=DiscordAuthFailed', request.url));
  }

  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = `http://localhost:3000/api/discord/callback`;

  try {
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error('Failed to get token');

    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        authorization: `${tokenData.token_type} ${tokenData.access_token}`,
      },
    });
    
    const userData = await userResponse.json();
    if (!userResponse.ok) throw new Error('Failed to get user info');

    await supabase.from('profiles').update({
      discord_id: userData.id,
      discord_username: userData.username,
      discord_access_token: tokenData.access_token,
      discord_refresh_token: tokenData.refresh_token,
    }).eq('id', userId);

    await fetch(new URL('/api/discord/update-metadata', request.url).toString(), {
      method: 'POST',
      body: JSON.stringify({ userId }),
      headers: { 'Content-Type': 'application/json' }
    });

    return NextResponse.redirect(new URL('/dashboard?tab=security&discord=linked', request.url));
  } catch (err) {
    console.error("Discord Auth Error:", err);
    return NextResponse.redirect(new URL('/dashboard?tab=security&error=DiscordAuthFailed', request.url));
  }
}
