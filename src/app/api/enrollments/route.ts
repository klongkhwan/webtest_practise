import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, supabaseAdmin } from '@/lib/supabase/server';
import { enrollSchema } from '@/lib/validation';

// GET /api/enrollments - Get user's enrollments
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user profile
    const { data: user } = await supabaseAdmin!
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get enrollments with course details
    const { data: enrollments, error } = await supabaseAdmin!
      .from('enrollments')
      .select('*, course:courses(*, instructor:users(*), lessons(count))')
      .eq('user_id', user.id)
      .order('enrolled_at', { ascending: false });
    
    if (error) {
      console.error('Fetch enrollments error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch enrollments' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ enrollments });
  } catch (error) {
    console.error('Enrollments GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/enrollments - Enroll in a course
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: user } = await supabaseAdmin!
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate input
    const body = await request.json();
    const validation = enrollSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { course_id } = validation.data;

    // Check if course exists and is published
    const { data: course } = await supabaseAdmin!
      .from('courses')
      .select('*')
      .eq('id', course_id)
      .eq('status', 'PUBLISHED')
      .single();

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found or not published' },
        { status: 404 }
      );
    }

    // Check existing enrollment to prevent duplicate enroll/re-enroll
    const { data: existingEnrollment, error: existingEnrollmentError } = await supabaseAdmin!
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', course_id)
      .maybeSingle();

    if (existingEnrollmentError) {
      console.error('Check existing enrollment error:', existingEnrollmentError);
      return NextResponse.json(
        { error: 'Failed to validate enrollment state' },
        { status: 500 }
      );
    }

    if (existingEnrollment) {
      if (existingEnrollment.status === 'COMPLETED') {
        return NextResponse.json(
          { error: 'You have already completed this course' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Already enrolled in this course' },
        { status: 409 }
      );
    }
    
    // For paid courses, payment would be handled here
    if (course.is_paid && course.price > 0) {
      // TODO: Integrate payment gateway (Stripe, etc.)
      // For now, assume free or payment processed
    }
    
    // Create enrollment
    const { data: enrollment, error } = await supabaseAdmin!
      .from('enrollments')
      .insert({
        user_id: user.id,
        course_id,
        status: 'ACTIVE',
        progress_percent: 0,
      })
      .select('*, course:courses(*)')
      .single();
    
    if (error) {
      console.error('Create enrollment error:', error);
      return NextResponse.json(
        { error: 'Failed to enroll in course' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Successfully enrolled in course',
      enrollment 
    }, { status: 201 });
  } catch (error) {
    console.error('Enrollments POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
