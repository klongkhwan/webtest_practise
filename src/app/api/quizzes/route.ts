import { NextRequest, NextResponse } from 'next/server';
import { getServerClient, supabaseAdmin } from '@/lib/supabase/server';
import { createQuizSchema } from '@/lib/validation';

// GET /api/quizzes?courseId=xxx - List quizzes for a course
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    const { data: quizzes, error } = await supabaseAdmin!
      .from('quizzes')
      .select('*, questions(count), lesson:lessons(id, title)')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Fetch quizzes error:', error);
      return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
    }

    const mapped = (quizzes || []).map(q => ({
      ...q,
      questions_count: q.questions?.[0]?.count ?? 0,
      questions: undefined,
    }));

    return NextResponse.json({ quizzes: mapped });
  } catch (error) {
    console.error('Quizzes GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/quizzes - Create a quiz
export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: currentUser } = await supabaseAdmin!
      .from('users')
      .select('role')
      .eq('auth_id', authUser.id)
      .single();

    if (!currentUser || (currentUser.role !== 'INSTRUCTOR' && currentUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = createQuizSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { data: quiz, error } = await supabaseAdmin!
      .from('quizzes')
      .insert({
        ...validation.data,
        is_published: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Create quiz error:', error);
      return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
    }

    return NextResponse.json({ quiz }, { status: 201 });
  } catch (error) {
    console.error('Quizzes POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
