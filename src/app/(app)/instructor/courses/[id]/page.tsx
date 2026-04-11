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
import type { Course, Lesson, Quiz } from '@/types/database';

export default function InstructorCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="min-w-0">
              <Breadcrumb items={[
                { label: 'Courses', href: '/instructor' },
                { label: course?.title || 'Course' },
              ]} />
              <h1 className="section-title text-xl truncate">{course?.title}</h1>
            </div>
          </div>
          <span className={`${
            course?.status === 'PUBLISHED' ? 'badge-green' :
            course?.status === 'DRAFT' ? 'badge-yellow' :
            'badge-gray'
          }`}>
            {course?.status}
          </span>
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
                          className="action-edit"
                          title="Manage Quiz"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          Manage Quiz
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleAddQuiz(lesson)}
                          className="action-edit"
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
                        onClick={() => handleDeleteLesson(lesson.id)}
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

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-backdrop" onClick={() => setShowLessonModal(false)} />
          <div className="modal-content max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
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
                <label htmlFor="content" className="block text-sm font-semibold text-slate-700 mb-1.5">Content</label>
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
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_free"
                  name="is_free"
                  checked={lessonForm.is_free}
                  onChange={handleLessonChange}
                  className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-slate-300 rounded"
                />
                <label htmlFor="is_free" className="text-sm text-slate-700 font-medium">Preview</label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowLessonModal(false)} className="btn-secondary py-2.5 px-5 text-sm">Cancel</button>
                <button type="submit" disabled={savingLesson} className="btn-primary py-2.5 px-5 text-sm">
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
