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
          <div className="card empty-state max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-700 font-semibold text-lg mb-4">Lesson not found</p>
            <Link href="/courses" className="btn-primary">
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
        <div className="card p-10 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Lesson Locked</h2>
          <p className="text-slate-500 mb-6">
            {!isUnlockedByProgress
              ? 'You must complete the previous lesson before you can view this one.'
              : 'This lesson is part of a paid course. Enroll to access all content.'}
          </p>
          <Link href={`/courses/${course.id}`} className="btn-primary">
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
        <div className="mb-6 p-4 bg-red-50 border border-red-200/50 text-red-700 rounded-2xl text-sm font-medium">
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
            <div className="video-glow bg-black aspect-video">
              {(() => {
                const url = lesson.video_url;
                const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);

                if (ytMatch && ytMatch[1]) {
                  return (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=0&rel=0`}
                      title={lesson.title}
                      className="w-full h-full absolute inset-0 rounded-3xl"
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
                    className="w-full h-full object-contain absolute inset-0 rounded-3xl"
                  >
                    Your browser does not support the video tag.
                  </video>
                );
              })()}
            </div>
          ) : (
            <div className="premium-card h-full flex items-center justify-center p-16 text-center border-dashed border-2 border-slate-200">
              <div>
                <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-5 shadow-sm">
                  <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-500">Resource Lesson</h3>
                <p className="text-slate-400 mt-2 max-w-xs mx-auto">This lesson focuses on internal content and documentation.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Sidebar - Course Lessons */}
        <div className="w-full lg:w-[32%] lg:relative">
          <div className="premium-card flex flex-col lg:absolute lg:inset-0 h-[450px] lg:h-auto">
            {/* Sidebar Header with Progress */}
            <div className="p-6 border-b border-slate-50 bg-slate-50/30">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900 tracking-tight">Course Content</h3>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
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
                    <div className="flex justify-between text-[11px] mb-1.5 font-bold">
                      <span className="text-slate-400 uppercase tracking-wide">Overall Progress</span>
                      <span className="text-emerald-600">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="flex-1 overflow-y-auto px-1 py-2">
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
                  <div className={`mx-2 my-1 px-4 py-3.5 rounded-2xl transition-all duration-200 border border-transparent ${isActive
                    ? 'sidebar-item-active'
                    : canAccess
                      ? 'hover:bg-slate-50 hover:border-slate-100'
                      : 'opacity-60 grayscale-[50%]'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-transform duration-300 ${isActive ? 'scale-110 shadow-lg' : ''
                        } ${isCompleted
                          ? 'bg-emerald-500 text-white shadow-emerald-500/20 shadow-md'
                          : isActive
                            ? 'bg-gradient-to-br from-secondary-500 to-cyan-500 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-bold truncate ${isActive ? 'text-secondary-800' : 'text-slate-700'}`}>
                          {l.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                            {l.duration_minutes > 0 ? `${l.duration_minutes} min` : 'Reading'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {!canAccess && (
                          <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                        {l.is_free && (
                          <span className="badge-green text-[9px] leading-none py-1">Preview</span>
                        )}
                        {isCompleted && (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isActive ? 'bg-white text-emerald-600' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
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
        <div className="premium-card p-10 mb-12 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-400/5 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-slate-50 mb-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-secondary-50 text-secondary-700 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] mb-4 shadow-sm border border-secondary-100">
                  Lesson Module {lesson.order_index + 1}
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-[1.1] mb-2">
                  {lesson.title}
                </h1>
                <p className="text-slate-400 font-medium flex items-center gap-2">
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
                    className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/20 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                  >
                    {enrolling ? 'Enrolling...' : course.is_paid ? `Enroll Course • $${course.price}` : 'Enroll Course'}
                  </button>
                ) : progress?.is_completed ? (
                  <div className="inline-flex items-center gap-3 px-8 py-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 font-black shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    Lesson Completed
                  </div>
                ) : (
                  <button
                    onClick={handleCompleteClick}
                    className="px-8 py-4 bg-gradient-to-br from-secondary-700 to-secondary-500 hover:from-secondary-600 hover:to-secondary-400 text-white rounded-2xl font-black shadow-xl shadow-secondary-500/25 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                  >
                    {!hasQuiz ? (
                      'Mark as Complete'
                    ) : quizPassed ? (
                      'Complete Lesson'
                    ) : (
                      <>
                        <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
              <div className="max-w-4xl">
                <div className="text-prose whitespace-pre-wrap">{lesson.content}</div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-secondary-100 text-secondary-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 text-center mb-2">Complete Lesson?</h3>
            <p className="text-slate-500 text-center mb-8">
              Are you sure you want to mark <span className="font-semibold text-slate-700">{lesson.title}</span> as complete?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                disabled={completing}
              >
                Cancel
              </button>
              <button
                onClick={confirmMarkComplete}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-secondary-500 to-cyan-500 hover:from-secondary-600 hover:to-cyan-600 shadow-lg shadow-secondary-500/30 text-white font-bold rounded-xl transition-all"
                disabled={completing}
              >
                {completing ? 'Completing...' : 'Yes, Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Confirmation Modal */}
      {showEnrollConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowEnrollConfirm(false)} />
          <div className="card w-full max-w-sm p-6 relative animate-fade-in-up">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Enrollment</h3>
            <p className="text-slate-500 mb-6 leading-relaxed text-sm">
              Are you sure you want to enroll in the course <strong>{course.title}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEnrollConfirm(false)}
                disabled={enrolling}
                className="px-4 py-2 font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmEnroll}
                disabled={enrolling}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50"
              >
                {enrolling ? 'Enrolling...' : 'Yes, Enroll'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
