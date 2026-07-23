import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import jwt from 'jsonwebtoken';

const resend = new Resend(process.env.RESEND_API_KEY);
const JWT_SECRET = process.env.VERIFICATION_JWT_SECRET || 'fallback_secret';

// Simple in-memory rate limiter to prevent spamming
const rateLimitMap = new Map<string, number>();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const now = Date.now();
    // 5 minutes in milliseconds
    const COOLDOWN_PERIOD = 5 * 60 * 1000; 
    
    // Check if the user has requested a code recently
    if (rateLimitMap.has(email)) {
      const lastRequestTime = rateLimitMap.get(email)!;
      const timePassed = now - lastRequestTime;
      
      if (timePassed < COOLDOWN_PERIOD) {
        const minutesLeft = Math.ceil((COOLDOWN_PERIOD - timePassed) / 60000);
        return NextResponse.json(
          { error: `Please wait ${minutesLeft} minute(s) before requesting a new code.` },
          { status: 429 }
        );
      }
    }

    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Sign a JWT valid for 5 minutes
    const token = jwt.sign({ email, code }, JWT_SECRET, { expiresIn: '5m' });

    // HTML Email Template (10x Better Design)
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050505; color: #ffffff; padding: 60px 20px; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #0f0f11; padding: 48px 40px; border-radius: 24px; border: 1px solid #27272a; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.8);">
          
          <!-- Logo Section -->
          <div style="margin-bottom: 40px;">
            <img src="https://larpsensestore.com/logo.png" alt="LarpSense Logo" style="height: 60px; width: auto; object-fit: contain; margin: 0 auto; display: block;" />
          </div>

          <h2 style="color: #ffffff; font-size: 24px; font-weight: 700; margin-bottom: 16px; letter-spacing: -0.5px;">Verify your identity</h2>
          <p style="color: #a1a1aa; font-size: 15px; line-height: 24px; margin-bottom: 40px;">
            You are one step away from joining LarpSense. Enter the code below to complete your registration.
          </p>
          
          <!-- Code Box -->
          <div style="background-color: #000000; border: 1px solid #3f3f46; padding: 24px; border-radius: 16px; margin-bottom: 40px; display: inline-block; width: 80%;">
            <p style="font-size: 38px; font-weight: 800; color: #ffffff; letter-spacing: 16px; margin: 0; text-indent: 16px;">${code}</p>
          </div>
          
          <div style="background-color: rgba(255, 255, 255, 0.03); border-radius: 12px; padding: 16px; margin-bottom: 32px;">
            <p style="color: #71717a; font-size: 13px; margin: 0 0 4px 0;">
              This code will securely expire in <strong style="color: #e4e4e7;">5 minutes</strong>.
            </p>
            <p style="color: #71717a; font-size: 13px; margin: 0;">
              If you didn't request this email, you can safely ignore it.
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

    // Save the request time to rate limit map after successfully sending email
    rateLimitMap.set(email, now);
    
    // Cleanup old entries from the map to prevent memory leaks over time
    if (rateLimitMap.size > 1000) {
      for (const [key, timestamp] of rateLimitMap.entries()) {
        if (now - timestamp > COOLDOWN_PERIOD) {
          rateLimitMap.delete(key);
        }
      }
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
