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

async function removeInvalidToken(token, tokenPaths) {
  const paths = tokenPaths.get(token) || [];
  await Promise.all(paths.map((path) => db.ref(path).remove().catch((err) => {
    console.warn('Could not remove invalid FCM token:', path, err);
  })));
}

async function sendToToken(token, { title, body, data }) {
  try {
    await messaging.send({
      token,
      notification: { title, body },
      data,
    });
    return true;
  } catch (err) {
    if (err?.code === 'messaging/registration-token-not-registered' || err?.code === 'messaging/invalid-registration-token') {
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

async function collectTokensForUser(userId) {
  const tokenPaths = new Map();
  const tokens = [];
  const addToken = (token, path) => {
    if (!token || typeof token !== 'string') return;
    // Deduplicate: never add the same token string twice
    if (tokens.includes(token)) {
      if (!tokenPaths.has(token)) tokenPaths.set(token, []);
      tokenPaths.get(token).push(path);
      return;
    }
    tokens.push(token);
    if (!tokenPaths.has(token)) tokenPaths.set(token, []);
    tokenPaths.get(token).push(path);
  };

  // 1. Resolve canonical user ID from users collection
  //    (userId might be passed as username, email, or display name)
  let canonicalUserId = userId;
  const usersSnap = await db.ref('users').once('value');
  const usersVal = usersSnap.val();
  if (usersVal) {
    const users = Array.isArray(usersVal) ? usersVal : Object.values(usersVal);
    const matchedUser = users.find((u) =>
      u && (
        u.id === userId ||
        u.username?.toLowerCase() === userId.toLowerCase() ||
        u.email?.toLowerCase() === userId.toLowerCase() ||
        u.name?.toLowerCase() === userId.toLowerCase()
      )
    );
    if (matchedUser && matchedUser.id) {
      canonicalUserId = matchedUser.id;
    }
  }

  // 2. Always prefer the active session token — it represents the device
  //    the user is currently logged in on (single-device enforcement).
  //    Check both the raw userId and the resolved canonicalUserId.
  const idsToCheck = [...new Set([userId, canonicalUserId].filter(Boolean))];
  for (const id of idsToCheck) {
    const sessionSnap = await db.ref(`activeSessions/${id}/fcmToken`).once('value');
    const activeToken = sessionSnap.val();
    if (activeToken && typeof activeToken === 'string') {
      addToken(activeToken, `activeSessions/${id}/fcmToken`);
      // Found an active session token — stop here. We send to exactly ONE
      // device (the user's current active session) to prevent duplicates.
      return { tokens, tokenPaths };
    }
  }

  // 3. Fallback to stored userTokens ONLY if there is no active session token.
  //    Take the single most-recently-updated token to avoid spamming old devices.
  for (const id of idsToCheck) {
    const storedTokensSnap = await db.ref(`userTokens/${id}`).once('value');
    const storedTokens = storedTokensSnap.val() || {};
    const entries = Object.entries(storedTokens).map(([k, v]) => ({
      key: k,
      token: typeof v === 'string' ? v : v?.token,
      updatedAt: v?.updatedAt || ''
    })).filter(e => e.token);

    entries.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    if (entries.length > 0) {
      addToken(entries[0].token, `userTokens/${id}/${entries[0].key}`);
      // One token per user — stop after first match to avoid duplicates.
      return { tokens, tokenPaths };
    }
  }

  return { tokens, tokenPaths };
}

async function collectTokensForRole(role, senderId) {
  const usersSnap = await db.ref('users').once('value');
  const usersVal = usersSnap.val();
  if (!usersVal) return { tokens: [], tokenPaths: new Map() };

  const users = Array.isArray(usersVal) ? usersVal : Object.values(usersVal);
  const matchedIds = users
    .filter((u) => u && u.id !== senderId && (role === 'admin' ? ADMIN_INBOX_ROLES.includes(u.role) : u.role === role))
    .map((u) => u.id)
    .filter(Boolean);

  const tokenResults = await Promise.all(
    matchedIds.map((id) => collectTokensForUser(id))
  );
  const tokenPaths = new Map();
  const tokens = [];
  tokenResults.forEach((result) => {
    result.tokens.forEach((token) => tokens.push(token));
    result.tokenPaths.forEach((paths, token) => tokenPaths.set(token, paths));
  });
  return { tokens, tokenPaths };
}

exports.sendChatPush = onCall(async (request) => {
  const { senderId, targetUserId, targetRole, title, body, threadId, orderId, badgeCount } = request.data || {};

  if (!senderId || !title || !body || (!targetUserId && !targetRole)) {
    return { sent: 0, error: 'senderId, targetUserId or targetRole, plus title and body, are required.' };
  }

  const recipient = targetUserId
    ? await collectTokensForUser(targetUserId)
    : await collectTokensForRole(targetRole, senderId);

  // NOTE: recipients are already excluded-by-account-id above (collectTokensForRole
  // drops senderId from its candidate users; the targetUserId path only ever
  // looks up the one specific *other* account being messaged). We deliberately
  // do NOT also filter out any token that happens to match one of the sender's
  // own registered tokens: an FCM token is tied to the browser's Service
  // Worker installation, not to whichever account is logged into a given tab,
  // so testing admin and customer accounts in the same browser makes both
  // accounts register the identical token. Excluding "the sender's token"
  // then wrongly excluded the recipient's only token too, silently dropping
  // every push. The client already guards the sender from seeing their own
  // message as a push banner (see the isFromThisUser check in
  // ChatNotificationContext's foreground listener).
  const uniqueTokens = [...new Set(recipient.tokens)];

  console.log('[sendChatPush] Sender ID:', senderId);
  console.log('[sendChatPush] Receiver ID:', targetUserId || `role:${targetRole}`);
  console.log('[sendChatPush] Notification Target Token:', uniqueTokens);

  if (uniqueTokens.length === 0) {
    return { sent: 0 };
  }

  const effectiveRole = targetRole || (targetUserId ? 'customer' : 'admin');
  const targetUrl = effectiveRole === 'admin'
    ? (threadId ? `/dashboard/admin/chats?thread=${encodeURIComponent(threadId)}` : '/dashboard/admin/chats')
    : (threadId ? `/dashboard/customer/chat?thread=${encodeURIComponent(threadId)}` : '/dashboard/customer/chat');

  const data = {
    type: 'chat-message',
    threadId: threadId || '',
    orderId: orderId || '',
    role: effectiveRole,
    userId: targetUserId || '',
    senderId: senderId || '',
    badgeCount: badgeCount !== undefined && badgeCount !== null ? String(badgeCount) : '',
    url: targetUrl,
  };

  const response = await messaging.sendEachForMulticast({
    tokens: uniqueTokens,
    notification: { title, body },
    data,
    webpush: {
      headers: {
        Urgency: 'high',
      },
      notification: {
        title,
        body,
        icon: '/pwa-192x192-v4.png',
        badge: '/pwa-192x192-v4.png',
        tag: threadId ? `chat-${threadId}` : 'dream-jewels-chat',
        // renotify: false — same-tag notification replaces the previous banner
        // instead of stacking a new one, preventing duplicate lock-screen alerts.
        renotify: false,
        data: {
          url: targetUrl,
        },
      },
      fcmOptions: {
        link: targetUrl,
      },
    },
  });

  await Promise.all(response.responses.map(async (result, index) => {
    if (!result.success && (
      result.error?.code === 'messaging/registration-token-not-registered' ||
      result.error?.code === 'messaging/invalid-registration-token'
    )) {
      await removeInvalidToken(uniqueTokens[index], recipient.tokenPaths);
    }
  }));

  return { sent: response.successCount };
});
