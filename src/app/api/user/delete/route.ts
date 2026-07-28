import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const token = authHeader.replace("Bearer ", "");
    
    // Use the admin API to get the user based on the token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { confirmDeleteToken } = await req.json();
    if (!confirmDeleteToken) return NextResponse.json({ error: "Token required" }, { status: 400 });

    const metadata = user.user_metadata || {};
    
    if (metadata.pending_delete_token !== confirmDeleteToken) {
      return NextResponse.json({ error: "Invalid confirmation token." }, { status: 400 });
    }

    const requestedAt = metadata.pending_delete_requested_at;
    const now = Date.now();
    if (!requestedAt || (now - requestedAt) > 5 * 60 * 1000) {
      return NextResponse.json({ error: "Confirmation link has expired (valid for 5 minutes)." }, { status: 400 });
    }

    // Ensure they aren't an admin, or handle it carefully. 
    // Delete the user using Admin API which completely purges them from Auth and triggers cascades.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      console.error("Failed to delete user", deleteError);
      return NextResponse.json({ error: "Failed to delete account." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete account error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
