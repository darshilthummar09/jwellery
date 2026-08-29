import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported, MessagePayload } from 'firebase/messaging';
import { ref, set } from 'firebase/database';
import { firebaseDatabase } from './firebase';

const firebaseConfig = {
  apiKey: "AIzaSyBZfAB3BGJLYUYaNmhDYYWfUoskO4U8N0k",
  authDomain: "dream-jeweles.firebaseapp.com",
  databaseURL: "https://dream-jeweles-default-rtdb.firebaseio.com",
  projectId: "dream-jeweles",
  storageBucket: "dream-jeweles.firebasestorage.app",
  messagingSenderId: "153082202942",
  appId: "1:153082202942:web:949dd3db3469330c54fa6f",
  measurementId: "G-CZH1C2FQV2"
};

// ─── App Icon Badging API ───────────────────────────────────────────────────

/**
 * Sets the numeric badge count on the PWA icon (Android, iOS 16.4+ PWA, Desktop Dock/Taskbar).
 */
export const setAppBadge = async (count: number): Promise<void> => {
  try {
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        await navigator.setAppBadge(count);
      } else {
        await navigator.clearAppBadge();
      }
    }

    // Also notify active service worker if registered
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: count > 0 ? 'SET_BADGE' : 'CLEAR_BADGE',
        count,
      });
    }
  } catch (err) {
    console.debug('Badge API not supported or restricted:', err);
  }
};

/**
 * Clears the badge from the PWA app icon.
 */
export const clearAppBadge = async (): Promise<void> => {
  try {
    if ('clearAppBadge' in navigator) {
      await navigator.clearAppBadge();
    }

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_BADGE' });
    }
  } catch (err) {
    console.debug('Clear badge error:', err);
  }
};

// ─── Notification Permissions & Service Worker Registration ─────────────────

export const isPushSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
};

export const getPushPermissionState = (): NotificationPermission | 'unsupported' => {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
};

/**
 * Registers the Service Worker and requests Web Push permissions.
 * Saves the FCM Device Token in Firebase under /userTokens/{userId}/
 */
export const requestPushPermission = async (userId?: string): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> => {
  if (!isPushSupported()) {
    return { success: false, error: 'Push notifications are not supported on this browser or device.' };
  }

  try {
    // 1. Request Browser / OS Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission was denied or dismissed.' };
    }

    // 2. Register Service Worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    await navigator.serviceWorker.ready;

    // 3. Initialize Firebase Messaging
    const supported = await isSupported();
    if (!supported) {
      return { success: true, error: 'Standard notifications enabled (Firebase messaging not supported in this client environment).' };
    }

    const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    // 4. Retrieve FCM Device Token
    let token: string | undefined;
    try {
      token = await getToken(messaging, {
        serviceWorkerRegistration: registration,
      });
    } catch (e: any) {
      console.warn('FCM getToken notice:', e?.message || e);
    }

    // 5. Store Token in Firebase Realtime Database
    if (token && userId && firebaseDatabase) {
      const sanitizedKey = btoa(token).replace(/[=/+]/g, '_').slice(0, 60);
      const tokenRef = ref(firebaseDatabase, `userTokens/${userId}/${sanitizedKey}`);
      await set(tokenRef, {
        token,
        userId,
        userAgent: navigator.userAgent,
        updatedAt: new Date().toISOString(),
        platform: /iPhone|iPad|iPod/i.test(navigator.userAgent)
          ? 'iOS'
          : /Android/i.test(navigator.userAgent)
            ? 'Android'
            : 'Desktop/Web',
      });
    }

    return { success: true, token };
  } catch (err: any) {
    console.error('Error enabling push notifications:', err);
    return { success: false, error: err?.message || 'Failed to enable notifications.' };
  }
};

/**
 * Listens for incoming push notifications while the app is OPEN in the foreground.
 */
export const registerForegroundPushListener = (
  onMessageReceived: (payload: MessagePayload) => void
): (() => void) => {
  if (!isPushSupported()) return () => {};

  let unsubscribe: (() => void) | null = null;

  isSupported().then((supported) => {
    if (supported) {
      const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
      const messaging = getMessaging(app);
      unsubscribe = onMessage(messaging, (payload) => {
        console.log('[NotificationService] Foreground message received:', payload);
        onMessageReceived(payload);
      });
    }
  }).catch(() => {});

  return () => {
    if (unsubscribe) unsubscribe();
  };
};

/**
 * Triggers a local system notification banner immediately (if permission is granted).
 */
export const showLocalNotification = (title: string, options?: NotificationOptions) => {
  if (isPushSupported() && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            icon: '/pwa-192x192-v4.png',
            badge: '/pwa-192x192-v4.png',
            ...options,
          });
        });
      } else {
        new Notification(title, {
          icon: '/pwa-192x192-v4.png',
          ...options,
        });
      }
    } catch (e) {
      console.warn('Could not display local notification:', e);
    }
  }
};
