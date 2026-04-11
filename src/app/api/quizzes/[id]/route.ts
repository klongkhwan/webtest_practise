import { NextRequest, NextResponse } from 'next/server';
import { getServerClient, supabaseAdmin } from '@/lib/supabase/server';

// PATCH /api/quizzes/[id] - Update a quiz
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: quiz, error } = await supabaseAdmin!
      .from('quizzes')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update quiz error:', error);
      return NextResponse.json({ error: 'Failed to update quiz' }, { status: 500 });
    }

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error('Quiz PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
