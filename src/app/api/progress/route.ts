import { NextRequest, NextResponse } from 'next/server';
import { getServerClient, supabaseAdmin } from '@/lib/supabase/server';
import { markLessonCompleteSchema } from '@/lib/validation';

// POST /api/progress - Mark lesson as complete
export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    
    // Check authentication
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
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
    
    // Validate input
    const body = await request.json();
    const validation = markLessonCompleteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    const { lesson_id, course_id } = validation.data;
    
    // Check enrollment
    const { data: enrollment } = await supabaseAdmin!
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', course_id)
      .eq('status', 'ACTIVE')
      .single();
    
    if (!enrollment) {
      return NextResponse.json(
        { error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }
    
    // Check if the lesson has a quiz, and if so, check if they passed it
    const { data: lessonData } = await supabaseAdmin!
      .from('lessons')
      .select('*, quiz:quizzes(*)')
      .eq('id', lesson_id)
      .single();

    if (lessonData && lessonData.quiz && lessonData.quiz.length > 0) {
      const quizObj = lessonData.quiz[0];
      const { data: passAttempt } = await supabaseAdmin!
        .from('quiz_attempts')
        .select('id')
        .eq('user_id', user.id)
        .eq('quiz_id', quizObj.id)
        .eq('is_passed', true)
        .limit(1);

      if (!passAttempt || passAttempt.length === 0) {
        return NextResponse.json(
          { error: 'You must pass the quiz before completing this lesson.' },
          { status: 400 }
        );
      }
    }

    // Upsert lesson progress
    const { data: progress, error } = await supabaseAdmin!
      .from('lesson_progress')
      .upsert({
        user_id: user.id,
        lesson_id,
        course_id,
        is_completed: true,
        completed_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,lesson_id',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Update progress error:', error);
      return NextResponse.json(
        { error: 'Failed to update progress' },
        { status: 500 }
      );
    }
    
    // Get updated enrollment (progress recalculated by trigger)
    const { data: updatedEnrollment } = await supabaseAdmin!
      .from('enrollments')
      .select('*')
      .eq('id', enrollment.id)
      .single();

    // Auto-generate certificate if course completed
    let certificate = null;
    if (updatedEnrollment && updatedEnrollment.progress_percent >= 100 && updatedEnrollment.status === 'ACTIVE') {
      // Update enrollment status to COMPLETED
      await supabaseAdmin!
        .from('enrollments')
        .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
        .eq('id', enrollment.id);

      // Check if certificate already exists
      const { data: existingCert } = await supabaseAdmin!
        .from('certificates')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', course_id)
        .maybeSingle();

      if (!existingCert) {
        const certNumber = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const { data: newCert } = await supabaseAdmin!
          .from('certificates')
          .insert({
            user_id: user.id,
            course_id,
            enrollment_id: enrollment.id,
            certificate_number: certNumber,
            issued_at: new Date().toISOString(),
          })
          .select()
          .single();

        certificate = newCert;
      }
    }

    return NextResponse.json({
      message: 'Lesson marked as complete',
      progress,
      enrollment: updatedEnrollment,
      certificate,
    });
  } catch (error) {
    console.error('Progress POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
