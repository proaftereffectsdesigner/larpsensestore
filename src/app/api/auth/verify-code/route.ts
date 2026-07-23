import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.VERIFICATION_JWT_SECRET || 'fallback_secret';

// Use the Service Role Key to bypass RLS and create confirmed users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: Request) {
  try {
    const { token, code, password } = await request.json();

    if (!token || !code || !password) {
      return NextResponse.json({ error: 'Token, code, and password are required' }, { status: 400 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    if (decoded.code !== code) {
      return NextResponse.json({ error: 'Incorrect verification code' }, { status: 400 });
    }

    const email = decoded.email;

    // Check if the user already exists to avoid errors
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
       console.error("List users error", listError);
       return NextResponse.json({ error: 'Failed to communicate with database' }, { status: 500 });
    }
    
    const userExists = existingUsers.users.some(u => u.email === email);
    
    if (userExists) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Create the user with confirmed email
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
    });

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Account verified and created successfully' });
  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during verification' },
      { status: 500 }
    );
  }
}
