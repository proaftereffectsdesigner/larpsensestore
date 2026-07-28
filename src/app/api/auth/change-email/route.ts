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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const token = authHeader.replace("Bearer ", "");
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { newEmail } = await req.json();
    if (!newEmail) return NextResponse.json({ error: "New email required" }, { status: 400 });

    if (!resendApiKey) {
      return NextResponse.json({ error: "Resend API Key is not configured." }, { status: 500 });
    }

    // Generate link for the new email
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "email_change_new",
      email: user.email!,
      newEmail: newEmail,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`
      }
    });

    if (linkError) {
      console.error("Failed to generate link", linkError);
      return NextResponse.json({ error: "Could not generate email change link." }, { status: 500 });
    }

    // Send email via Resend to the new email address
    const { error: sendError } = await resend.emails.send({
      from: `LarpSense Store <${resendFromEmail}>`,
      to: [newEmail],
      subject: "Confirm your new email address",
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0a; color: #fff; border-radius: 12px; border: 1px solid #333;">
          <h2 style="color: #10b981; margin-bottom: 20px;">LarpSense Store - Email Change</h2>
          <p style="color: #ccc; font-size: 16px; line-height: 1.5;">You recently requested to change your email address for your LarpSense Store account.</p>
          <p style="color: #ccc; font-size: 16px; line-height: 1.5;">Click the button below to confirm your new email address.</p>
          <a href="${linkData.properties.action_link}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Confirm New Email</a>
          <p style="color: #888; font-size: 14px; line-height: 1.5;">If you did not request this, please ignore this email or contact support.</p>
        </div>
      `
    });

    if (sendError) {
      console.error("Failed to send email via Resend", sendError);
      return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
    }

    // Optionally generate link for current email to notify them
    // For now we just send to the new email to verify it.

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Change email error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
