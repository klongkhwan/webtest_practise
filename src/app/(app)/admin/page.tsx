'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useFetchOnce } from '@/hooks/useFetchOnce';
import { useRouter } from 'next/navigation';
import { useLayoutUser } from '@/components/AppLayout';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Snackbar } from '@/components/Snackbar';
import type { User, Course } from '@/types/database';

type RoleFilter = '' | 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
type ActiveTab = 'users' | 'courses';

export default function AdminPage() {
  const { user: currentUser, setPageLoading } = useLayoutUser();
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('users');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [courseStatus, setCourseStatus] = useState<Record<string, string>>({});
  const [pendingStatusChange, setPendingStatusChange] = useState<{ courseId: string; title: string; newStatus: string; oldStatus: string } | null>(null);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [fetchingCourses, setFetchingCourses] = useState(false);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);
  const router = useRouter();

  const fetchUsers = useCallback(async (searchVal: string = search, role: RoleFilter = roleFilter) => {
    setFetchingUsers(true);
    try {
      const params = new URLSearchParams();
      if (searchVal.trim()) params.set('search', searchVal.trim());
      if (role) params.set('role', role);
      const response = await fetch(`/api/users?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setFetchingUsers(false);
    }
  }, [search, roleFilter]);

  const fetchCourses = useCallback(async () => {
    setFetchingCourses(true);
    try {
      const response = await fetch('/api/courses?status=DRAFT,PUBLISHED,ARCHIVED');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
        const statusMap: Record<string, string> = {};
        (data.courses || []).forEach((c: Course) => { statusMap[c.id] = c.status; });
        setCourseStatus(statusMap);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setFetchingCourses(false);
    }
  }, []);

  const fetchAll = async () => {
    await Promise.all([fetchUsers('', ''), fetchCourses()]);
    if (isInitialLoad.current) {
      setPageLoading(false);
      isInitialLoad.current = false;
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [currentUser, router]);

  useFetchOnce(fetchAll, [currentUser]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchUsers(value, roleFilter);
    }, 400);
  };

  const handleRoleFilterChange = (role: RoleFilter) => {
    setRoleFilter(role);
    fetchUsers(search, role);
  };

  const handleUpdateRole = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update role');
      }

      setSnackbar({ message: 'Role updated successfully!', type: 'success' });
      setEditingUser(null);
      fetchUsers();
    } catch (err: unknown) {
      setSnackbar({ message: err instanceof Error ? err.message : 'Failed to update role', type: 'error' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }
      setSnackbar({ message: 'User deleted successfully!', type: 'success' });
      setDeleteTarget(null);
      fetchUsers();
    } catch (err: unknown) {
      setSnackbar({ message: err instanceof Error ? err.message : 'Failed to delete user', type: 'error' });
    }
  };

  const handleUpdateCourseStatus = async (courseId: string, status: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update course');
      }

      setSnackbar({ message: 'Course status updated!', type: 'success' });
      fetchCourses();
    } catch (err: unknown) {
      setSnackbar({ message: err instanceof Error ? err.message : 'Failed to update course', type: 'error' });
    }
  };

  // Counts
  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const instructorCount = users.filter(u => u.role === 'INSTRUCTOR').length;
  const studentCount = users.filter(u => u.role === 'STUDENT').length;

  const roleConfig: Record<string, { label: string; className: string }> = {
    ADMIN: { label: 'Admin', className: 'badge-purple' },
    INSTRUCTOR: { label: 'Instructor', className: 'badge-cyan' },
    STUDENT: { label: 'Student', className: 'badge-blue' },
  };

  const roleFilterTabs: { key: RoleFilter; label: string; count?: number }[] = [
    { key: '', label: 'All' },
    { key: 'ADMIN', label: 'Admin', count: adminCount },
    { key: 'INSTRUCTOR', label: 'Instructor', count: instructorCount },
    { key: 'STUDENT', label: 'Student', count: studentCount },
  ];

  const statusConfig: Record<string, { label: string; className: string }> = {
    PUBLISHED: { label: 'Published', className: 'badge-green' },
    DRAFT: { label: 'Draft', className: 'badge-yellow' },
    ARCHIVED: { label: 'Archived', className: 'badge-blue' },
  };

  return (
    <>
    <div className="page-container">
      {/* Hero header */}
      <div className="relative overflow-hidden bg-primary-400 border-x-0 border-y-4 sm:border-4 border-black sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 sm:p-12 mb-10">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '16px 16px' }} />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1 mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-2 h-2 bg-black animate-pulse" />
            <span className="text-black text-[10px] font-mono font-bold uppercase tracking-widest">Admin Console</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-black text-black tracking-tight uppercase leading-none">Administration</h1>
          <p className="mt-4 text-black/80 font-mono text-sm max-w-md uppercase tracking-wider">
            Manage users, courses, and platform settings.
          </p>
        </div>
      </div>

      {/* Navigation bar */}
      <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6 mb-10">
        {/* Section tabs */}
        <div className="flex border-2 border-black bg-white mb-6 p-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-[10px] font-mono font-bold tracking-widest uppercase transition-all duration-200 ${
              activeTab === 'users' ? 'bg-secondary-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]' : 'bg-transparent text-slate-500 hover:text-black hover:bg-slate-100'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
            Users
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-[10px] font-mono font-bold tracking-widest uppercase transition-all duration-200 ${
              activeTab === 'courses' ? 'bg-secondary-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]' : 'bg-transparent text-slate-500 hover:text-black hover:bg-slate-100'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            Courses
          </button>
        </div>

        {/* Search & Filter (only for Users tab) */}
        {activeTab === 'users' && (
          <div className="flex flex-col sm:flex-row gap-4 mb-2">
            {/* Search */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input
                type="text"
                placeholder="SEARCH BY NAME OR EMAIL..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-black text-[12px] font-mono text-black placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none"
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); fetchUsers('', roleFilter); }}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-black"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>

            {/* Role filter tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              {roleFilterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleRoleFilterChange(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 border-2 border-black text-[10px] font-mono font-bold tracking-widest uppercase transition-all duration-200 ${
                    roleFilter === tab.key
                      ? 'bg-secondary-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]'
                      : 'bg-white text-black hover:bg-slate-50 border-transparent hover:border-black'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`text-[10px] sm:text-xs px-1.5 py-0.5 min-w-[20px] text-center border ${
                      roleFilter === tab.key
                        ? 'border-white bg-white/20 text-white'
                        : 'border-black bg-slate-100 text-black'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>

          {/* Loading */}
          {fetchingUsers && (
            <div className="flex items-center justify-center py-4 mb-4">
              <div className="loader" style={{ width: 32, height: 32 }} />
            </div>
          )}

          {/* User list */}
          {!fetchingUsers && users.length === 0 ? (
            <div className="bg-white border-2 border-black p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
              </div>
              {search || roleFilter ? (
                <>
                  <p className="text-black font-serif text-2xl mb-2">No users found</p>
                  <p className="font-mono text-sm text-slate-500 mb-6 uppercase tracking-wider">
                    TRY ADJUSTING YOUR SEARCH OR FILTER
                  </p>
                  <button
                    onClick={() => { setSearch(''); setRoleFilter(''); fetchUsers('', ''); }}
                    className="px-6 py-2 border-2 border-black bg-secondary-400 text-black font-mono text-[10px] font-bold tracking-widest uppercase hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none inline-flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Clear filters
                  </button>
                </>
              ) : (
                <p className="font-mono text-sm text-slate-500 uppercase tracking-wider">No users in the system yet.</p>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {users.map((u) => {
                const role = roleConfig[u.role] || roleConfig.STUDENT;
                return (
                  <div
                    key={u.id}
                    className="group bg-white border-2 border-black p-5 sm:p-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6"
                  >
                    {/* User info */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 border-2 border-black bg-black flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-serif text-white">{u.full_name?.charAt(0)?.toUpperCase() || '?'}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                          <span className="text-xl font-serif text-black truncate leading-none">{u.full_name}</span>
                          {editingUser?.id === u.id ? (
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value)}
                              className="text-[10px] uppercase tracking-widest font-mono font-bold px-2 py-1 border-2 border-black bg-white focus:outline-none focus:bg-slate-100"
                            >
                              <option value="STUDENT">Student</option>
                              <option value="INSTRUCTOR">Instructor</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2 py-0.5 border border-black ${role.className} uppercase tracking-widest leading-loose`}>
                              {role.label}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-slate-500 uppercase tracking-wider mt-2">
                          <span className="inline-flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            {u.email}
                          </span>
                          {u.phone && (
                            <span className="inline-flex items-center gap-1.5 border-l border-slate-300 pl-4">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                              {u.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 mt-4 sm:mt-0 opacity-100 sm:opacity-50 sm:group-hover:opacity-100 transition-opacity w-full sm:w-auto justify-end">
                      {editingUser?.id === u.id ? (
                        <>
                          <button onClick={() => handleUpdateRole(u.id)} className="action-save shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none inline-flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            SAVE
                          </button>
                          <button onClick={() => setEditingUser(null)} className="action-cancel shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none inline-flex items-center gap-1">
                            CANCEL
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingUser(u); setEditRole(u.role); }} className="action-edit shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none inline-flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            EDIT
                          </button>
                          {u.id !== currentUser?.id && (
                            <button onClick={() => setDeleteTarget(u.id)} className="action-delete shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none inline-flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              DEL
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div>
          {/* Loading */}
          {fetchingCourses && (
            <div className="flex items-center justify-center py-4 mb-4">
              <div className="loader" style={{ width: 32, height: 32 }} />
            </div>
          )}

          {!fetchingCourses && courses.length === 0 ? (
            <div className="bg-white border-2 border-black p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <p className="font-mono text-sm text-slate-500 uppercase tracking-wider">No courses in the system yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {courses.map((course) => {
                const currentStatus = courseStatus[course.id] || course.status;
                const status = statusConfig[currentStatus] || statusConfig.DRAFT;
                return (
                  <div
                    key={course.id}
                    className="group bg-white border-2 border-black p-5 sm:p-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6"
                  >
                    {/* Course info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="text-xl font-serif text-black truncate leading-none">{course.title}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 border border-black text-[10px] uppercase font-mono font-bold tracking-widest leading-loose ${status.className}`}>
                          {status.label}
                        </span>
                      </div>
                      {course.description && (
                        <p className="text-sm font-mono text-slate-500 line-clamp-1 mb-3">{course.description}</p>
                      )}

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono text-slate-500 uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          <span className="font-bold text-black">{course.instructor?.full_name || '-'}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 border-l border-slate-300 pl-4">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                          <span className="font-bold text-black">{course.enrollments_count ?? 0}</span> students
                        </span>
                        <span className="inline-flex items-center gap-1.5 border-l border-slate-300 pl-4">
                          {course.is_paid ? (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              <span className="font-bold text-black">${course.price}</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              <span className="font-bold text-black">Free</span>
                            </>
                          )}
                        </span>
                        <span className="inline-flex items-center gap-1.5 border-l border-slate-300 pl-4">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {new Date(course.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Status changer */}
                    <div className="flex-shrink-0 mt-4 sm:mt-0 w-full sm:w-auto text-right">
                      <select
                        value={currentStatus}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          setPendingStatusChange({ courseId: course.id, title: course.title, newStatus, oldStatus: currentStatus });
                        }}
                        className="w-full sm:w-auto text-[10px] uppercase font-mono font-bold tracking-widest px-3 py-2 border-2 border-black bg-white cursor-pointer focus:outline-none focus:bg-slate-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                      >
                        <option value="DRAFT">DRAFT</option>
                        <option value="PUBLISHED">PUBLISHED</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>

    <ConfirmDialog
      open={!!deleteTarget}
      title="Delete User"
      message="Are you sure you want to delete this user? This action cannot be undone."
      onConfirm={() => deleteTarget && handleDeleteUser(deleteTarget)}
      onCancel={() => setDeleteTarget(null)}
    />

    <ConfirmDialog
      open={!!pendingStatusChange}
      title="Change Course Status"
      message={pendingStatusChange ? `Change "${pendingStatusChange.title}" status from ${pendingStatusChange.oldStatus} to ${pendingStatusChange.newStatus}?` : ''}
      onConfirm={() => {
        if (pendingStatusChange) {
          setCourseStatus(prev => ({ ...prev, [pendingStatusChange.courseId]: pendingStatusChange.newStatus }));
          handleUpdateCourseStatus(pendingStatusChange.courseId, pendingStatusChange.newStatus);
        }
        setPendingStatusChange(null);
      }}
      onCancel={() => setPendingStatusChange(null)}
    />

    <Snackbar
      message={snackbar?.message || ''}
      type={snackbar?.type || 'success'}
      onClose={() => setSnackbar(null)}
    />
    </>
  );
}
