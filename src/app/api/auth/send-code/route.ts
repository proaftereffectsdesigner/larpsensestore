import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import jwt from 'jsonwebtoken';

const resend = new Resend(process.env.RESEND_API_KEY);
const JWT_SECRET = process.env.VERIFICATION_JWT_SECRET || 'fallback_secret';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Sign a JWT valid for 10 minutes
    const token = jwt.sign({ email, code }, JWT_SECRET, { expiresIn: '10m' });

    // HTML Email Template
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 40px 20px; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #141414; padding: 40px; border-radius: 16px; border: 1px solid #27272a; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
          
          <!-- Logo Section -->
          <div style="margin-bottom: 32px;">
            <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -1px;">
              Larp<span style="color: #3b82f6;">Sense</span>
            </h1>
          </div>

          <h2 style="color: #ffffff; font-size: 20px; font-weight: 600; margin-bottom: 16px;">Verify your email</h2>
          <p style="color: #a1a1aa; font-size: 15px; line-height: 24px; margin-bottom: 32px;">
            Please enter the following 6-digit verification code to complete your registration.
          </p>
          
          <!-- Code Box -->
          <div style="background-color: #000000; border: 1px solid #3f3f46; padding: 20px; border-radius: 12px; margin-bottom: 32px;">
            <p style="font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: 12px; margin: 0; text-indent: 12px;">${code}</p>
          </div>
          
          <p style="color: #71717a; font-size: 13px; margin-bottom: 8px;">
            This code will expire in 10 minutes.
          </p>
          <p style="color: #71717a; font-size: 13px; margin-bottom: 32px;">
            If you didn't request this email, you can safely ignore it.
          </p>

          <hr style="border: 0; border-top: 1px solid #27272a; margin-bottom: 24px;" />
          
          <!-- Footer -->
          <p style="color: #52525b; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} LarpSense. All rights reserved.
          </p>
          <p style="color: #52525b; font-size: 12px; margin-top: 4px;">
            <a href="https://larpsensestore.com" style="color: #3b82f6; text-decoration: none;">larpsensestore.com</a>
          </p>
        </div>
      </div>
    `;

    // Send the email via Resend
    const data = await resend.emails.send({
      from: 'LarpSense NFA <noreply@larpsensestore.com>',
      to: email,
      subject: 'Your LarpSense Verification Code',
      html: htmlContent,
    });

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    return NextResponse.json({ token, message: 'Verification code sent successfully' });
  } catch (error: any) {
    console.error('Error sending verification code:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while sending the email' },
      { status: 500 }
    );
  }
}
