import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const verifyAdmin = async (req: Request) => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: profile } = await supabaseAdmin.from("profiles").select("is_admin").eq("id", user.id).single();
  
  if (!profile || !profile.is_admin) return null;

  return { user, supabaseAdmin };
};

export async function GET(req: Request) {
  const adminContext = await verifyAdmin(req);
  if (!adminContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { supabaseAdmin } = adminContext;
  const { data, error } = await supabaseAdmin.from("promo_codes").select("*").order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ promoCodes: data });
}

export async function POST(req: Request) {
  const adminContext = await verifyAdmin(req);
  if (!adminContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, discount_pct, expires_at, max_uses, min_spent } = await req.json();

  if (!code || !discount_pct || discount_pct < 1 || discount_pct > 100) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { supabaseAdmin } = adminContext;
  const { data, error } = await supabaseAdmin.from("promo_codes").insert({
    code: code.toUpperCase(),
    discount_pct,
    expires_at: expires_at || null,
    max_uses: max_uses || null,
    min_spent: min_spent || 0
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ promoCode: data });
}

export async function DELETE(req: Request) {
  const adminContext = await verifyAdmin(req);
  if (!adminContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  const { supabaseAdmin } = adminContext;
  const { error } = await supabaseAdmin.from("promo_codes").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
