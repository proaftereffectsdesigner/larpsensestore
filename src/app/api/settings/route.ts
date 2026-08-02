import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: settings, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      // If table doesn't exist yet, return safe defaults
      return NextResponse.json({
        stripe_enabled: true,
        crypto_enabled: true,
        announcement_text: null,
        announcement_color: 'amber'
      });
    }

    return NextResponse.json(settings);
  } catch (err: any) {
    return NextResponse.json({
      stripe_enabled: true,
      crypto_enabled: true,
      announcement_text: null,
      announcement_color: 'amber'
    });
  }
}
