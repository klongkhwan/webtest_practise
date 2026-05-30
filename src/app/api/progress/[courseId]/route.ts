import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, supabaseAdmin } from '@/lib/supabase/server';

// GET /api/progress/[courseId] - Get progress for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;

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
    
    // Validate course exists
    const { data: course, error: courseError } = await supabaseAdmin!
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .maybeSingle();

    if (courseError) {
      console.error('Course lookup error:', courseError);
      return NextResponse.json(
        { error: 'Failed to validate course' },
        { status: 500 }
      );
    }

    if (!course) {
      return NextResponse.json(
        { error: 'Course does not exist' },
        { status: 404 }
      );
    }

    // Get enrollment with progress
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin!
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (enrollmentError) {
      console.error('Enrollment lookup error:', enrollmentError);
      return NextResponse.json(
        { error: 'Failed to validate enrollment' },
        { status: 500 }
      );
    }

    if (!enrollment) {
      return NextResponse.json(
        {
          enrolled: false,
          message: 'You are not enrolled in this course yet',
        },
        { status: 200 }
      );
    }

    // Get all lesson progress for this course
    const { data: lessonProgress, error } = await supabaseAdmin!
      .from('lesson_progress')
      .select('*, lesson:lessons(*)')
      .eq('user_id', user.id)
      .eq('course_id', courseId);
    
    if (error) {
      console.error('Fetch progress error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch progress' },
        { status: 500 }
      );
    }
    
    // Get total lessons count
    const { count: totalLessons } = await supabaseAdmin!
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);
    
    return NextResponse.json({
      enrollment,
      lessonProgress: lessonProgress || [],
      totalLessons: totalLessons || 0,
      completedLessons: lessonProgress?.filter(p => p.is_completed).length || 0,
    });
  } catch (error) {
    console.error('Progress GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
