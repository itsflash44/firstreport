import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client with service role key.
 * ONLY use this in server components, API routes, or admin scripts.
 * This key bypasses RLS — never expose to the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
