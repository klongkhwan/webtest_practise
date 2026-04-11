'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFetchOnce } from '@/hooks/useFetchOnce';
import Link from 'next/link';
import { useLayoutUser } from '@/components/AppLayout';
import type { Enrollment } from '@/types/database';

function DashboardContent() {
  const { user, setPageLoading } = useLayoutUser();
  const searchParams = useSearchParams();
  const celebrateCourseId = searchParams.get('celebrate');
  
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Fetch enrollments and certificates in parallel
      const [enrollResp, certResp] = await Promise.all([
        fetch('/api/enrollments'),
        fetch('/api/certificates')
      ]);

      if (enrollResp.ok) {
        const data = await enrollResp.json();
        setEnrollments(data.enrollments || []);
      }

      if (certResp.ok) {
        const data = await certResp.json();
        setCertificates(data.certificates || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  useFetchOnce(fetchData, []);

  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');
  const completedEnrollments = enrollments.filter(e => e.status === 'COMPLETED');
  const avgProgress = Math.round(
    activeEnrollments.length > 0
      ? activeEnrollments.reduce((acc, e) => acc + (e.progress_percent || 0), 0) / activeEnrollments.length
      : 0
  );

  const celebratedCourse = celebrateCourseId 
    ? enrollments.find(e => e.course_id === celebrateCourseId)?.course
    : null;
  
  const celebratedCert = celebratedCourse 
    ? certificates.find(c => c.course_id === celebrateCourseId)
    : null;

  return (
    <div className="page-container">
        {/* Celebration Banner */}
        {celebratedCourse && (
          <div className="bg-gradient-to-r from-secondary-600 via-secondary-500 to-cyan-500 rounded-3xl p-8 sm:p-12 mb-10 text-white relative overflow-hidden shadow-2xl shadow-secondary-500/20 animate-in zoom-in-95 duration-500">
            {/* Animated particles background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 blur-3xl rounded-full -ml-10 -mb-10" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/30 rotate-3">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                </svg>
              </div>
              <div className="text-center md:text-left flex-1">
                <p className="text-secondary-100 font-bold uppercase tracking-[0.2em] text-xs mb-2">Grand Achievement!</p>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 leading-tight">
                  Congratulations, {user?.full_name?.split(' ')[0]}!
                </h2>
                <p className="text-white/80 font-medium text-lg">
                  You have successfully completed <span className="text-white font-bold underline decoration-cyan-300 underline-offset-4">{celebratedCourse.title}</span>.
                </p>
              </div>
              <div className="shrink-0 flex gap-3">
                {celebratedCert ? (
                  <Link 
                    href={`/certificates/${celebratedCert.id}`}
                    className="px-8 py-4 bg-white text-secondary-600 rounded-2xl font-black shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-2"
                  >
                    View Certificate
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </Link>
                ) : (
                  <button className="px-8 py-4 bg-white/20 backdrop-blur-md rounded-2xl font-black animate-pulse cursor-wait">
                    Generating Cert...
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Welcome banner */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 sm:p-10 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Welcome back</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {user?.full_name?.split(' ')[0] || 'Student'}
              </h2>
              <p className="mt-2 text-slate-500 max-w-md">
                Continue your learning journey where you left off.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-6">
              <div className="text-right">
                <p className="text-3xl font-bold text-slate-900">{activeEnrollments.length + completedEnrollments.length}</p>
                <p className="text-sm text-slate-400 font-medium">Total Courses</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <p className="text-sm text-slate-500 font-medium mb-1">Active</p>
            <p className="text-2xl font-bold text-slate-900">{activeEnrollments.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <p className="text-sm text-slate-500 font-medium mb-1">Completed</p>
            <p className="text-2xl font-bold text-slate-900">{completedEnrollments.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <p className="text-sm text-slate-500 font-medium mb-1">Avg. Progress</p>
            <p className="text-2xl font-bold text-slate-900">{avgProgress}%</p>
          </div>
        </div>

        {/* Active Courses */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-slate-900">My Learning</h2>
            {activeEnrollments.length > 0 && (
              <Link href="/courses" className="text-sm text-secondary-600 hover:text-secondary-700 font-medium flex items-center gap-1">
                Browse more
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>

          {activeEnrollments.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
              <p className="text-slate-700 font-semibold text-lg mb-1">No courses yet</p>
              <p className="text-slate-400 text-sm mb-6">Start learning by enrolling in a course</p>
              <Link href="/courses" className="btn-primary px-6">
                Explore Courses
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeEnrollments.map((enrollment) => (
                <Link
                  key={enrollment.id}
                  href={`/courses/${enrollment.course_id}`}
                  className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200 group"
                >
                  <div className="p-5">
                    <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-secondary-600 transition-colors">
                      {enrollment.course?.title}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      {enrollment.course?.instructor?.full_name || 'Instructor'}
                    </p>
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-400">Progress</span>
                        <span className="font-semibold text-secondary-600">{enrollment.progress_percent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-secondary-500 rounded-full h-1.5 transition-all duration-500" style={{ width: `${enrollment.progress_percent}%` }} />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-secondary-600 font-medium group-hover:gap-1.5 transition-all">
                      Continue
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Completed Courses */}
        {completedEnrollments.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-5">Completed</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:border-slate-200 transition-all flex flex-col justify-between group">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 border border-emerald-100/50">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 group-hover:text-secondary-600 transition-colors leading-tight mb-1">{enrollment.course?.title}</h3>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                        Completed {new Date(enrollment.completed_at || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  
                  {(() => {
                    const cert = certificates.find(c => c.course_id === enrollment.course_id);
                    if (cert) {
                      return (
                        <Link 
                          href={`/certificates/${cert.id}`}
                          className="w-full py-2.5 bg-slate-50 hover:bg-secondary-50 text-slate-600 hover:text-secondary-600 rounded-xl text-xs font-black transition-all text-center flex items-center justify-center gap-2"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          View Certificate
                        </Link>
                      );
                    }
                    return null;
                  })()}
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="loader" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
