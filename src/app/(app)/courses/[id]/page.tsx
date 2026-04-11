'use client';

import { useState } from 'react';
import { useFetchOnce } from '@/hooks/useFetchOnce';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useLayoutUser } from '@/components/AppLayout';
import { Breadcrumb } from '@/components/Breadcrumb';
import type { Course, Enrollment, Lesson } from '@/types/database';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const { user: currentUser, setPageLoading } = useLayoutUser();
  const [hasAccess, setHasAccess] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [lessonProgresses, setLessonProgresses] = useState<any[]>([]);
  const [certificate, setCertificate] = useState<any>(null);
  const [error, setError] = useState('');

  const fetchCourseDetails = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) {
        throw new Error('Course not found');
      }
      const data = await response.json();
      setCourse(data.course);
      setEnrollment(data.enrollment);
      setHasAccess(data.hasAccess);
      setLessons(data.course?.lessons || []);
      setLessonProgresses(data.lessonProgresses || []);

      // Fetch certificate if completed
      if (data.enrollment?.progress_percent === 100) {
        const certResp = await fetch('/api/certificates');
        if (certResp.ok) {
          const certData = await certResp.json();
          const cert = certData.certificates.find((c: any) => c.course_id === courseId);
          setCertificate(cert);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      // loading handled by AppLayout
      setPageLoading(false);
    }
  };

  useFetchOnce(fetchCourseDetails, [courseId]);

  const handleEnroll = async () => {
    setEnrolling(true);
    setError('');

    try {
      if (!currentUser) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // Already enrolled
          setEnrollment(data.enrollment);
          setHasAccess(true);
          return;
        }
        throw new Error(data.error || 'Failed to enroll');
      }

      setEnrollment(data.enrollment);
      setHasAccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setEnrolling(false);
    }
  };

  if (!course) {
    return (
      <div className="page-container text-center">
        <div className="card empty-state">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-5">
            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-slate-700 font-semibold text-lg mb-2">Course not found</p>
          <Link href="/courses" className="btn-primary">Browse Courses</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Courses', href: '/courses' },
        { label: course.title },
      ]} />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200/50 text-red-700 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Course Header */}
      <div className="card mb-6 overflow-hidden">
        <div className="p-5">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Thumbnail */}
            <div className="w-full md:w-64 aspect-video rounded-xl gradient-primary flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-white/20">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {course.is_paid ? (
                    <span className="px-2 py-0.5 rounded-lg bg-secondary-50 text-xs font-bold text-secondary-700 ring-1 ring-secondary-600/10">
                      ${course.price}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/10">Free</span>
                  )}
                  <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded-lg">
                    {lessons.length} lessons
                  </span>
                </div>

                <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2 truncate">
                  {course.title}
                </h1>

                <p className="text-slate-500 mb-4 leading-relaxed text-sm line-clamp-2 font-medium">
                  {course.description || 'No description available'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 mt-auto">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Course BY :</span>
                  <span className="text-xs text-slate-600 font-bold">{course.instructor?.full_name || 'Instructor'}</span>
                </div>

                {/* Actions */}
                {(enrollment || lessonProgresses.length > 0) ? (
                  <div className="flex items-center gap-2">
                    {enrollment?.progress_percent === 100 ? (
                      <div className="flex items-center gap-2">
                        {certificate && (
                          <Link
                            href={`/certificates/${certificate.id}`}
                            className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl shadow-slate-200"
                          >
                            <span>Claim Certificate</span>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </Link>
                        )}
                      </div>
                    ) : enrollment?.progress_percent !== undefined && (
                      <div className="flex items-center gap-3 bg-slate-50/50 p-1 rounded-xl border border-slate-100/50">
                        <div className="hidden sm:block w-20 bg-slate-200 rounded-full h-1 overflow-hidden">
                          <div
                            className="bg-secondary-500 h-full transition-all duration-700"
                            style={{ width: `${enrollment.progress_percent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black text-secondary-600">{enrollment.progress_percent}%</span>
                        <Link
                          href={lessons.length > 0 ? `/lessons/${lessons[0].id}` : '#'}
                          className="px-4 py-1.5 bg-secondary-500 text-white rounded-lg text-xs font-black hover:bg-secondary-600 transition-all shadow-sm"
                        >
                          {enrollment.progress_percent > 0 ? 'Continue' : 'Start'}
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="px-8 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-black hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200/50 disabled:opacity-50"
                  >
                    {enrolling ? 'Enrolling...' : course.is_paid ? `Enroll for $${course.price}` : 'Enroll Course'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lessons */}
      <div>
        <div className="mb-6">
          <h2 className="section-title">Course Content</h2>
          <p className="section-subtitle">{lessons.length} lessons in this course</p>
        </div>

        {lessons.length === 0 ? (
          <div className="card empty-state">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">No lessons available yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson, index) => {
              const isFirst = index === 0;
              const prevLesson = index > 0 ? lessons[index - 1] : null;
              const prevLessonCompleted = prevLesson
                ? lessonProgresses.some(p => p.lesson_id === prevLesson.id && p.is_completed)
                : false;

              const isCompleted = lessonProgresses.some(p => p.lesson_id === lesson.id && p.is_completed);
              const isFinished = enrollment?.progress_percent === 100;
              const isUnlockedByProgress = isFirst || prevLessonCompleted || isFinished || isCompleted;
              const canAccess = (hasAccess && isUnlockedByProgress) || lesson.is_free || isCompleted || isFinished;

              const content = (
                <div className={`card p-5 flex items-center justify-between transition-all duration-200 ${canAccess ? 'hover:shadow-md hover:-translate-y-0.5' : 'opacity-60 grayscale-[50%]'
                  } ${isCompleted ? 'border-l-4 border-l-emerald-500' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold ${isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        {lesson.title}
                        {!canAccess && (
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        {lesson.duration_minutes > 0 && (
                          <span className="text-xs text-slate-400 font-medium">{lesson.duration_minutes} min</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2">
                      {lesson.is_free && (
                        <span className="badge-green text-[10px]">Preview</span>
                      )}
                      {isCompleted && (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {canAccess && (
                      <div className="btn-ghost flex-shrink-0 text-sm px-3 md:px-4">
                        {isCompleted ? 'Watch Again' : 'Watch'}
                        <svg className="w-4 h-4 ml-1 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              );

              return canAccess ? (
                <Link key={lesson.id} href={`/lessons/${lesson.id}`} className="block">
                  {content}
                </Link>
              ) : (
                <div key={lesson.id} className="block cursor-not-allowed">
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
