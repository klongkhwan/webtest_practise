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
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-black font-mono font-bold text-xs uppercase tracking-widest">Preparing Quiz Experience</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center p-8">
        <div className="w-16 h-16 bg-black text-white border-2 border-black flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-3xl font-serif text-black mb-4">Quiz Load failed</h3>
        <p className="text-slate-600 font-mono text-sm mb-10 leading-relaxed max-w-sm mx-auto">{error || 'Unable to load quiz data.'}</p>
        <button onClick={onCancel} className="px-8 py-3 bg-white text-black border-2 border-black hover:bg-black hover:text-white font-mono text-sm font-bold uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Back to Lesson</button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-white border-2 border-black overflow-hidden relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="max-w-md w-full px-8 py-12 text-center relative z-10">
          <div className={`w-24 h-24 border-2 border-black mx-auto mb-8 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
            result.isPassed 
              ? 'bg-secondary-400 text-black' 
              : 'bg-black text-white'
          }`}>
            {result.isPassed ? (
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          
          <h2 className={`text-5xl font-serif mb-6 tracking-tight ${result.isPassed ? 'text-black' : 'text-black'}`}>
            {result.isPassed ? 'Victory!' : 'Keep Practicing'}
          </h2>
          <p className="text-slate-600 font-mono text-sm mb-10 leading-relaxed font-semibold">
            {result.isPassed 
              ? `You've mastered this lesson with a score of ${result.percentage}%!` 
              : `You scored ${result.percentage}%. You need ${quiz.passing_score}% to unlock the next level.`}
          </p>

          <div className="bg-white p-6 flex justify-around mb-10 border-t-2 border-b-2 border-black">
            <div className="text-center">
              <p className="text-4xl font-serif text-black leading-none mb-2">{result.score}/{result.maxScore}</p>
              <p className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest">Your Score</p>
            </div>
            <div className="w-0.5 bg-black h-12 self-center" />
            <div className="text-center">
              <p className="text-4xl font-serif text-black leading-none mb-2">{quiz.passing_score}%</p>
              <p className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest">Required</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {result.isPassed ? (
              <button 
                onClick={() => {
                  if (onSuccess) onSuccess();
                  onCancel();
                }}
                className="w-full py-4 bg-secondary-400 text-black border-2 border-black font-mono text-xs font-bold uppercase tracking-widest transition-all hover:bg-black hover:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none flex items-center justify-center gap-3 group"
              >
                <span>Complete Lesson</span>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="w-full py-4 bg-black text-white border-2 border-black font-mono text-xs font-bold uppercase tracking-widest transition-all hover:bg-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none"
                >
                  Try Again
                </button>
                <button 
                  onClick={onCancel}
                  className="w-full py-4 bg-white text-black hover:bg-slate-50 border-2 border-black font-mono text-xs font-bold uppercase tracking-widest transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none"
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
    <div className="w-full h-full min-h-[500px] flex flex-col bg-white border-2 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      {/* Header / Progress Area */}
      <div className="px-8 pt-8 pb-6 border-b-2 border-black bg-secondary-400 shrink-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-serif text-black border-b-2 border-black pb-1 inline-block">{quiz.title}</h2>
            <p className="text-[10px] text-black font-mono font-bold uppercase tracking-widest mt-2">
              Assessment Phase • {currentIdx + 1} of {questions.length}
            </p>
          </div>
          <button 
            onClick={onCancel}
            className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center text-black hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-0.5"
            title="Exit Quiz"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Thick Premium Progress Bar */}
        <div className="w-full h-3 bg-white border-2 border-black overflow-hidden">
          <div 
            className="h-full bg-black transition-all duration-700 ease-out"
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
          <div className="flex items-start gap-6">
            <span className="w-12 h-12 bg-white text-black border-2 border-black flex items-center justify-center font-mono font-bold text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
              {currentIdx + 1}
            </span>
            <h3 className="text-3xl font-serif text-black leading-snug pt-1">
              {currentQuestion.question}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-2">
            {currentQuestion.choices?.map((choice) => {
              const selected = answers[currentQuestion.id] === choice.id;
              return (
                <button
                  key={choice.id}
                  onClick={() => handleSelectAnswer(choice.id)}
                  className={`group relative text-left p-6 transition-all duration-200 border-2 border-black block w-full outline-none focus:outline-none ${
                    selected
                      ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[2px] translate-y-[2px]'
                      : 'bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-50 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none translate-x-[-2px] translate-y-[-2px]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-xl font-serif font-bold leading-tight transition-colors duration-200 ${selected ? 'text-secondary-400' : 'text-black'}`}>
                      {choice.text}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Control Footer */}
      <div className="px-8 py-6 bg-white border-t-2 border-black flex items-center justify-between shrink-0">
        <button
          onClick={goToPrev}
          disabled={currentIdx === 0 || submitting}
          className={`flex items-center gap-2 font-mono text-sm font-bold border-2 border-transparent transition-all px-4 py-2 ${
            currentIdx === 0 || submitting
              ? 'opacity-0 pointer-events-none'
              : 'text-slate-600 hover:text-black hover:bg-slate-100 border-black'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          PREVIOUS
        </button>

        <button
          onClick={goToNext}
          disabled={submitting || !answers[currentQuestion.id]}
          className={`group flex items-center gap-3 px-8 py-4 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all ${
            isLastQuestion
              ? 'bg-secondary-400 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white hover:translate-y-0.5 hover:shadow-none'
              : 'bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-900 hover:translate-y-0.5 hover:shadow-none'
          } disabled:opacity-50 disabled:grayscale disabled:pointer-events-none`}
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <span>{isLastQuestion ? 'Submit Answers' : 'Next Question'}</span>
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
    </div>
  );
}
