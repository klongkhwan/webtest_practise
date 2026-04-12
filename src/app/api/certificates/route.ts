import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, supabaseAdmin } from '@/lib/supabase/server';

// GET /api/certificates - Get user's certificates
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: user } = await supabaseAdmin!
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: certificates, error } = await supabaseAdmin!
      .from('certificates')
      .select('*, course:courses(title, id), user:users(full_name)')
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
    }

    return NextResponse.json({ certificates });
  } catch (error) {
    console.error('Certificates GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/certificates - Generate certificate (auto or manual)
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: user } = await supabaseAdmin!
      .from('users')
      .select('id, full_name')
      .eq('auth_id', authUser.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { enrollment_id } = body;

    if (!enrollment_id) {
      return NextResponse.json({ error: 'enrollment_id is required' }, { status: 400 });
    }

    // Get enrollment
    const { data: enrollment } = await supabaseAdmin!
      .from('enrollments')
      .select('*, course:courses(title)')
      .eq('id', enrollment_id)
      .eq('user_id', user.id)
      .single();

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    if (enrollment.progress_percent < 100) {
      return NextResponse.json({ error: 'Course not yet completed' }, { status: 400 });
    }

    // Check if certificate already exists
    const { data: existing } = await supabaseAdmin!
      .from('certificates')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', enrollment.course_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Certificate already exists', certificate_id: existing.id }, { status: 409 });
    }

    // Generate certificate number
    const certNumber = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { data: certificate, error } = await supabaseAdmin!
      .from('certificates')
      .insert({
        user_id: user.id,
        course_id: enrollment.course_id,
        enrollment_id: enrollment.id,
        certificate_number: certNumber,
        issued_at: new Date().toISOString(),
      })
      .select('*, course:courses(title, id)')
      .single();

    if (error) {
      console.error('Create certificate error:', error);
      return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500 });
    }

    return NextResponse.json({ certificate }, { status: 201 });
  } catch (error) {
    console.error('Certificate POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
