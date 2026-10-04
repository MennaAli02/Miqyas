/**
 * src/lib/auth.js
 *
 * Auth helpers — manages the Supabase session.
 * The default strategy is anonymous sign-in: the user gets a real
 * JWT session without needing an account, which matches the original
 * "no login required" UX.  Officers and managers can later upgrade
 * to a named account via the login modal.
 */
import { supabase } from './supabase.js';

/**
 * Ensures a valid session exists.
 * Called once on app startup.  If no session is found, signs in
 * anonymously so all RPC calls have a valid JWT.
 */
export async function ensureSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session;

  // No session — sign in anonymously
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw new Error('Auth failed: ' + error.message);
  return data.session;
}

/**
 * Sign in with email + password (for Officers and Managers).
 */
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data.session;
}

/**
 * Sign out and immediately re-acquire an anonymous session.
 */
export async function signOut() {
  await supabase.auth.signOut();
  return ensureSession();
}

/**
 * Returns the current session's user or null.
 */
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
