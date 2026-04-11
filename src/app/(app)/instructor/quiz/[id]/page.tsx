'use client';

import { useState } from 'react';
import { useFetchOnce } from '@/hooks/useFetchOnce';
import { useParams, useRouter } from 'next/navigation';
import { FormInput } from '@/components/FormInput';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Snackbar } from '@/components/Snackbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useLayoutUser } from '@/components/AppLayout';
import type { Quiz, Question, Choice } from '@/types/database';

export default function InstructorQuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Question form
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [points, setPoints] = useState(1);
  const [choices, setChoices] = useState([{ text: '', is_correct: false }, { text: '', is_correct: false }, { text: '', is_correct: false }, { text: '', is_correct: false }]);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [questionErrors, setQuestionErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [quizForm, setQuizForm] = useState({ title: '', description: '', passing_score: 70, time_limit_minutes: 0, max_attempts: 1 });
  const { setPageLoading } = useLayoutUser();

  const fetchQuiz = async () => {
    try {
      const response = await fetch(`/api/questions?quizId=${quizId}`);
      if (response.ok) {
        const data = await response.json();
        setQuiz(data.quiz || null);
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Failed to fetch quiz:', error);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  useFetchOnce(fetchQuiz, [quizId]);

  const openEditDetails = () => {
    if (quiz) {
      setQuizForm({
        title: quiz.title,
        description: quiz.description || '',
        passing_score: quiz.passing_score,
        time_limit_minutes: quiz.time_limit_minutes || 0,
        max_attempts: quiz.max_attempts,
      });
      setEditingDetails(true);
    }
  };

  const handleSaveDetails = async () => {
    setSavingQuiz(true);
    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quizForm.title,
          description: quizForm.description || null,
          passing_score: quizForm.passing_score,
          time_limit_minutes: quizForm.time_limit_minutes || null,
          max_attempts: quizForm.max_attempts,
        }),
      });
      if (!response.ok) throw new Error('Failed to update quiz');
      setSnackbar({ message: 'Quiz details updated!', type: 'success' });
      setEditingDetails(false);
      fetchQuiz();
    } catch (err: unknown) {
      setSnackbar({ message: err instanceof Error ? err.message : 'Failed to update quiz', type: 'error' });
    } finally {
      setSavingQuiz(false);
    }
  };

  const handleAddChoice = () => {
    setChoices([...choices, { text: '', is_correct: false }]);
  };

  const handleRemoveChoice = (index: number) => {
    if (choices.length <= 2) return;
    setChoices(choices.filter((_, i) => i !== index));
  };

  const handleChoiceChange = (index: number, field: 'text' | 'is_correct', value: string | boolean) => {
    const newChoices = [...choices];
    if (field === 'is_correct' && value) {
      // Only one correct answer
      newChoices.forEach((c, i) => { newChoices[i] = { ...c, is_correct: i === index }; });
    } else {
      newChoices[index] = { ...newChoices[index], [field]: value };
    }
    setChoices(newChoices);
  };

  const validateQuestion = () => {
    const errors: Record<string, string> = {};
    if (!questionText.trim()) errors.question = 'Please enter a question';
    if (choices.some(c => !c.text.trim())) errors.choices = 'All choices must have text';
    if (!choices.some(c => c.is_correct)) errors.correct = 'Select one correct answer';
    setQuestionErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setQuestionText(q.question);
    setExplanation(q.explanation || '');
    setPoints(q.points || 1);
    setChoices(
      q.choices?.length
        ? q.choices.map(c => ({ text: c.text, is_correct: c.is_correct }))
        : [{ text: '', is_correct: false }, { text: '', is_correct: false }, { text: '', is_correct: false }, { text: '', is_correct: false }]
    );
    setQuestionErrors({});
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateQuestion()) return;

    setSavingQuestion(true);
    try {
      if (editingQuestion) {
        // Update existing question
        const response = await fetch(`/api/questions/${editingQuestion.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: questionText,
            explanation: explanation || undefined,
            points,
            choices: choices.filter(c => c.text.trim()).map((c, i) => ({
              text: c.text,
              is_correct: c.is_correct,
              order_index: i,
            })),
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update question');

        setSnackbar({ message: 'Question updated!', type: 'success' });
      } else {
        // Create new question
        const qResponse = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quiz_id: quizId,
            question: questionText,
            explanation: explanation || undefined,
            points,
          }),
        });

        const qData = await qResponse.json();
        if (!qResponse.ok) throw new Error(qData.error || 'Failed to create question');

        const questionId = qData.question.id;

        // Create choices
        const choicesPayload = choices
          .filter(c => c.text.trim())
          .map((c, i) => ({
            question_id: questionId,
            text: c.text,
            is_correct: c.is_correct,
            order_index: i,
          }));

        const cResponse = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question_id: questionId, choices: choicesPayload }),
        });

        if (!cResponse.ok) {
          const cData = await cResponse.json();
          throw new Error(cData.error || 'Failed to create choices');
        }

        setSnackbar({ message: 'Question added!', type: 'success' });
      }

      setShowQuestionModal(false);
      setEditingQuestion(null);
      setQuestionText('');
      setExplanation('');
      setPoints(1);
      setChoices([{ text: '', is_correct: false }, { text: '', is_correct: false }, { text: '', is_correct: false }, { text: '', is_correct: false }]);
      fetchQuiz();
    } catch (err: unknown) {
      setSnackbar({ message: err instanceof Error ? err.message : 'Failed to save question', type: 'error' });
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const response = await fetch(`/api/questions/${questionId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete question');
      setSnackbar({ message: 'Question deleted!', type: 'success' });
      setDeleteTarget(null);
      fetchQuiz();
    } catch (err: unknown) {
      setSnackbar({ message: err instanceof Error ? err.message : 'Failed to delete question', type: 'error' });
    }
  };

  const handleSaveQuiz = async () => {
    if (questions.length === 0) {
      setSnackbar({ message: 'Add at least 1 question before saving', type: 'error' });
      return;
    }
    setSavingQuiz(true);
    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: true }),
      });
      if (!response.ok) throw new Error('Failed to save quiz');
      setSnackbar({ message: 'Quiz saved!', type: 'success' });
      // Go back to course page
      if (quiz?.course?.id) {
        router.push(`/instructor/courses/${quiz.course.id}`);
      } else if (quiz?.lesson?.course?.id) {
        router.push(`/instructor/courses/${quiz.lesson.course.id}`);
      }
    } catch (err: unknown) {
      setSnackbar({ message: err instanceof Error ? err.message : 'Failed to save quiz', type: 'error' });
    } finally {
      setSavingQuiz(false);
    }
  };

  return (
    <>
    <div className="page-container max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="min-w-0">
              <Breadcrumb items={[
                { label: 'Courses', href: '/instructor' },
                ...(quiz?.course ? [{ label: quiz.course.title, href: `/instructor/courses/${quiz.course.id}` }] : []),
                { label: quiz?.title || 'Quiz' },
              ]} />
              <h1 className="section-title text-xl truncate">{quiz?.title || 'Quiz'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setEditingQuestion(null); setQuestionText(''); setExplanation(''); setPoints(1); setChoices([{ text: '', is_correct: false }, { text: '', is_correct: false }, { text: '', is_correct: false }, { text: '', is_correct: false }]); setQuestionErrors({}); setShowQuestionModal(true); }} className="btn-secondary text-sm py-2.5 px-5">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Question
            </button>
            <button
              onClick={handleSaveQuiz}
              disabled={savingQuiz || questions.length === 0}
              className="btn-primary text-sm py-2.5 px-5 disabled:opacity-50"
            >
              {savingQuiz ? 'Saving...' : 'Save Quiz'}
            </button>
          </div>
        </div>

        {/* Quiz Details */}
        {quiz && (
          <div className="card p-5 mb-6">
            {editingDetails ? (
              <div className="space-y-4">
                <FormInput
                  id="quiz_title"
                  name="title"
                  label="Quiz Title"
                  type="text"
                  value={quizForm.title}
                  onChange={(e) => setQuizForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
                <div>
                  <label htmlFor="quiz_description" className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                  <textarea
                    id="quiz_description"
                    value={quizForm.description}
                    onChange={(e) => setQuizForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="input w-full"
                  />
                </div>
                <FormInput
                  id="passing_score"
                  name="passing_score"
                  label="Pass %"
                  type="number"
                  value={quizForm.passing_score.toString()}
                  onChange={(e) => setQuizForm(prev => ({ ...prev, passing_score: Number(e.target.value) }))}
                />
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setEditingDetails(false)} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
                  <button type="button" onClick={handleSaveDetails} disabled={savingQuiz} className="btn-primary py-2 px-4 text-sm">
                    {savingQuiz ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">Pass:</span>
                    <span className="font-semibold text-slate-800">{quiz.passing_score}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">Questions:</span>
                    <span className="font-semibold text-slate-800">{questions.length}</span>
                  </div>
                  <span className={`ml-auto ${quiz.is_published ? 'badge-green' : 'badge-yellow'}`}>
                    {quiz.is_published ? 'Published' : 'Draft'}
                  </span>
                  <button onClick={openEditDetails} className="action-edit text-xs ml-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Edit
                  </button>
                </div>
                {quiz.description && (
                  <p className="mt-3 text-sm text-slate-500 border-t border-slate-100 pt-3">{quiz.description}</p>
                )}
              </>
            )}
          </div>
        )}

        {questions.length === 0 ? (
          <div className="card empty-state">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-5">
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-700 font-semibold text-lg mb-1">No questions yet</p>
            <p className="text-slate-400 text-sm">Add questions to this quiz</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, index) => (
              <div key={q.id} className="card p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="badge-blue">Q{index + 1}</span>
                      <span className="text-xs text-slate-400 font-medium">{q.points} pt</span>
                    </div>
                    <p className="font-semibold text-slate-900">{q.question}</p>
                    <div className="mt-4 space-y-2">
                      {q.choices?.map((choice: Choice) => (
                        <div
                          key={choice.id}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                            choice.is_correct ? 'bg-emerald-50 text-emerald-700 font-semibold ring-1 ring-emerald-600/20' : 'bg-slate-50 text-slate-600'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            choice.is_correct ? 'border-emerald-500' : 'border-slate-300'
                          }`}>
                            {choice.is_correct && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                          </div>
                          {choice.text}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <p className="mt-3 text-sm text-slate-400 italic">Explanation: {q.explanation}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleEditQuestion(q)}
                      className="action-edit"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="action-delete"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Add Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-backdrop" onClick={() => setShowQuestionModal(false)} />
          <div className="modal-content max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-6">{editingQuestion ? 'Edit Question' : 'Add Question'}</h2>
            <form onSubmit={handleSaveQuestion} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Question <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={questionText}
                  onChange={(e) => {
                    setQuestionText(e.target.value);
                    if (questionErrors.question) setQuestionErrors(prev => ({ ...prev, question: '' }));
                  }}
                  rows={2}
                  className="input w-full"
                />
                {questionErrors.question && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{questionErrors.question}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Choices <span className="text-red-500">*</span>
                  <span className="text-slate-400 font-normal ml-1">(select correct answer)</span>
                </label>
                <div className="space-y-2">
                  {choices.map((choice, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct"
                        checked={choice.is_correct}
                        onChange={() => handleChoiceChange(index, 'is_correct', true)}
                        className="h-4 w-4 text-secondary-600 focus:ring-secondary-500"
                      />
                      <input
                        type="text"
                        value={choice.text}
                        onChange={(e) => handleChoiceChange(index, 'text', e.target.value)}
                        placeholder={`Choice ${index + 1}`}
                        className="input flex-1"
                      />
                      {choices.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveChoice(index)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {questionErrors.choices && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{questionErrors.choices}</p>
                )}
                {questionErrors.correct && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{questionErrors.correct}</p>
                )}
                <button
                  type="button"
                  onClick={handleAddChoice}
                  className="mt-3 text-sm text-secondary-600 hover:text-secondary-700 font-semibold"
                >
                  + Add Choice
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Explanation (optional)</label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  rows={2}
                  className="input w-full"
                />
              </div>

              <FormInput
                id="points"
                name="points"
                label="Points"
                type="number"
                value={points.toString()}
                onChange={(e) => setPoints(Number(e.target.value) || 1)}
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowQuestionModal(false)} className="btn-secondary py-2.5 px-5 text-sm">Cancel</button>
                <button type="submit" disabled={savingQuestion} className="btn-primary py-2.5 px-5 text-sm">
                  {savingQuestion ? 'Saving...' : editingQuestion ? 'Update' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

    <ConfirmDialog
      open={!!deleteTarget}
      title="Delete Question"
      message="Are you sure you want to delete this question? This action cannot be undone."
      onConfirm={() => deleteTarget && handleDeleteQuestion(deleteTarget)}
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
