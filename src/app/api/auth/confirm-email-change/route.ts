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
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { confirmToken } = await req.json();
    if (!confirmToken) return NextResponse.json({ error: "Token required" }, { status: 400 });

    const metadata = user.user_metadata || {};
    
    if (metadata.pending_email_token !== confirmToken) {
      return NextResponse.json({ error: "Invalid confirmation token." }, { status: 400 });
    }

    const requestedAt = metadata.pending_email_requested_at;
    const now = Date.now();
    if (!requestedAt || (now - requestedAt) > 5 * 60 * 1000) {
      return NextResponse.json({ error: "Confirmation link has expired (valid for 5 minutes)." }, { status: 400 });
    }

    const newEmail = metadata.pending_email;
    if (!newEmail) {
      return NextResponse.json({ error: "No pending email found." }, { status: 400 });
    }

    // Force update the email directly! This bypasses Supabase dual-confirmation.
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email: newEmail,
      email_confirm: true,
      user_metadata: {
        pending_email: null,
        pending_email_token: null,
        pending_email_requested_at: null
      }
    });

    if (updateError) {
      console.error("Failed to update email", updateError);
      return NextResponse.json({ error: updateError.message || "Failed to update email." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Confirm email error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
