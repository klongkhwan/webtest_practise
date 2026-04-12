'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormInput } from '@/components/FormInput';
import { Snackbar } from '@/components/Snackbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useLayoutUser } from '@/components/AppLayout';

interface PendingQuestion {
  id: string;
  question: string;
  explanation: string;
  points: number;
  choices: { text: string; is_correct: boolean }[];
}

export default function NewQuizPage() {
  return (
    <Suspense>
      <NewQuizContent />
    </Suspense>
  );
}

function NewQuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId') || '';
  const lessonId = searchParams.get('lessonId') || '';

  const [quizForm, setQuizForm] = useState({ title: '', description: '', passing_score: 70, time_limit_minutes: 0, max_attempts: 1 });
  const [quizErrors, setQuizErrors] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<PendingQuestion[]>([]);
  const [course, setCourse] = useState<{ title: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Question form
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [points, setPoints] = useState(1);
  const [choices, setChoices] = useState([
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
  ]);
  const [questionErrors, setQuestionErrors] = useState<Record<string, string>>({});

  const { setPageLoading } = useLayoutUser();

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        setPageLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/courses/${courseId}`);
        if (res.ok) {
          const data = await res.json();
          setCourse(data.course);
        }
      } catch (err) {
        console.error('Failed to fetch course:', err);
      } finally {
        setPageLoading(false);
      }
    };
    fetchCourse();
  }, [courseId, setPageLoading]);

  const handleQuizChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setQuizForm(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    if (quizErrors[name]) setQuizErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateQuiz = () => {
    const errors: Record<string, string> = {};
    if (!quizForm.title.trim()) errors.title = 'Please enter a quiz title';
    setQuizErrors(errors);
    return Object.keys(errors).length === 0;
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

  const resetQuestionForm = () => {
    setQuestionText('');
    setExplanation('');
    setPoints(1);
    setChoices([
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
    ]);
    setQuestionErrors({});
    setEditingIndex(null);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateQuestion()) return;

    const q: PendingQuestion = {
      id: editingIndex !== null ? questions[editingIndex].id : `temp_${Date.now()}`,
      question: questionText,
      explanation,
      points,
      choices: choices.filter(c => c.text.trim()),
    };

    if (editingIndex !== null) {
      setQuestions(prev => prev.map((item, i) => (i === editingIndex ? q : item)));
    } else {
      setQuestions(prev => [...prev, q]);
    }

    setShowQuestionModal(false);
    resetQuestionForm();
  };

  const handleEditQuestion = (index: number) => {
    const q = questions[index];
    setEditingIndex(index);
    setQuestionText(q.question);
    setExplanation(q.explanation);
    setPoints(q.points);
    setChoices(
      q.choices.length >= 2
        ? q.choices.map(c => ({ text: c.text, is_correct: c.is_correct }))
        : [
          { text: '', is_correct: false },
          { text: '', is_correct: false },
          { text: '', is_correct: false },
          { text: '', is_correct: false },
        ]
    );
    setQuestionErrors({});
    setShowQuestionModal(true);
  };

  const handleDeleteQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveQuiz = async () => {
    if (!validateQuiz()) return;
    if (questions.length === 0) {
      setSnackbar({ message: 'Add at least 1 question before saving', type: 'error' });
      return;
    }

    setSaving(true);
    setPageLoading(true);
    try {
      // 1. Create quiz
      const quizRes = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quizForm.title,
          description: quizForm.description || null,
          passing_score: quizForm.passing_score,
          time_limit_minutes: null,
          max_attempts: null,
          course_id: courseId,
          lesson_id: lessonId || undefined,
          is_published: false,
        }),
      });
      const quizData = await quizRes.json();
      if (!quizRes.ok) throw new Error(quizData.error || 'Failed to create quiz');

      const quizId = quizData.quiz.id;

      // 2. Create questions + choices
      for (const q of questions) {
        const qRes = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quiz_id: quizId,
            question: q.question,
            explanation: q.explanation || undefined,
            points: q.points,
          }),
        });
        const qData = await qRes.json();
        if (!qRes.ok) throw new Error(qData.error || 'Failed to create question');

        const questionId = qData.question.id;
        const choicesPayload = q.choices.map((c, i) => ({
          question_id: questionId,
          text: c.text,
          is_correct: c.is_correct,
          order_index: i,
        }));

        const cRes = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question_id: questionId, choices: choicesPayload }),
        });
        if (!cRes.ok) {
          const cData = await cRes.json();
          throw new Error(cData.error || 'Failed to create choices');
        }
      }

      setSnackbar({ message: 'Quiz created!', type: 'success' });
      router.push(`/instructor/courses/${courseId}`);
    } catch (err: unknown) {
      setSnackbar({ message: err instanceof Error ? err.message : 'Failed to save quiz', type: 'error' });
    } finally {
      setSaving(false);
      setPageLoading(false);
    }
  };

  return (
    <>
      <div className="page-container max-w-4xl">
        <div className="flex items-center justify-between mb-8 border-b-4 border-black pb-6">
          <div className="min-w-0">
            <Breadcrumb items={[
              { label: 'Courses', href: '/instructor' },
              ...(course ? [{ label: course.title, href: `/instructor/courses/${courseId}` }] : []),
              { label: 'New Quiz' },
            ]} />
            <h1 className="text-4xl font-serif text-black uppercase tracking-tight mt-2">New Quiz</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => { resetQuestionForm(); setShowQuestionModal(true); }}
              className="inline-flex items-center px-6 py-3 bg-white text-black border-2 border-black font-mono text-sm font-bold uppercase tracking-widest transition-all hover:bg-secondary-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Question
            </button>
            <button
              onClick={handleSaveQuiz}
              disabled={saving || questions.length === 0}
              className="inline-flex items-center px-6 py-3 bg-black text-white border-2 border-black font-mono text-sm font-bold uppercase tracking-widest transition-all hover:bg-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Quiz'}
            </button>
          </div>
        </div>

        {/* Quiz Info */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Quiz Details</h2>
          <div className="space-y-4">
            <FormInput
              id="quiz_title"
              name="title"
              label="Quiz Title"
              type="text"
              value={quizForm.title}
              onChange={handleQuizChange}
              error={quizErrors.title}
              required
            />
            <div>
              <label htmlFor="quiz_description" className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
              <textarea
                id="quiz_description"
                name="description"
                value={quizForm.description}
                onChange={handleQuizChange}
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
              onChange={handleQuizChange}
            />
          </div>
        </div>

        {/* Questions */}
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
                      {q.choices.map((choice, ci) => (
                        <div
                          key={ci}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${choice.is_correct ? 'bg-emerald-50 text-emerald-700 font-semibold ring-1 ring-emerald-600/20' : 'bg-slate-50 text-slate-600'
                            }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${choice.is_correct ? 'border-emerald-500' : 'border-slate-300'
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
                    <button onClick={() => handleEditQuestion(index)} className="action-edit w-32 justify-center">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      Edit
                    </button>
                    <button onClick={() => handleDeleteQuestion(index)} className="action-delete w-32 justify-center">
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
              <h2 className="text-xl font-bold text-slate-900 mb-6">{editingIndex !== null ? 'Edit Question' : 'Add Question'}</h2>
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
                          className={`input flex-1 ${choice.is_correct ? 'bg-emerald-50 border-emerald-500 ring-emerald-500' : ''}`}
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
                  <button type="button" onClick={() => setShowQuestionModal(false)} className="action-cancel">Cancel</button>
                  <button type="submit" className="action-save">
                    {editingIndex !== null ? 'Update' : 'Add Question'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <Snackbar
        message={snackbar?.message || ''}
        type={snackbar?.type || 'success'}
        onClose={() => setSnackbar(null)}
      />
    </>
  );
}
