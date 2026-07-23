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
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; background-color: #111111; color: #ffffff; padding: 40px 20px; text-align: center;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; padding: 40px; border-radius: 12px; border: 1px solid #333;">
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin-bottom: 24px; letter-spacing: -0.5px;">Welcome to LarpSense NFA!</h1>
          <p style="color: #a1a1aa; font-size: 16px; line-height: 24px; margin-bottom: 32px;">
            You are almost there. To complete your sign-up, please enter the following verification code:
          </p>
          <div style="background-color: #000000; border: 1px solid #333; padding: 24px; border-radius: 8px; margin-bottom: 32px;">
            <p style="font-size: 36px; font-weight: 800; color: #ffffff; letter-spacing: 8px; margin: 0;">${code}</p>
          </div>
          <p style="color: #71717a; font-size: 14px; margin-bottom: 16px;">
            This code will expire in 10 minutes. If you didn't request this email, you can safely ignore it.
          </p>
          <p style="color: #52525b; font-size: 12px; margin-top: 48px;">
            © ${new Date().getFullYear()} LarpSense. All rights reserved.
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
