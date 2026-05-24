'use client';

import { useState, useCallback, useRef } from 'react';
import { useFetchOnce } from '@/hooks/useFetchOnce';
import Link from 'next/link';
import Image from 'next/image';
import { useLayoutUser } from '@/components/AppLayout';
import type { Course, Enrollment } from '@/types/database';

type EnrollFilter = 'ALL' | 'NOT_ENROLLED' | 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<EnrollFilter>('ALL');
  const [fetching, setFetching] = useState(false);
  const { user: currentUser, setPageLoading } = useLayoutUser();
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);

  const fetchCourses = useCallback(async (search: string = '') => {
    setFetching(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      const response = await fetch(`/api/courses?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch courses');
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setFetching(false);
    }
  }, []);

  const fetchEnrollments = useCallback(async () => {
    try {
      const response = await fetch('/api/enrollments');
      if (response.ok) {
        const data = await response.json();
        setEnrollments(data.enrollments || []);
      }
    } catch (err) {
      console.error('Failed to fetch enrollments:', err);
    }
  }, []);

  const fetchAll = async () => {
    await Promise.all([fetchCourses(''), fetchEnrollments()]);
    if (isInitialLoad.current) {
      setPageLoading(false);
      isInitialLoad.current = false;
    }
  };

  useFetchOnce(fetchAll, [currentUser]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchCourses(value);
    }, 400);
  };

  // Enrollment lookup helper
  const getEnrollment = (courseId: string) => enrollments.find(e => e.course_id === courseId);

  // Filter courses client-side based on enrollment status
  const filteredCourses = courses.filter(course => {
    const enrollment = getEnrollment(course.id);
    switch (activeFilter) {
      case 'NOT_ENROLLED':
        return !enrollment;
      case 'ENROLLED':
        return !!enrollment;
      case 'IN_PROGRESS':
        return enrollment && enrollment.status === 'ACTIVE' && enrollment.progress_percent < 100;
      case 'COMPLETED':
        return enrollment && (enrollment.status === 'COMPLETED' || enrollment.progress_percent >= 100);
      default:
        return true;
    }
  });

  // Counts for filter tabs
  const enrolledIds = new Set(enrollments.map(e => e.course_id));
  const notEnrolledCount = courses.filter(c => !enrolledIds.has(c.id)).length;
  const enrolledCount = courses.filter(c => enrolledIds.has(c.id)).length;
  const inProgressCount = courses.filter(c => {
    const e = getEnrollment(c.id);
    return e && e.status === 'ACTIVE' && e.progress_percent < 100;
  }).length;
  const completedCount = courses.filter(c => {
    const e = getEnrollment(c.id);
    return e && (e.status === 'COMPLETED' || e.progress_percent >= 100);
  }).length;

  const filterTabs: { key: EnrollFilter; label: string; count?: number }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'NOT_ENROLLED', label: 'Not Enrolled', count: notEnrolledCount },
    { key: 'ENROLLED', label: 'Enrolled', count: enrolledCount },
    { key: 'IN_PROGRESS', label: 'In Progress', count: inProgressCount },
    { key: 'COMPLETED', label: 'Completed', count: completedCount },
  ];

  const getEnrollmentBadge = (courseId: string) => {
    const enrollment = getEnrollment(courseId);
    if (!enrollment) return null;

    if (enrollment.status === 'COMPLETED' || enrollment.progress_percent >= 100) {
      return (
        <span className="inline-block px-2 text-[10px] font-mono tracking-widest uppercase border border-black badge-green">
          Completed
        </span>
      );
    }

    if (enrollment.progress_percent > 0) {
      return (
        <span className="inline-block px-2 text-[10px] font-mono tracking-widest uppercase border border-black badge-yellow">
          {enrollment.progress_percent}%
        </span>
      );
    }

    return (
      <span className="inline-block px-2 text-[10px] font-mono tracking-widest uppercase border border-black badge-blue">
        Enrolled
      </span>
    );
  };

  return (
    <div className="page-container">
      {/* Hero header */}
      <div className="border-t-2 border-l-2 border-r-2 border-black bg-white mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        {/* Minimalist geometric background lines */}
        <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundSize: '60px 60px', backgroundPosition: '0 0, 30px 30px' }} />
        
        <div className="p-8 sm:p-12 border-b-2 border-black flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
            <div className="inline-block px-3 py-1 border border-black text-black font-mono text-[10px] uppercase tracking-widest mb-4 font-bold bg-white">
              Course Catalog
            </div>
            <h1 className="text-4xl sm:text-5xl font-serif text-black tracking-tight">All Courses</h1>
          </div>
          <p className="text-slate-600 font-mono text-sm max-w-sm leading-relaxed text-right border-l-2 border-black pl-6 hidden md:block">
            Don&apos;t wait for the perfect map; just start walking and create your own.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200/50 text-red-700 rounded-2xl text-sm font-medium">{error}</div>
      )}

      {/* Search & Filter bar */}
      <div className="mb-8 border-y-2 border-black py-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Search */}
          <div className="relative w-full md:w-96 flex-shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="SEARCH COURSES..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-transparent border border-black rounded-none text-sm font-mono text-black placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-secondary-600 transition-all uppercase tracking-wider"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); fetchCourses(''); }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-black hover:text-secondary-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`relative flex items-center gap-1.5 px-4 py-2 text-[10px] font-mono font-bold tracking-widest uppercase transition-all duration-200 whitespace-nowrap border-2 ${
                  activeFilter === tab.key
                    ? 'bg-secondary-400 text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]'
                    : 'bg-transparent text-slate-500 border-transparent hover:border-black hover:text-black hover:bg-slate-50'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 min-w-[20px] text-center border ${
                    activeFilter === tab.key
                      ? 'bg-white text-black border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {fetching && (
        <div className="flex items-center justify-center py-4 mb-4">
          <div className="loader" style={{ width: 32, height: 32 }} />
        </div>
      )}

      {/* Course grid */}
      {!fetching && filteredCourses.length === 0 ? (
        <div className="bg-white border-2 border-black p-16 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          {searchQuery || activeFilter !== 'ALL' ? (
            <>
              <p className="text-black font-serif text-2xl mb-2">No courses found</p>
              <p className="text-slate-500 font-mono text-sm mb-8 max-w-sm mx-auto">
                Try adjusting your search or filter to find what you&apos;re looking for.
              </p>
              <button
                onClick={() => { setSearchQuery(''); setActiveFilter('ALL'); fetchCourses(''); }}
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-black bg-white hover:bg-secondary-400 text-black font-mono font-bold text-[10px] uppercase tracking-widest transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Clear filters
              </button>
            </>
          ) : (
            <>
              <p className="text-black font-serif text-2xl mb-2">No courses available yet</p>
              <p className="text-slate-500 font-mono text-sm max-w-sm mx-auto">Check back soon for new content.</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => {
            const enrollment = getEnrollment(course.id);
            return (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="group bg-white border-2 border-black flex flex-col hover:-translate-y-0.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all duration-300 relative"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-secondary-900 border-b-2 border-black flex items-center justify-center relative overflow-hidden">
                  {course.thumbnail_url ? (
                    <Image
                      src={course.thumbnail_url}
                      alt={course.title}
                      fill
                      className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                  )}
                  {/* Price badge */}
                  <div className="absolute top-0 right-0">
                    {course.is_paid ? (
                      <span className="inline-block px-4 py-2 border-b-2 border-l-2 border-black bg-white font-mono text-[10px] font-bold text-black uppercase tracking-widest leading-none">
                        ${course.price}
                      </span>
                    ) : (
                      <span className="inline-block px-4 py-2 border-b-2 border-l-2 border-black bg-secondary-400 font-mono text-[10px] font-bold text-black uppercase tracking-widest leading-none">
                        Free
                      </span>
                    )}
                  </div>
                  {/* Progress bar overlay */}
                  {enrollment && enrollment.progress_percent > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black">
                      <div
                        className="h-full bg-secondary-500 transition-all duration-500"
                        style={{ width: `${Math.min(enrollment.progress_percent, 100)}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow relative">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {getEnrollmentBadge(course.id)}
                  </div>
                  <h3 className="font-serif text-xl font-bold text-black leading-tight group-hover:text-secondary-700 transition-colors mb-3 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="font-mono text-xs text-slate-600 line-clamp-3 mb-6 leading-relaxed flex-grow">
                    {course.description || 'No description available'}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between pt-4 border-t border-black/10 mt-auto">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Inst:</span>
                      <span className="text-xs font-mono text-black font-bold uppercase truncate max-w-[100px]">{course.instructor?.full_name || 'Instructor'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                      <span className="inline-flex items-center gap-1.5 uppercase">
                        <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        {course.lessons_count ?? 0}
                      </span>
                      <span className="inline-flex items-center gap-1.5 uppercase">
                        <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                        {course.enrollments_count ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
