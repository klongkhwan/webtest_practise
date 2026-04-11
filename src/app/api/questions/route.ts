import { NextRequest, NextResponse } from 'next/server';
import { getServerClient, supabaseAdmin } from '@/lib/supabase/server';
import { createQuestionSchema } from '@/lib/validation';

// GET /api/questions?quizId= - Get questions for a quiz
export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quizId');

    if (quizId) {
      // Get quiz with questions and choices
      const { data: quiz, error: quizError } = await supabaseAdmin!
        .from('quizzes')
        .select('*, course:courses(id, title)')
        .eq('id', quizId)
        .single();

      if (quizError || !quiz) {
        return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
      }

      const { data: questions, error: qError } = await supabaseAdmin!
        .from('questions')
        .select('*, choices(*)')
        .eq('quiz_id', quizId)
        .order('order_index');

      if (qError) {
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
      }

      return NextResponse.json({ quiz, questions: questions || [] });
    }

    return NextResponse.json({ error: 'quizId is required' }, { status: 400 });
  } catch (error) {
    console.error('Questions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/questions - Create a question (or choices)
export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: currentUser } = await supabaseAdmin!
      .from('users')
      .select('id, role')
      .eq('auth_id', authUser.id)
      .single();

    if (!currentUser || (currentUser.role !== 'INSTRUCTOR' && currentUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Check if creating choices (has question_id + choices array)
    if (body.question_id && body.choices) {
      const { question_id, choices } = body;

      const { data: newChoices, error } = await supabaseAdmin!
        .from('choices')
        .insert(choices.map((c: { text: string; is_correct: boolean; order_index: number }, i: number) => ({
          question_id,
          text: c.text,
          is_correct: c.is_correct,
          order_index: c.order_index ?? i,
        })))
        .select();

      if (error) {
        console.error('Create choices error:', error);
        return NextResponse.json({ error: 'Failed to create choices' }, { status: 500 });
      }

      return NextResponse.json({ choices: newChoices }, { status: 201 });
    }

    // Creating a question
    const validation = createQuestionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { quiz_id, question, explanation, points } = validation.data;

    // Get next order index
    const { count } = await supabaseAdmin!
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quiz_id);

    const { data: newQuestion, error } = await supabaseAdmin!
      .from('questions')
      .insert({
        quiz_id,
        question,
        explanation,
        points,
        order_index: (count || 0) + 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Create question error:', error);
      return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
    }

    return NextResponse.json({ question: newQuestion }, { status: 201 });
  } catch (error) {
    console.error('Questions POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
