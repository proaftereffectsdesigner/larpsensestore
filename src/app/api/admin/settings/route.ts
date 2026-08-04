import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if ('error' in authResult) return authResult.error;
    const { supabaseAdmin } = authResult;

    const body = await req.json();
    const { stripe_enabled, crypto_enabled, announcement_text, announcement_color } = body;

    const { data, error } = await supabaseAdmin
      .from('store_settings')
      .upsert({
        id: 1,
        stripe_enabled,
        crypto_enabled,
        announcement_text: announcement_text || null,
        announcement_color
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Admin settings API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
