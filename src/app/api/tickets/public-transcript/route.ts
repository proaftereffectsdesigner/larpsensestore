import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const { searchParams, origin } = new URL(req.url);
    const fileName = searchParams.get('file');

    if (!fileName) {
      return new NextResponse("Missing file parameter", { status: 400 });
    }

    // Attempt to get token from cookies
    const cookieStore = await cookies();
    // In supabase-client.ts the cookie key is sb-[project_ref]-auth-token
    // Let's just find any cookie that looks like a supabase auth token
    let token = '';
    for (const cookie of cookieStore.getAll()) {
      if (cookie.name.includes('-auth-token')) {
        token = cookie.value;
        break;
      }
    }

    if (!token) {
      // Not logged in -> redirect to login with callback
      return NextResponse.redirect(`${origin}/`);
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.redirect(`${origin}/`);
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Extract ticket ID from filename: ticket-[id]-[timestamp].html
    const match = fileName.match(/ticket-(.*?)-\d+\.html/);
    if (match && match[1]) {
      const ticketId = match[1];
      
      const { data: ticket } = await supabaseAdmin
        .from('tickets')
        .select('user_id')
        .eq('id', ticketId)
        .single();
        
      if (ticket && ticket.user_id !== user.id) {
        // Check if admin
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
          
        if (!profile?.is_admin) {
          return new NextResponse("Access Denied: You do not have permission to view this transcript.", { status: 403 });
        }
      }
    }

    const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage
      .from('transcripts')
      .download(fileName);

    if (downloadError || !fileBlob) {
      return new NextResponse("Transcript not found", { status: 404 });
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
