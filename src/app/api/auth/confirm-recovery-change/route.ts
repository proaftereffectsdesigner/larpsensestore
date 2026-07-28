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
    
    if (metadata.pending_recovery_token !== confirmToken) {
      return NextResponse.json({ error: "Invalid confirmation token." }, { status: 400 });
    }

    const requestedAt = metadata.pending_recovery_requested_at;
    const now = Date.now();
    if (!requestedAt || (now - requestedAt) > 5 * 60 * 1000) {
      return NextResponse.json({ error: "Confirmation link has expired (valid for 5 minutes)." }, { status: 400 });
    }

    const newRecoveryEmail = metadata.pending_recovery_email;
    if (!newRecoveryEmail) {
      return NextResponse.json({ error: "No pending recovery email found." }, { status: 400 });
    }

    // Update profiles table
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ recovery_email: newRecoveryEmail })
      .eq("id", user.id);

    if (profileError) {
      console.error("Failed to update profile", profileError);
      return NextResponse.json({ error: "Failed to update recovery email in profile." }, { status: 500 });
    }

    // Clear the pending metadata
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        pending_recovery_email: null,
        pending_recovery_token: null,
        pending_recovery_requested_at: null
      }
    });

    return NextResponse.json({ success: true, newEmail: newRecoveryEmail });
  } catch (err: any) {
    console.error("Confirm recovery email error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
