import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  if (!process.env.VERIFICATION_JWT_SECRET) {
    console.error('CRITICAL: VERIFICATION_JWT_SECRET is missing');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  const baseUrl = new URL(request.url).origin;
  const redirectUri = encodeURIComponent(`${baseUrl}/api/discord/callback`);
  
  // CRITICAL SECURITY FIX: Sign the state parameter to prevent CSRF and arbitrary account linking
  const stateToken = jwt.sign(
    { userId, nonce: crypto.randomUUID() }, 
    process.env.VERIFICATION_JWT_SECRET, 
    { expiresIn: '10m' }
  );
  
  const discordOAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20role_connections.write&state=${stateToken}`;
  
  return NextResponse.redirect(discordOAuthUrl);
}
