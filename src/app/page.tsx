import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#004557] selection:bg-[#0091B4] selection:text-white font-sans overflow-x-hidden">
      
      {/* Navigation - Sharp, Monospace, Minimal */}
      <nav className="fixed top-0 w-full z-50 bg-[#F9F8F6]/90 backdrop-blur-md border-b border-[#004557]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/" className="text-xl font-serif font-bold tracking-tight uppercase">
            LMS<span className="text-[#0091B4] ml-1">/</span>System
          </Link>
          <div className="flex items-center gap-6 font-mono text-xs uppercase tracking-widest">
            <Link
              href="/docs/api"
              className="hover:text-[#0091B4] transition-colors"
            >
              [ API Docs ]
            </Link>
            <Link 
              href="/login" 
              className="px-4 py-2 border border-[#004557] hover:bg-[#004557] hover:text-[#F9F8F6] transition-all"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Asymmetrical, Massive Typography */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-[90vh] flex flex-col justify-center relative">
        {/* Background Grid Pattern (Subtle) */}
        <div className="absolute inset-0 pointer-events-none opacity-5" 
             style={{ backgroundImage: 'linear-gradient(#004557 1px, transparent 1px), linear-gradient(90deg, #004557 1px, transparent 1px)', backgroundSize: '4rem 4rem' }}>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 items-end relative z-10">
          
          {/* Main Headline */}
          <div className="lg:col-span-8 animate-fade-up opacity-0">
            <p className="font-mono text-sm tracking-widest uppercase mb-6 flex items-center gap-4">
              <span className="w-12 h-px bg-[#004557]"></span>
              The Academic Standard
            </p>
            <h1 className="text-6xl sm:text-8xl md:text-[7rem] font-serif font-bold leading-[0.9] tracking-tighter mb-8">
              Elevate <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#004557] to-[#0091B4]">Your Mastery.</span>
            </h1>
            <p className="text-xl max-w-xl leading-relaxed text-[#004557]/80 mb-10 font-sans delay-100 animate-fade-up opacity-0">
              A comprehensive architecture for structured learning. Access curated curriculums, rigorous assessments, and industry-recognized certifications.
            </p>
            
            <div className="flex flex-wrap gap-4 font-mono text-sm delay-200 animate-fade-up opacity-0">
              <Link href="/register" className="btn-primary">
                Initialize Enrollment →
              </Link>
              <Link href="/courses" className="btn-secondary">
                View Curriculum
              </Link>
            </div>
          </div>

          {/* Technical Data Card */}
          <div className="lg:col-span-4 delay-300 animate-reveal-right opacity-0 border border-[#004557] bg-white p-8 relative shadow-[8px_8px_0_0_#004557]">
            <div className="absolute top-0 right-0 p-4 font-mono text-xs text-[#0091B4]">v2.4.0</div>
            <h3 className="font-serif text-2xl mb-6">System Status</h3>
            
            <div className="space-y-6 font-mono text-sm border-t border-[#004557] pt-6">
              <div className="flex justify-between items-center">
                <span className="text-[#004557]/60">Active Nodes</span>
                <span className="font-bold">10,492+</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#004557]/60">Curriculums</span>
                <span className="font-bold">500+</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#004557]/60">Uptime</span>
                <span className="font-bold text-emerald-600">99.99%</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#004557]">
               <p className="text-xs text-[#004557]/60 uppercase tracking-widest mb-2">Latest Milestone</p>
               <p className="font-bold">Advanced Web Architecture <span className="text-[#0091B4] xl:ml-2">Published</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Strict Grid Stats Section */}
      <section className="border-y border-[#004557] bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-[#004557]">
          {[
            { value: '500+', label: 'Curated Modules' },
            { value: '50+', label: 'Domain Experts' },
            { value: '10K+', label: 'Global Alumni' },
            { value: '95%', label: 'Completion Rate' },
          ].map((stat, i) => (
            <div key={i} className="p-10 text-center hover:bg-[#F9F8F6] transition-colors">
              <p className="text-5xl font-serif font-bold text-[#004557] mb-2">{stat.value}</p>
              <p className="font-mono text-xs uppercase tracking-widest text-[#004557]/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features - Editorial Columns */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <p className="font-mono text-sm tracking-widest uppercase mb-4 text-[#0091B4]">[ Implementation ]</p>
          <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">
            Engineered for <br/> Cognitive Maximum.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              num: '01',
              title: 'Rigorous Curriculum',
              desc: 'Structured pathways constructed by industry veterans. No filler, pure signal.',
            },
            {
              num: '02',
              title: 'Quantifiable Metrics',
              desc: 'Track knowledge acquisition through granular analytics and standardized assessments.',
            },
            {
              num: '03',
              title: 'Immutable Proof',
              desc: 'Cryptographically verifiable certificates upon completion of designated milestones.',
            },
          ].map((feature) => (
            <div key={feature.num} className="border border-[#004557] bg-white p-10 group hover:bg-[#004557] hover:text-[#F9F8F6] transition-all duration-500 relative">
              <div className="font-mono text-4xl font-bold text-[#004557]/20 group-hover:text-white/20 mb-8 transition-colors">
                {feature.num}
              </div>
              <h3 className="font-serif text-2xl font-bold mb-4">{feature.title}</h3>
              <p className="text-sm leading-relaxed opacity-80">{feature.desc}</p>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-[#0091B4] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
            </div>
          ))}
        </div>
      </section>

      {/* Terminal / API Section */}
      <section className="bg-[#004557] text-[#F9F8F6] py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(0,145,180,0.8)_0,transparent_50%)]" />
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <p className="font-mono text-sm tracking-widest uppercase mb-4 text-[#0091B4]">_Developer_Protocol</p>
            <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-6">
              Headless by Design.
            </h2>
            <p className="text-lg opacity-80 mb-10 max-w-md font-sans">
              Integrate our learning architecture directly into your infrastructure via our robust REST API.
            </p>
            <Link
              href="/docs/api"
              className="inline-block border border-[#0091B4] text-[#0091B4] hover:bg-[#0091B4] hover:text-[#004557] font-mono text-xs uppercase tracking-widest px-8 py-4 transition-colors"
            >
              Initialize Documentation
            </Link>
          </div>

          <div className="border border-[#0091B4]/30 bg-[#002b36] p-6 shadow-2xl relative">
            <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-[#0091B4]"></div>
            <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-[#0091B4]"></div>
            
            <div className="font-mono text-sm leading-loose">
              <div className="flex gap-2 text-[#0091B4]/50 mb-4 border-b border-[#0091B4]/20 pb-2">
                <span>&#x25CF;</span><span>&#x25CF;</span><span>&#x25CF;</span>
              </div>
              <p><span className="text-[#859900]">GET</span> <span className="text-[#2aa198]">/api/courses</span> <span className="opacity-50 float-right"># Retrieve catalog</span></p>
              <p><span className="text-[#b58900]">POST</span> <span className="text-[#2aa198]">/api/enrollments</span> <span className="opacity-50 float-right"># Request access</span></p>
              <p><span className="text-[#859900]">GET</span> <span className="text-[#2aa198]">/api/progress/:id</span> <span className="opacity-50 float-right"># Audit metrics</span></p>
              <p className="border-t border-[#0091B4]/20 mt-4 pt-4 text-[#268bd2]">
                <span className="opacity-50">&gt; </span>Status: <span className="text-[#859900]">200 OK</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-Footer CTA */}
      <section className="py-32 px-6 text-center border-b border-[#004557]">
        <h2 className="text-5xl md:text-7xl font-serif font-bold tracking-tighter mb-8">
          Commence <br />
          <span className="text-[#0091B4] italic font-normal">Execution.</span>
        </h2>
        <Link href="/register" className="btn-primary transform hover:scale-105 transition-transform duration-300">
          Open Account Protocol
        </Link>
      </section>

      {/* Footer - Minimalist Typography */}
      <footer className="bg-[#F9F8F6] pt-16 pb-8 px-6 border-t-8 border-[#004557]">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <h2 className="text-[15vw] leading-none font-serif font-black tracking-tighter text-[#004557]/5 select-none mb-8">
            LMS<span className="text-[#0091B4]/10">SYS</span>
          </h2>
          
          <div className="w-full flex justify-between items-center border-t border-[#004557]/20 pt-8 font-mono text-xs uppercase tracking-widest text-[#004557]">
            <p>&copy; {new Date().getFullYear()} LMS System.</p>
            <div className="flex gap-8">
              <Link href="/docs/api" className="hover:text-[#0091B4]">API</Link>
              <Link href="/login" className="hover:text-[#0091B4]">Access</Link>
              <span className="opacity-50">v2.4</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
