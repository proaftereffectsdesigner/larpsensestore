import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendApiKey = process.env.RESEND_API_KEY!;
const resendFromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    if (!resendApiKey) {
      return NextResponse.json({ error: "Resend API Key is not configured." }, { status: 500 });
    }

    // Generate link using Supabase Admin
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`
      }
    });

    if (linkError) {
      console.error("Failed to generate link", linkError);
      return NextResponse.json({ error: "Could not generate reset link." }, { status: 500 });
    }

    // Send email via Resend
    const { error: sendError } = await resend.emails.send({
      from: `LarpSense Store <${resendFromEmail}>`,
      to: [email],
      subject: "Password Reset Request",
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0a; color: #fff; border-radius: 12px; border: 1px solid #333;">
          <h2 style="color: #10b981; margin-bottom: 20px;">LarpSense Store - Password Reset</h2>
          <p style="color: #ccc; font-size: 16px; line-height: 1.5;">You recently requested to reset your password for your LarpSense Store account. Click the button below to reset it.</p>
          <a href="${linkData.properties.action_link}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Reset Password</a>
          <p style="color: #888; font-size: 14px; line-height: 1.5;">If you did not request a password reset, please ignore this email or reply to let us know. This password reset is only valid for the next 24 hours.</p>
        </div>
      `
    });

    if (sendError) {
      console.error("Failed to send email via Resend", sendError);
      return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Reset password error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
