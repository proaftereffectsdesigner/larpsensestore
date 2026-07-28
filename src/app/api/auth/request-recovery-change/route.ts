import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendApiKey = process.env.RESEND_API_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const token = authHeader.replace("Bearer ", "");
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { newRecoveryEmail } = await req.json();
    if (!newRecoveryEmail) return NextResponse.json({ error: "New recovery email required" }, { status: 400 });

    if (!resendApiKey) {
      return NextResponse.json({ error: "Resend API Key is not configured." }, { status: 500 });
    }

    const metadata = user.user_metadata || {};
    const lastRequest = metadata.pending_recovery_requested_at;
    const now = Date.now();

    if (lastRequest && (now - lastRequest) < 5 * 60 * 1000) {
      const remainingTime = Math.ceil((5 * 60 * 1000 - (now - lastRequest)) / 1000 / 60);
      return NextResponse.json({ error: `Please wait ${remainingTime} minutes before requesting another recovery email change.` }, { status: 429 });
    }

    const tokenString = crypto.randomUUID();

    // Store the pending email and token in user_metadata
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        pending_recovery_email: newRecoveryEmail,
        pending_recovery_token: tokenString,
        pending_recovery_requested_at: now
      }
    });

    const actionLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://larpsensestore.com'}/dashboard?confirmRecoveryToken=${tokenString}`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050505; color: #ffffff; padding: 60px 20px; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #0f0f11; padding: 48px 40px; border-radius: 24px; border: 1px solid #27272a; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.8);">
          
          <div style="margin-bottom: 40px;">
            <img src="https://larpsensestore.com/logo.png" alt="LarpSense Logo" style="height: 60px; width: auto; object-fit: contain; margin: 0 auto; display: block;" />
          </div>

          <h2 style="color: #ffffff; font-size: 24px; font-weight: 700; margin-bottom: 16px; letter-spacing: -0.5px;">Confirm Recovery Email</h2>
          <p style="color: #a1a1aa; font-size: 15px; line-height: 24px; margin-bottom: 40px;">
            You requested to change your recovery email address to <strong>${newRecoveryEmail}</strong>. Click the button below to confirm this change.
          </p>
          
          <a href="${actionLink}" style="display: inline-block; padding: 14px 28px; background-color: #ffffff; color: #000000; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; margin-bottom: 40px; letter-spacing: -0.2px;">Confirm Change</a>
          
          <div style="background-color: rgba(255, 255, 255, 0.03); border-radius: 12px; padding: 16px; margin-bottom: 32px;">
            <p style="color: #71717a; font-size: 13px; margin: 0;">
              If you didn't request this change, you can safely ignore this email.
            </p>
          </div>

          <hr style="border: 0; border-top: 1px solid #27272a; margin-bottom: 32px;" />
          
          <p style="color: #52525b; font-size: 12px; margin: 0 0 8px 0;">
            © ${new Date().getFullYear()} LarpSense. All rights reserved.
          </p>
          <p style="color: #52525b; font-size: 12px; margin: 0;">
            <a href="https://larpsensestore.com" style="color: #3b82f6; text-decoration: none;">larpsensestore.com</a> • <a href="mailto:support@larpsensestore.com" style="color: #52525b; text-decoration: underline;">Contact Support</a>
          </p>
        </div>
      </div>
    `;

    // Send email via Resend to the ORIGINAL (current) email address
    const { error: sendError } = await resend.emails.send({
      from: 'LarpSense NFA <noreply@larpsensestore.com>',
      to: user.email!,
      subject: "Confirm recovery email change for your account",
      html: htmlContent
    });

    if (sendError) {
      console.error("Failed to send email via Resend", sendError);
      return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Change recovery email error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
