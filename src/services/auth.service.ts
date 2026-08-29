/**
 * auth.service.ts
 *
 * Authentication service with a clean interface.
 * Currently backed by mock data + SessionStorage.
 *
 * TO MIGRATE TO SUPABASE:
 *   Replace the function bodies below with Supabase auth calls.
 *   The interface (function signatures) stays identical — no UI changes needed.
 */

import { LoginCredentials, AuthResult } from '../types/auth.types';
import { User } from '../types/user.types';
import { MOCK_USERS } from '../data/mock-users';
import { saveSession, getSession, clearSession } from '../utils/session';

/**
 * Authenticates a user with username + password.
 * Checks both persistent registered users and mock users.
 * Returns the User object on success, an error string on failure.
 */
export async function authLogin(credentials: LoginCredentials): Promise<AuthResult> {
  // Simulate async network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  let allUsers: Array<any> = [...MOCK_USERS];

  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('dream-jewels-chat-state') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.users) {
        const storedUsers = Array.isArray(parsed.users)
          ? parsed.users
          : Object.values(parsed.users);
        allUsers = [...storedUsers, ...MOCK_USERS];
      }
    }
  } catch (e) {
    console.warn('Could not read persistent users:', e);
  }

  const match = allUsers.find(
    (u) =>
      u.username?.toLowerCase() === credentials.username.toLowerCase() &&
      (u.password === credentials.password || (!u.password && credentials.password === '123456'))
  );

  if (!match) {
    return { success: false, error: 'Invalid username or password.' };
  }

  // Strip password before storing
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _pw, ...safeUser } = match;
  saveSession(safeUser);

  return { success: true, user: safeUser };
}

/**
 * Logs out the current user by clearing the session.
 */
export async function authLogout(): Promise<void> {
  clearSession();
}

/**
 * Returns the currently authenticated user from session, or null.
 */
export function authGetCurrentUser(): User | null {
  return getSession();
}
