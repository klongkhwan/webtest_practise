import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { verifyOtpSchema } from '@/lib/validation';
import { sanitizePhone } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = verifyOtpSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { code } = validation.data;
    const phone = sanitizePhone(validation.data.phone);

    // Find valid OTP
    const { data: otpRecord, error: otpError } = await supabaseAdmin!
      .from('otp_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await supabaseAdmin!
      .from('otp_codes')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('id', otpRecord.id);

    // Check if user exists
    const { data: existingUser } = await supabaseAdmin!
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (existingUser) {
      // Update phone verification status
      await supabaseAdmin!
        .from('users')
        .update({ is_phone_verified: true })
        .eq('id', existingUser.id);

      // Create auth session
      const { data: authData, error: authError } = await supabaseAdmin!.auth.admin.createUser({
        email: existingUser.email,
        phone: phone,
        email_confirm: true,
        phone_confirm: true,
      });

      if (authError && !authError.message.includes('already been registered')) {
        console.error('Auth creation error:', authError);
      }

      return NextResponse.json({
        message: 'OTP verified successfully',
        user: existingUser,
        isNewUser: false,
      });
    }

    // New user - return temp token to complete profile
    return NextResponse.json({
      message: 'OTP verified. Please complete your profile.',
      phone,
      isNewUser: true,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
