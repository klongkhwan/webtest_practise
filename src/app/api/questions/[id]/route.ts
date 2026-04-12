import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, supabaseAdmin } from '@/lib/supabase/server';

// PATCH /api/questions/[id] - Update question and choices
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authUser = await getAuthUser(request);
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
    const { question, explanation, points, choices } = body;

    // Update question
    const updateData: Record<string, unknown> = {};
    if (question !== undefined) updateData.question = question;
    if (explanation !== undefined) updateData.explanation = explanation || null;
    if (points !== undefined) updateData.points = points;

    if (Object.keys(updateData).length > 0) {
      const { error: qError } = await supabaseAdmin!
        .from('questions')
        .update(updateData)
        .eq('id', id);

      if (qError) {
        console.error('Update question error:', qError);
        return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
      }
    }

    // Update choices if provided
    if (choices && Array.isArray(choices)) {
      // Delete existing choices
      await supabaseAdmin!
        .from('choices')
        .delete()
        .eq('question_id', id);

      // Insert new choices
      const choicesPayload = choices
        .filter((c: { text: string }) => c.text?.trim())
        .map((c: { text: string; is_correct: boolean }, i: number) => ({
          question_id: id,
          text: c.text,
          is_correct: c.is_correct,
          order_index: i,
        }));

      if (choicesPayload.length > 0) {
        const { error: cError } = await supabaseAdmin!
          .from('choices')
          .insert(choicesPayload);

        if (cError) {
          console.error('Update choices error:', cError);
          return NextResponse.json({ error: 'Failed to update choices' }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ message: 'Question updated' });
  } catch (error) {
    console.error('Question PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/questions/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authUser = await getAuthUser(request);
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

    const { error } = await supabaseAdmin!
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Question deleted' });
  } catch (error) {
    console.error('Question DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
