import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { loginSchema } from '@/lib/validation';
import { generateOtpCode, sanitizePhone } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid phone number', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const phone = sanitizePhone(validation.data.phone);
    
    // Generate OTP
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP in database
    const { error: insertError } = await supabaseAdmin!
      .from('otp_codes')
      .insert({
        phone,
        code,
        expires_at: expiresAt.toISOString(),
        is_used: false,
        attempt_count: 0,
      });

    if (insertError) {
      console.error('OTP insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to send OTP' },
        { status: 500 }
      );
    }

    // TODO: Integrate with SMS provider (Twilio, etc.)
    // For development, we return the code
    console.log(`[DEV MODE] OTP for ${phone}: ${code}`);

    return NextResponse.json({
      message: 'OTP sent successfully',
      // Remove in production
      dev_code: process.env.NODE_ENV === 'development' ? code : undefined,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
