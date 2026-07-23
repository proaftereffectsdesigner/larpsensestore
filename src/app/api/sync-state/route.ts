import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!userId || !token) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    // Extract IP address from headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    let ip = forwardedFor?.split(',')[0] || realIp || '127.0.0.1';

    // Update last_seen and last_ip, and fetch is_admin status
    const { data: currentUser, error } = await supabase
      .from("profiles")
      .update({ 
        last_seen: new Date().toISOString(),
        last_ip: ip
      })
      .eq("id", userId)
      .select("is_admin")
      .single();

    if (error) {
      console.error("Presence update error:", error);
      return NextResponse.json({ error: "Failed to update presence" }, { status: 500 });
    }

    // Never auto-ban an admin!
    if (currentUser?.is_admin) {
      return NextResponse.json({ ok: true });
    }

    // Check for banned accounts on the same IP (Auto-Ban Evasion)
    const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (SUPABASE_SERVICE_ROLE && ip) {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
      
      const { data: bannedAccounts } = await supabaseAdmin
        .from('profiles')
        .select('id, is_banned, ban_expires_at')
        .eq('last_ip', ip)
        .eq('is_banned', true)
        .neq('id', userId)
        .limit(1);

      console.log(`[Presence] IP: ${ip}, Checking for banned accounts... Found:`, bannedAccounts?.length || 0);

      if (bannedAccounts && bannedAccounts.length > 0) {
        // Only ban the current user if they are NOT already banned (prevents infinite loop/resetting acknowledged flag)
        const cu: any = currentUser;
        if (!cu?.is_banned) {
          console.log(`[Presence] IP: ${ip} has banned accounts. Auto-banning user ${userId} for evasion.`);
          
          await supabaseAdmin
            .from('profiles')
            .update({
              is_banned: true,
              can_topup: false,
              can_purchase: false,
              can_update_profile: false,
              ban_reason: 'Ban Evasion (Multiple accounts)',
              ban_acknowledged: false,
              banned_at: new Date().toISOString()
            })
            .eq('id', userId);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
