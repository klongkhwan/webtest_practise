import { NextResponse, type NextRequest } from 'next/server';
import { getMiddlewareClient } from './lib/supabase/middleware';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/enrollments', '/progress'];

// Routes that should redirect authenticated users
const authRoutes = ['/login'];

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = getMiddlewareClient(request, response);

  // Refresh session if expired
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if route is for authentication pages
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
