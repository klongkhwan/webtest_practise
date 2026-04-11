import { NextRequest, NextResponse } from 'next/server';
import { getServerClient, supabaseAdmin } from '@/lib/supabase/server';

// GET /api/progress/[courseId] - Get progress for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const supabase = await getServerClient();
    const { courseId } = await params;
    
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
    
    // Get enrollment with progress
    const { data: enrollment } = await supabaseAdmin!
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();
    
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
