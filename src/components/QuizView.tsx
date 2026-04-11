'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { useFetchOnce } from '@/hooks/useFetchOnce';
import { useLayoutUser } from '@/components/AppLayout';
import type { Quiz, Question } from '@/types/database';

interface QuizViewProps {
  quizId: string;
  onCancel: () => void;
  onSuccess?: () => void;
}

export function QuizView({ quizId, onCancel, onSuccess }: QuizViewProps) {
  const { user: currentUser } = useLayoutUser();
  const isInitialLoad = useRef(true);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
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
      if (!response.ok) throw new Error('Quiz not found');
      const data = await response.json();
      setQuiz(data.quiz);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      if (isInitialLoad.current) {
        setLoading(false);
        isInitialLoad.current = false;
      }
    }
  }, [quizId]);

  useFetchOnce(fetchQuiz, [quizId, currentUser]);

  const questions = useMemo(() => quiz?.questions || [], [quiz]);
  const currentQuestion = questions[currentIdx];
  const isLastQuestion = currentIdx === questions.length - 1;

  const handleSelectAnswer = (choiceId: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: choiceId }));
    setError('');
  };

  const goToNext = () => {
    if (!answers[currentQuestion.id]) {
      setError('Please select an answer to continue.');
      return;
    }
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentIdx(currentIdx + 1);
      setError('');
    }
  };

  const goToPrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      setError('');
    }
  };

  const handleSubmit = async () => {
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
      if (!response.ok) throw new Error(data.error || 'Submission failed');

      setResult({
        score: data.score,
        maxScore: data.maxScore,
        percentage: data.percentage,
        isPassed: data.isPassed,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-3xl premium-card">
        <div className="loader mb-4 scale-75"></div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Preparing Quiz Experience</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-3xl premium-card text-center p-8">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Quiz Load failed</h3>
        <p className="text-slate-500 mb-8 max-w-xs">{error || 'Unable to load quiz data.'}</p>
        <button onClick={onCancel} className="btn-secondary px-8">Back to Lesson</button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-white rounded-3xl premium-card overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-400/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-md w-full px-8 py-12 text-center relative z-10">
          <div className={`w-24 h-24 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl transition-all duration-700 ${
            result.isPassed 
              ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/30 rotate-[10deg]' 
              : 'bg-gradient-to-br from-red-500 to-rose-500 shadow-red-500/30'
          }`}>
            {result.isPassed ? (
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          
          <h2 className={`text-4xl font-black mb-2 tracking-tight ${result.isPassed ? 'text-emerald-700' : 'text-red-700'}`}>
            {result.isPassed ? 'Victory!' : 'Keep Practicing'}
          </h2>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed">
            {result.isPassed 
              ? `You've mastered this lesson with a score of ${result.percentage}%!` 
              : `You scored ${result.percentage}%. You need ${quiz.passing_score}% to unlock the next level.`}
          </p>

          <div className="bg-slate-50 p-6 rounded-3xl flex justify-around mb-10 border border-slate-100 shadow-inner">
            <div className="text-center">
              <p className="text-2xl font-black text-slate-900 leading-none mb-1">{result.score}/{result.maxScore}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Your Score</p>
            </div>
            <div className="w-px bg-slate-200 h-8 self-center" />
            <div className="text-center">
              <p className="text-2xl font-black text-slate-900 leading-none mb-1">{quiz.passing_score}%</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Required</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {result.isPassed ? (
              <button 
                onClick={() => {
                  if (onSuccess) onSuccess();
                  onCancel();
                }}
                className="w-full py-4 bg-gradient-to-br from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/20 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
              >
                <span>Complete Lesson</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            ) : (
              <>
                <button 
                  onClick={() => {
                    setResult(null);
                    setCurrentIdx(0);
                    setAnswers({});
                  }}
                  className="w-full py-4 bg-secondary-600 hover:bg-secondary-500 text-white rounded-2xl font-black shadow-xl shadow-secondary-600/20 transition-all hover:-translate-y-1"
                >
                  Try Again
                </button>
                <button 
                  onClick={onCancel}
                  className="w-full py-3 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
                >
                  Return to Video
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const progress = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col bg-white rounded-3xl premium-card overflow-hidden">
      {/* Header / Progress Area */}
      <div className="px-8 pt-8 pb-6 bg-slate-50/50 border-b border-slate-100/50 shrink-0">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{quiz.title}</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
              Assessment Phase • {currentIdx + 1} of {questions.length}
            </p>
          </div>
          <button 
            onClick={onCancel}
            className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
            title="Exit Quiz"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Thick Premium Progress Bar */}
        <div className="w-full h-2.5 bg-slate-200/50 rounded-full overflow-hidden shadow-inner flex">
          <div 
            className="h-full bg-gradient-to-r from-secondary-500 via-cyan-500 to-secondary-500 bg-[length:200%_auto] animate-gradient-x transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main Quiz Content */}
      <div className="flex-1 overflow-y-auto px-8 py-10">
        {error && (
          <div className="mb-6 px-5 py-3.5 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[13px] font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in duration-500">
          <div className="flex items-start gap-5">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white font-black flex items-center justify-center shrink-0 shadow-xl shadow-slate-900/10 scale-110">
              {currentIdx + 1}
            </span>
            <h3 className="text-2xl font-extrabold text-slate-800 leading-[1.35] pt-1">
              {currentQuestion.question}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-1">
            {currentQuestion.choices?.map((choice) => {
              const selected = answers[currentQuestion.id] === choice.id;
              return (
                <button
                  key={choice.id}
                  onClick={() => handleSelectAnswer(choice.id)}
                  className={`group relative text-left p-6 rounded-3xl border-2 transition-all duration-300 ${
                    selected
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-lg shadow-emerald-500/5 ring-4 ring-emerald-500/5 pulse-subtle'
                      : 'border-slate-100 hover:border-slate-300 bg-white hover:bg-slate-50/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-lg font-bold leading-tight transition-colors duration-200 ${selected ? 'text-emerald-500' : 'text-slate-600'}`}>
                      {choice.text}
                    </span>
                  </div>
                  
                  {/* Visual feedback glow on hover */}
                  {!selected && (
                    <div className="absolute inset-0 bg-secondary-400/0 group-hover:bg-secondary-400/[0.02] rounded-3xl transition-colors duration-300" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Control Footer */}
      <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100/50 flex items-center justify-between shrink-0">
        <button
          onClick={goToPrev}
          disabled={currentIdx === 0 || submitting}
          className={`flex items-center gap-2 font-bold transition-all px-4 py-2 rounded-xl ${
            currentIdx === 0 || submitting
              ? 'opacity-0 pointer-events-none'
              : 'text-slate-400 hover:text-slate-600 hover:bg-white'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Previous Question
        </button>

        <button
          onClick={goToNext}
          disabled={submitting || !answers[currentQuestion.id]}
          className={`group flex items-center gap-3 px-8 py-3.5 rounded-2xl font-black transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-95 disabled:pointer-events-none ${
            isLastQuestion
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40'
              : 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-slate-800'
          }`}
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <span>{isLastQuestion ? 'Submit Final Answers' : 'Next Question'}</span>
              <svg 
                className={`w-5 h-5 transition-transform duration-300 ${isLastQuestion ? '' : 'group-hover:translate-x-1'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Global CSS for some effects */}
      <style jsx global>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.01); }
        }
        .pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
