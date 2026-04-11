'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useFetchOnce } from '@/hooks/useFetchOnce';
import { useLayoutUser } from '@/components/AppLayout';
import { Breadcrumb } from '@/components/Breadcrumb';
import type { Quiz, Question, Choice, QuizAttempt } from '@/types/database';

export default function QuizPage() {
  const params = useParams();
  const quizId = params.id as string;
  const { user: currentUser, setPageLoading } = useLayoutUser();
  const isInitialLoad = useRef(true);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [canAttempt, setCanAttempt] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    maxScore: number;
    percentage: number;
    isPassed: boolean;
  } | null>(null);
  const [error, setError] = useState('');

  const fetchQuiz = useCallback(async () => {
    try {
      const response = await fetch(`/api/quiz/${quizId}`);
      if (!response.ok) {
        throw new Error('Quiz not found');
      }
      const data = await response.json();
      setQuiz(data.quiz);
      setAttempts(data.attempts || []);
      setCanAttempt(data.canAttempt);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      if (isInitialLoad.current) {
        setPageLoading(false);
        isInitialLoad.current = false;
      }
    }
  }, [quizId, setPageLoading]);

  useFetchOnce(fetchQuiz, [quizId, currentUser]);

  const handleSelectAnswer = (questionId: string, choiceId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    // Check all questions answered
    const unansweredQuestions = quiz.questions?.filter((q: Question) => !answers[q.id]);
    if (unansweredQuestions && unansweredQuestions.length > 0) {
      setError(`Please answer all questions (${unansweredQuestions.length} remaining)`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_id: quizId,
          answers: Object.entries(answers).map(([question_id, selected_choice_id]) => ({
            question_id,
            selected_choice_id,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit quiz');
      }

      setResult({
        score: data.score,
        maxScore: data.maxScore,
        percentage: data.percentage,
        isPassed: data.isPassed,
      });
      setAttempts((prev) => [data.attempt, ...prev]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!quiz) {
    if (error) {
      return (
        <div className="page-container">
          <div className="card empty-state max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-700 font-semibold text-lg mb-4">Quiz not found</p>
            <Link href="/courses" className="btn-primary">Browse Courses</Link>
          </div>
        </div>
      );
    }
    return null;
  }

  // Build breadcrumb from quiz lesson/course info
  const breadcrumbItems = [
    { label: 'Courses', href: '/courses' },
    ...(quiz.lesson?.course ? [{ label: quiz.lesson.course.title, href: `/courses/${quiz.lesson.course.id}` }] : []),
    ...(quiz.lesson ? [{ label: quiz.lesson.title, href: `/lessons/${quiz.lesson.id}` }] : []),
    { label: quiz.title },
  ];

  if (result) {
    const passed = result.isPassed;
    return (
      <div className="page-container max-w-3xl mx-auto">
        <Breadcrumb items={breadcrumbItems} />

        <div className="card p-10 text-center">
          <div className={`w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg ${
            passed ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/20' : 'bg-gradient-to-br from-red-500 to-rose-500 shadow-red-500/20'
          }`}>
            {passed ? (
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h2 className={`text-3xl font-bold mb-2 ${passed ? 'text-emerald-700' : 'text-red-700'}`}>
            {passed ? 'Congratulations!' : 'Not Passed'}
          </h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            You scored {result.percentage}% on this quiz
            {passed ? ' — you passed!' : ` — you need ${quiz.passing_score}% to pass.`}
          </p>
          <div className="inline-flex items-center gap-6 bg-slate-50 rounded-2xl px-8 py-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900">{result.percentage}%</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Your Score</p>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900">{quiz.passing_score}%</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Passing Score</p>
            </div>
          </div>
        </div>

        {/* Previous attempts */}
        {attempts.length > 0 && (
          <div className="mt-8">
            <h3 className="section-title mb-4">Previous Attempts</h3>
            <div className="space-y-3">
              {attempts.map((attempt, index) => (
                <div key={attempt.id} className="card p-5 flex items-center justify-between">
                  <span className="text-sm text-slate-500 font-medium">Attempt {attempts.length - index}</span>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${attempt.percentage >= quiz.passing_score ? 'text-emerald-600' : 'text-red-600'}`}>
                      {attempt.percentage}%
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(attempt.submitted_at || '').toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page-container max-w-3xl mx-auto">
      <Breadcrumb items={breadcrumbItems} />

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200/50 text-red-700 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Quiz Info */}
      <div className="card p-6 mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">{quiz.title}</h1>
        {quiz.description && <p className="text-slate-500 mb-4">{quiz.description}</p>}
        <div className="flex items-center gap-4 text-sm text-slate-400 font-medium">
          <span>{quiz.questions?.length || 0} questions</span>
          <span>Pass: {quiz.passing_score}%</span>
          {quiz.time_limit_minutes && <span>Time: {quiz.time_limit_minutes} min</span>}
          <span>Attempts: {quiz.max_attempts}</span>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-5">
        {quiz.questions?.map((q, index) => (
          <div key={q.id} className="card p-6">
            <div className="flex items-start gap-3 mb-5">
              <span className="badge-blue">Q{index + 1}</span>
              <p className="font-semibold text-slate-900">{q.question}</p>
            </div>
            <div className="space-y-2">
              {q.choices?.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleSelectAnswer(q.id, choice.id)}
                  className={`w-full text-left px-5 py-3.5 rounded-xl border-2 transition-all duration-200 ${
                    answers[q.id] === choice.id
                      ? 'border-secondary-500 bg-secondary-50 text-secondary-700 font-semibold shadow-sm shadow-secondary-100'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {choice.text}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={submitting || !canAttempt}
          className="btn-primary px-8 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Quiz'}
        </button>
      </div>
    </div>
  );
}
