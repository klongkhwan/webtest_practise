import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Get authenticated user from Authorization header or cookie session
export async function getAuthUser(request?: NextRequest) {
  // 1. Try Bearer token from Authorization header
  if (request) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data, error } = await supabaseAdmin!.auth.getUser(token);
      if (!error && data.user) {
        return data.user;
      }
    }
  }

  // 2. Fallback to cookie-based session
  const supabase = await getServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (!error && data.user) {
    return data.user;
  }

  return null;
}

// Server client - ONLY use in Server Components/API Routes
export async function getServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: object }>) {
        try {
          cookiesToSet.forEach((cookie: { name: string; value: string; options: object }) => {
            cookieStore.set(cookie.name, cookie.value, cookie.options as any);
          });
        } catch (err) {
          console.error('Cookie set error in setAll:', err);
        }
      },
    },
  });
}

// Admin client - ONLY use in Server Components/API Routes
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
