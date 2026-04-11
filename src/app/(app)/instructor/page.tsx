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
        body: JSON.stringify(formData),
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
        body: JSON.stringify(formData),
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

  const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string; ring: string }> = {
    PUBLISHED: { label: 'Published', dot: 'bg-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-600/20' },
    DRAFT: { label: 'Draft', dot: 'bg-amber-400', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-600/20' },
    ARCHIVED: { label: 'Archived', dot: 'bg-slate-400', bg: 'bg-slate-100', text: 'text-slate-600', ring: 'ring-slate-500/20' },
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
      <div className="relative overflow-hidden bg-gradient-to-br from-secondary-700 via-secondary-600 to-cyan-600 rounded-2xl p-8 sm:p-10 mb-8">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-white/5 rounded-full" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              <span className="text-white/90 text-xs font-medium">Instructor Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">My Courses</h1>
            <p className="mt-2 text-secondary-100/80 max-w-md text-sm">
              Create, manage and track your courses all in one place.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-white text-secondary-700 font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-secondary-900/20 hover:shadow-xl hover:shadow-secondary-900/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            New Course
          </button>
        </div>

      </div>

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
                onClick={() => { setSearchQuery(''); fetchCourses(activeFilter, ''); }}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-100">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleFilterChange(tab.key)}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
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

      {/* Loading indicator for search/filter */}
      {fetching && (
        <div className="flex items-center justify-center py-4 mb-4">
          <div className="loader" style={{ width: 32, height: 32 }} />
        </div>
      )}

      {/* Course list */}
      {!fetching && courses.length === 0 ? (
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
                  onClick={() => { setSearchQuery(''); setActiveFilter('ALL'); fetchCourses('ALL', ''); }}
                  className="btn-secondary px-5 text-sm gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <p className="text-slate-900 font-semibold text-lg mb-1">No courses yet</p>
                <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">Create your first course to start sharing knowledge with students.</p>
                <button onClick={() => setShowCreateModal(true)} className="btn-primary px-6 text-sm gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Create Course
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {courses.map((course, index) => {
            const status = statusConfig[course.status] || statusConfig.DRAFT;
            return (
              <div
                key={course.id}
                className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-200 transition-all duration-300 overflow-hidden"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Course info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                        <Link
                          href={`/instructor/courses/${course.id}`}
                          className="text-base font-semibold text-slate-900 hover:text-secondary-600 transition-colors truncate"
                        >
                          {course.title}
                        </Link>
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ring-1 ${status.bg} ${status.text} ${status.ring}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>
                      {course.description && (
                        <p className="text-sm text-slate-400 line-clamp-1 mb-3">{course.description}</p>
                      )}

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                          <span className="font-medium text-slate-500">{course.lessons_count ?? 0}</span> lessons
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                          <span className="font-medium text-slate-500">{course.enrollments_count ?? 0}</span> students
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          {course.is_paid ? (
                            <>
                              <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              <span className="font-semibold text-slate-600">${course.price}</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              <span className="font-medium text-emerald-600">Free</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                      <Link
                        href={`/instructor/courses/${course.id}`}
                        className="action-view"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        View
                      </Link>
                      <button
                        onClick={() => handleEditCourse(course)}
                        className="action-edit"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Edit
                      </button>
                    </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-backdrop" onClick={() => setShowCreateModal(false)} />
          <div className="modal-content">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">New Course</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreateCourse} className="space-y-5">
              <FormInput id="title" name="title" label="Course Title" type="text" value={formData.title} onChange={handleChange} error={fieldErrors.title} required />
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} className="input w-full" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="is_paid" name="is_paid" checked={formData.is_paid} onChange={handleChange} className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-slate-300 rounded" />
                <label htmlFor="is_paid" className="text-sm text-slate-700 font-medium">Paid course</label>
              </div>
              {formData.is_paid && (
                <FormInput id="price" name="price" label="Price (USD)" type="number" value={formData.price.toString()} onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))} error={fieldErrors.price} required />
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-ghost py-2 px-4 text-sm">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary py-2 px-5 text-sm">{creating ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    {/* Edit Course Modal */}
    {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-backdrop" onClick={() => setShowEditModal(false)} />
          <div className="modal-content">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Edit Course</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleUpdateCourse} className="space-y-5">
              <FormInput id="edit_title" name="title" label="Course Title" type="text" value={formData.title} onChange={handleChange} error={fieldErrors.title} required />
              <div>
                <label htmlFor="edit_description" className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea id="edit_description" name="description" value={formData.description} onChange={handleChange} rows={3} className="input w-full" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="edit_is_paid" name="is_paid" checked={formData.is_paid} onChange={handleChange} className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-slate-300 rounded" />
                <label htmlFor="edit_is_paid" className="text-sm text-slate-700 font-medium">Paid course</label>
              </div>
              {formData.is_paid && (
                <FormInput id="edit_price" name="price" label="Price (USD)" type="number" value={formData.price.toString()} onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))} error={fieldErrors.price} required />
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-ghost py-2 px-4 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary py-2 px-5 text-sm">{saving ? 'Saving...' : 'Save'}</button>
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
