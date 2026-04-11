import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client using @supabase/ssr - stores session in cookies so middleware can read it
export const supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
