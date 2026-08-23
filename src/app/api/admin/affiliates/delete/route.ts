import { NextResponse } from "next/server";
import { requireAdmin } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if ('error' in authResult) return authResult.error;
    const { supabaseAdmin } = authResult;

    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("affiliate_codes")
      .delete()
      .eq("code", code);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete affiliate error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
