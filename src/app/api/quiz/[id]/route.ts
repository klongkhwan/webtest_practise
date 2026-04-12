import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, supabaseAdmin } from '@/lib/supabase/server';

// GET /api/quiz/[id] - Get quiz with questions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get quiz with questions and choices
    const { data: quiz, error } = await supabaseAdmin!
      .from('quizzes')
      .select(`
        *,
        course:courses(*),
        lesson:lessons(*),
        questions:questions(
          *,
          choices:choices(*)
        )
      `)
      .eq('id', id)
      .eq('is_published', true)
      .single();

    if (error || !quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      quiz,
    });
  } catch (error) {
    console.error('Quiz GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
