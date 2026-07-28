import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import jwt from "jsonwebtoken";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendApiKey = process.env.RESEND_API_KEY!;
const JWT_SECRET = process.env.VERIFICATION_JWT_SECRET || 'fallback_secret';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

// Rate limiter map for 5-minute cooldown
const rateLimitMap = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    if (!resendApiKey) {
      return NextResponse.json({ error: "Resend API Key is not configured." }, { status: 500 });
    }

    const now = Date.now();
    const COOLDOWN_PERIOD = 5 * 60 * 1000; 
    
    // Check if the user has requested a reset recently
    if (rateLimitMap.has(email)) {
      const lastRequestTime = rateLimitMap.get(email)!;
      const timePassed = now - lastRequestTime;
      
      if (timePassed < COOLDOWN_PERIOD) {
        const minutesLeft = Math.ceil((COOLDOWN_PERIOD - timePassed) / 60000);
        return NextResponse.json(
          { error: `Please wait ${minutesLeft} minute(s) before requesting a new password reset.` },
          { status: 429 }
        );
      }
    }

    // Lookup user to ensure they exist and to get their ID
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;
    
    const targetUser = usersData.users.find(u => u.email === email);
    
    // For security, do not reveal if the user doesn't exist, just act like it worked
    // However, if they DO exist, we generate the JWT and send the email.
    if (targetUser) {
      // Create a JWT valid for 5 minutes
      const token = jwt.sign({ sub: targetUser.id, email: targetUser.email }, JWT_SECRET, { expiresIn: '5m' });
      const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050505; color: #ffffff; padding: 60px 20px; text-align: center;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #0f0f11; padding: 48px 40px; border-radius: 24px; border: 1px solid #27272a; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.8);">
            
            <!-- Logo Section -->
            <div style="margin-bottom: 40px;">
              <img src="https://larpsensestore.com/logo.png" alt="LarpSense Logo" style="height: 60px; width: auto; object-fit: contain; margin: 0 auto; display: block;" />
            </div>

            <h2 style="color: #ffffff; font-size: 24px; font-weight: 700; margin-bottom: 16px; letter-spacing: -0.5px;">Password Reset Request</h2>
            <p style="color: #a1a1aa; font-size: 15px; line-height: 24px; margin-bottom: 40px;">
              You recently requested to reset your password for your LarpSense Store account. Click the button below to reset it.
            </p>
            
            <a href="${resetLink}" style="display: inline-block; padding: 14px 28px; background-color: #ffffff; color: #000000; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; margin-bottom: 40px; letter-spacing: -0.2px;">Reset Password</a>
            
            <div style="background-color: rgba(255, 255, 255, 0.03); border-radius: 12px; padding: 16px; margin-bottom: 32px;">
              <p style="color: #71717a; font-size: 13px; margin: 0 0 4px 0;">
                This link is securely valid for <strong style="color: #e4e4e7;">5 minutes</strong>.
              </p>
              <p style="color: #71717a; font-size: 13px; margin: 0;">
                If you didn't request a password reset, you can safely ignore this email.
              </p>
            </div>

            <hr style="border: 0; border-top: 1px solid #27272a; margin-bottom: 32px;" />
            
            <!-- Footer -->
            <p style="color: #52525b; font-size: 12px; margin: 0 0 8px 0;">
              © ${new Date().getFullYear()} LarpSense. All rights reserved.
            </p>
            <p style="color: #52525b; font-size: 12px; margin: 0;">
              <a href="https://larpsensestore.com" style="color: #3b82f6; text-decoration: none;">larpsensestore.com</a> • <a href="mailto:support@larpsensestore.com" style="color: #52525b; text-decoration: underline;">Contact Support</a>
            </p>
          </div>
        </div>
      `;

      // Send email via Resend
      const { error: sendError } = await resend.emails.send({
        from: 'LarpSense NFA <noreply@larpsensestore.com>',
        to: email,
        subject: "Password Reset Request",
        html: htmlContent
      });

      if (sendError) {
        console.error("Failed to send email via Resend", sendError);
        return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
      }
      
      rateLimitMap.set(email, now);
    }
    
    // Cleanup rate limit map
    if (rateLimitMap.size > 1000) {
      for (const [key, timestamp] of rateLimitMap.entries()) {
        if (now - timestamp > COOLDOWN_PERIOD) {
          rateLimitMap.delete(key);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Reset password error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

