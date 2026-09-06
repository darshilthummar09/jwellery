/**
 * Dream Jewels Cloud Functions
 *
 * Two functions, both needed because the browser can never hold the
 * credentials required to call FCM's send API directly:
 *
 *  - notifyDeviceTakeover: fires when a login on a new device overwrites
 *    /activeSessions/{userId}, and pushes a "signed in elsewhere" notice to
 *    whichever device just got logged out.
 *  - sendChatPush: callable from the client right when an order-chat message
 *    is sent, pushing a real notification (+ app icon badge count) to the
 *    other party's device.
 *
 * The databaseURL is passed explicitly to initializeApp() below rather than
 * relying on Cloud Functions' auto-injected default config — v2 RTDB
 * triggers bind to a specific instance, and a silently-wrong/unset instance
 * is the most common reason a trigger deploys successfully but never fires.
 */

const { onValueWritten } = require('firebase-functions/v2/database');
const { onCall } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { getMessaging } = require('firebase-admin/messaging');

const DATABASE_URL = 'https://dream-jeweles-default-rtdb.firebaseio.com';

initializeApp({ databaseURL: DATABASE_URL });

const db = getDatabase();
const messaging = getMessaging();

/** Sends one FCM message and swallows "token no longer valid" errors — nothing to clean up automatically here since the token will simply be replaced next time that device re-enables push. */
async function sendToToken(token, { title, body, data }) {
  try {
    await messaging.send({
      token,
      notification: { title, body },
      data,
    });
    return true;
  } catch (err) {
    if (err?.code === 'messaging/registration-token-not-registered') {
      console.warn('Skipping push: token no longer registered.', token.slice(0, 12));
    } else {
      console.error('Failed to send push:', err);
    }
    return false;
  }
}

// ─── Single-device login enforcement ──────────────────────────────────────

exports.notifyDeviceTakeover = onValueWritten(
  { ref: '/activeSessions/{userId}', instance: 'dream-jeweles-default-rtdb' },
  async (event) => {
    const before = event.data.before.val();
    const after = event.data.after.val();

    // First-ever login for this account — nothing to notify.
    if (!before) return;

    // Same sessionId means this write was just an fcmToken refresh
    // (updateSessionFcmToken), not an actual takeover by another device.
    if (!after || before.sessionId === after.sessionId) return;

    if (!before.fcmToken) return;

    const deviceLabel = after.device || 'another device';
    await sendToToken(before.fcmToken, {
      title: 'New Sign-in Detected',
      body: `Your Dream Jewels account was just signed in from ${deviceLabel}. You've been logged out here.`,
      data: { type: 'session-takeover' },
    });
  }
);

// ─── Order-chat push notifications ────────────────────────────────────────

/** Roles that share the single "admin" inbox in the app today (see AppRouter.tsx). */
const ADMIN_INBOX_ROLES = ['admin', 'super-admin'];

async function collectTokensForRole(role) {
  const usersSnap = await db.ref('users').once('value');
  const usersVal = usersSnap.val();
  if (!usersVal) return [];

  const users = Array.isArray(usersVal) ? usersVal : Object.values(usersVal);
  const matchedIds = users
    .filter((u) => u && (role === 'admin' ? ADMIN_INBOX_ROLES.includes(u.role) : u.role === role))
    .map((u) => u.id)
    .filter(Boolean);

  const sessions = await Promise.all(
    matchedIds.map((id) => db.ref(`activeSessions/${id}/fcmToken`).once('value'))
  );

  return sessions.map((snap) => snap.val()).filter(Boolean);
}

async function collectTokenForUser(userId) {
  const snap = await db.ref(`activeSessions/${userId}/fcmToken`).once('value');
  const token = snap.val();
  return token ? [token] : [];
}

exports.sendChatPush = onCall(async (request) => {
  const { targetUserId, targetRole, title, body, threadId, orderId, badgeCount } = request.data || {};

  if (!title || !body || (!targetUserId && !targetRole)) {
    return { sent: 0, error: 'targetUserId or targetRole, plus title and body, are required.' };
  }

  const tokens = targetUserId
    ? await collectTokenForUser(targetUserId)
    : await collectTokensForRole(targetRole);

  const uniqueTokens = [...new Set(tokens)];
  if (uniqueTokens.length === 0) {
    return { sent: 0 };
  }

  const data = {
    type: 'chat-message',
    threadId: threadId || '',
    orderId: orderId || '',
    role: targetRole || '',
    userId: targetUserId || '',
    badgeCount: badgeCount !== undefined && badgeCount !== null ? String(badgeCount) : '',
  };

  const response = await messaging.sendEachForMulticast({
    tokens: uniqueTokens,
    notification: { title, body },
    data,
  });

  return { sent: response.successCount };
});
