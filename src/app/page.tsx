import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-secondary-700 to-cyan-600 bg-clip-text text-transparent">
            LMS Platform
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/docs/api"
              className="px-4 py-2.5 text-sm font-semibold text-secondary-700 border border-secondary-200 rounded-xl hover:bg-secondary-50 transition-all duration-200"
            >
              API Docs
            </Link>
            <Link href="/login" className="btn-primary text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-secondary-200/30 rounded-full blur-3xl -translate-x-1/2" />
        <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-cyan-200/20 rounded-full blur-3xl translate-x-1/3" />

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-50 border border-secondary-100 mb-8">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-secondary-700">Learning Management System</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 leading-[1.1] mb-6 tracking-tight">
                Master New
                <br />
                Skills{' '}
                <span className="bg-gradient-to-r from-secondary-700 via-secondary-500 to-cyan-500 bg-clip-text text-transparent">Online</span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-500 mb-10 leading-relaxed max-w-lg">
                Join thousands of learners worldwide. Access premium courses,
                learn at your own pace, and earn recognized certificates.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/register" className="btn-primary px-8 py-4 text-base rounded-2xl">
                  Start Learning Free →
                </Link>
                <Link href="/docs/api" className="btn-secondary px-8 py-4 text-base rounded-2xl">
                  API Documentation
                </Link>
              </div>

              <div className="mt-10 flex items-center gap-6">
                <div className="flex -space-x-3">
                  {['from-secondary-400 to-secondary-700', 'from-cyan-400 to-cyan-600', 'from-violet-400 to-violet-600', 'from-emerald-400 to-emerald-600'].map((gradient, i) => (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} border-[3px] border-white shadow-sm`}
                    />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">10,000+ Students</p>
                  <p className="text-xs text-slate-400">Already learning with us</p>
                </div>
              </div>
            </div>

            {/* Hero Card — dashboard preview */}
            <div className="relative">
              <div className="absolute inset-0 gradient-cool rounded-3xl blur-3xl opacity-10 scale-110" />
              <div className="relative premium-card p-8 space-y-6">
                {/* Course completion notification */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-100/50">
                  <span className="text-3xl">🎉</span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">Course Completed!</p>
                    <p className="text-sm text-slate-500">Web Development Bootcamp</p>
                  </div>
                  <div className="badge-green">+1 Cert</div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-600">Overall Progress</span>
                    <span className="font-bold text-secondary-700">75%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 gradient-primary rounded-full shadow-sm" />
                  </div>
                </div>

                {/* Mini Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: '12', label: 'Enrolled', color: 'text-secondary-700' },
                    { value: '8', label: 'Completed', color: 'text-emerald-600' },
                    { value: '3', label: 'Certificates', color: 'text-violet-600' },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Active Course */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary-50/50 border border-secondary-100/50">
                  <span className="text-xl">▶️</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">Continue: React Deep Dive</p>
                    <p className="text-xs text-slate-400">Lesson 7 of 24</p>
                  </div>
                  <span className="text-xs font-semibold text-secondary-600 bg-secondary-50 px-2 py-1 rounded-lg">29%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section — clean text-only */}
      <section className="py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '500+', label: 'Courses', color: 'text-secondary-700' },
              { value: '50+', label: 'Instructors', color: 'text-violet-600' },
              { value: '10K+', label: 'Students', color: 'text-emerald-600' },
              { value: '95%', label: 'Satisfaction', color: 'text-amber-600' },
            ].map((stat) => (
              <div key={stat.label} className="stat-card group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center py-8">
                <p className={`text-4xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-slate-500 mt-2 text-sm font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features — emoji instead of SVG icons */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-secondary-600 tracking-widest uppercase mb-3">Platform Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-secondary-700 to-cyan-600 bg-clip-text text-transparent">Succeed</span>
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              Our platform provides all the tools and resources you need to achieve your learning goals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                emoji: '📚',
                title: 'Expert-Led Courses',
                desc: 'Learn from industry professionals with real-world experience and structured curriculum.',
              },
              {
                emoji: '📊',
                title: 'Track Progress',
                desc: 'Monitor your learning journey with detailed analytics, milestones, and insights.',
              },
              {
                emoji: '🏆',
                title: 'Earn Certificates',
                desc: 'Get certified upon completion and showcase your achievements to the world.',
              },
            ].map((feature) => (
              <div key={feature.title} className="premium-card p-8 group hover:-translate-y-1">
                <span className="text-4xl block mb-5">{feature.emoji}</span>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Documentation Promo */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl gradient-cool p-12 md:p-16">
            <div className="relative grid md:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-sm font-semibold text-cyan-300 tracking-widest uppercase mb-4">Developer Resources</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
                  API Documentation
                </h2>
                <p className="text-lg text-white/70 mb-8 leading-relaxed">
                  Explore our comprehensive REST API with detailed endpoint descriptions.
                  Authenticate, manage courses, track progress, and more.
                </p>
                <Link
                  href="/docs/api"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-secondary-700 rounded-2xl font-semibold hover:bg-white/90 transition-all shadow-lg shadow-white/10"
                >
                  View API Docs →
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-white/10 font-mono text-sm shadow-2xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-400/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                    <span className="text-white/30 text-xs ml-2">terminal</span>
                  </div>
                  <div className="space-y-2 text-white/80">
                    <p><span className="text-emerald-400">GET</span> <span className="text-cyan-300">/api/courses</span></p>
                    <p className="text-white/30">→ List all published courses</p>
                    <p className="mt-3"><span className="text-amber-400">POST</span> <span className="text-cyan-300">/api/enrollments</span></p>
                    <p className="text-white/30">→ Enroll in a course</p>
                    <p className="mt-3"><span className="text-emerald-400">GET</span> <span className="text-cyan-300">/api/progress/:courseId</span></p>
                    <p className="text-white/30">→ Get learning progress</p>
                    <p className="mt-3"><span className="text-violet-400">POST</span> <span className="text-cyan-300">/api/quiz/submit</span></p>
                    <p className="text-white/30">→ Submit quiz answers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
            Ready to Start{' '}
            <span className="bg-gradient-to-r from-secondary-700 to-cyan-600 bg-clip-text text-transparent">Learning?</span>
          </h2>
          <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto">
            Join our community today and take the first step towards achieving your goals.
          </p>
          <Link href="/register" className="btn-primary px-10 py-4 text-base rounded-2xl">
            Create Free Account →
          </Link>
          <p className="mt-6 text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-secondary-600 hover:text-secondary-500 font-semibold transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="font-bold text-slate-600">LMS Platform</span>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link href="/docs/api" className="hover:text-secondary-600 transition-colors">API Docs</Link>
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
