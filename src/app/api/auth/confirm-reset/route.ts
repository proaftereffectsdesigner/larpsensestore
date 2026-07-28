import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const JWT_SECRET = process.env.VERIFICATION_JWT_SECRET || 'fallback_secret';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "Invalid or expired reset token. Please request a new one." }, { status: 401 });
    }

    const userId = payload.sub;
    if (!userId || !payload.email) {
      return NextResponse.json({ error: "Invalid token payload." }, { status: 400 });
    }

    // Check if the new password is the same as the old one by trying to sign in with it
    const { data: signInData } = await supabaseAdmin.auth.signInWithPassword({
      email: payload.email,
      password: password,
    });

    if (signInData?.session) {
      // If sign in succeeds, the new password matches the current one!
      return NextResponse.json({ error: "New password cannot be the same as your current password." }, { status: 400 });
    }

    // Update the user's password using the Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: password
    });

    if (updateError) {
      console.error("Failed to update password:", updateError);
      return NextResponse.json({ error: "Failed to update password. Please try again." }, { status: 500 });
    }

    // Log out of all devices by signing in with the new password, then calling global signout
    const { data: newSessionData } = await supabaseAdmin.auth.signInWithPassword({
      email: payload.email,
      password: password,
    });

    if (newSessionData?.session) {
      // Create a client with the new user session
      const tempClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: {
          headers: { Authorization: `Bearer ${newSessionData.session.access_token}` }
        }
      });
      // Sign out of all devices globally
      await tempClient.auth.signOut({ scope: 'global' });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Confirm reset error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
