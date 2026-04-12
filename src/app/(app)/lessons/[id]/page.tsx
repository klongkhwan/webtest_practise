'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useFetchOnce } from '@/hooks/useFetchOnce';
import { useLayoutUser } from '@/components/AppLayout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { QuizView } from '@/components/QuizView';
import type { Course, Lesson, LessonProgress } from '@/types/database';

export default function LessonPage() {
  const params = useParams();
  const lessonId = params.id as string;
  const { user: currentUser, setPageLoading } = useLayoutUser();
  const isInitialLoad = useRef(true);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');
  const [quizPassed, setQuizPassed] = useState(false);
  const [courseAccessible, setCourseAccessible] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [showEnrollConfirm, setShowEnrollConfirm] = useState(false);
  const [showQuizMode, setShowQuizMode] = useState(false);
  const [activeQuizId, setActiveQuizId] = useState('');
  const [lessonProgresses, setLessonProgresses] = useState<any[]>([]);

  const fetchLessonDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}`);
      if (!response.ok) {
        throw new Error('Lesson not found');
      }
      const data = await response.json();
      setLesson(data.lesson);
      setCourse(data.lesson?.course || null);
      setProgress(data.progress);
      setHasAccess(data.hasAccess);
      setQuizPassed(!!data.quizPassed);
      setCourseAccessible(!!data.courseAccessible);
      setLessonProgresses(data.lessonProgresses || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      if (isInitialLoad.current) {
        setPageLoading(false);
        isInitialLoad.current = false;
      }
    }
  }, [lessonId, setPageLoading]);

  useFetchOnce(fetchLessonDetails, [lessonId, currentUser]);

  const hasQuiz = Array.isArray(lesson?.quiz) ? lesson.quiz.length > 0 : !!lesson?.quiz;

  const confirmMarkComplete = async () => {
    if (!lesson || !course) return;

    setCompleting(true);
    setError('');

    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lessonId,
          course_id: course.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to mark complete');
      }

      const data = await response.json();
      setProgress(data.progress);
      setShowConfirm(false);

      const nextLesson = course.lessons && currentIndex >= 0 && currentIndex + 1 < course.lessons.length
        ? course.lessons[currentIndex + 1]
        : null;

      if (nextLesson) {
        window.location.href = `/lessons/${nextLesson.id}`;
      } else {
        // Last lesson completed - go to course overview
        window.location.href = `/courses/${course.id}?completed=true`;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setCompleting(false);
    }
  };

  const handleCompleteClick = () => {
    if (hasQuiz && !quizPassed) {
      const quizId = Array.isArray(lesson?.quiz) ? lesson.quiz[0]?.id : (lesson?.quiz as any)?.id || '';
      if (quizId) {
        setActiveQuizId(quizId);
        setShowQuizMode(true);
        // Scroll to top to ensure quiz is visible
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
    setShowConfirm(true);
  };

  const handleEnrollClick = () => {
    if (!currentUser) {
      window.location.href = `/login?redirect=/lessons/${lessonId}`;
      return;
    }
    setShowEnrollConfirm(true);
  };

  const confirmEnroll = async () => {
    if (!course) return;

    setEnrolling(true);
    setError('');

    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: course.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }
        throw new Error(data.error || 'Failed to enroll');
      }

      setShowEnrollConfirm(false);
      window.location.reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      setEnrolling(false);
    }
  };

  if (!lesson || !course) {
    if (error) {
      return (
        <div className="page-container">
          <div className="bg-white border-2 border-black p-12 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto mt-10">
            <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-black font-serif text-2xl mb-8">Lesson not found</p>
            <Link href="/courses" className="action-view inline-flex px-8 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              Browse Courses
            </Link>
          </div>
        </div>
      );
    }
    return null;
  }

  const currentIndex = course.lessons?.findIndex((l: any) => l.id === lessonId) ?? -1;
  const isFirst = currentIndex <= 0;
  const prevLesson = currentIndex > 0 && course.lessons ? course.lessons[currentIndex - 1] : null;
  const prevLessonCompleted = prevLesson
    ? lessonProgresses.some(p => p.lesson_id === prevLesson.id && p.is_completed)
    : false;
  const isCompleted = progress?.is_completed;
  const isFinished = course.lessons?.every(l => lessonProgresses.some(p => p.lesson_id === l.id && p.is_completed));
  const isUnlockedByProgress = isFirst || prevLessonCompleted || isFinished || isCompleted;

  const isCurrentLessonAccessible = (hasAccess && isUnlockedByProgress) || lesson.is_free || isCompleted || isFinished;

  if (!isCurrentLessonAccessible) {
    return (
      <div className="page-container">
        <Breadcrumb items={[
          { label: 'Courses', href: '/courses' },
          { label: course.title, href: `/courses/${course.id}` },
          { label: lesson.title },
        ]} />
        <div className="bg-white border-2 border-black p-12 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto mt-10">
          <div className="w-16 h-16 bg-slate-100 border-2 border-black flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-serif text-black mb-4">Lesson Locked</h2>
          <p className="text-slate-600 font-mono text-sm mb-8 leading-relaxed max-w-xs mx-auto">
            {!isUnlockedByProgress
              ? 'You must complete the previous lesson before you can view this one.'
              : 'This lesson is part of a paid course. Enroll to access all content.'}
          </p>
          <Link href={`/courses/${course.id}`} className="action-view inline-flex px-8 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            View Course
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Courses', href: '/courses' },
        { label: course.title, href: `/courses/${course.id}` },
        { label: lesson.title },
      ]} />

      {error && (
        <div className="mb-6 p-4 bg-red-500 border-2 border-black text-white font-mono text-sm font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {error}
        </div>
      )}

      {/* Top Section: Video (Left) + Sidebar (Right) */}
      <div className="flex flex-col lg:flex-row gap-8 mb-10 items-stretch">
        {/* Left Area: Video OR Quiz */}
        <div className="w-full lg:w-[68%] shrink-0">
          {showQuizMode && activeQuizId ? (
            <QuizView
              quizId={activeQuizId}
              onCancel={() => setShowQuizMode(false)}
              onSuccess={() => {
                setQuizPassed(true);
                setShowQuizMode(false);
                // After passing, trigger the completion confirm
                setShowConfirm(true);
              }}
            />
          ) : lesson.video_url ? (
            <div className="bg-black border-2 border-black aspect-video relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              {(() => {
                const url = lesson.video_url;
                const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);

                if (ytMatch && ytMatch[1]) {
                  return (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=0&rel=0`}
                      title={lesson.title}
                      className="w-full h-full absolute inset-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }

                return (
                  <video
                    src={url}
                    controls
                    controlsList="nodownload"
                    preload="metadata"
                    autoPlay={false}
                    className="w-full h-full object-contain absolute inset-0"
                  >
                    Your browser does not support the video tag.
                  </video>
                );
              })()}
            </div>
          ) : (
            <div className="bg-white border-2 border-black p-16 h-full flex flex-col items-center justify-center text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div>
                <div className="w-20 h-20 bg-secondary-400 border-2 border-black flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-serif text-black mb-4">Resource Lesson</h3>
                <p className="text-slate-600 font-mono text-sm max-w-sm mx-auto">This lesson focuses on internal content and documentation. Scroll down to read.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Sidebar - Course Lessons */}
        <div className="w-full lg:w-[32%] lg:relative">
          <div className="bg-white border-2 border-black flex flex-col h-[450px] lg:absolute lg:inset-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            {/* Sidebar Header with Progress */}
            <div className="p-6 border-b-2 border-black bg-secondary-400">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif text-xl font-bold text-black border-b-2 border-black pb-1">Course Content</h3>
                <span className="text-[10px] font-bold bg-white text-black border border-black px-2 py-0.5 uppercase tracking-widest">
                  {currentIndex + 1} / {course.lessons?.length || 0}
                </span>
              </div>

              {/* Progress Mini-bar */}
              {(() => {
                const total = course.lessons?.length || 1;
                const completed = course.lessons?.filter(l =>
                  lessonProgresses.some(p => p.lesson_id === l.id && p.is_completed)
                ).length || 0;
                const pct = Math.round((completed / total) * 100);

                return (
                  <div>
                    <div className="flex justify-between text-[11px] mb-2 font-mono font-bold uppercase tracking-widest text-black">
                      <span>Overall Progress</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full bg-white border-2 border-black h-3 overflow-hidden">
                      <div
                        className="bg-[#10b981] h-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="flex-1 overflow-y-auto">
              {course.lessons?.map((l: Lesson, index: number) => {
                const isFirst = index === 0;
                const prevLesson = index > 0 && course.lessons ? course.lessons[index - 1] : null;
                const prevLessonCompleted = prevLesson
                  ? lessonProgresses.some(p => p.lesson_id === prevLesson.id && p.is_completed)
                  : false;

                const isCompleted = lessonProgresses.some(p => p.lesson_id === l.id && p.is_completed);
                const isUnlockedByProgress = isFirst || prevLessonCompleted || isFinished || isCompleted;
                const canAccess = (courseAccessible && isUnlockedByProgress) || l.is_free || isCompleted || isFinished;
                const isActive = l.id === lessonId;

                const content = (
                  <div className={`p-4 border-b-2 border-black last:border-b-0 transition-colors duration-200 flex items-center gap-4 ${isActive
                    ? 'bg-black text-white group-hover:bg-slate-900'
                    : canAccess
                      ? 'bg-white hover:bg-slate-50'
                      : 'bg-slate-50 opacity-60 grayscale-[50%]'
                    }`}>
                      <div className={`w-8 h-8 border-2 flex flex-col items-center justify-center text-[8px] font-mono shrink-0 transition-colors ${
                        isCompleted 
                          ? 'badge-green !p-0' 
                          : isActive 
                            ? 'border-white bg-[#10b981] text-white' 
                            : 'border-black bg-white text-black'
                      }`}>
                        <span className={`opacity-70 text-[6px] ${isCompleted || isActive ? 'text-white' : ''}`}>MOD</span>
                        <span className={`text-[10px] font-bold -mt-1 ${isCompleted || isActive ? 'text-white' : ''}`}>{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-serif text-lg font-bold truncate ${isActive ? 'text-white' : 'text-black'}`}>
                          {l.title}
                        </p>
                          <p className={`text-[10px] font-mono font-bold uppercase tracking-widest ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                            Module {index + 1} • {l.duration_minutes > 0 ? `${l.duration_minutes} min` : 'Reading'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                        {isCompleted && (
                          <span className={`badge-green px-2 py-0.5 !text-[9px] ${isActive ? '!bg-white/20 !text-white !border-white' : ''}`}>Completed</span>
                        )}
                        {!canAccess && (
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                        {l.is_free && (
                          <span className={`badge-yellow px-2 py-0.5 !text-[9px] ${isActive ? '!bg-white/20 !text-white !border-white' : ''}`}>Preview</span>
                        )}
                      </div>
                  </div>
                );

                return canAccess ? (
                  <Link key={l.id} href={`/lessons/${l.id}`} className="block">
                    {content}
                  </Link>
                ) : (
                  <div key={l.id} className="block cursor-not-allowed">
                    {content}
                  </div>
                );
              }) || (
                  <p className="p-4 text-slate-400 text-center text-sm">No lessons available</p>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Details (Full Width Below) */}
      {!showQuizMode && (
        <div className="bg-white border-2 border-black p-8 md:p-12 mb-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b-2 border-black mb-8">
              <div className="flex-1">
                <div className="badge-cyan inline-flex px-3 py-1 mb-6">
                  Module {lesson.order_index + 1}
                </div>
                <h1 className="text-4xl font-serif text-black tracking-tight leading-tight mb-4">
                  {lesson.title}
                </h1>
                <p className="text-slate-600 font-mono text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {lesson.duration_minutes > 0 ? `${lesson.duration_minutes} minutes duration` : 'Standard Reading'}
                </p>
              </div>

              <div className="flex-shrink-0">
                {!courseAccessible ? (
                  <button
                    onClick={handleEnrollClick}
                    disabled={enrolling}
                    className="action-save px-8 py-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none translate-x-[-4px] translate-y-[-4px] hover:translate-x-0 disabled:opacity-50"
                  >
                    {enrolling ? 'Enrolling...' : course.is_paid ? `Enroll Course • $${course.price}` : 'Enroll Course'}
                  </button>
                ) : progress?.is_completed ? (
                  <div className="badge-green inline-flex items-center gap-3 px-8 py-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <div className="w-5 h-5 bg-white text-green-600 flex items-center justify-center">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    Lesson Completed
                  </div>
                ) : (
                  <button
                    onClick={handleCompleteClick}
                    className="action-save px-8 py-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none flex items-center gap-3 group"
                  >
                    {!hasQuiz ? (
                      'Mark as Complete'
                    ) : quizPassed ? (
                      'Complete Lesson'
                    ) : (
                      <>
                        <svg className="w-5 h-5 animate-pulse text-white group-hover:text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Quiz
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Lesson Content Area */}
            {lesson.content && (
              <div className="max-w-4xl text-black font-medium leading-relaxed">
                <div className="whitespace-pre-wrap">{lesson.content}</div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-white/80 backdrop-blur-sm">
          <div className="bg-white border-2 border-black p-10 max-w-sm w-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center relative">
            <div className="w-16 h-16 bg-black text-white flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-3xl font-serif text-black mb-4">Complete Lesson?</h3>
            <p className="text-slate-600 font-mono text-sm mb-10 leading-relaxed">
              Are you sure you want to mark <span className="badge-yellow px-1 !border-none">{lesson.title}</span> as complete?
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={confirmMarkComplete}
                className="action-save w-full py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none"
                disabled={completing}
              >
                {completing ? 'Completing...' : 'Yes, Confirm'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full py-4 bg-white text-black hover:bg-slate-100 border-2 border-black font-mono text-xs font-bold uppercase tracking-widest transition-colors"
                disabled={completing}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Confirmation Modal */}
      {showEnrollConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" onClick={() => setShowEnrollConfirm(false)} />
          <div className="bg-white border-2 border-black p-10 max-w-sm w-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center relative z-10 animate-fade-in-up">
            <h3 className="text-3xl font-serif text-black mb-4">Confirm Enrollment</h3>
            <p className="text-slate-600 font-mono text-sm mb-10 leading-relaxed">
              Are you sure you want to enroll in the course <strong className="badge-yellow px-1 !border-none !text-black">{course.title}</strong>?
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={confirmEnroll}
                disabled={enrolling}
                className="action-save w-full py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none"
              >
                {enrolling ? 'Enrolling...' : 'Yes, Enroll'}
              </button>
              <button
                onClick={() => setShowEnrollConfirm(false)}
                disabled={enrolling}
                className="w-full py-4 bg-white text-slate-600 hover:text-black hover:bg-slate-50 border-2 border-black font-mono text-xs font-bold uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
