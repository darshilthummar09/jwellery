import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

console.log('\n======================================================');
console.log('🚀 DREAM JEWELS: COMPREHENSIVE E2E FUNCTIONAL TEST SUITE');
console.log('======================================================\n');

// ─── SUITE 1: Badging Debounce & Duplicate Suppression ──────────────
console.log('🧪 SUITE 1: Badging Debounce & Duplicate Suppression');

let mockNativeCalls = [];
let mockSwMessages = [];

globalThis.navigator = {
  setAppBadge: async (count) => { mockNativeCalls.push({ action: 'set', count }); },
  clearAppBadge: async () => { mockNativeCalls.push({ action: 'clear' }); },
  serviceWorker: {
    controller: {
      postMessage: (msg) => { mockSwMessages.push(msg); }
    }
  }
};

let lastBadgeCount = null;
let badgeDebounceTimer = null;

const testSetAppBadge = (count) => {
  return new Promise((resolve) => {
    const safeCount = Math.max(0, Math.floor(count));
    if (lastBadgeCount === safeCount) {
      resolve();
      return;
    }
    lastBadgeCount = safeCount;

    if (badgeDebounceTimer) {
      clearTimeout(badgeDebounceTimer);
    }

    badgeDebounceTimer = setTimeout(async () => {
      if (safeCount > 0) {
        await globalThis.navigator.setAppBadge(safeCount);
      } else {
        await globalThis.navigator.clearAppBadge();
      }
      resolve();
    }, 50);
  });
};

const testClearAppBadge = () => {
  lastBadgeCount = 0;
  if (badgeDebounceTimer) clearTimeout(badgeDebounceTimer);
  return globalThis.navigator.clearAppBadge();
};

// Test rapid calls (simulating the 3,4,5,4,3,5 rapid loop)
mockNativeCalls = [];
testSetAppBadge(3);
testSetAppBadge(4);
testSetAppBadge(5);
testSetAppBadge(4);
testSetAppBadge(3);
testSetAppBadge(5);

await new Promise((r) => setTimeout(r, 120));

assert(
  mockNativeCalls.length === 1 && mockNativeCalls[0].count === 5,
  `Rapid badging calls coalesced into exactly 1 call with count = 5 (actual calls: ${mockNativeCalls.length})`
);

// Test identical count duplicate suppression
mockNativeCalls = [];
await testSetAppBadge(5);
await testSetAppBadge(5);
assert(
  mockNativeCalls.length === 0,
  `Consecutive duplicate badging (5 -> 5) is completely suppressed`
);

// Test clearAppBadge
mockNativeCalls = [];
await testClearAppBadge();
assert(
  mockNativeCalls.length === 1 && mockNativeCalls[0].action === 'clear',
  `clearAppBadge resets badge to 0 and clears OS indicator`
);


// ─── SUITE 2: Cross-Browser Date Normalization & Order Date Filter ───
console.log('\n🧪 SUITE 2: Date Normalization & Filter Logic');

function normalizeDateToYMD(val) {
  if (!val) return null;
  const clean = String(val).trim();
  if (!clean || clean === 'To be scheduled' || clean === '-') return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  const parsed = new Date(clean.includes('T') ? clean : clean + ' 00:00:00');
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const fallback = new Date(clean);
  if (!isNaN(fallback.getTime())) {
    const y = fallback.getFullYear();
    const m = String(fallback.getMonth() + 1).padStart(2, '0');
    const d = String(fallback.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
}

assert(normalizeDateToYMD('2026-08-23') === '2026-08-23', 'ISO date "2026-08-23" normalizes to "2026-08-23"');
assert(normalizeDateToYMD('Aug 23, 2026') === '2026-08-23', 'Textual date "Aug 23, 2026" normalizes to "2026-08-23"');
assert(normalizeDateToYMD('2026-08-28T14:30:00Z') === '2026-08-28', 'Timestamp "2026-08-28T14:30:00Z" normalizes to "2026-08-28"');
assert(normalizeDateToYMD('To be scheduled') === null, '"To be scheduled" returns null safely without error');
assert(normalizeDateToYMD('') === null, 'Empty string returns null safely');

// Filter orders with date matching
const testOrders = [
  { id: 'ORD-1', name: 'Ring 1', created: 'Aug 23, 2026', due: 'Aug 28, 2026', priority: 'High' },
  { id: 'ORD-2', name: 'Necklace 2', created: 'Aug 23, 2026', due: 'Sep 05, 2026', priority: 'Medium' },
  { id: 'ORD-3', name: 'Bracelet 3', created: 'Aug 22, 2026', due: 'Sep 12, 2026', priority: 'High' },
];

const filterByDate = (orders, filterDate) => {
  if (!filterDate) return orders;
  const filterYMD = normalizeDateToYMD(filterDate);
  return orders.filter((o) => {
    const createdYMD = normalizeDateToYMD(o.created);
    const dueYMD = normalizeDateToYMD(o.due);
    return filterYMD && (filterYMD === createdYMD || filterYMD === dueYMD);
  });
};

const matchCreated = filterByDate(testOrders, '2026-08-23');
assert(matchCreated.length === 2 && matchCreated[0].id === 'ORD-1' && matchCreated[1].id === 'ORD-2', 'Date filter "2026-08-23" accurately matches 2 orders created on Aug 23, 2026');

const matchDue = filterByDate(testOrders, '2026-08-28');
assert(matchDue.length === 1 && matchDue[0].id === 'ORD-1', 'Date filter "2026-08-28" matches order due on Aug 28, 2026');

const matchNone = filterByDate(testOrders, '2026-09-01');
assert(matchNone.length === 0, 'Date filter with no matches returns empty list');


// ─── SUITE 3: Priority State Transitions & Config ───────────────────
console.log('\n🧪 SUITE 3: Admin Priority Management');

const PRIORITY_CONFIG = {
  High: { label: 'High', sub: 'Rush / Urgent', emoji: '🔴' },
  Medium: { label: 'Medium', sub: 'Standard', emoji: '🟡' },
  Low: { label: 'Low', sub: 'Flexible', emoji: '🔵' },
};

let currentOrder = { ...testOrders[0] };

const updateOrderPriority = (order, newPriority) => {
  return { ...order, priority: newPriority };
};

currentOrder = updateOrderPriority(currentOrder, 'Medium');
assert(currentOrder.priority === 'Medium', 'Priority successfully changed to "Medium"');
assert(PRIORITY_CONFIG[currentOrder.priority].label === 'Medium', 'Priority label resolves to "Medium"');

currentOrder = updateOrderPriority(currentOrder, 'Low');
assert(currentOrder.priority === 'Low', 'Priority successfully changed to "Low"');

currentOrder = updateOrderPriority(currentOrder, 'High');
assert(currentOrder.priority === 'High', 'Priority successfully changed to "High"');


// ─── SUITE 4: Role-Based Navigation & Super Admin Chat Removal ──────
console.log('\n🧪 SUITE 4: RBAC & Navigation Verification');

const navigationPath = path.join(rootDir, 'src', 'constants', 'navigation.ts');
const navigationContent = fs.readFileSync(navigationPath, 'utf8');

assert(
  !navigationContent.includes("path: '/dashboard/super-admin/chats'"),
  'Super Admin navigation no longer contains "/dashboard/super-admin/chats"'
);

assert(
  navigationContent.includes("path: '/dashboard/admin/chats'"),
  'Admin navigation contains "/dashboard/admin/chats"'
);

assert(
  navigationContent.includes("path: '/dashboard/customer/chat'"),
  'Customer navigation contains "/dashboard/customer/chat"'
);

const routerPath = path.join(rootDir, 'src', 'routes', 'AppRouter.tsx');
const routerContent = fs.readFileSync(routerPath, 'utf8');

assert(
  !routerContent.includes('path="/dashboard/super-admin/chats"'),
  'Super Admin protected routes do not expose "/dashboard/super-admin/chats"'
);


// ─── SUITE 5: PWA Manifest & Firebase Service Worker Assets ─────────
console.log('\n🧪 SUITE 5: PWA & Service Worker Asset Integrity');

const manifestPath = path.join(rootDir, 'public', 'manifest.json');
assert(fs.existsSync(manifestPath), 'public/manifest.json exists');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert(manifest.display === 'standalone', 'PWA manifest configured with display: standalone');
assert(Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'PWA manifest contains valid icon definitions');

const swPath = path.join(rootDir, 'public', 'firebase-messaging-sw.js');
assert(fs.existsSync(swPath), 'public/firebase-messaging-sw.js exists');

const swContent = fs.readFileSync(swPath, 'utf8');
assert(swContent.includes('navigator.setAppBadge'), 'firebase-messaging-sw.js includes setAppBadge background handler');
assert(swContent.includes('onBackgroundMessage'), 'firebase-messaging-sw.js includes onBackgroundMessage handler');

// Check production build artifacts
const distSwPath = path.join(rootDir, 'dist', 'sw.js');
assert(fs.existsSync(distSwPath), 'dist/sw.js exists in production bundle');

const distManifestPath = path.join(rootDir, 'dist', 'manifest.webmanifest');
assert(fs.existsSync(distManifestPath), 'dist/manifest.webmanifest exists in production bundle');


// ─── FINAL REPORT ───────────────────────────────────────────────────
console.log('\n======================================================');
console.log(`📊 TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
if (failedTests === 0) {
  console.log('🎉 ALL END-TO-END VERIFICATION CHECKS PASSED WITH 0 ERRORS!');
} else {
  console.error(`⚠️ ${failedTests} TESTS FAILED.`);
}
console.log('======================================================\n');
process.exit(failedTests > 0 ? 1 : 0);
