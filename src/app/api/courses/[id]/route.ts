import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, supabaseAdmin } from '@/lib/supabase/server';
import { updateCourseSchema } from '@/lib/validation';

// GET /api/courses/[id] - Get course details with lessons
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Use admin client to bypass RLS for course data
    const { data: course, error } = await supabaseAdmin!
      .from('courses')
      .select(`
        *,
        instructor:users(*),
        lessons(*, quiz:quizzes(*, questions(count))),
        enrollments(count)
      `)
      .eq('id', id)
      .single();

    if (error || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user is enrolled (for paid courses)
    const authUser = await getAuthUser(request);
    let enrollment = null;
    let userData = null;
    let lessonProgresses: any[] = [];

    if (authUser) {
      const { data: user } = await supabaseAdmin!
        .from('users')
        .select('id, role')
        .eq('auth_id', authUser.id)
        .single();
        
      userData = user;

      if (user) {
        const { data: enrollData } = await supabaseAdmin!
          .from('enrollments')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', id)
          .single();
        enrollment = enrollData;

        // Fetch progress for all lessons in this course
        if (course.lessons && course.lessons.length > 0) {
          const lessonIds = course.lessons.map((l: any) => l.id);
          const { data: progressData } = await supabaseAdmin!
            .from('lesson_progress')
            .select('*')
            .eq('user_id', user.id)
            .in('lesson_id', lessonIds);
            
          if (progressData) {
            lessonProgresses = progressData;
          }
        }
      }
    }

    return NextResponse.json({ 
      course,
      enrollment,
      hasAccess: enrollment?.status === 'ACTIVE',
      lessonProgresses,
    });
  } catch (error) {
    console.error('Course GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/[id] - Update course
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Check ownership or admin
    const { data: course } = await supabaseAdmin!
      .from('courses')
      .select('created_by')
      .eq('id', id)
      .single();

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.created_by !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized to update this course' },
        { status: 403 }
      );
    }
    
    // Validate input
    const body = await request.json();
    const validation = updateCourseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    // Update course
    const { data: updatedCourse, error } = await supabaseAdmin!
      .from('courses')
      .update(validation.data)
      .eq('id', id)
      .select('*, instructor:users(*)')
      .single();
    
    if (error) {
      console.error('Update course error:', error);
      return NextResponse.json(
        { error: 'Failed to update course' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ course: updatedCourse });
  } catch (error) {
    console.error('Course PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id] - Delete course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Check ownership or admin
    const { data: course } = await supabaseAdmin!
      .from('courses')
      .select('created_by')
      .eq('id', id)
      .single();

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.created_by !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized to delete this course' },
        { status: 403 }
      );
    }
    
    // Delete course (cascade will handle related records)
    const { error } = await supabaseAdmin!
      .from('courses')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Delete course error:', error);
      return NextResponse.json(
        { error: 'Failed to delete course' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Course DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
