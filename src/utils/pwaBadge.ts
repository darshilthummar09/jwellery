/**
 * W3C Badging API utility for PWA Home Screen Icon Badge (iOS, Android, Windows, Mac).
 * Automatically updates the red badge number on the user's home screen PWA icon.
 */

export async function setPwaAppBadge(count: number): Promise<void> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

  // 1. Native W3C App Badging API (PWA Home Screen Icon Badge on iOS 16.4+, Android, Chrome/Edge/macOS)
  if ('setAppBadge' in navigator && typeof (navigator as any).setAppBadge === 'function') {
    try {
      if (count > 0) {
        await (navigator as any).setAppBadge(count);
      } else {
        if ('clearAppBadge' in navigator && typeof (navigator as any).clearAppBadge === 'function') {
          await (navigator as any).clearAppBadge();
        }
      }
    } catch {
      // Ignored if permission not granted or unsupported
    }
  }

  // 2. Favicon / Document Title fallback indicator: (3) Dream Jewels
  try {
    const baseTitle = 'Dream Jewels';
    if (count > 0) {
      document.title = `(${count}) ${baseTitle}`;
    } else if (document.title.startsWith('(')) {
      document.title = baseTitle;
    }
  } catch {
    // ignore
  }
}

export async function clearPwaAppBadge(): Promise<void> {
  await setPwaAppBadge(0);
}

/**
 * Requests Notification permission (required by iOS Safari PWA on Home Screen to show native icon badges)
 */
export async function requestBadgePermission(): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch {
      // ignore
    }
  }
}
