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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const celebratedCourse = celebrateCourseId
    ? enrollments.find(e => e.course_id === celebrateCourseId)?.course
    : null;

  const celebratedCert = celebratedCourse
    ? certificates.find(c => c.course_id === celebrateCourseId)
    : null;

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-10 space-y-10">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-4 border-black bg-primary-400 p-8 sm:p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] group">
        {/* Decorative Grid Pattern instead of spinning shape */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-20 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(black 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }} />
        <div className="absolute bottom-4 right-8 opacity-10 hidden lg:block">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1">
            <path d="M12 14l9-5-9-5-9 5 9 5z" />
            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        </div>

        <div className="relative z-10 max-w-3xl">
          <p className="font-mono text-sm font-black uppercase tracking-[0.3em] text-black/60 mb-4 flex items-center gap-3">
            <span className="w-12 h-1 bg-black"></span>
            {getGreeting()}
          </p>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black text-black leading-tight tracking-tighter mb-6 uppercase italic">
            {user?.full_name || 'Scholar'}
            <span className="text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] not-italic">.</span>
          </h1>
          <p className="text-lg sm:text-xl font-medium text-black/80 max-w-xl leading-relaxed mb-8 border-l-4 border-black pl-6">
            Your progress is the compass of your future. You've completed <span className="font-black underline decoration-white">{completedEnrollments.length} missions</span> so far. Ready for the next one?
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Link href="/courses" className="px-8 py-4 bg-black text-white hover:bg-white hover:text-black border-4 border-black font-mono font-black uppercase tracking-widest text-sm transition-all shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:shadow-none active:translate-x-1 active:translate-y-1">
              Explore Courses
            </Link>
            <div className="hidden sm:flex items-center gap-6 px-8 border-l-2 border-black/20">
              <div className="text-center">
                <p className="text-[10px] font-black uppercase opacity-60">Avg. Progress</p>
                <p className="text-3xl font-serif font-black">{avgProgress}%</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase opacity-60">Active</p>
                <p className="text-3xl font-serif font-black">{activeEnrollments.length}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BENTO STATS & CELEBRATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Celebration / Major Achievement Card */}
        <div className={`lg:col-span-8 border-4 border-black ${celebratedCourse ? 'bg-secondary-900 text-white' : 'bg-white text-black'} p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between relative overflow-hidden min-h-[300px]`}>
          {celebratedCourse ? (
            <>
              <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-400 rotate-45 translate-x-32 -translate-y-32 opacity-20 pointer-events-none" />
              <div className="relative z-10">
                <span className="inline-block bg-secondary-400 text-black px-3 py-1 font-mono text-[10px] font-black uppercase mb-6 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] border border-black">
                  New Achievement
                </span>
                <h2 className="text-3xl sm:text-5xl font-serif font-black tracking-tight mb-4 leading-none uppercase">
                  Champ is Here!
                </h2>
                <p className="text-secondary-200 font-mono text-sm max-w-lg mb-8 uppercase tracking-widest">
                  You just finished <span className="text-white font-black underline">{celebratedCourse.title}</span>. That's a huge win for your career roadmap.
                </p>
              </div>
              <div className="flex gap-4">
                {celebratedCert && (
                  <Link href={`/certificates/${celebratedCert.id}`} className="px-6 py-3 bg-white text-black border-2 border-black font-mono font-black uppercase text-xs hover:bg-secondary-400 transition-colors shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                    Get Certificate
                  </Link>
                )}
                <button
                  onClick={() => window.history.replaceState({}, '', '/dashboard')}
                  className="px-6 py-3 border-2 border-white/30 font-mono font-black uppercase text-xs hover:bg-white/10"
                >
                  Dismiss
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="relative z-10">
                <h3 className="text-4xl font-serif font-black uppercase mb-4 tracking-tighter italic">Weekly Goal</h3>
                <p className="text-slate-500 font-mono text-sm uppercase tracking-widest leading-loose">
                  Enroll in a new course today to keep your streak alive. The best time to learn was yesterday. The second best time is <span className="text-black font-black">NOW</span>.
                </p>
              </div>
              <div className="mt-12 flex items-end justify-between border-t-2 border-black pt-6">
                <div>
                  <span className="text-6xl font-serif font-black leading-none">{activeEnrollments.length}</span>
                  <span className="text-xs font-mono uppercase font-black ml-2 opacity-60">Active Missions</span>
                </div>
                <Link href="/courses" className="w-12 h-12 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-all transform hover:rotate-90">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Small Highlight Bento Cards */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="flex-1 bg-amber-400 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group">
            <h4 className="font-mono text-[10px] font-black uppercase tracking-widest mb-4 opacity-70">Certificates Earned</h4>
            <div className="flex items-center justify-between">
              <span className="text-6xl font-serif font-black">{certificates.length}</span>
              <div className="w-12 h-12 bg-white border-2 border-black flex items-center justify-center -rotate-12 group-hover:rotate-0 transition-transform">
                🥇
              </div>
            </div>
          </div>
          <div className="flex-1 bg-emerald-400 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group">
            <h4 className="font-mono text-[10px] font-black uppercase tracking-widest mb-4 opacity-70">System Identity</h4>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 border-2 border-black bg-white flex items-center justify-center font-serif text-2xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {user?.full_name?.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs font-black uppercase truncate">{user?.full_name}</p>
                <p className="font-mono text-[10px] uppercase opacity-60">ID: {user?.id.slice(0, 8)}...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CONTINUE LEARNING GRID */}
      <section>
        <div className="flex items-baseline justify-between mb-8 border-b-4 border-black pb-2">
          <h2 className="text-3xl font-serif font-black uppercase tracking-tighter">Current Missions</h2>
          <Link href="/courses" className="font-mono text-[10px] font-black uppercase tracking-widest hover:underline transition-all">
            View All Marketplace →
          </Link>
        </div>

        {activeEnrollments.length === 0 ? (
          <div className="bg-white border-4 border-black p-16 text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-slate-500 font-mono text-sm max-w-md mx-auto mb-8 tracking-widest uppercase">
              You aren't enrolled in any active courses. Launch a new mission today.
            </p>
            <Link href="/courses" className="inline-block px-10 py-4 bg-primary-400 border-4 border-black text-black font-mono font-black uppercase text-sm tracking-widest hover:bg-black hover:text-white transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-x-[-4px] translate-y-[-4px]">
              Find Course Now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {activeEnrollments.map((enrollment) => (
              <Link
                key={enrollment.id}
                href={`/courses/${enrollment.course_id}`}
                className="group relative bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none flex flex-col justify-between min-h-[320px]"
              >
                {/* Method tag corner */}
                <div className="absolute top-0 right-0 px-3 py-1 bg-black text-white font-mono text-[10px] font-black uppercase">
                  IN PROGRESS
                </div>

                <div>
                  <h3 className="font-serif text-2xl font-black leading-tight uppercase tracking-tight mb-3 group-hover:text-secondary-600 transition-colors">
                    {enrollment.course?.title}
                  </h3>
                  <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest font-black flex items-center gap-2">
                    <span className="w-2 h-2 bg-black rounded-full"></span>
                    {enrollment.course?.instructor?.full_name || 'Academic Unit'}
                  </p>
                </div>

                <div className="mt-auto pt-8">
                  <div className="flex justify-between items-end mb-3">
                    <span className="font-mono text-[10px] font-black uppercase tracking-widest opacity-60">Engagement</span>
                    <span className="text-3xl font-serif font-black">{enrollment.progress_percent}%</span>
                  </div>
                  <div className="w-full h-8 bg-slate-100 border-2 border-black p-1 flex items-stretch">
                    <div
                      className="bg-secondary-500 border-r-2 border-black transition-all duration-1000"
                      style={{ width: `${enrollment.progress_percent}%` }}
                    />
                  </div>
                  <div className="mt-6 flex items-center justify-between font-mono text-[10px] font-black uppercase tracking-[0.2em] group-hover:bg-black group-hover:text-white border-2 border-black p-3 transition-colors">
                    <span>Initiate Session</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 12h14m-7-7l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 4. COMPLETED MISSIONS & REWARDS */}
      {completedEnrollments.length > 0 && (
        <section className="bg-black text-white p-8 sm:p-12 border-4 border-black">
          <div className="flex items-baseline justify-between mb-12 border-b border-white/20 pb-4">
            <h2 className="text-3xl font-serif font-black uppercase tracking-tighter italic">Completed Missions</h2>
            <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">Authorized History</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {completedEnrollments.map((enrollment) => {
              const cert = certificates.find(c => c.course_id === enrollment.course_id);
              return (
                <div key={enrollment.id} className="border-2 border-white/20 p-6 flex flex-col md:flex-row gap-6 items-center bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="w-20 h-20 bg-emerald-500 border-2 border-white flex items-center justify-center text-3xl shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex-shrink-0">
                    🏆
                  </div>
                  <div className="flex-1 min-w-0 text-center md:text-left">
                    <h3 className="text-xl font-serif font-black uppercase leading-tight mb-2 truncate">
                      {enrollment.course?.title}
                    </h3>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 mb-4 font-black">
                      SUCCESSFULLY DEPLOYED • {new Date(enrollment.completed_at || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {cert && (
                      <Link
                        href={`/certificates/${cert.id}`}
                        className="inline-flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-widest border-b-2 border-emerald-500 pb-1 hover:text-emerald-300 transition-colors"
                      >
                        Download Certificates
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
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
