'use client';

import Link from 'next/link';
import { useState } from 'react';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';

interface Endpoint {
  method: HttpMethod;
  path: string;
  description: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
  payload?: any;
  response?: any;
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
      { 
        method: 'POST', 
        path: '/api/auth/register', 
        description: 'Register a new user account profile in the database.',
        payload: {
          auth_id: "string (from supabase.auth)",
          email: "user@example.com",
          full_name: "John Doe",
          phone: "+66812345678 (optional)",
          role: "STUDENT | INSTRUCTOR | ADMIN"
        },
        response: { message: "Registration successful", user: { id: "...", email: "..." } }
      },
      { 
        method: 'GET', 
        path: '/api/auth/me', 
        description: 'Get the currently authenticated user profile.',
        response: { user: { id: "...", role: "STUDENT", full_name: "..." } }
      },
    ],
  },
  {
    name: 'Courses',
    emoji: '📚',
    description: 'CRUD operations for courses (admin/instructor) and public listing.',
    endpoints: [
      { 
        method: 'GET', 
        path: '/api/courses', 
        description: 'List all published courses with pagination and search.',
        params: [
          { name: 'search', type: 'string', required: false, description: 'Search title for keyword' },
          { name: 'status', type: 'string', required: false, description: 'PUBLISHED (default), DRAFT, ARCHIVED' },
          { name: 'limit', type: 'number', required: false, description: 'Number of items to return' },
          { name: 'offset', type: 'number', required: false, description: 'Number of items to skip' }
        ],
        response: { courses: [ { id: '...', title: '...' } ] }
      },
      { 
        method: 'POST', 
        path: '/api/courses', 
        description: 'Create a new course (Instructor/Admin only).',
        payload: {
          title: "Course title (min 3 chars)",
          description: "Course description (optional)",
          is_paid: "boolean",
          price: "number"
        }
      },
      { 
        method: 'GET', 
        path: '/api/courses/[id]', 
        description: 'Get detailed information about a specific course.',
        response: { id: "...", title: "...", lessons: ["..."], instructor: { name: "..." } }
      },
    ],
  },
  {
    name: 'Lessons',
    emoji: '🎬',
    description: 'Manage lessons within a course. Supports ordering and video content.',
    endpoints: [
      { 
        method: 'GET', 
        path: '/api/lessons', 
        description: 'List all lessons for a specific course.',
        params: [{ name: 'courseId', type: 'UUID', required: true, description: 'Filter by course' }]
      },
      { 
        method: 'POST', 
        path: '/api/lessons', 
        description: 'Create a new lesson (Instructor/Admin only).',
        payload: {
          course_id: "UUID",
          title: "Lesson title",
          content: "Markdown content",
          video_url: "URL (optional)",
          is_free: "boolean",
          duration_minutes: "number"
        }
      },
      { method: 'GET', path: '/api/lessons/[id]', description: 'Get a single lesson by its ID including content and video' },
    ],
  },
  {
    name: 'Enrollments',
    emoji: '✋',
    description: 'Manage student enrollments into courses.',
    endpoints: [
      { 
        method: 'POST', 
        path: '/api/enrollments', 
        description: 'Enroll the current user in a course.',
        payload: { course_id: "UUID" }
      },
      { 
        method: 'GET', 
        path: '/api/progress/[courseId]', 
        description: 'Get lesson completion progress for a specific course.',
        response: { completed_lesson_ids: ["UUID", "..."], percentage: 45 }
      },
      { 
        method: 'POST', 
        path: '/api/progress', 
        description: 'Mark a lesson as completed.',
        payload: { lesson_id: "UUID", course_id: "UUID" }
      },
    ],
  },
  {
    name: 'Quizzes',
    emoji: '❓',
    description: 'CRUD for quizzes (per-lesson), including scoring configuration.',
    endpoints: [
      { 
        method: 'GET', 
        path: '/api/quizzes', 
        description: 'List all quizzes for a given lesson.',
        params: [{ name: 'lessonId', type: 'UUID', required: true, description: 'Filter by lesson' }]
      },
      { 
        method: 'POST', 
        path: '/api/quiz/submit', 
        description: 'Submit quiz answers and receive scoring.',
        payload: {
          quiz_id: "UUID",
          answers: [
            { question_id: "UUID", selected_choice_id: "UUID" }
          ]
        },
        response: { score: 85, passed: true, total_questions: 10, correct_answers: 8 }
      },
      { 
        method: 'GET', 
        path: '/api/quizzes/[id]', 
        description: 'Get quiz details including questions and choices.',
        response: { id: "...", title: "...", questions: [ { id: "...", text: "...", choices: ["..."] } ] }
      },
      { 
        method: 'POST', 
        path: '/api/certificates', 
        description: 'Issue a certificate for a completed course.',
        payload: { course_id: "UUID" },
        response: { id: "...", certificate_url: "..." }
      },
    ],
  },
  {
    name: 'Administrative',
    emoji: '⚙️',
    description: 'User and system management (Admin only).',
    endpoints: [
      { 
        method: 'GET', 
        path: '/api/users', 
        description: 'List all users with search and filter.',
        params: [
          { name: 'role', type: 'string', required: false, description: 'STUDENT, INSTRUCTOR, ADMIN' },
          { name: 'search', type: 'string', required: false, description: 'Search name or email' }
        ]
      },
      { 
        method: 'PATCH', 
        path: '/api/users/[id]', 
        description: 'Update user role.',
        payload: { role: "ADMIN | INSTRUCTOR | STUDENT" }
      },
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
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
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
        // Auto-expand if there's a match
        if (searchQuery && !expandedCategories.includes(cat.name)) {
          setExpandedCategories(prev => [...prev, cat.name]);
        }
        return { ...cat, endpoints: filtered.length > 0 ? filtered : cat.endpoints };
      }
      return null;
    })
    .filter(Boolean) as ApiCategory[];

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => 
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#F9F8F6]/90 backdrop-blur-md border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-serif font-black uppercase tracking-tighter text-black">
            LMS<span className="text-[#0091B4]">.</span>Platform
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="font-mono text-xs uppercase font-bold hover:underline">
              ← Back
            </Link>
            <Link href="/login" className="btn-primary !py-2 !px-4 text-[10px]">
              Sign In
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
            <p className="text-sm font-bold font-mono text-secondary-600 tracking-[0.3em] uppercase mb-4">REST API Reference</p>
            <h1 className="text-5xl sm:text-7xl font-serif font-black text-black mb-6 uppercase tracking-tight leading-none">
              API Documentation
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto font-mono">
              Comprehensive reference for all REST API endpoints available in the LMS platform.
              All endpoints use JSON and require Supabase session authentication.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex flex-col items-center justify-center w-32 h-32 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-3xl font-serif font-black">{apiCategories.length}</span>
              <span className="text-[10px] font-mono uppercase text-slate-400 mt-1">Modules</span>
            </div>
            <div className="flex flex-col items-center justify-center w-32 h-32 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-3xl font-serif font-black">{totalEndpoints}</span>
              <span className="text-[10px] font-mono uppercase text-slate-400 mt-1">Routes</span>
            </div>
            <div className="flex flex-col items-center justify-center w-32 h-32 bg-[#10b981] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-3xl font-serif font-black">1.0</span>
              <span className="text-[10px] font-mono uppercase text-white/70 mt-1">Version</span>
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
      <section className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border-4 border-black p-8 font-mono text-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-100 pb-4">
              <div className="w-4 h-4 bg-red-500 border-2 border-black" />
              <div className="w-4 h-4 bg-yellow-400 border-2 border-black" />
              <div className="w-4 h-4 bg-green-500 border-2 border-black" />
              <span className="text-black font-black uppercase text-xs ml-2 tracking-tighter">System Configuration</span>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-1">
                <span className="text-slate-400 uppercase text-[10px] font-black">Base URL</span>
                <p className="text-black font-bold text-lg break-all">https://api.your-platform.com</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 uppercase text-[10px] font-black">Authentication</span>
                <p className="text-black font-bold">Supabase Auth (JWT)</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 uppercase text-[10px] font-black">Response Format</span>
                <p className="text-black font-bold">application/json</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API Categories */}
      <section className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-7xl mx-auto space-y-8">
          {filteredCategories.map((category) => {
            const isExpanded = expandedCategories.includes(category.name);
            return (
              <div key={category.name} id={category.name.toLowerCase()} className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <button 
                  onClick={() => toggleCategory(category.name)}
                  className="w-full flex items-center justify-between p-6 bg-white hover:bg-slate-50 transition-colors border-b-4 border-black group"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{category.emoji}</span>
                    <div className="text-left">
                      <h2 className="text-2xl font-serif font-black uppercase tracking-tight group-hover:text-secondary-600 transition-colors">
                        {category.name}
                      </h2>
                      <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">{category.description}</p>
                    </div>
                  </div>
                  <div className={`text-3xl font-black transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-6 bg-slate-50 space-y-6">
                    <div className="grid gap-6">
                      {category.endpoints.map((endpoint, idx) => {
                        const color = methodColors[endpoint.method];
                        return (
                          <div key={idx} className="card bg-white p-0 border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            {/* Endpoint Header */}
                            <div className="p-4 border-b-2 border-black flex flex-wrap items-center gap-4 bg-white">
                              <span className={`${color.bg} ${color.text} px-3 py-1 border-2 border-black font-mono font-black text-xs`}>
                                {endpoint.method}
                              </span>
                              <code className="text-sm font-mono font-bold text-black break-all">
                                {endpoint.path}
                              </code>
                              <div className="sm:ml-auto">
                                <span className="text-[10px] uppercase font-black text-slate-400">{endpoint.description}</span>
                              </div>
                            </div>

                            {/* Endpoint Details */}
                            <div className="p-6 grid lg:grid-cols-2 gap-8 bg-white border-t-2 border-slate-100">
                          <div className="space-y-6">
                            {/* Parameters */}
                            {endpoint.params && endpoint.params.length > 0 && (
                              <div>
                                <h4 className="font-mono text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-blue-500"></span> Query Parameters
                                </h4>
                                <div className="space-y-3">
                                  {endpoint.params.map(p => (
                                    <div key={p.name} className="flex flex-col border-l-2 border-slate-200 pl-4 py-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-black">{p.name}</span>
                                        <span className="text-[10px] text-slate-400 uppercase">{p.type}</span>
                                        {p.required && <span className="text-[10px] text-red-500 font-bold uppercase">Required</span>}
                                      </div>
                                      <span className="text-sm text-slate-500">{p.description}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Request Body */}
                            {endpoint.payload && (
                              <div>
                                <h4 className="font-mono text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-amber-500"></span> Request Body (JSON)
                                </h4>
                                <pre className="bg-slate-900 text-slate-300 p-4 font-mono text-xs border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
                                  {JSON.stringify(endpoint.payload, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>

                          <div className="space-y-6">
                            {/* Example Response */}
                            {endpoint.response && (
                              <div>
                                <h4 className="font-mono text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-emerald-500"></span> Success Response
                                </h4>
                                <pre className="bg-emerald-950 text-emerald-400 p-4 font-mono text-xs border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
                                  {JSON.stringify(endpoint.response, null, 2)}
                                </pre>
                              </div>
                            )}

                            <div>
                              <h4 className="font-mono text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-slate-400"></span> Auth Required
                              </h4>
                              <p className="text-sm text-slate-500 font-mono">
                                {endpoint.path.includes('/api/auth/register') || endpoint.path.includes('/api/courses') && endpoint.method === 'GET' 
                                  ? "None (Public)" 
                                  : "Bearer Token (Supabase Session)"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
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
      <footer className="py-12 border-t-4 border-black bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-2">
              <span className="text-2xl font-serif font-black uppercase tracking-tighter">API Reference</span>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Internal Documentation v1.0.4</p>
            </div>
            <div className="flex flex-wrap gap-8 text-xs font-mono font-bold uppercase">
              <Link href="/" className="hover:text-secondary-600 underline decoration-2 underline-offset-4">Portal</Link>
              <Link href="/login" className="hover:text-secondary-600 underline decoration-2 underline-offset-4">Instructor Login</Link>
              <Link href="/register" className="hover:text-secondary-600 underline decoration-2 underline-offset-4">Student Board</Link>
            </div>
            <p className="text-[10px] font-mono text-slate-400 uppercase leading-none">
              &copy; {new Date().getFullYear()} Brutalist LMS Core. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
