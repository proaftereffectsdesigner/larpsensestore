import { NextResponse } from "next/server";
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if ('error' in authResult) return authResult.error;
    const { supabaseAdmin } = authResult;

    const { data: tickets, error } = await supabaseAdmin
      .from('tickets')
      .select('*, profiles(email, display_name, avatar_url, discord_username)')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Fetch auth users to get correct emails if missing from profiles
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authData?.users && tickets) {
      const emailMap = new Map();
      for (const u of authData.users) {
        emailMap.set(u.id, u.email);
      }
      for (const t of tickets) {
        if (!t.profiles) t.profiles = {};
        if (!t.profiles.email) {
          t.profiles.email = emailMap.get(t.user_id) || null;
        }
      }
    }

    return NextResponse.json(tickets);
  } catch (error: any) {
    console.error("Admin tickets API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
