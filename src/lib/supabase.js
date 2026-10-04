/**
 * src/lib/supabase.js
 *
 * Creates and exports the Supabase client singleton.
 * The URL and anon key are read from environment variables so they
 * are never hard-coded in the source repository.
 *
 * Required .env.local variables:
 *   VITE_SUPABASE_URL      — your Supabase project URL
 *   VITE_SUPABASE_ANON_KEY — your public anon key
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
    'Create a .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    // Store the session in localStorage (default); clear on sign-out
    persistSession: true,
    autoRefreshToken: true,
  },
});
