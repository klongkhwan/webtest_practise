'use client';

import { useState } from 'react';
import { useFetchOnce } from '@/hooks/useFetchOnce';
import Link from 'next/link';
import Image from 'next/image';
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
        <div className="bg-white border-2 border-black p-16 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-lg mx-auto mt-20">
          <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-black font-serif text-2xl mb-8">Course not found</p>
          <Link href="/courses" className="action-view inline-flex px-8 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]">
            Browse Courses
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
        { label: course.title },
      ]} />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200/50 text-red-700 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Course Header */}
      <div className="bg-white border-2 border-black mb-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative group flex flex-col md:flex-row items-center md:items-stretch overflow-hidden">
        {/* Thumbnail */}
        <div className="w-full md:w-[40%] bg-secondary-900 border-b-2 md:border-b-0 md:border-r-2 border-black flex items-center justify-center relative overflow-hidden aspect-video md:aspect-auto">
          {course.thumbnail_url ? (
            <Image
              src={course.thumbnail_url}
              alt={course.title}
              fill
              className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
              sizes="(max-width: 768px) 100vw, 40vw"
            />
          ) : (
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-6 sm:p-10 flex flex-col justify-center">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {course.is_paid ? (
                <span className="px-3 py-1 border-2 border-black bg-white text-[10px] font-bold text-black font-mono tracking-widest uppercase">
                  ${course.price}
                </span>
              ) : (
                <span className="px-3 py-1 border-2 border-black bg-secondary-400 text-[10px] font-bold text-black font-mono tracking-widest uppercase">
                  Free
                </span>
              )}
              <span className="px-3 py-1 text-[10px] text-slate-600 font-mono tracking-widest uppercase border border-slate-300">
                {lessons.length} lessons
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-serif text-black tracking-tight mb-6 leading-tight">
              {course.title}
            </h1>

            <p className="text-slate-600 mb-8 leading-relaxed font-mono text-sm max-w-2xl whitespace-pre-wrap break-words">
              {course.description || 'No description available'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6 pt-8 border-t-2 border-black">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest">Instructor</span>
              <span className="text-sm text-black font-mono font-bold uppercase">{course.instructor?.full_name || 'Instructor'}</span>
            </div>

            {/* Actions */}
            {(enrollment || lessonProgresses.length > 0) ? (
              <div className="flex items-center gap-4">
                {enrollment?.progress_percent === 100 ? (
                  <div className="flex items-center gap-2">
                    {certificate && (
                      <Link
                        href={`/certificates/${certificate.id}`}
                        className="action-view px-6 py-3 transition-all flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
                      >
                        <span>View Certificate</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </Link>
                    )}
                  </div>
                ) : enrollment?.progress_percent !== undefined && (
                  <div className="flex items-center gap-6 border-2 border-black p-2 pr-3 bg-slate-50">
                    <div className="hidden sm:block w-32 bg-slate-200 h-2 border border-black overflow-hidden relative">
                      <div
                        className="bg-secondary-500 h-full transition-all duration-700 border-r border-black"
                        style={{ width: `${enrollment.progress_percent}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-black uppercase">{enrollment.progress_percent}%</span>
                    <Link
                      href={lessons.length > 0 ? `/lessons/${lessons[0].id}` : '#'}
                      className="action-view px-6 py-2 text-[10px] shadow-none hover:translate-y-0"
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
                className="action-save px-8 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enrolling ? 'Enrolling...' : course.is_paid ? `Enroll for $${course.price}` : 'Enroll Course'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lessons */}
      <div>
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between border-b-2 border-black pb-4 gap-4">
          <h2 className="text-3xl font-serif text-black">Course Content</h2>
          <p className="font-mono text-sm tracking-widest uppercase text-slate-500">{lessons.length} lessons available</p>
        </div>

        {lessons.length === 0 ? (
          <div className="bg-white border-2 border-black p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-16 h-16 bg-slate-100 flex items-center justify-center mx-auto mb-4 border border-slate-200">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-black font-mono uppercase tracking-widest text-sm font-bold">No lessons available yet</p>
          </div>
        ) : (
          <div className="space-y-4">
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
                <div className={`bg-white border-2 border-black p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all duration-200 ${
                  canAccess ? 'hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-slate-50 opacity-60 grayscale-[50%]'
                } ${isCompleted ? 'bg-secondary-50/50' : ''}`}>
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 flex-shrink-0 flex flex-col items-center justify-center text-[10px] font-mono border-2 border-black ${
                      isCompleted ? 'badge-green !p-0' : 'bg-white text-black'
                    }`}>
                      <span className={`opacity-50 text-[8px] uppercase ${isCompleted ? 'text-white' : ''}`}>Mod</span>
                      <span className={`text-sm font-bold -mt-0.5 ${isCompleted ? 'text-white' : ''}`}>{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-black flex items-center gap-3">
                        {lesson.title}
                        {!canAccess && (
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-2 font-mono text-xs uppercase tracking-widest text-slate-500">
                        {lesson.duration_minutes > 0 && (
                          <span className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {lesson.duration_minutes} min
                          </span>
                        )}
                        {lesson.is_free && (
                          <span className="badge-yellow px-2 py-0.5 !text-[9px]">Preview</span>
                        )}
                        {isCompleted && (
                          <span className="badge-green px-2 py-0.5 !text-[9px] flex items-center gap-1">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {canAccess && (
                    <div className="flex-shrink-0 flex sm:justify-end ml-17 sm:ml-0">
                      <span className="action-view inline-flex items-center gap-2 px-6 py-2 text-[10px] cursor-pointer group-hover:bg-green-600 transition-colors shadow-none hover:translate-y-0">
                        {isCompleted ? 'Review' : 'Play'}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </span>
                    </div>
                  )}
                </div>
              );

              return canAccess ? (
                <Link key={lesson.id} href={`/lessons/${lesson.id}`} className="block group">
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
