import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const token = authHeader.replace("Bearer ", "");
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!resend) {
      return NextResponse.json({ error: "Resend API Key is not configured." }, { status: 500 });
    }

    const metadata = user.user_metadata || {};
    const lastRequest = metadata.pending_delete_requested_at;
    const now = Date.now();

    if (lastRequest && (now - lastRequest) < 5 * 60 * 1000) {
      const remainingTime = Math.ceil((5 * 60 * 1000 - (now - lastRequest)) / 1000 / 60);
      return NextResponse.json({ error: `Please wait ${remainingTime} minutes before requesting another account deletion.` }, { status: 429 });
    }

    const tokenString = crypto.randomUUID();

    // Store the pending delete token in user_metadata
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        pending_delete_token: tokenString,
        pending_delete_requested_at: now
      }
    });

    const actionLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://larpsensestore.com'}/dashboard?confirmDeleteToken=${tokenString}`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050505; color: #ffffff; padding: 60px 20px; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #0f0f11; padding: 48px 40px; border-radius: 24px; border: 1px solid #27272a; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.8);">
          <div style="margin-bottom: 40px;">
            <img src="https://larpsensestore.com/logo.png" alt="LarpSense Logo" style="height: 60px; width: auto; object-fit: contain; margin: 0 auto; display: block;" />
          </div>
          <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin-bottom: 16px; letter-spacing: -0.5px;">Account Deletion Request</h1>
          <p style="color: #a1a1aa; font-size: 16px; line-height: 24px; margin-bottom: 32px;">
            We received a request to permanently delete your LarpSense Store account. This action cannot be undone. If you did not make this request, please ignore this email.
          </p>
          <a href="${actionLink}" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px;">
            Confirm Account Deletion
          </a>
          <p style="color: #71717a; font-size: 13px; margin-top: 40px; padding-top: 24px; border-top: 1px solid #27272a;">
            Link expires in 5 minutes. If you have questions, please contact our support.
          </p>
        </div>
      </div>
    `;

    const { error: emailError } = await resend.emails.send({
      from: 'LarpSense Store <noreply@larpsensestore.com>',
      to: user.email!,
      subject: 'Confirm Account Deletion - LarpSense Store',
      html: htmlContent
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      return NextResponse.json({ error: "Failed to send deletion confirmation email." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Confirmation email sent." });
  } catch (err: any) {
    console.error("Request delete error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
