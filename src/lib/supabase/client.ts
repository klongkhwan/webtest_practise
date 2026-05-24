import { createBrowserClient } from '@supabase/ssr';

let supabaseClientInstance: ReturnType<typeof createBrowserClient> | null = null;

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase browser environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

function createLazySupabaseClient() {
  if (!supabaseClientInstance) {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
    supabaseClientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseClientInstance;
}

// Preserve the existing import surface while deferring env access until first use.
export const supabaseClient = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_target, prop, receiver) {
    const client = createLazySupabaseClient();
    return Reflect.get(client, prop, receiver);
  },
});

export function getSupabaseClient() {
  return createLazySupabaseClient();
}
