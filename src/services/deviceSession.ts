/**
 * deviceSession.ts
 *
 * Enforces "only one active device per account". Each login claims
 * `/activeSessions/{userId}` in Firebase Realtime Database with a fresh
 * sessionId; whichever device's sessionId stops matching what's stored there
 * has been superseded by a newer login elsewhere and should log itself out.
 *
 * The actual "notify the old device" push (for when it's backgrounded/closed,
 * not just watching this listener) is sent server-side by the
 * `notifyDeviceTakeover` Cloud Function, triggered off the same RTDB write —
 * see functions/index.js. This file only owns the client's read/write side.
 */

import { onValue, ref, set, update } from 'firebase/database';
import { firebaseDatabase, isFirebaseConfigured } from './firebase';

export interface ActiveSession {
  sessionId: string;
  device: string;
  loginAt: number;
  fcmToken: string | null;
}

/** Builds a short human-readable device label for display in the takeover notification. */
function getDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'another device';
  const ua = navigator.userAgent || '';
  const platform = /iPhone|iPad|iPod/i.test(ua)
    ? 'iOS'
    : /Android/i.test(ua)
      ? 'Android'
      : /Windows/i.test(ua)
        ? 'Windows'
        : /Macintosh/i.test(ua)
          ? 'Mac'
          : 'Desktop';
  const browser = /Edg\//i.test(ua)
    ? 'Edge'
    : /Chrome\//i.test(ua)
      ? 'Chrome'
      : /Firefox\//i.test(ua)
        ? 'Firefox'
        : /Safari\//i.test(ua)
          ? 'Safari'
          : 'a browser';
  return `${browser} on ${platform}`;
}

/**
 * Claims this device as the account's single active session, overwriting
 * whatever device was previously logged in. Best-effort: never throws, so a
 * flaky/offline Firebase connection never blocks login.
 */
export async function claimSession(userId: string, sessionId: string): Promise<void> {
  if (!isFirebaseConfigured || !firebaseDatabase) return;
  try {
    const session: ActiveSession = {
      sessionId,
      device: getDeviceLabel(),
      loginAt: Date.now(),
      fcmToken: null,
    };
    await set(ref(firebaseDatabase, `activeSessions/${userId}`), session);
  } catch (err) {
    console.warn('claimSession failed (continuing login anyway):', err);
  }
}

/**
 * Records this device's FCM token against its active session, so a future
 * takeover on another device can push a "signed in elsewhere" notice here.
 */
export async function updateSessionFcmToken(userId: string, token: string): Promise<void> {
  if (!isFirebaseConfigured || !firebaseDatabase) return;
  try {
    await update(ref(firebaseDatabase, `activeSessions/${userId}`), { fcmToken: token });
  } catch (err) {
    console.warn('updateSessionFcmToken failed:', err);
  }
}

/**
 * Watches this account's active session. Calls onKicked() the moment the
 * remote sessionId no longer matches localSessionId — i.e. another device
 * has logged into this account and taken over. Returns an unsubscribe fn.
 */
export function subscribeToSessionTakeover(
  userId: string,
  localSessionId: string | null,
  onKicked: () => void
): () => void {
  if (!isFirebaseConfigured || !firebaseDatabase || !localSessionId) {
    return () => {};
  }

  const sessionRef = ref(firebaseDatabase, `activeSessions/${userId}`);
  const unsubscribe = onValue(sessionRef, (snapshot) => {
    const remote = snapshot.val() as ActiveSession | null;
    if (remote && remote.sessionId && remote.sessionId !== localSessionId) {
      onKicked();
    }
  });

  return () => unsubscribe();
}
