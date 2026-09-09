/**
 * pushChat.ts
 *
 * Client-side wrapper around the `sendChatPush` Cloud Function (functions/index.js).
 * Fire-and-forget: a push failing (offline, function not yet deployed, no
 * token on file for the recipient, etc.) must never block sending the chat
 * message itself.
 */

import { httpsCallable } from 'firebase/functions';
import { firebaseFunctions } from './firebase';

export interface ChatPushPayload {
  /** Authenticated sender; the server excludes this user's tokens. */
  senderId: string;
  /** Push a specific user's current device (e.g. a single customer). */
  targetUserId?: string;
  /** Push every currently-logged-in device for a role's shared inbox (e.g. 'admin') or target role. */
  targetRole?: 'admin' | 'customer' | 'designer';
  title: string;
  body: string;
  threadId?: string;
  orderId?: string;
  /** Accurate recipient unread count, so the OS/PWA icon badge stays correct even if their app is fully closed. */
  badgeCount?: number;
}

export async function sendChatPushNotification(payload: ChatPushPayload): Promise<void> {
  if (!firebaseFunctions) return;
  try {
    const callable = httpsCallable(firebaseFunctions, 'sendChatPush');
    await callable(payload);
  } catch (err) {
    console.warn('sendChatPushNotification failed (message was still sent):', err);
  }
}
