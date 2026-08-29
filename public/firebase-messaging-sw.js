/* eslint-disable no-undef */
// Service Worker for Background Push Notifications & App Badging

// Firebase Compat Libraries for Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBZfAB3BGJLYUYaNmhDYYWfUoskO4U8N0k",
  authDomain: "dream-jeweles.firebaseapp.com",
  databaseURL: "https://dream-jeweles-default-rtdb.firebaseio.com",
  projectId: "dream-jeweles",
  storageBucket: "dream-jeweles.firebasestorage.app",
  messagingSenderId: "153082202942",
  appId: "1:153082202942:web:949dd3db3469330c54fa6f"
};

firebase.initializeApp(firebaseConfig);

let messaging = null;
try {
  messaging = firebase.messaging();
} catch (e) {
  console.warn('Firebase messaging in service worker initialization error:', e);
}

// 1. Listen for background push events from FCM when app is completely closed
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'Dream Jewels';
    const notificationBody = payload.notification?.body || payload.data?.body || 'You have a new update.';
    const badgeCount = parseInt(payload.data?.badgeCount || payload.data?.unreadCount, 10);
    const targetUrl = payload.data?.url || '/';

    const notificationOptions = {
      body: notificationBody,
      icon: '/pwa-192x192-v4.png',
      badge: '/pwa-192x192-v4.png',
      vibrate: [200, 100, 200],
      tag: payload.data?.tag || 'dream-jewels-notification',
      renotify: true,
      data: {
        url: targetUrl,
        badgeCount: !isNaN(badgeCount) ? badgeCount : undefined
      }
    };

    const actions = [
      self.registration.showNotification(notificationTitle, notificationOptions)
    ];

    // Set or update the app icon badge count on the device Home Screen
    if (!isNaN(badgeCount) && 'setAppBadge' in navigator) {
      actions.push(navigator.setAppBadge(badgeCount).catch(() => {}));
    }

    return Promise.all(actions);
  });
}

// 2. Generic Push event fallback (for standard Web Push payloads)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const notificationTitle = data.title || data.notification?.title || 'Dream Jewels';
    const notificationOptions = {
      body: data.body || data.notification?.body || 'New notification',
      icon: '/pwa-192x192-v4.png',
      badge: '/pwa-192x192-v4.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || data.data?.url || '/'
      }
    };

    const count = parseInt(data.badgeCount || data.data?.badgeCount, 10);

    event.waitUntil(
      Promise.all([
        self.registration.showNotification(notificationTitle, notificationOptions),
        !isNaN(count) && 'setAppBadge' in navigator 
          ? navigator.setAppBadge(count).catch(() => {}) 
          : Promise.resolve()
      ])
    );
  } catch (err) {
    console.warn('Push event payload parse fallback:', err);
  }
});

// 3. User taps on the push notification banner
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            if (targetUrl && client.navigate) {
              client.navigate(targetUrl);
            }
            return;
          }
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// 4. Listen for messages from foreground app (e.g. to update badge or sync)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_BADGE') {
    const count = Number(event.data.count);
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        navigator.setAppBadge(count).catch(() => {});
      } else {
        navigator.clearAppBadge().catch(() => {});
      }
    }
  } else if (event.data && event.data.type === 'CLEAR_BADGE') {
    if ('clearAppBadge' in navigator) {
      navigator.clearAppBadge().catch(() => {});
    }
  }
});
