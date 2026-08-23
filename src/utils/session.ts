import { User } from '../types/user.types';

export const SESSION_KEY = 'dreamjewels_session';

/**
 * 3 Months in milliseconds = 90 days * 24h * 60m * 60s * 1000ms
 */
export const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;

export interface StoredSession {
  user: User;
  createdAt: number;
  expiresAt: number;
  lastActiveAt?: number;
}

/**
 * Saves a user session to LocalStorage with a 3-month expiration timestamp.
 * Session persists when the user or admin closes the browser or application.
 */
export function saveSession(user: User): void {
  try {
    const now = Date.now();
    const sessionData: StoredSession = {
      user,
      createdAt: now,
      expiresAt: now + THREE_MONTHS_MS,
      lastActiveAt: now,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    // Clean up any legacy sessionStorage
    sessionStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Failed to save session to localStorage:', error);
  }
}

/**
 * Retrieves the current session from LocalStorage.
 * Validates expiration (max 3 months). If expired or invalid, clears it and returns null.
 */
export function getSession(): User | null {
  try {
    // 1. Check localStorage first
    let raw = localStorage.getItem(SESSION_KEY);

    // 2. Fallback / migration from legacy sessionStorage if present
    if (!raw) {
      const legacyRaw = sessionStorage.getItem(SESSION_KEY);
      if (legacyRaw) {
        raw = legacyRaw;
        sessionStorage.removeItem(SESSION_KEY);
      }
    }

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // Check if it's the structured StoredSession
    if (parsed && typeof parsed === 'object' && 'user' in parsed && 'expiresAt' in parsed) {
      const stored = parsed as StoredSession;
      const now = Date.now();

      // Check if session has exceeded the 3-month maximum duration
      if (now > stored.expiresAt) {
        console.warn('User session expired (max 3 months reached). Logging out.');
        clearSession();
        return null;
      }

      return stored.user;
    }

    // Handle legacy raw User object stored directly
    if (parsed && typeof parsed === 'object' && 'id' in parsed && 'role' in parsed) {
      const legacyUser = parsed as User;
      // Upgrade to 3-month format in localStorage
      saveSession(legacyUser);
      return legacyUser;
    }

    // Invalid format
    clearSession();
    return null;
  } catch {
    clearSession();
    return null;
  }
}

/**
 * Retrieves full session metadata (user, login time, expiry time).
 */
export function getSessionDetails(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'user' in parsed && 'expiresAt' in parsed) {
      return parsed as StoredSession;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clears the session from both LocalStorage and SessionStorage.
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
}

