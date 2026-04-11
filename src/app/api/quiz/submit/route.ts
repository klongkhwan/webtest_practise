import { NextRequest, NextResponse } from 'next/server';
import { getServerClient, supabaseAdmin } from '@/lib/supabase/server';
import { submitQuizSchema } from '@/lib/validation';

// POST /api/quiz/submit - Submit quiz answers
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
    const validation = submitQuizSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    const { quiz_id, answers } = validation.data;
    
    // Get quiz details
    const { data: quiz } = await supabaseAdmin!
      .from('quizzes')
      .select('*, questions(*, choices(*))')
      .eq('id', quiz_id)
      .single();
    
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    
    // Note: We no longer track previous attempts in DB.
    // The quiz behaves as self-assessment on the fly.
    
    // Calculate score
    let score = 0;
    let maxScore = 0;
    const answerRecords = [];
    
    for (const question of quiz.questions) {
      const userAnswer = answers.find(a => a.question_id === question.id);
      const selectedChoice = question.choices.find(
        (c: { id: string; is_correct: boolean }) => c.id === userAnswer?.selected_choice_id
      );
      
      const isCorrect = selectedChoice?.is_correct || false;
      const pointsEarned = isCorrect ? question.points : 0;
      
      score += pointsEarned;
      maxScore += question.points;
      
      answerRecords.push({
        question_id: question.id,
        selected_choice_id: userAnswer?.selected_choice_id || null,
        is_correct: isCorrect,
        points_earned: pointsEarned,
      });
    }
    
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const isPassed = percentage >= quiz.passing_score;
    
    // Only save to database if the user passed the quiz, as requested.
    if (isPassed) {
      // Save the attempt to the database so it can be verified by the progress API
      const { data: attempt, error: attemptError } = await supabaseAdmin!
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: quiz_id,
          score,
          max_score: maxScore,
          percentage,
          is_passed: isPassed,
          submitted_at: new Date().toISOString(),
          time_spent_seconds: 0,
        })
        .select()
        .single();

      if (attemptError) {
        console.error('Save quiz attempt error:', attemptError);
        return NextResponse.json({ error: 'Failed to save quiz result' }, { status: 500 });
      }

      // Save individual answers for historical tracking
      if (answerRecords.length > 0) {
        const { error: answersError } = await supabaseAdmin!
          .from('answers')
          .insert(
            answerRecords.map(record => ({
              attempt_id: attempt.id,
              question_id: record.question_id,
              selected_choice_id: record.selected_choice_id,
              is_correct: record.is_correct,
              points_earned: record.points_earned,
            }))
          );
        
        if (answersError) {
          console.error('Save quiz answers error:', answersError);
        }
      }
    }

    return NextResponse.json({
      message: isPassed ? 'Quiz passed and saved successfully' : 'Quiz evaluated successfully',
      score,
      maxScore,
      percentage,
      isPassed,
    });
  } catch (error) {
    console.error('Quiz submit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
