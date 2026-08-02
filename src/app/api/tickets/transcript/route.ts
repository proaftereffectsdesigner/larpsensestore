import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl || !targetUrl.startsWith('https://')) {
      return new NextResponse("Invalid URL", { status: 400 });
    }

    const token = searchParams.get('token');
    if (!token) {
      return new NextResponse("Unauthorized (Missing token)", { status: 401 });
    }

    // Authenticate user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify ownership or admin rights
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: ticket } = await supabaseAdmin
      .from('tickets')
      .select('user_id')
      .eq('transcript_url', targetUrl)
      .single();

    if (!ticket) {
      return new NextResponse("Transcript not found", { status: 404 });
    }

    if (ticket.user_id !== user.id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
        
      if (!profile?.is_admin) {
        return new NextResponse("Forbidden - This transcript does not belong to you.", { status: 403 });
      }
    }

    const fileName = targetUrl.split('/').pop();
    if (!fileName) {
      return new NextResponse("Invalid file name", { status: 400 });
    }

    const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage
      .from('transcripts')
      .download(fileName);

    if (downloadError || !fileBlob) {
      return new NextResponse("Failed to download transcript (or it is not accessible)", { status: 404 });
    }

    const html = await fileBlob.text();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
