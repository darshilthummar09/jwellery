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
 * Returns the User object on success, an error string on failure.
 */
export async function authLogin(credentials: LoginCredentials): Promise<AuthResult> {
  // Simulate async network delay (remove when using Supabase)
  await new Promise((resolve) => setTimeout(resolve, 600));

  const match = MOCK_USERS.find(
    (u) =>
      u.username.toLowerCase() === credentials.username.toLowerCase() &&
      u.password === credentials.password
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
