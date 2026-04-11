'use client';

import Link from 'next/link';
import { useState } from 'react';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';

interface Endpoint {
  method: HttpMethod;
  path: string;
  description: string;
}

interface ApiCategory {
  name: string;
  emoji: string;
  description: string;
  endpoints: Endpoint[];
}

const apiCategories: ApiCategory[] = [
  {
    name: 'Authentication',
    emoji: '🔐',
    description: 'User registration, login, logout and session management.',
    endpoints: [
      { method: 'POST', path: '/api/auth/register', description: 'Register a new user account with email, password, full_name, and optional role' },
      { method: 'POST', path: '/api/auth/login', description: 'Authenticate user with email and password, creates a session' },
      { method: 'POST', path: '/api/auth/logout', description: 'Sign out and destroy the current session' },
      { method: 'GET', path: '/api/auth/me', description: 'Get the currently authenticated user profile and role' },
    ],
  },
  {
    name: 'Courses',
    emoji: '📚',
    description: 'CRUD operations for courses (admin/instructor) and public listing.',
    endpoints: [
      { method: 'GET', path: '/api/courses', description: 'List all published courses with optional search query (?search=keyword)' },
      { method: 'POST', path: '/api/courses', description: 'Create a new course (admin/instructor only) with title, description, thumbnail' },
      { method: 'GET', path: '/api/courses/[id]', description: 'Get detailed information about a specific course by ID' },
      { method: 'PATCH', path: '/api/courses/[id]', description: 'Update course details such as title, description, status (admin/instructor only)' },
      { method: 'DELETE', path: '/api/courses/[id]', description: 'Delete a course and all associated lessons/enrollments (admin only)' },
    ],
  },
  {
    name: 'Lessons',
    emoji: '🎬',
    description: 'Manage lessons within a course. Supports ordering and video content.',
    endpoints: [
      { method: 'GET', path: '/api/lessons', description: 'List all lessons for a specific course (?courseId=xxx)' },
      { method: 'POST', path: '/api/lessons', description: 'Create a new lesson with title, content, video_url, order_index, and course_id' },
      { method: 'GET', path: '/api/lessons/[id]', description: 'Get a single lesson by its ID including content and video' },
      { method: 'PATCH', path: '/api/lessons/[id]', description: 'Update lesson content, title, video URL, or order index' },
      { method: 'DELETE', path: '/api/lessons/[id]', description: 'Delete a lesson from the course' },
    ],
  },
  {
    name: 'Enrollments',
    emoji: '✋',
    description: 'Manage student enrollments into courses.',
    endpoints: [
      { method: 'GET', path: '/api/enrollments', description: 'List all enrollments for the authenticated user' },
      { method: 'POST', path: '/api/enrollments', description: 'Enroll the current user in a course by providing course_id' },
      { method: 'DELETE', path: '/api/enrollments', description: 'Unenroll the current user from a course (?courseId=xxx)' },
    ],
  },
  {
    name: 'Progress',
    emoji: '📊',
    description: 'Track and update lesson completion and course progress.',
    endpoints: [
      { method: 'GET', path: '/api/progress/[courseId]', description: 'Get lesson completion progress for a specific course (authenticated user)' },
      { method: 'POST', path: '/api/progress', description: 'Mark a lesson as completed by providing lesson_id and course_id' },
    ],
  },
  {
    name: 'Quizzes',
    emoji: '❓',
    description: 'CRUD for quizzes (per-lesson), including scoring configuration.',
    endpoints: [
      { method: 'GET', path: '/api/quizzes', description: 'List all quizzes for a given lesson (?lessonId=xxx)' },
      { method: 'POST', path: '/api/quizzes', description: 'Create a new quiz for a lesson with title and passing_score' },
      { method: 'GET', path: '/api/quizzes/[id]', description: 'Get quiz details including its questions' },
      { method: 'PATCH', path: '/api/quizzes/[id]', description: 'Update quiz title or passing score' },
      { method: 'DELETE', path: '/api/quizzes/[id]', description: 'Delete a quiz and all its questions' },
      { method: 'POST', path: '/api/quizzes/submit', description: 'Submit quiz answers and receive the score/result' },
    ],
  },
  {
    name: 'Questions',
    emoji: '💬',
    description: 'Manage quiz questions and their answer choices.',
    endpoints: [
      { method: 'GET', path: '/api/questions', description: 'List all questions for a given quiz (?quizId=xxx)' },
      { method: 'POST', path: '/api/questions', description: 'Create a new question with text, choices array, and correct_answer index' },
      { method: 'PATCH', path: '/api/questions/[id]', description: 'Update question text, choices, or correct answer' },
      { method: 'DELETE', path: '/api/questions/[id]', description: 'Delete a specific question from a quiz' },
    ],
  },
  {
    name: 'Users',
    emoji: '👤',
    description: 'User management for admins — list, update roles, delete accounts.',
    endpoints: [
      { method: 'GET', path: '/api/users', description: 'List all users with search and role filter (admin only)' },
      { method: 'PATCH', path: '/api/users/[id]', description: 'Update a user role (admin only)' },
      { method: 'DELETE', path: '/api/users/[id]', description: 'Delete a user account (admin only)' },
    ],
  },
  {
    name: 'Certificates',
    emoji: '🏆',
    description: 'Issue and retrieve certificates upon course completion.',
    endpoints: [
      { method: 'GET', path: '/api/certificates', description: 'List all certificates earned by the authenticated user' },
      { method: 'POST', path: '/api/certificates', description: 'Issue a certificate for a completed course (requires 100% progress)' },
    ],
  },
];

const methodColors: Record<HttpMethod, { bg: string; text: string; ring: string }> = {
  GET: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-500/20' },
  POST: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-500/20' },
  PATCH: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-500/20' },
  PUT: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-500/20' },
  DELETE: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-500/20' },
};

export default function ApiDocsPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const totalEndpoints = apiCategories.reduce((sum, cat) => sum + cat.endpoints.length, 0);

  const filteredCategories = apiCategories
    .map((cat) => {
      if (!searchQuery) return cat;
      const filtered = cat.endpoints.filter(
        (e) =>
          e.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.method.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (
        filtered.length > 0 ||
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return { ...cat, endpoints: filtered.length > 0 ? filtered : cat.endpoints };
      }
      return null;
    })
    .filter(Boolean) as ApiCategory[];

  const toggleCategory = (name: string) => {
    setActiveCategory(activeCategory === name ? null : name);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-secondary-700 to-cyan-600 bg-clip-text text-transparent">
            LMS Platform
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="btn-ghost text-sm">
              ← Home
            </Link>
            <Link href="/login" className="btn-primary text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <section className="pt-36 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-20 left-0 w-[400px] h-[400px] bg-secondary-200/20 rounded-full blur-3xl -translate-x-1/2" />
        <div className="absolute top-40 right-0 w-[300px] h-[300px] bg-cyan-200/15 rounded-full blur-3xl translate-x-1/3" />

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-secondary-600 tracking-widest uppercase mb-4">REST API Reference</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              API{' '}
              <span className="bg-gradient-to-r from-secondary-700 to-cyan-600 bg-clip-text text-transparent">Documentation</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Comprehensive reference for all REST API endpoints available in the LMS platform.
              All endpoints use JSON and require appropriate authentication.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-100 shadow-sm">
              <span className="text-lg font-bold text-secondary-700">{apiCategories.length}</span>
              <span className="text-sm text-slate-500">Categories</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-100 shadow-sm">
              <span className="text-lg font-bold text-emerald-600">{totalEndpoints}</span>
              <span className="text-sm text-slate-500">Endpoints</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-100 shadow-sm">
              <span className="text-lg font-bold text-violet-600">REST</span>
              <span className="text-sm text-slate-500">Architecture</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-100 shadow-sm">
              <span className="text-lg font-bold text-amber-600">JSON</span>
              <span className="text-sm text-slate-500">Format</span>
            </div>
          </div>

          {/* Search */}
          <div className="max-w-xl mx-auto">
            <input
              type="text"
              placeholder="🔍  Search endpoints... e.g. POST, courses, login"
              className="input !rounded-2xl shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Base URL Notice */}
      <section className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 font-mono text-sm shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-amber-400/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
              <span className="text-slate-500 text-xs ml-2">base url</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400">Base URL:</span>
              <span className="text-cyan-300">https://your-domain.com</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-amber-400">Auth:</span>
              <span className="text-slate-400">Supabase session cookie-based authentication</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-violet-400">Format:</span>
              <span className="text-slate-400">Content-Type: application/json</span>
            </div>
          </div>
        </div>
      </section>

      {/* API Categories */}
      <section className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-7xl mx-auto space-y-4">
          {filteredCategories.map((category) => {
            const isOpen = activeCategory === category.name;
            return (
              <div key={category.name} className="premium-card overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.name)}
                  className="w-full p-5 flex items-center gap-4 text-left hover:bg-slate-50/50 transition-colors"
                >
                  <span className="text-2xl flex-shrink-0">{category.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-0.5">
                      <h3 className="text-lg font-bold text-slate-900">{category.name}</h3>
                      <span className="badge-gray">{category.endpoints.length}</span>
                    </div>
                    <p className="text-sm text-slate-500 truncate">{category.description}</p>
                  </div>
                  <span className={`text-slate-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
                    ▾
                  </span>
                </button>

                {/* Endpoints List */}
                {isOpen && (
                  <div className="border-t border-slate-100">
                    {category.endpoints.map((endpoint, idx) => {
                      const color = methodColors[endpoint.method];
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 ${idx < category.endpoints.length - 1 ? 'border-b border-slate-50' : ''} hover:bg-slate-50/30 transition-colors`}
                        >
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className={`inline-flex items-center justify-center w-[72px] px-2 py-1 rounded-lg text-xs font-bold ring-1 ${color.bg} ${color.text} ${color.ring}`}>
                              {endpoint.method}
                            </span>
                            <code className="text-sm font-mono text-slate-700 font-semibold">
                              {endpoint.path}
                            </code>
                          </div>
                          <span className="text-sm text-slate-500 sm:ml-auto sm:text-right max-w-md">
                            {endpoint.description}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {filteredCategories.length === 0 && (
            <div className="empty-state">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-slate-500 text-lg font-medium">No endpoints found</p>
              <p className="text-slate-400 text-sm mt-1">Try adjusting your search query</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="font-bold text-slate-600">LMS Platform</span>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link href="/" className="hover:text-secondary-600 transition-colors">Home</Link>
              <Link href="/login" className="hover:text-secondary-600 transition-colors">Login</Link>
              <Link href="/register" className="hover:text-secondary-600 transition-colors">Register</Link>
            </div>
            <p className="text-sm text-slate-400">&copy; 2024 LMS Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
