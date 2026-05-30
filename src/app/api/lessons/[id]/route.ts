import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, supabaseAdmin } from '@/lib/supabase/server';
import { updateLessonSchema } from '@/lib/validation';

// GET /api/lessons/[id] - Get lesson details with progress
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get lesson details with minimal course payload for lesson page
    const { data: lesson, error } = await supabaseAdmin!
      .from('lessons')
      .select(`
        id,
        course_id,
        title,
        content,
        video_url,
        order_index,
        is_free,
        duration_minutes,
        created_at,
        updated_at,
        course:courses(
          id,
          title,
          is_paid,
          price,
          lessons(id,title,order_index,is_free,duration_minutes)
        ),
        quiz:quizzes(*, questions(*, choices(*)))
      `)
      .eq('id', id)
      .single();

    if (error || !lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }


    // Get user progress for this lesson
    const authUser = await getAuthUser(request);
    let progress = null;
    let enrollment = null;
    let quizPassed = false;
    let lessonProgresses: any[] = [];

    if (authUser) {
      const { data: user } = await supabaseAdmin!
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

      if (user) {
        // Get progress for current lesson
        const { data: progressData } = await supabaseAdmin!
          .from('lesson_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('lesson_id', id)
          .single();
        progress = progressData;

        // Get progress for ALL lessons in this course
        const { data: courseLessonRows } = await supabaseAdmin!
          .from('lessons')
          .select('id')
          .eq('course_id', lesson.course_id);

        const lessonIds = (courseLessonRows || []).map((l: any) => l.id);
        if (lessonIds.length > 0) {
          const { data: allProgressData } = await supabaseAdmin!
            .from('lesson_progress')
            .select('*')
            .eq('user_id', user.id)
            .in('lesson_id', lessonIds);

          if (allProgressData) {
            lessonProgresses = allProgressData;
          }
        }

        // Get enrollment
        const { data: enrollData } = await supabaseAdmin!
          .from('enrollments')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', lesson.course_id)
          .single();
        enrollment = enrollData;
        
        // Check quiz passed status if lesson has quiz
        const quizObj = Array.isArray(lesson.quiz) ? lesson.quiz[0] : lesson.quiz;
        if (quizObj) {
          const { data: passAttempt } = await supabaseAdmin!
            .from('quiz_attempts')
            .select('id, is_passed')
            .eq('user_id', user.id)
            .eq('quiz_id', quizObj.id)
            .eq('is_passed', true)
            .limit(1);
            
          if (passAttempt && passAttempt.length > 0) {
            quizPassed = true;
          }
        }
      }
    }

    // Check role based access
    let courseAccessible = false;
    
    if (authUser) {
      const { data: user } = await supabaseAdmin!
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

      if (user) {
        courseAccessible = enrollment?.status === 'ACTIVE' || enrollment?.status === 'COMPLETED';
      }
    }

    const hasAccess = lesson.is_free || courseAccessible;

    return NextResponse.json({
      lesson,
      progress,
      enrollment,
      courseAccessible,
      hasAccess,
      quizPassed,
      lessonProgresses,
    });
  } catch (error) {
    console.error('Lesson GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/lessons/[id] - Update lesson
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

    // Get lesson to check course ownership
    const { data: lesson } = await supabaseAdmin!
      .from('lessons')
      .select('course:courses!inner(created_by)')
      .eq('id', id)
      .single();

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    if ((lesson.course as any).created_by !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized to update this lesson' },
        { status: 403 }
      );
    }

    // Validate input
    const body = await request.json();
    const validation = updateLessonSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // Prevent duplicate lesson title within the same course on update
    if (typeof validation.data.title === 'string') {
      const normalizedTitle = validation.data.title.trim();
      const { data: courseData } = await supabaseAdmin!
        .from('lessons')
        .select('course_id')
        .eq('id', id)
        .single();
        
      const courseId = courseData?.course_id;

      const { data: duplicateLesson, error: duplicateCheckError } = await supabaseAdmin!
        .from('lessons')
        .select('id,title')
        .eq('course_id', courseId)
        .ilike('title', normalizedTitle)
        .neq('id', id) // exclude current lesson
        .maybeSingle();

      if (duplicateCheckError && duplicateCheckError.code !== 'PGRST116') {
        console.error('Duplicate lesson title check error (PATCH):', duplicateCheckError);
        return NextResponse.json(
          { error: 'Failed to validate lesson title' },
          { status: 500 }
        );
      }

      if (duplicateLesson) {
        return NextResponse.json(
          { error: 'Lesson title already exists in this course' },
          { status: 409 }
        );
      }

      // Apply trimmed title to update
      (validation.data as any).title = normalizedTitle;
    }

    // Update lesson
    const { data: updatedLesson, error } = await supabaseAdmin!
      .from('lessons')
      .update(validation.data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update lesson error:', error);
      return NextResponse.json(
        { error: 'Failed to update lesson' },
        { status: 500 }
      );
    }

    return NextResponse.json({ lesson: updatedLesson });
  } catch (error) {
    console.error('Lesson PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/lessons/[id] - Delete lesson
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

    // Get lesson to check course ownership
    const { data: lesson } = await supabaseAdmin!
      .from('lessons')
      .select('course:courses!inner(created_by)')
      .eq('id', id)
      .single();

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    if ((lesson.course as any).created_by !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized to delete this lesson' },
        { status: 403 }
      );
    }

    // Delete quizzes linked to this lesson first
    const { error: deleteQuizzesError } = await supabaseAdmin!
      .from('quizzes')
      .delete()
      .eq('lesson_id', id);

    if (deleteQuizzesError) {
      console.error('Delete linked quizzes error:', deleteQuizzesError);
      return NextResponse.json(
        { error: 'Failed to delete lesson quizzes' },
        { status: 500 }
      );
    }

    // Delete lesson
    const { error } = await supabaseAdmin!
      .from('lessons')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete lesson error:', error);
      return NextResponse.json(
        { error: 'Failed to delete lesson' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Lesson DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
