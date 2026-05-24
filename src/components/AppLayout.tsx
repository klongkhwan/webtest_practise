'use client';

import { useState, useEffect, useRef, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/client';
import type { User } from '@/types/database';

interface LayoutContextType {
  user: User | null;
  loading: boolean;
  setNavigating: (v: boolean) => void;
  setPageLoading: (v: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType>({ user: null, loading: true, setNavigating: () => { }, setPageLoading: () => { } });
export const useLayoutUser = () => useContext(LayoutContext);

interface NavItem {
  label: string;
  href: string;
  icon: 'home' | 'book' | 'user' | 'shield' | 'teach';
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const loaderStartRef = useRef(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    loaderStartRef.current = Date.now();
    try {
      const { data: { user: authUser } } = await supabaseClient.auth.getUser();
      if (!authUser) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        // Update Cache
        localStorage.setItem('lms_user_cache', JSON.stringify(data.user));
      } else {
        // Clear cache if API check fails
        localStorage.removeItem('lms_user_cache');
        setUser(null);
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // 1. Initial Load from Cache
    const cachedUser = localStorage.getItem('lms_user_cache');
    if (cachedUser) {
      try {
        const parsedUser = JSON.parse(cachedUser);
        setUser(parsedUser);
        setLoading(false);
        setPageLoading(false);
      } catch (e) {
        localStorage.removeItem('lms_user_cache');
      }
    }

    // 2. Revalidate with Server
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    setNavigating(false);
    setPageLoading(true);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (target && target.getAttribute('href')?.startsWith('/') && target.getAttribute('href') !== pathname) {
        setNavigating(true);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [pathname]);

  // Minimum 0.5s loader display + combine auth & page loading
  const isLoading = loading || pageLoading || navigating;
  useEffect(() => {
    if (isLoading) {
      if (!loaderStartRef.current) loaderStartRef.current = Date.now();
      setShowLoader(true);
    } else {
      const elapsed = Date.now() - loaderStartRef.current;
      const remaining = Math.max(0, 500 - elapsed);
      const timer = setTimeout(() => {
        setShowLoader(false);
        loaderStartRef.current = 0;
      }, remaining);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    localStorage.removeItem('lms_user_cache');
    window.location.href = '/';
  };

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: 'home' },
    { label: 'Courses', href: '/courses', icon: 'book' },
  ];

  if (user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN') {
    navItems.push({ label: 'Instructor', href: '/instructor', icon: 'teach' });
  }

  if (user?.role === 'ADMIN') {
    navItems.push({ label: 'Admin Panel', href: '/admin', icon: 'shield' });
  }

  // Always keep Profile at the very end
  navItems.push({ label: 'Profile', href: '/profile', icon: 'user' });

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/courses') return pathname.startsWith('/courses') || pathname.startsWith('/lessons') || pathname.startsWith('/quiz');
    return pathname.startsWith(href);
  };

  const renderIcon = (icon: string) => {
    switch (icon) {
      case 'home':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'book':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'user':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'shield':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'teach':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-14.48 0L12 2m7.74 8.147L12 2m0 0L4.26 10.147M12 2v7.2" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <LayoutContext.Provider value={{ user, loading, setNavigating, setPageLoading }}>
      <div className="min-h-screen bg-slate-50">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
          </div>
        )}

        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r-4 border-black transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="px-6 py-6 border-b-4 border-black bg-primary-400">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <span className="text-xl font-black text-black tracking-widest uppercase leading-none">LMS</span>
                  <p className="text-[10px] text-black font-mono font-bold uppercase tracking-widest mt-1">Learning Platform</p>
                </div>
              </Link>
            </div>

            <nav className="flex-1 p-6 space-y-4 overflow-y-auto">
              <p className="text-[10px] font-mono font-bold text-black uppercase tracking-widest mb-4">Menu</p>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => { setSidebarOpen(false); setNavigating(true); }}
                  className={`flex items-center gap-3 px-4 py-3 border-2 transition-all duration-200 text-[12px] font-mono font-bold tracking-widest uppercase ${isActive(item.href)
                      ? 'border-black bg-secondary-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-1'
                      : 'border-transparent text-black hover:border-black hover:bg-slate-100 hover:translate-x-1'
                    }`}
                >
                  <span className={`transition-colors ${isActive(item.href) ? 'text-black' : ''}`}>
                    {renderIcon(item.icon)}
                  </span>
                  {item.label}
                  {isActive(item.href) && (
                    <span className="ml-auto w-2 h-2 bg-black border border-black animate-pulse" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />
          </div>
        </aside>

        {/* Main content */}
        <div className="lg:pl-72">
          {/* Top bar */}
          <header className="sticky top-0 z-30 bg-white border-b-4 border-black">
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-20">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 border-2 border-black bg-primary-400 text-black hover:bg-black hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="lg:hidden flex-1" />
              <div className="ml-auto flex items-center gap-4">
                <div className="flex flex-col items-end hidden sm:flex mr-2">
                  <p className="text-[12px] font-mono font-bold text-black uppercase tracking-widest">{user?.full_name}</p>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{user?.role}</p>
                </div>
                <Link href="/profile" className="flex items-center justify-center w-12 h-12 border-2 border-black bg-secondary-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all">
                  <span className="text-xl font-serif font-bold text-black">
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-3 border-2 border-black bg-white hover:bg-black hover:text-white transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none ml-2"
                  title="Sign Out"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="relative">
            {(isLoading || showLoader) && (
              <div className="fixed inset-0 lg:left-72 z-40 bg-slate-50 flex items-center justify-center">
                <div className="loader" />
              </div>
            )}
            <div style={{ visibility: (isLoading || showLoader) ? 'hidden' : 'visible' }}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </LayoutContext.Provider>
  );
}
