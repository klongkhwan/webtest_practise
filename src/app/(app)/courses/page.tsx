'use client';

import { useState, useCallback, useRef } from 'react';
import { useFetchOnce } from '@/hooks/useFetchOnce';
import Link from 'next/link';
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
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ring-1 bg-emerald-50 text-emerald-700 ring-emerald-600/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Completed
        </span>
      );
    }

    if (enrollment.progress_percent > 0) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ring-1 bg-blue-50 text-blue-700 ring-blue-600/20">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          {enrollment.progress_percent}%
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ring-1 bg-indigo-50 text-indigo-700 ring-indigo-600/20">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
        Enrolled
      </span>
    );
  };

  return (
    <div className="page-container">
      {/* Hero header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-secondary-700 via-secondary-600 to-cyan-600 rounded-2xl p-8 sm:p-10 mb-8">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-white/5 rounded-full" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            <span className="text-white/90 text-xs font-medium">Course Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">All Courses</h1>
          <p className="mt-2 text-secondary-100/80 max-w-md text-sm">
            Explore our collection and start learning today.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200/50 text-red-700 rounded-2xl text-sm font-medium">{error}</div>
      )}

      {/* Search & Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary-200 focus:border-secondary-300 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); fetchCourses(''); }}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-100 overflow-x-auto">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                  activeFilter === tab.key
                    ? 'bg-white text-secondary-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                    activeFilter === tab.key
                      ? 'bg-secondary-50 text-secondary-700'
                      : 'bg-slate-200/70 text-slate-500'
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-16 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary-50 to-cyan-50 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            {searchQuery || activeFilter !== 'ALL' ? (
              <>
                <p className="text-slate-900 font-semibold text-lg mb-1">No courses found</p>
                <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
                  Try adjusting your search or filter to find what you&apos;re looking for.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveFilter('ALL'); fetchCourses(''); }}
                  className="btn-secondary px-5 text-sm gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <p className="text-slate-900 font-semibold text-lg mb-1">No courses available yet</p>
                <p className="text-slate-400 text-sm">Check back soon for new content.</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const enrollment = getEnrollment(course.id);
            return (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-200 transition-all duration-300 overflow-hidden hover:-translate-y-0.5"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-secondary-500 via-secondary-400 to-cyan-400 flex items-center justify-center relative overflow-hidden">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-12 h-12 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  )}
                  {/* Price badge */}
                  <div className="absolute top-3 right-3">
                    {course.is_paid ? (
                      <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-sm font-bold text-secondary-700 shadow-lg">
                        ${course.price}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/90 backdrop-blur-sm text-sm font-bold text-white shadow-lg">
                        Free
                      </span>
                    )}
                  </div>
                  {/* Progress bar overlay */}
                  {enrollment && enrollment.progress_percent > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-500"
                        style={{ width: `${Math.min(enrollment.progress_percent, 100)}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-secondary-600 transition-colors flex-1 min-w-0">
                      {course.title}
                    </h3>
                    {getEnrollmentBadge(course.id)}
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2 mb-4">{course.description || 'No description available'}</p>

                  {/* Meta */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-secondary-400 to-cyan-400 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-white">{course.instructor?.full_name?.charAt(0) || 'I'}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium truncate max-w-[120px]">{course.instructor?.full_name || 'Instructor'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        <span className="font-medium text-slate-500">{course.lessons_count ?? 0}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                        <span className="font-medium text-slate-500">{course.enrollments_count ?? 0}</span>
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
