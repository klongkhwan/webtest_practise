import { NextRequest, NextResponse } from 'next/server';
import { getServerClient, supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { email: rawEmail, password } = body;

    // Reject a missing email or password with HTTP 400
    if (rawEmail === undefined || rawEmail === null || password === undefined || password === null) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password' },
        { status: 400 }
      );
    }

    // Treat empty password as missing/invalid too
    if (typeof password !== 'string' || password === '') {
      return NextResponse.json(
        { error: 'Missing required fields: email, password' },
        { status: 400 }
      );
    }

    // Reject non-string email with HTTP 400 and a validation error
    if (typeof rawEmail !== 'string') {
      return NextResponse.json(
        { error: 'Validation error: email must be a string' },
        { status: 400 }
      );
    }

    // Trim the email before validation and before it is sent to Supabase
    const email = rawEmail.trim();

    // Reject blank email
    if (email === '') {
      return NextResponse.json(
        { error: 'Validation error: email cannot be blank' },
        { status: 400 }
      );
    }

    // Reject malformed email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Validation error: email is malformed' },
        { status: 400 }
      );
    }

    const supabase = await getServerClient();

    // Send the trimmed email to Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // For any failed credential check from Supabase, return HTTP 401 with { "error": "Invalid credentials" }
    // Do not return the Supabase error text
    if (authError) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: user, error: userError } = await supabaseAdmin!
      .from('users')
      .select('*')
      .eq('auth_id', authData.user.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Login successful',
      access_token: authData.session?.access_token,
      refresh_token: authData.session?.refresh_token,
      token_type: 'bearer',
      expires_in: authData.session?.expires_in,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
