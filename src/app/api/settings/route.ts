import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: settings, error } = await supabaseAdmin
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
