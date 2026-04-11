import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { auth_id, email, full_name, phone, role = 'STUDENT', is_phone_verified = false } = body;

    // Validate required fields
    if (!auth_id || !email || !full_name) {
      return NextResponse.json(
        { error: 'Missing required fields: auth_id, email, full_name' },
        { status: 400 }
      );
    }

    // Create user profile in database
    const { data: user, error: userError } = await supabaseAdmin!
      .from('users')
      .insert({
        auth_id,
        email,
        phone: phone || null,
        full_name,
        role,
        is_phone_verified,
      })
      .select()
      .single();

    if (userError) {
      console.error('Profile creation error:', userError);
      return NextResponse.json(
        { error: 'Failed to create profile', details: userError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Registration successful',
      user,
    }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
