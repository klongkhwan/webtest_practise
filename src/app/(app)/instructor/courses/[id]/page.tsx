'use client';

import { useEffect, useState } from 'react';
import { useFetchOnce } from '@/hooks/useFetchOnce';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormInput } from '@/components/FormInput';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Snackbar } from '@/components/Snackbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useLayoutUser } from '@/components/AppLayout';
import type { Course, Lesson, Quiz, CourseStatus } from '@/types/database';

export default function InstructorCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  // Course edit form
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: '', description: '', status: 'DRAFT' as CourseStatus });
  const [savingCourse, setSavingCourse] = useState(false);

  // Lesson form
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonForm, setLessonForm] = useState({ title: '', content: '', video_url: '', duration_minutes: 0, is_free: false });
  const [lessonErrors, setLessonErrors] = useState<Record<string, string>>({});
  const [savingLesson, setSavingLesson] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Quiz
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  const [snackbar, setSnackbar] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { setPageLoading } = useLayoutUser();

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
        setCourseForm({
          title: data.course.title,
          description: data.course.description || '',
          status: data.course.status,
        });
      }
    } catch (error) {
      console.error('Failed to fetch course:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAll = async () => {
    await Promise.all([fetchCourse(), fetchLessons(), fetchQuizzes()]);
    setPageLoading(false);
  };

  useFetchOnce(fetchAll, [courseId]);

  const fetchLessons = async () => {
    try {
      const response = await fetch(`/api/lessons?courseId=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setLessons(data.lessons || []);
      }
    } catch (error) {
      console.error('Failed to fetch lessons:', error);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await fetch(`/api/quizzes?courseId=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data.quizzes || []);
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    }
  };

  const handleAddQuiz = (lesson: Lesson) => {
    router.push(`/instructor/quiz/new?courseId=${courseId}&lessonId=${lesson.id}`);
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCourse(true);
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseForm),
      });
      if (response.ok) {
        setSnackbar({ message: 'Course updated!', type: 'success' });
        setShowCourseModal(false);
        fetchCourse();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update course');
      }
    } catch (err: unknown) {
      setSnackbar({ message: err instanceof Error ? err.message : 'Error updating course', type: 'error' });
    } finally {
      setSavingCourse(false);
    }
  };

  // Lesson handlers
  const handleLessonChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setLessonForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : type === 'number' ? Number(value) : value,
    }));
    if (lessonErrors[name]) setLessonErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateLesson = () => {
    const errors: Record<string, string> = {};
    if (!lessonForm.title.trim()) errors.title = 'Please enter a lesson title';
    setLessonErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLesson()) return;

    setSavingLesson(true);
    try {
      const url = editingLesson ? `/api/lessons/${editingLesson.id}` : '/api/lessons';
      const method = editingLesson ? 'PATCH' : 'POST';
      const body = editingLesson ? lessonForm : { ...lessonForm, course_id: courseId };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save lesson');

      setSnackbar({ message: editingLesson ? 'Lesson updated!' : 'Lesson created!', type: 'success' });
      setShowLessonModal(false);
      setEditingLesson(null);
      setLessonForm({ title: '', content: '', video_url: '', duration_minutes: 0, is_free: false });
      fetchLessons();
    } catch (err: unknown) {
      setSnackbar({ message: err instanceof Error ? err.message : 'Failed to save lesson', type: 'error' });
    } finally {
      setSavingLesson(false);
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      content: lesson.content || '',
      video_url: lesson.video_url || '',
      duration_minutes: lesson.duration_minutes,
      is_free: lesson.is_free,
    });
    setShowLessonModal(true);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete lesson');
      setSnackbar({ message: 'Lesson deleted!', type: 'success' });
      setDeleteTarget(null);
      fetchLessons();
    } catch (err: unknown) {
      setSnackbar({ message: err instanceof Error ? err.message : 'Failed to delete lesson', type: 'error' });
    }
  };


  return (
    <>
    <div className="page-container">
        {/* NEW REDESIGNED HERO SECTION */}
        <div className="mb-10 bg-[#004557] rounded-3xl overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-white">
          <div className="relative p-8 md:p-12">
            {/* Dynamic Background Element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
            
            <div className="relative z-10">
              <div className="mb-6">
                <Breadcrumb items={[
                  { label: 'Instructor Panel', href: '/instructor' },
                  { label: 'Management', href: '#' },
                ]} />
              </div>

              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] uppercase tracking-wider ${
                      course?.status === 'PUBLISHED' ? 'bg-green-500 text-white' :
                      course?.status === 'DRAFT' ? 'bg-yellow-400 text-black' :
                      'bg-slate-500 text-white'
                    }`}>
                      {course?.status || 'Unknown'}
                    </span>
                    <span className="text-white/60 text-sm font-medium">Created on {course ? new Date(course.created_at).toLocaleDateString() : '...'}</span>
                  </div>
                  
                  <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight uppercase">
                    {course?.title || 'Loading Course...'}
                  </h1>

                  <div className="flex flex-wrap gap-8">
                    <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-2xl border border-white/10">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-2xl font-black">{lessons.length}</div>
                        <div className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Total Lessons</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-2xl border border-white/10">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-2xl font-black">{course?.enrollments_count || course?.enrollments?.[0]?.count || 0}</div>
                        <div className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Total Students</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 flex-shrink-0">
                  <button 
                    onClick={() => setShowCourseModal(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#004557] rounded-xl font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-0"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Details
                  </button>
                  <Link 
                    href={`/courses/${courseId}`}
                    target="_blank"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[#FFDE59] text-black rounded-xl font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-0"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Preview Page
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Lessons */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="section-title">Lessons</h2>
          <button
            onClick={() => {
              setEditingLesson(null);
              setLessonForm({ title: '', content: '', video_url: '', duration_minutes: 0, is_free: false });
              setShowLessonModal(true);
            }}
            className="btn-primary text-sm py-2.5 px-5"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Lesson
          </button>
        </div>

        {lessons.length === 0 ? (
          <div className="card empty-state">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium mb-4">No lessons yet. Add your first lesson.</p>
            <button onClick={() => setShowLessonModal(true)} className="btn-primary text-sm px-6">Add Lesson</button>
          </div>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson, index) => {
              const lessonQuizzes = quizzes.filter(q => q.lesson_id === lesson.id);
              return (
                <div key={lesson.id} className="card overflow-hidden hover:shadow-md transition-all duration-200">
                  <div className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">{index + 1}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{lesson.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-medium">
                          {lesson.video_url && (
                            <span className="flex items-center gap-1 text-secondary-600">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              </svg>
                              Video
                            </span>
                          )}
                          {lesson.duration_minutes > 0 && <span>{lesson.duration_minutes} min</span>}
                          {lesson.is_free && <span className="badge-green text-[10px]">Preview</span>}
                          {lessonQuizzes.length > 0 && lessonQuizzes.map((q) => (
                            <span key={q.id} className="text-secondary-600">
                              Quiz = {q.questions_count ?? q.questions?.length ?? 0} question{((q.questions_count ?? q.questions?.length ?? 0) !== 1) ? 's' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {quizzes.find(q => q.lesson_id === lesson.id) ? (
                        <Link
                          href={`/instructor/quiz/${quizzes.find(q => q.lesson_id === lesson.id)!.id}`}
                          className="action-quiz"
                          title="Manage Quiz"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          Manage Quiz
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleAddQuiz(lesson)}
                          className="action-quiz"
                          title="Add Quiz"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          Add Quiz
                        </button>
                      )}
                      <button
                        onClick={() => handleEditLesson(lesson)}
                        className="action-edit"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(lesson.id)}
                        className="action-delete"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-backdrop" onClick={() => setShowCourseModal(false)} />
          <div className="modal-content max-w-2xl bg-[#F9F8F6] border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter">Edit Course Meta</h2>
              <button 
                onClick={() => setShowCourseModal(false)}
                className="w-10 h-10 border-4 border-black rounded-xl bg-[#FFDE59] flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleUpdateCourse} className="space-y-6">
              <FormInput
                id="course_title"
                name="title"
                label="Course Title"
                type="text"
                value={courseForm.title}
                onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                required
              />
              <div>
                <label className="block text-sm font-black uppercase mb-2">Description</label>
                <textarea
                  className="input w-full min-h-[120px]"
                  value={courseForm.description}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell students what this course is about..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-black uppercase mb-2">Status</label>
                  <select 
                    className="input w-full cursor-pointer pr-10"
                    value={courseForm.status}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, status: e.target.value as CourseStatus }))}
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 mt-6 border-t-4 border-black">
                <button type="button" onClick={() => setShowCourseModal(false)} className="px-6 py-3 font-bold uppercase underline">Cancel</button>
                <button type="submit" disabled={savingCourse} className="btn-primary min-w-[140px]">
                  {savingCourse ? 'Saving...' : 'Update Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-backdrop" onClick={() => setShowLessonModal(false)} />
          <div className="modal-content max-h-[90vh] overflow-y-auto bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-8">
              {editingLesson ? 'Edit Lesson' : 'Add Lesson'}
            </h2>
            <form onSubmit={handleSaveLesson} className="space-y-5">
              <FormInput
                id="lesson_title"
                name="title"
                label="Lesson Title"
                type="text"
                value={lessonForm.title}
                onChange={handleLessonChange}
                error={lessonErrors.title}
                required
              />
              <div>
                <label htmlFor="content" className="block text-sm font-black uppercase mb-2">Content</label>
                <textarea
                  id="content"
                  name="content"
                  value={lessonForm.content}
                  onChange={handleLessonChange}
                  rows={4}
                  className="input w-full"
                />
              </div>
              <FormInput
                id="video_url"
                name="video_url"
                label="Video URL"
                type="url"
                value={lessonForm.video_url}
                onChange={handleLessonChange}
                placeholder="https://youtube.com/watch?v=..."
              />
              <FormInput
                id="duration_minutes"
                name="duration_minutes"
                label="Duration (minutes)"
                type="number"
                value={lessonForm.duration_minutes.toString()}
                onChange={handleLessonChange}
              />
              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="is_free"
                  name="is_free"
                  checked={lessonForm.is_free}
                  onChange={handleLessonChange}
                  className="h-6 w-6 border-4 border-black text-[#004557] focus:ring-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
                <label htmlFor="is_free" className="text-sm font-black uppercase cursor-pointer">Preview Enabled</label>
              </div>
              <div className="flex justify-end gap-3 pt-6 mt-6 border-t-4 border-black">
                <button type="button" onClick={() => setShowLessonModal(false)} className="px-6 py-3 font-bold uppercase underline">Cancel</button>
                <button type="submit" disabled={savingLesson} className="btn-primary min-w-[140px]">
                  {savingLesson ? 'Saving...' : editingLesson ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>

    <ConfirmDialog
      open={!!deleteTarget}
      title="Delete Lesson"
      message="Are you sure you want to delete this lesson? This action cannot be undone."
      onConfirm={() => deleteTarget && handleDeleteLesson(deleteTarget)}
      onCancel={() => setDeleteTarget(null)}
    />

    <Snackbar
      message={snackbar?.message || ''}
      type={snackbar?.type || 'success'}
      onClose={() => setSnackbar(null)}
    />
    </>
  );
}
