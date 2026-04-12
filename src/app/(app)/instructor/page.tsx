'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useFetchOnce } from '@/hooks/useFetchOnce';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLayoutUser } from '@/components/AppLayout';
import { FormInput } from '@/components/FormInput';
import { Snackbar } from '@/components/Snackbar';
import type { Course } from '@/types/database';

type StatusFilter = 'ALL' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

export default function InstructorPage() {
  const { user: currentUser, setPageLoading } = useLayoutUser();
  const [courses, setCourses] = useState<Course[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_paid: false,
    price: 0,
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('ALL');
  const [fetching, setFetching] = useState(false);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);

  const router = useRouter();

  const buildApiUrl = useCallback((status: StatusFilter, search: string) => {
    const params = new URLSearchParams();
    params.set('status', status === 'ALL' ? 'DRAFT,PUBLISHED,ARCHIVED' : status);
    if (search.trim()) params.set('search', search.trim());
    return `/api/courses?${params.toString()}`;
  }, []);

  const fetchCourses = useCallback(async (status: StatusFilter = activeFilter, search: string = searchQuery) => {
    setFetching(true);
    try {
      const response = await fetch(buildApiUrl(status, search));
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setFetching(false);
      if (isInitialLoad.current) {
        setPageLoading(false);
        isInitialLoad.current = false;
      }
    }
  }, [activeFilter, searchQuery, buildApiUrl, setPageLoading]);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'INSTRUCTOR' && currentUser.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [currentUser]);

  useFetchOnce(() => fetchCourses('ALL', ''), [currentUser]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchCourses(activeFilter, value);
    }, 400);
  };

  const handleFilterChange = (filter: StatusFilter) => {
    setActiveFilter(filter);
    fetchCourses(filter, searchQuery);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateFields = () => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = 'Please enter a course title';
    if (formData.is_paid && formData.price <= 0) errors.price = 'Price must be greater than 0';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFields()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, is_paid: false, price: 0 }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create course');

      setSnackbar({ message: 'Course created successfully!', type: 'success' });
      setShowCreateModal(false);
      setFormData({ title: '', description: '', is_paid: false, price: 0 });
      fetchCourses();
    } catch (err: unknown) {
      setSnackbar({ message: err instanceof Error ? err.message : 'Failed to create course', type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description || '',
      is_paid: course.is_paid || false,
      price: course.price || 0,
    });
    setFieldErrors({});
    setShowEditModal(true);
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFields() || !editingCourse) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/courses/${editingCourse.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, is_paid: false, price: 0 }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update course');

      setSnackbar({ message: 'Course updated successfully!', type: 'success' });
      setShowEditModal(false);
      setEditingCourse(null);
      setFormData({ title: '', description: '', is_paid: false, price: 0 });
      fetchCourses();
    } catch (err: unknown) {
      setSnackbar({ message: err instanceof Error ? err.message : 'Failed to update course', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const publishedCount = courses.filter(c => c.status === 'PUBLISHED').length;
  const draftCount = courses.filter(c => c.status === 'DRAFT').length;
  const archivedCount = courses.filter(c => c.status === 'ARCHIVED').length;
  const totalStudents = courses.reduce((acc, c) => acc + (c.enrollments_count || 0), 0);
  const totalLessons = courses.reduce((acc, c) => acc + (c.lessons_count || 0), 0);

  const statusConfig: Record<string, { label: string; dot: string; className: string }> = {
    PUBLISHED: { label: 'Published', dot: 'bg-white', className: 'badge-green' },
    DRAFT: { label: 'Draft', dot: 'bg-black', className: 'badge-yellow' },
    ARCHIVED: { label: 'Archived', dot: 'bg-white', className: 'badge-blue' },
  };

  const filterTabs: { key: StatusFilter; label: string; count?: number }[] = [
    { key: 'ALL', label: 'All Courses' },
    { key: 'PUBLISHED', label: 'Published', count: publishedCount },
    { key: 'DRAFT', label: 'Drafts', count: draftCount },
    { key: 'ARCHIVED', label: 'Archived', count: archivedCount },
  ];

  return (
    <>
      <div className="page-container">
        {/* Hero header */}
        <div className="relative bg-white border-2 border-black p-8 sm:p-10 mb-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 z-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-secondary-400 border-2 border-black px-3 py-1 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-2 h-2 bg-black animate-pulse" />
                <span className="text-black font-mono text-[10px] font-bold uppercase tracking-widest">Instructor Dashboard</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-serif text-black tracking-tight">My Courses</h1>
              <p className="mt-4 text-slate-600 font-mono text-sm max-w-md">
                Create, manage and track your courses all in one place.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-3 bg-secondary-400 text-black font-mono text-xs font-bold uppercase tracking-widest px-8 py-4 transition-all duration-200 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              New Course
            </button>
          </div>
        </div>

        {/* Search & Filter bar */}
        <div className="bg-white border-2 border-black p-6 mb-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input
                type="text"
                placeholder="SEARCH COURSES..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-white border-2 border-black rounded-none text-sm font-mono font-bold text-black placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[1px] hover:translate-x-[1px]"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); fetchCourses(activeFilter, ''); }}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-black hover:text-red-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap items-center gap-3">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleFilterChange(tab.key)}
                  className={`relative flex items-center gap-2 px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-widest transition-all duration-200 border-2 whitespace-nowrap ${activeFilter === tab.key
                      ? 'bg-secondary-400 text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]'
                      : 'bg-white text-slate-600 border-transparent hover:border-black hover:text-black hover:bg-slate-50'
                    }`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 min-w-[24px] text-center border ${activeFilter === tab.key
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-black border-black group-hover:border-white'
                      }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Loading indicator for search/filter */}
        {fetching && (
          <div className="flex items-center justify-center py-4 mb-4">
            <div className="loader" style={{ width: 32, height: 32 }} />
          </div>
        )}

        {/* Course list */}
        {!fetching && courses.length === 0 ? (
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="p-16 sm:p-24 text-center">
              <div className="w-24 h-24 bg-secondary-400 border-2 border-black flex items-center justify-center mx-auto mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              {searchQuery || activeFilter !== 'ALL' ? (
                <>
                  <p className="text-black font-serif text-3xl sm:text-4xl mb-4">No courses found</p>
                  <p className="text-slate-600 font-mono text-sm mb-8 max-w-md mx-auto">
                    Try adjusting your search or filter to find what you&apos;re looking for.
                  </p>
                  <button
                    onClick={() => { setSearchQuery(''); setActiveFilter('ALL'); fetchCourses('ALL', ''); }}
                    className="inline-flex px-8 py-4 bg-white text-black border-2 border-black hover:bg-black hover:text-white font-mono text-xs font-bold uppercase tracking-widest transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none translate-x-[-2px] translate-y-[-2px]"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Clear filters
                  </button>
                </>
              ) : (
                <>
                  <p className="text-black font-serif text-3xl sm:text-4xl mb-4">No courses yet</p>
                  <p className="text-slate-600 font-mono text-sm mb-8 max-w-sm mx-auto">Create your first course to start sharing knowledge with students.</p>
                  <button onClick={() => setShowCreateModal(true)} className="inline-flex px-8 py-4 bg-secondary-400 text-black border-2 border-black hover:bg-black hover:text-white font-mono text-xs font-bold uppercase tracking-widest transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none translate-x-[-2px] translate-y-[-2px]">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Create Course
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {courses.map((course, index) => {
              const status = statusConfig[course.status] || statusConfig.DRAFT;
              return (
                <div
                  key={course.id}
                  className="group bg-white border-2 border-black hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 overflow-hidden"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="p-6 md:p-8 flex flex-col md:flex-row items-start justify-between gap-6">
                    {/* Course info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-4 mb-3">
                        <Link
                          href={`/instructor/courses/${course.id}`}
                          className="text-2xl sm:text-3xl font-serif font-bold text-black hover:bg-secondary-400 hover:px-1 transition-all truncate"
                        >
                          {course.title}
                        </Link>
                        <span className={`inline-flex items-center gap-2 text-[10px] uppercase font-mono font-bold px-3 py-1 border-2 border-black ${status.className}`}>
                          <span className={`w-2 h-2 ${status.dot} border border-black/20`} />
                          {status.label}
                        </span>
                      </div>
                      {course.description && (
                        <p className="text-sm font-mono text-slate-600 line-clamp-2 mb-6">{course.description}</p>
                      )}

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-xs font-mono font-bold uppercase tracking-widest text-slate-500">
                        <span className="inline-flex items-center gap-2">
                          <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                          <span className="text-black">{course.lessons_count ?? 0}</span> lessons
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                          <span className="text-black">{course.enrollments_count ?? 0}</span> students
                        </span>
                        <span className="inline-flex items-center gap-2">
                          {course.is_paid ? (
                            <>
                              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              <span className="text-black">${course.price}</span>
                            </>
                          ) : (
                            <>
                              <span className="px-2 py-0.5 bg-black text-white text-[10px]">FREE</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex md:flex-col items-center justify-end gap-3 flex-shrink-0 w-full md:w-auto mt-6 md:mt-0 pt-6 md:pt-0 border-t-2 md:border-t-0 border-black border-dashed">
                      <Link
                        href={`/instructor/courses/${course.id}`}
                        className="w-full md:w-32 action-manage justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        Manage
                      </Link>
                      <button
                        onClick={() => handleEditCourse(course)}
                        className="w-full md:w-32 action-edit justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="modal-backdrop" onClick={() => setShowCreateModal(false)} />
          <div className="modal-content shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-black">
              <h2 className="text-3xl font-serif text-black">New Course</h2>
              <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 border-2 border-transparent hover:border-black bg-white hover:bg-secondary-400 flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreateCourse} className="space-y-6">
              <FormInput id="title" name="title" label="COURSE TITLE" type="text" value={formData.title} onChange={handleChange} error={fieldErrors.title} required />
              <div>
                <label htmlFor="description" className="block text-xs font-mono font-bold uppercase tracking-widest text-black mb-2">Description</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} className="input w-full" />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-6 mt-8 border-t-2 border-black">
                <button type="button" onClick={() => setShowCreateModal(false)} className="w-full sm:w-auto px-8 py-4 bg-white text-black border-2 border-black font-mono text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" disabled={creating} className="w-full sm:w-auto px-8 py-4 bg-secondary-400 text-black border-2 border-black font-mono text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none disabled:opacity-50">{creating ? 'CREATING...' : 'CREATE COURSE'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="modal-backdrop" onClick={() => setShowEditModal(false)} />
          <div className="modal-content shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-black">
              <h2 className="text-3xl font-serif text-black">Edit Course</h2>
              <button onClick={() => setShowEditModal(false)} className="w-10 h-10 border-2 border-transparent hover:border-black bg-white hover:bg-secondary-400 flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleUpdateCourse} className="space-y-6">
              <FormInput id="edit_title" name="title" label="COURSE TITLE" type="text" value={formData.title} onChange={handleChange} error={fieldErrors.title} required />
              <div>
                <label htmlFor="edit_description" className="block text-xs font-mono font-bold uppercase tracking-widest text-black mb-2">Description</label>
                <textarea id="edit_description" name="description" value={formData.description} onChange={handleChange} rows={4} className="input w-full" />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-6 mt-8 border-t-2 border-black">
                <button type="button" onClick={() => setShowEditModal(false)} className="action-cancel w-full sm:w-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none">Cancel</button>
                <button type="submit" disabled={saving} className="action-save w-full sm:w-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none disabled:opacity-50">{saving ? 'SAVING...' : 'SAVE CHANGES'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Snackbar
        message={snackbar?.message || ''}
        type={snackbar?.type || 'success'}
        onClose={() => setSnackbar(null)}
      />
    </>
  );
}
