// Re-export for convenience
// Note: Only import server functions in Server Components/API Routes

export { supabaseClient } from './client';
export { getServerClient, supabaseAdmin } from './server';
export { getMiddlewareClient } from './middleware';
