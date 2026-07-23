import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  try {
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    let ip = forwardedFor?.split(',')[0] || realIp || '127.0.0.1';

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    const { data: bannedProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('last_ip', ip)
      .eq('is_banned', true)
      .limit(1);

    if (bannedProfiles && bannedProfiles.length > 0) {
      return NextResponse.json({ banned: true });
    }

    return NextResponse.json({ banned: false });
  } catch (err) {
    return NextResponse.json({ banned: false });
  }
}
