import { User } from '../types/user.types';

const SESSION_KEY = 'dreamjewels_session';

/**
 * Saves a user session to SessionStorage.
 * When Supabase is integrated, session management moves to supabase.auth.
 */
export function saveSession(user: User): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

/**
 * Retrieves the current session from SessionStorage.
 * Returns null if no session exists or data is malformed.
 */
export function getSession(): User | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    clearSession();
    return null;
  }
}

/**
 * Clears the session from SessionStorage.
 */
export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
