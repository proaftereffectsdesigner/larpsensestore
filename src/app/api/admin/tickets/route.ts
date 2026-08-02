import { NextResponse } from "next/server";
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if ('error' in authResult) return authResult.error;
    const { supabaseAdmin } = authResult;

    const { data: tickets, error } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(tickets);
  } catch (error: any) {
    console.error("Admin tickets API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
