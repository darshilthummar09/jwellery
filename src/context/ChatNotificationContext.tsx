import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onValue, ref, set, get } from 'firebase/database';
import { firebaseDatabase, isFirebaseConfigured } from '../services/firebase';
import {
  setAppBadge,
  clearAppBadge,
  requestPushPermission,
  getPushPermissionState,
  registerForegroundPushListener,
  showLocalNotification,
} from '../services/notificationService';
import { sendChatPushNotification } from '../services/pushChat';
import { useAuth } from '../hooks/useAuth';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChatAttachment {
  id: number;
  name: string;
  size: number;
  type: string;
  url: string;
  kind: 'image' | 'video' | 'file';
}

export interface UploadedOrderImage {
  id: number;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface ChatMessage {
  id: number;
  from: 'customer' | 'admin' | 'designer';
  senderName: string;
  text: string;
  time: string;
  attachments?: ChatAttachment[];
  seenBy?: Array<'admin' | 'customer' | 'designer'>;
}

export interface ChatThread {
  id: string;
  orderId?: string;
  orderName?: string;
  customerName: string;
  customerId: string;
  participantRole?: 'customer' | 'designer';
  messages: ChatMessage[];
  unread: number;
  customerUnread: number;
  lastMessage: string;
  lastTime: string;
}

export interface AppNotification {
  id: number;
  role: 'customer' | 'admin' | 'designer';
  userId?: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type?: 'order' | 'chat' | 'system';
  orderId?: string;
  threadId?: string;
}

export interface OrderAttachment {
  dataUrl: string;
  name: string;
  type: string;
  size: number;
}

export interface OrderDetails {
  name: string;
  category: string;
  metal: string;
  karat: string;
  size?: string;
  weight?: string;
  budget: string;
  notes?: string;
  deliveryDate?: string;
  /** @deprecated use attachments[] instead */
  hasImage?: boolean;
  /** @deprecated use attachments[] instead */
  image?: string;
  attachments?: OrderAttachment[];
  imageName?: string;
  images?: UploadedOrderImage[];
}

export type OrderStatus = 'Pending Approval' | 'Approved' | 'Rejected' | 'In Progress' | 'Review' | 'Completed';

export interface Order {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  designerName: string;
  status: OrderStatus;
  due: string;
  budget: string;
  priority: 'High' | 'Medium' | 'Low';
  category: string;
  metal: string;
  karat: string;
  size?: string;
  weight?: string;
  notes?: string;
  image?: string;
  images?: UploadedOrderImage[];
  created: string;
  progress: string;
  rejectionReason?: string;
}

interface ChatNotificationContextValue {
  threads: ChatThread[];
  orders: Order[];
  notifications: AppNotification[];
  sendCustomerMessage: (
    customerId: string,
    customerName: string,
    text: string,
    optionalThreadId?: string,
    attachments?: ChatAttachment[]
  ) => void;
  sendDesignerMessage: (threadId: string, designerName: string, text: string) => void;
  sendAdminMessage: (threadId: string, text: string, attachments?: ChatAttachment[]) => void;
  markThreadRead: (threadId: string, as: 'admin' | 'customer' | 'designer') => void;
  getThreadByCustomer: (customerId: string) => ChatThread | undefined;
  getDesignerThread: (designerName: string) => ChatThread | undefined;
  ensureDesignerThread: (designerName: string, orderName?: string, designerId?: string) => string;
  ensureThreadForOrder: (order: Order) => string;
  createThreadForOrder: (customerId: string, customerName: string, order: OrderDetails) => void;
  upsertOrder: (order: Order) => void;
  approveOrder: (orderId: string) => void;
  rejectOrder: (orderId: string, reason?: string) => void;
  deleteOrder: (orderId: string) => void;
  addNotification: (n: Omit<AppNotification, 'id'> | Array<Omit<AppNotification, 'id'>>) => void;
  markAllNotificationsRead: (role: 'customer' | 'admin' | 'designer', userId?: string) => void;
  markNotificationRead: (id: number) => void;
  clearAllNotifications: (role?: 'customer' | 'admin' | 'designer', userId?: string) => void;
  getUnreadCount: (role: 'customer' | 'admin' | 'designer', userId?: string) => number;
  getChatUnreadCount: (role: 'customer' | 'admin' | 'designer', userId?: string) => number;
  triggerTestNotification: (
    type: 'order_created' | 'order_approved' | 'order_rejected' | 'order_progress' | 'chat_message' | 'system_alert'
  ) => void;
  seedOrderTestChats: () => void;
  deleteMessage: (threadId: string, messageId: number) => void;
  deleteThread: (threadId: string) => void;
  enablePushNotifications: (userId?: string) => Promise<{ success: boolean; error?: string }>;
  pushPermission: NotificationPermission | 'unsupported';
  setAppBadgeCount: (count: number) => Promise<void>;
  clearAppBadgeCount: () => Promise<void>;
  users: User[];
  addUser: (user: User & { password?: string }) => void;
  deleteUser: (userId: string) => void;
}

const ChatNotificationContext = createContext<ChatNotificationContextValue | null>(null);
const CHAT_STORAGE_KEY = 'dream-jewels-chat-state';
const CHAT_CHANNEL_NAME = 'dream-jewels-live-chat';

// ─── Seed data ────────────────────────────────────────────────────────────────

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_THREADS: ChatThread[] = [];

const DEFAULT_DESIGNER_NAME = 'Riya Sharma';

const createDesignerThreadId = (designerName: string) =>
  `designer-${designerName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

const formatLastMessage = (text: string, attachments?: ChatAttachment[]) => {
  if (text.trim()) return text.trim();
  if (!attachments || attachments.length === 0) return '';
  return attachments.length === 1 ? `Sent ${attachments[0].name}` : `Sent ${attachments.length} files`;
};

import { MOCK_USERS } from '../data/mock-users';
import { User } from '../types/user.types';

interface StoredChatState {
  threads?: ChatThread[] | Record<string, ChatThread>;
  orders?: Order[] | Record<string, Order>;
  projects?: Order[] | Record<string, Order>;
  users?: User[] | Record<string, User>;
  notifications?: AppNotification[] | Record<string, AppNotification>;
  notifCounter?: number;
}

/** Parses an orders collection from Firebase or LocalStorage whether it's an Array or Object map */
function parseOrdersFromState(raw: any): Order[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'object') {
    return Object.values(raw).filter(Boolean) as Order[];
  }
  return [];
}

/** Parses a users collection from Firebase or LocalStorage whether it's an Array or Object map */
function parseUsersFromState(raw: any): User[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'object') {
    return Object.values(raw).filter(Boolean) as User[];
  }
  return [];
}

/** Parses a threads collection from Firebase or LocalStorage whether it's an Array or Object map */
function parseThreadsFromState(raw: any): ChatThread[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter(Boolean).map((t: any) => ({
      ...t,
      messages: Array.isArray(t.messages)
        ? t.messages.filter(Boolean)
        : typeof t.messages === 'object'
          ? Object.values(t.messages).filter(Boolean)
          : [],
    }));
  }
  if (typeof raw === 'object') {
    return Object.values(raw).filter(Boolean).map((t: any) => ({
      ...t,
      messages: Array.isArray(t.messages)
        ? t.messages.filter(Boolean)
        : typeof t.messages === 'object'
          ? Object.values(t.messages).filter(Boolean)
          : [],
    })) as ChatThread[];
  }
  return [];
}

function parseNotificationsFromState(raw: any): AppNotification[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'object') return Object.values(raw).filter(Boolean) as AppNotification[];
  return [];
}

function readOrders(state: StoredChatState): Order[] {
  return parseOrdersFromState(state.orders ?? state.projects);
}

function loadStoredChatState(): StoredChatState | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredChatState;
  } catch {
    return null;
  }
}

function parseStoredChatState(raw: string | null): StoredChatState | null {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredChatState;
  } catch {
    return null;
  }
}

function isChatNotification(notification: AppNotification) {
  const title = notification.title.toLowerCase();
  return title.includes('message') || title.includes('order') || title.includes('chat');
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [];

function removeDeletedSeedData(state: StoredChatState | null): StoredChatState | null {
  if (!state) return null;
  return state;
}

/** Merges two message arrays by id so a concurrent write from another device can't discard either side's messages. */
function mergeMessages(local: ChatMessage[], remote: ChatMessage[]): ChatMessage[] {
  const byId = new Map<number, ChatMessage>();
  remote.forEach((m) => byId.set(m.id, m));
  local.forEach((m) => byId.set(m.id, m));
  return Array.from(byId.values()).sort((a, b) => a.id - b.id);
}

/**
 * Merges two thread arrays by id, unioning each shared thread's messages
 * instead of a blind overwrite. Every device debounce-writes its ENTIRE local
 * `threads` snapshot to Firebase; if two devices write around the same time,
 * whichever write lands last used to silently erase whatever message the
 * other device had just added (the "I send a message but it's not stored"
 * bug) since there was no merge, only last-write-wins.
 */
function mergeThreads(local: ChatThread[], remote: ChatThread[]): ChatThread[] {
  const byId = new Map<string, ChatThread>();
  remote.forEach((t) => byId.set(t.id, t));
  local.forEach((t) => {
    const existing = byId.get(t.id);
    byId.set(t.id, existing
      ? { ...existing, ...t, messages: mergeMessages(t.messages, existing.messages) }
      : t);
  });
  return Array.from(byId.values());
}

/** Merges two notification arrays by id for the same reason as mergeThreads. */
function mergeNotifications(local: AppNotification[], remote: AppNotification[]): AppNotification[] {
  const byId = new Map<number, AppNotification>();
  remote.forEach((n) => byId.set(n.id, n));
  local.forEach((n) => byId.set(n.id, n));
  return Array.from(byId.values()).sort((a, b) => b.id - a.id);
}

/** Strips undefined properties so Firebase Realtime Database set() never rejects */
function sanitizeForFirebase<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_, val) => (val === undefined ? null : val)));
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ChatNotificationProvider({ children }: { children: React.ReactNode }) {
  const { user: currentUser } = useAuth();
  const storedState = removeDeletedSeedData(loadStoredChatState());
  const [threads, setThreads] = useState<ChatThread[]>(storedState ? parseThreadsFromState(storedState.threads) : INITIAL_THREADS);
  const [orders, setOrders] = useState<Order[]>(storedState ? readOrders(storedState) : INITIAL_ORDERS);
  const [users, setUsers] = useState<User[]>(storedState?.users ? parseUsersFromState(storedState.users) : MOCK_USERS);
  const [notifications, setNotifications] = useState<AppNotification[]>(storedState ? parseNotificationsFromState(storedState.notifications) : INITIAL_NOTIFICATIONS);
  const [notifCounter, setNotifCounter] = useState(storedState?.notifCounter ?? 9000);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>(getPushPermissionState());
  const clientIdRef = useRef(`chat-client-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const lastSerializedStateRef = useRef('');
  const isFirstSyncRunRef = useRef(true);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // ─── Automated PWA App Icon Badging & Tab Title Synchronization ──────────
  useEffect(() => {
    const currentRole = currentUser?.role === 'super-admin' ? 'admin' : (currentUser?.role || 'admin');
    const currentCustId = currentUser?.id || '';

    const unreadNotifications = notifications.filter((n) => {
      if (n.read) return false;
      if (n.role !== currentRole) return false;
      if (currentRole === 'customer' && currentCustId && n.userId && n.userId !== currentCustId) return false;
      if (currentRole === 'designer' && currentCustId && n.userId && n.userId !== currentCustId) return false;
      return true;
    }).length;

    let unreadMessages = 0;
    if (currentRole === 'admin') {
      unreadMessages = threads.reduce((acc, t) => acc + (t.unread || 0), 0);
    } else if (currentRole === 'customer') {
      unreadMessages = threads
        .filter((t) => !currentCustId || t.customerId === currentCustId || t.id === `customer-${currentCustId}` || t.id === `order-${currentCustId}`)
        .reduce((acc, t) => acc + (t.customerUnread || 0), 0);
    } else if (currentRole === 'designer') {
      unreadMessages = threads
        .filter((t) => t.participantRole === 'designer' && (!currentCustId || t.customerName === currentCustId || t.id.includes(currentCustId)))
        .reduce((acc, t) => acc + (t.customerUnread || 0), 0);
    }

    // Unread count: use unread notifications as primary counter
    const totalUnread = unreadNotifications;
    setAppBadge(totalUnread);

    // Sync browser document title: (3) Dream Jewels
    try {
      const baseTitle = 'Dream Jewels';
      if (totalUnread > 0) {
        document.title = `(${totalUnread}) ${baseTitle}`;
      } else if (document.title.startsWith('(')) {
        document.title = baseTitle;
      }
    } catch {}
  }, [notifications, threads, currentUser?.role, currentUser?.id]);

  // ─── Automatic FCM Token Session Sync (Once Per User Session) ───────────────
  const hasSyncedFcmTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      currentUser?.id &&
      hasSyncedFcmTokenRef.current !== currentUser.id &&
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
    ) {
      hasSyncedFcmTokenRef.current = currentUser.id;
      requestPushPermission(currentUser.id).catch((err) => {
        console.debug('Auto push registration notice:', err);
      });
    }
  }, [currentUser?.id]);

  // ─── Foreground Push Notification Listener ──────────────────────────────────
  useEffect(() => {
    const unsub = registerForegroundPushListener((payload) => {
      const title = payload.notification?.title || payload.data?.title || 'Dream Jewels Update';
      const body = payload.notification?.body || payload.data?.body || 'You have a new update.';
      const pushType = payload.data?.type;

      // A takeover notice isn't role-scoped (it's account-specific, and the
      // realtime session listener has usually already logged this device out
      // by the time the push round-trips) — just surface the banner/chime.
      if (pushType === 'session-takeover') {
        showLocalNotification(title, { body });
        return;
      }

      if (pushType === 'chat-message') {
        const targetUserId = payload.data?.userId || undefined;
        const senderId = payload.data?.senderId || undefined;
        const role =
          (payload.data?.role as 'customer' | 'admin' | 'designer' | undefined) ||
          (targetUserId ? 'customer' : 'admin');

        // The browser's FCM registration token is shared across every open tab
        // of this origin (it's tied to the Service Worker, not to whichever
        // account happens to be logged into a given tab's sessionStorage). So a
        // push addressed to the receiver's token can still fire this listener
        // inside the SENDER's own tab if both accounts are open in the same
        // browser. Cross-check against the user actually logged into THIS tab
        // before surfacing anything, and never show the sender their own message.
        const myRole = currentUser?.role === 'super-admin' ? 'admin' : currentUser?.role;
        const currentUserIdLower = (currentUser?.id || '').toLowerCase();
        const currentUsernameLower = (currentUser?.username || '').toLowerCase();
        const currentEmailLower = (currentUser?.email || '').toLowerCase();
        const targetLower = (targetUserId || '').toLowerCase();

        const isForThisUser = targetUserId
          ? (
              currentUserIdLower === targetLower ||
              currentUsernameLower === targetLower ||
              currentEmailLower === targetLower ||
              (targetLower.startsWith('customer-') && (targetLower.includes(currentUserIdLower) || targetLower.includes(currentUsernameLower))) ||
              myRole === role
            )
          : myRole === role;

        const senderLower = (senderId || '').toLowerCase();
        const isFromThisUser = !!senderId && !!currentUser?.id && (
          senderLower === currentUserIdLower ||
          senderLower === currentUsernameLower ||
          senderLower === currentEmailLower
        );

        console.log('[ChatPush][foreground]', {
          senderId,
          targetUserId,
          targetRole: role,
          currentUserId: currentUser?.id,
          currentUserRole: myRole,
          isForThisUser,
          isFromThisUser,
        });

        if (!isForThisUser || isFromThisUser) return;

        // Surface banner/chime immediately for this user
        showLocalNotification(title, { body });
        return;
      }

      addNotification({
        role: 'admin',
        title,
        body,
        time: 'Just now',
        read: false,
        type: 'system',
      });
    });

    return () => unsub();
  }, [currentUser?.id, currentUser?.role, currentUser?.username, currentUser?.email]);

  const enablePushNotifications = useCallback(async (userId?: string) => {
    const targetUserId = userId || currentUser?.id;
    const res = await requestPushPermission(targetUserId);
    setPushPermission(getPushPermissionState());
    return res;
  }, [currentUser?.id]);

  const addNotification = useCallback((n: Omit<AppNotification, 'id'> | Array<Omit<AppNotification, 'id'>>) => {
    const items = Array.isArray(n) ? n : [n];
    setNotifications((prev) => {
      const newItems = items.map((item, idx) => ({
        ...item,
        id: Date.now() + idx + Math.floor(Math.random() * 100),
      }));
      return [...newItems, ...prev];
    });
    setNotifCounter((c) => c + items.length);

    // Trigger local desktop banner & Web Audio sound — but only for the item
    // actually addressed to whoever is logged into THIS tab. addNotification
    // is called by the sender's own code (e.g. sendAdminMessage queues a
    // 'customer'-role entry for the recipient) so without this check the
    // sender's own browser would pop a banner meant for the other party.
    try {
      const myRole = currentUser?.role === 'super-admin' ? 'admin' : currentUser?.role;
      const relevant = items.find((item) => {
        if (item.role !== myRole) return false;
        if (item.userId && currentUser?.id && item.userId !== currentUser.id) return false;
        return true;
      });
      if (relevant) {
        showLocalNotification(relevant.title, { body: relevant.body });
      }
    } catch (e) {
      console.debug('Notification trigger notice:', e);
    }
  }, [currentUser?.id, currentUser?.role]);

  const nowTime = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newMessageId = () => Date.now() + Math.floor(Math.random() * 1000);

  const getThreadByCustomer = useCallback(
    (customerId: string) => threads.find((t) => t.customerId === customerId),
    [threads]
  );

  const getDesignerThread = useCallback(
    (designerName: string) => threads.find((t) => t.id === createDesignerThreadId(designerName)),
    [threads]
  );

  const getRecipientRoleForAdminMessage = (thread: ChatThread): 'customer' | 'designer' =>
    thread.participantRole === 'designer' ? 'designer' : 'customer';

  const getMessageAudienceRole = (thread: ChatThread, message: ChatMessage): 'admin' | 'customer' | 'designer' | null => {
    if (message.from === 'admin') return getRecipientRoleForAdminMessage(thread);
    if (message.from === 'customer' || message.from === 'designer') return 'admin';
    return null;
  };

  const applyChatState = useCallback((stored: StoredChatState) => {
    const parsedOrders = parseOrdersFromState(stored.orders ?? stored.projects);
    const parsedThreads = parseThreadsFromState(stored.threads);
    const parsedUsers = stored.users ? parseUsersFromState(stored.users) : MOCK_USERS;
    const parsedNotifs = parseNotificationsFromState(stored.notifications);

    setThreads(parsedThreads);
    setOrders(parsedOrders);
    setUsers(parsedUsers);
    setNotifications(parsedNotifs);
    if (typeof stored.notifCounter === 'number') {
      setNotifCounter(stored.notifCounter);
    }

    const clean = sanitizeForFirebase({
      threads: parsedThreads,
      orders: parsedOrders,
      users: parsedUsers,
      notifications: parsedNotifs,
      notifCounter: stored.notifCounter ?? 9000,
    });
    const serialized = JSON.stringify(clean);
    lastSerializedStateRef.current = serialized;
    try {
      window.localStorage.setItem(CHAT_STORAGE_KEY, serialized);
    } catch {
      // ignore
    }
  }, []);

  const applyStoredState = useCallback((raw: string | null) => {
    const stored = parseStoredChatState(raw);
    if (!stored) return;
    applyChatState(stored);
  }, [applyChatState]);

  // ─── Firebase Realtime Database 3-Node Listener ───────────────────────────────
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === CHAT_STORAGE_KEY) {
        applyStoredState(event.newValue);
      }
    };

    window.addEventListener('storage', handleStorage);

    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(CHAT_CHANNEL_NAME);
      channelRef.current = channel;
      channel.onmessage = (event: MessageEvent<{ source: string; state: string }>) => {
        if (event.data?.source !== clientIdRef.current) {
          applyStoredState(event.data.state);
        }
      };
    }

    const unsubs: Array<() => void> = [];

    if (firebaseDatabase) {
      // 1. Orders Node Listener (/orders) - Single source of truth for orders
      const ordersRef = ref(firebaseDatabase, 'orders');
      const unsubOrders = onValue(ordersRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          const parsed = parseOrdersFromState(val);
          if (parsed.length > 0) {
            setOrders((prev) => {
              const prevStr = JSON.stringify(sanitizeForFirebase(prev));
              const newStr = JSON.stringify(sanitizeForFirebase(parsed));
              return prevStr === newStr ? prev : parsed;
            });
          } else {
            set(ordersRef, sanitizeForFirebase(INITIAL_ORDERS)).catch(() => {});
            setOrders(INITIAL_ORDERS);
          }
        } else {
          set(ordersRef, sanitizeForFirebase(INITIAL_ORDERS)).catch(() => {});
          setOrders(INITIAL_ORDERS);
        }
      }, (err) => console.warn('Firebase RTDB orders sync:', err.message));
      unsubs.push(unsubOrders);

      // 2. Users Node Listener (/users) - Single source of truth for users
      const usersRef = ref(firebaseDatabase, 'users');
      const unsubUsers = onValue(usersRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          const parsed = parseUsersFromState(val);
          setUsers((prev) => {
            const prevStr = JSON.stringify(sanitizeForFirebase(prev));
            const newStr = JSON.stringify(sanitizeForFirebase(parsed));
            return prevStr === newStr ? prev : parsed;
          });
        } else {
          try {
            set(usersRef, sanitizeForFirebase(MOCK_USERS));
          } catch {
            // ignore
          }
        }
      }, (err) => console.warn('Firebase RTDB users sync:', err.message));
      unsubs.push(unsubUsers);

      // 3. Chats / Notifications Listener (/chatState)
      const chatStateRef = ref(firebaseDatabase, 'chatState');
      const unsubChat = onValue(chatStateRef, (snapshot) => {
        const value = snapshot.val() as StoredChatState | null;
        if (value) {
          const parsedThreads = parseThreadsFromState(value.threads);
          const parsedNotifs = parseNotificationsFromState(value.notifications);
          
          if (parsedThreads.length > 0) {
            setThreads((prev) => {
              const prevStr = JSON.stringify(sanitizeForFirebase(prev));
              const newStr = JSON.stringify(sanitizeForFirebase(parsedThreads));
              return prevStr === newStr ? prev : parsedThreads;
            });
          }

          setNotifications((prev) => {
            const prevStr = JSON.stringify(sanitizeForFirebase(prev));
            const newStr = JSON.stringify(sanitizeForFirebase(parsedNotifs));
            return prevStr === newStr ? prev : parsedNotifs;
          });

          if (typeof value.notifCounter === 'number') {
            setNotifCounter((prev) => (prev === value.notifCounter ? prev : value.notifCounter!));
          }

          // Mark incoming snapshot as serialized so useEffect does not echo-write back
          lastSerializedStateRef.current = JSON.stringify(sanitizeForFirebase({
            threads: parsedThreads,
            orders,
            users,
            notifications: parsedNotifs,
            notifCounter: typeof value.notifCounter === 'number' ? value.notifCounter : notifCounter,
          }));
        }
      }, (err) => console.warn('Firebase RTDB chatState sync:', err.message));
      unsubs.push(unsubChat);
    }

    return () => {
      window.removeEventListener('storage', handleStorage);
      channelRef.current?.close();
      channelRef.current = null;
      unsubs.forEach((unsub) => unsub());
    };
  }, [applyStoredState]);

  // Direct persistence helper for instant, reliable database saving
  const persistChatStateNow = useCallback(async (
    nextThreads: ChatThread[],
    nextNotifs: AppNotification[],
    nextCounter?: number
  ) => {
    const counter = nextCounter ?? notifCounter;
    const payload = sanitizeForFirebase({
      threads: nextThreads,
      orders,
      users,
      notifications: nextNotifs,
      notifCounter: counter,
    });
    const serialized = JSON.stringify(payload);
    lastSerializedStateRef.current = serialized;

    try {
      window.localStorage.setItem(CHAT_STORAGE_KEY, serialized);
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
    channelRef.current?.postMessage({
      source: clientIdRef.current,
      state: serialized,
    });

    if (firebaseDatabase) {
      try {
        const chatStateRef = ref(firebaseDatabase, 'chatState');
        const remoteSnap = await get(chatStateRef);
        const remote = (remoteSnap.val() as StoredChatState) || {};
        const remoteThreads = parseThreadsFromState(remote.threads);
        const remoteNotifs = parseNotificationsFromState(remote.notifications);

        const mergedThreads = mergeThreads(nextThreads, remoteThreads);
        const mergedNotifs = mergeNotifications(nextNotifs, remoteNotifs);
        const mergedCounter = Math.max(counter, remote.notifCounter ?? 0);

        await set(chatStateRef, sanitizeForFirebase({
          threads: mergedThreads,
          notifications: mergedNotifs,
          notifCounter: mergedCounter,
        }));
      } catch (err) {
        console.error('Failed to save chat state directly to Firebase:', err);
      }
    }
  }, [orders, users, notifCounter]);

  // ─── Sync changes to Firebase & localStorage (Debounced & Deduplicated) ────────
  useEffect(() => {
    const payload = sanitizeForFirebase({
      threads,
      orders,
      users,
      notifications,
      notifCounter,
    });
    const serialized = JSON.stringify(payload);
    if (serialized === lastSerializedStateRef.current) return;

    if (isFirstSyncRunRef.current) {
      isFirstSyncRunRef.current = false;
      lastSerializedStateRef.current = serialized;
      return;
    }

    lastSerializedStateRef.current = serialized;

    const timer = setTimeout(async () => {
      try {
        window.localStorage.setItem(CHAT_STORAGE_KEY, serialized);
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }
      channelRef.current?.postMessage({
        source: clientIdRef.current,
        state: serialized,
      });

      if (firebaseDatabase) {
        try {
          set(ref(firebaseDatabase, 'orders'), sanitizeForFirebase(orders)).catch(() => {});
          set(ref(firebaseDatabase, 'users'), sanitizeForFirebase(users)).catch(() => {});

          const chatStateRef = ref(firebaseDatabase, 'chatState');
          const remoteSnap = await get(chatStateRef);
          const remote = (remoteSnap.val() as StoredChatState) || {};
          const remoteThreads = parseThreadsFromState(remote.threads);
          const remoteNotifs = parseNotificationsFromState(remote.notifications);

          const mergedThreads = mergeThreads(threads, remoteThreads);
          const mergedNotifs = mergeNotifications(notifications, remoteNotifs);
          const mergedCounter = Math.max(notifCounter, remote.notifCounter ?? 0);

          await set(chatStateRef, sanitizeForFirebase({
            threads: mergedThreads,
            notifications: mergedNotifs,
            notifCounter: mergedCounter,
          }));

          setThreads((prev) =>
            JSON.stringify(sanitizeForFirebase(prev)) === JSON.stringify(sanitizeForFirebase(mergedThreads)) ? prev : mergedThreads
          );
          setNotifications((prev) =>
            JSON.stringify(sanitizeForFirebase(prev)) === JSON.stringify(sanitizeForFirebase(mergedNotifs)) ? prev : mergedNotifs
          );
        } catch (e) {
          console.error('Failed to save state to Firebase:', e);
        }
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [threads, orders, users, notifications, notifCounter]);

  const ensureDesignerThread = useCallback((designerName: string, orderName?: string, designerId?: string) => {
    const threadId = createDesignerThreadId(designerName);

    setThreads((prev) => {
      if (prev.some((t) => t.id === threadId)) return prev;

      const introText = orderName
        ? `Order discussion started for ${orderName}.`
        : 'Designer conversation started.';

      const newThread: ChatThread = {
        id: threadId,
        customerName: designerName,
        // Prefer the designer's real user ID (needed for push targeting via
        // targetUserId) — falls back to the thread ID only when the caller
        // doesn't have it yet, matching prior behavior.
        customerId: designerId || threadId,
        participantRole: 'designer',
        messages: [
          {
            id: newMessageId(),
            from: 'admin',
            senderName: 'Dream Jewels Support',
            text: introText,
            time: nowTime(),
            seenBy: [],
          },
        ],
        unread: 0,
        customerUnread: 1,
        lastMessage: introText,
        lastTime: 'Just now',
      };

      return [newThread, ...prev];
    });

    return threadId;
  }, []);

  // Order-wise chat threads used to only get created via createThreadForOrder
  // (the customer's own "request custom order" flow). Orders an admin adds
  // manually never went through that path, so their thread was missing —
  // sendAdminMessage would silently drop the first message because there was
  // no matching thread to append it to. Call this before opening/navigating
  // to an order's chat so the thread (and its Conversations list entry)
  // always exists first.
  const ensureThreadForOrder = useCallback((order: Order) => {
    const threadId = `order-${order.id}`;

    setThreads((prev) => {
      if (prev.some((t) => t.id === threadId)) return prev;

      const newThread: ChatThread = {
        id: threadId,
        orderId: order.id,
        orderName: order.name,
        customerName: order.customerName,
        customerId: order.customerId,
        participantRole: 'customer',
        messages: [],
        unread: 0,
        customerUnread: 0,
        lastMessage: 'No messages yet',
        lastTime: '',
      };

      // Deliberately NOT writing to Firebase directly here. `prev` is this
      // tab's local state, which may not have hydrated from Firebase yet
      // (e.g. right after a fresh page load) — an immediate set() at that
      // point would overwrite the real chatState/threads node with a
      // snapshot that's missing this order's actual message history. The
      // debounced sync effect below persists this the same way every other
      // thread mutation does, but only once hydration has been confirmed.
      return [newThread, ...prev];
    });

    return threadId;
  }, []);

  const createThreadForOrder = useCallback(
    (customerId: string, customerName: string, order: OrderDetails) => {
      const orderName = order.name;
      const orderId = `ORD-${Date.now()}`;

      // Message 1: Greeting visible to the customer
      const greetMsg: ChatMessage = {
        id: Date.now(),
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: `👋 Hi ${customerName}! Your custom order "${orderName}" has been received. Our team will review the details and get back to you shortly.`,
        time: nowTime(),
      };

      // Build ChatAttachment[] from new attachments[] field
      const orderAttachments: ChatAttachment[] = (order.attachments ?? []).map((f, idx) => ({
        id: Date.now() + 2 + idx,
        name: f.name,
        size: f.size,
        type: f.type,
        url: f.dataUrl,
        kind: f.type.startsWith('image/') ? 'image' : 'file',
      }));

      // Legacy single-image fallback
      if (orderAttachments.length === 0 && order.image) {
        orderAttachments.push({
          id: Date.now() + 99,
          name: order.imageName ?? 'sample-image',
          size: 0,
          type: 'image/jpeg',
          url: order.image,
          kind: 'image',
        });
      }

      // Message 2: Full order details card
      const lines: string[] = [
        `📋 ORDER DETAILS — ${orderName}`,
        `──────────────────────────`,
        `👤 Customer   : ${customerName}`,
        `💍 Category   : ${order.category}`,
        `⚙️  Metal      : ${order.metal} (${order.karat})`,
      ];
      if (order.size)         lines.push(`📏 Size       : No. ${order.size}`);
      if (order.weight)       lines.push(`⚖️  Weight     : ${order.weight}`);
      if (order.deliveryDate) lines.push(`📅 Target Date: ${order.deliveryDate}`);
      if (order.notes)        lines.push(`📝 Notes      : ${order.notes}`);
      if (orderAttachments.length > 0) lines.push(`📎 Files      : ${orderAttachments.length} file(s) attached`);
      lines.push(`──────────────────────────`);
      lines.push(`🔖 Status     : In Design`);

      const detailMsg: ChatMessage = {
        id: Date.now() + 1,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: lines.join('\n'),
        time: nowTime(),
        attachments: orderAttachments.length > 0 ? orderAttachments : undefined,
        seenBy: [],
      };

      setThreads((prev) => {
        const threadId = `order-${orderId}`;
        const newThread: ChatThread = {
          id: threadId,
          orderId,
          orderName,
          customerName,
          customerId,
          participantRole: 'customer',
          messages: [greetMsg, detailMsg],
          unread: 1,           // admin has unread order details
          customerUnread: 1,   // customer gets greeting
          lastMessage: `New order: ${orderName}`,
          lastTime: 'Just now',
        };
        // Same reasoning as ensureThreadForOrder: let the debounced sync
        // effect persist this once hydration is confirmed, rather than
        // writing `prev` (possibly stale local state) straight to Firebase.
        return [newThread, ...prev.filter((t) => t.id !== threadId)];
      });

      const newOrder: Order = {
        id: orderId,
        name: order.name,
        customerId,
        customerName,
        designerName: DEFAULT_DESIGNER_NAME,
        status: 'Pending Approval',
        due: order.deliveryDate ?? 'To be scheduled',
        budget: order.budget,
        priority: 'Medium',
        category: order.category,
        metal: order.metal,
        karat: order.karat,
        size: order.size,
        weight: order.weight,
        notes: order.notes,
        image: orderAttachments.find(a => a.kind === 'image')?.url,
        images: orderAttachments.map(a => ({
          id: a.id,
          name: a.name,
          url: a.url,
          size: a.size,
          type: a.type
        })),
        created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        progress: '0%',
      };

      setOrders((prev) => {
        const updated = [newOrder, ...prev.filter((order) => order.id !== orderId)];
        if (firebaseDatabase) {
          set(ref(firebaseDatabase, 'orders'), sanitizeForFirebase(updated)).catch(() => {});
        }
        return updated;
      });

      addNotification([
        {
          role: 'admin',
          title: `New order from ${customerName}`,
          body: `"${orderName}" submitted for review.`,
          time: 'Just now',
          read: false,
          type: 'order',
          orderId: orderId,
        },
        {
          role: 'customer',
          userId: customerId,
          title: `Order placed: ${orderName}`,
          body: 'Your custom order has been received. Check your chat for updates.',
          time: 'Just now',
          read: false,
          type: 'chat',
          threadId: `order-${orderId}`,
          orderId: orderId,
        }
      ]);
    },
    [addNotification]
  );

  const upsertOrder = useCallback((order: Order) => {
    setOrders((current) => {
      const existing = current.find((item) => item.id === order.id);
      const exists = current.some((item) => item.id === order.id);
      const updated = exists
        ? current.map((item) => (item.id === order.id ? order : item))
        : [order, ...current];

      if (firebaseDatabase) {
        set(ref(firebaseDatabase, 'orders'), sanitizeForFirebase(updated)).catch(() => {});
      }

      if (existing) {
        const statusChanged = existing.status !== order.status;
        const progressChanged = existing.progress !== order.progress;

        if (statusChanged || progressChanged) {
          const statusText = statusChanged ? `status to ${order.status}` : '';
          const progressText = progressChanged ? `progress to ${order.progress}` : '';
          const andText = statusChanged && progressChanged ? ' and ' : '';
          const changeDesc = `${statusText}${andText}${progressText}`;

          // Only notify the customer about their order being updated.
          // Skip the admin self-notification entirely when admin/super-admin is
          // the one making the change — they already see the update on screen.
          // Only add admin notification when a designer (non-admin) actor made the change.
          const actorRole = currentUser?.role;
          const isAdminActor = actorRole === 'admin' || actorRole === 'super-admin';

          const notificationsToAdd: Array<Omit<AppNotification, 'id'>> = [
            {
              role: 'customer',
              userId: order.customerId,
              title: `Order Update: ${order.name}`,
              body: `Your order has been updated: ${changeDesc}.`,
              time: 'Just now',
              read: false,
              type: 'order',
              orderId: order.id,
            },
          ];

          if (!isAdminActor) {
            notificationsToAdd.push({
              role: 'admin',
              title: `Order Update: ${order.name}`,
              body: `Designer ${order.designerName} updated ${changeDesc}.`,
              time: 'Just now',
              read: false,
              type: 'order',
              orderId: order.id,
            });
          }

          addNotification(notificationsToAdd);
        }
      }

      return updated;
    });
  }, [addNotification, currentUser?.role]);

  // Approval only flips the status.
  const approveOrder = useCallback((orderId: string) => {
    setOrders((current) => {
      const order = current.find((item) => item.id === orderId);
      if (!order) return current;

      const updated = current.map((item) =>
        item.id === orderId ? { ...item, status: 'Approved' as const } : item
      );

      if (firebaseDatabase) {
        set(ref(firebaseDatabase, 'orders'), sanitizeForFirebase(updated)).catch(() => {});
      }

      addNotification({
        role: 'customer',
        userId: order.customerId,
        title: `Order approved: ${order.name}`,
        body: 'Your custom order has been approved and moved into design.',
        time: 'Just now',
        read: false,
        type: 'order',
        orderId: order.id,
      });

      return updated;
    });
  }, [addNotification]);

  const deleteOrder = useCallback((orderId: string) => {
    setOrders((current) => {
      const updated = current.filter((item) => item.id !== orderId);
      if (firebaseDatabase) {
        set(ref(firebaseDatabase, 'orders'), sanitizeForFirebase(updated)).catch(() => {});
      }
      return updated;
    });
  }, []);

  const rejectOrder = useCallback((orderId: string, reason?: string) => {
    setOrders((current) => {
      const order = current.find((item) => item.id === orderId);
      if (!order) return current;

      const rejectedOrder: Order = {
        ...order,
        status: 'Rejected',
        rejectionReason: reason?.trim() || undefined,
      };

      const updated = current.map((item) =>
        item.id === orderId ? rejectedOrder : item
      );

      if (firebaseDatabase) {
        set(ref(firebaseDatabase, 'orders'), sanitizeForFirebase(updated)).catch(() => {});
      }

      addNotification({
        role: 'customer',
        userId: rejectedOrder.customerId,
        title: `Order rejected: ${rejectedOrder.name}`,
        body: rejectedOrder.rejectionReason
          ? `Reason: ${rejectedOrder.rejectionReason}`
          : 'Your custom order could not be approved at this time.',
        time: 'Just now',
        read: false,
        type: 'order',
        orderId: rejectedOrder.id,
      });

      return updated;
    });
  }, [addNotification]);

  const sendCustomerMessage = useCallback(
    (
      customerId: string,
      customerName: string,
      text: string,
      optionalThreadId?: string,
      attachments?: ChatAttachment[]
    ) => {
      const msg: ChatMessage = {
        id: newMessageId(),
        from: 'customer',
        senderName: customerName,
        text,
        time: nowTime(),
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
        seenBy: [],
      };

      const targetThreadId = optionalThreadId || `customer-${customerId}`;

      let nextThreads: ChatThread[] = [];
      setThreads((prev) => {
        const existing = prev.find((t) => t.id === targetThreadId);

        if (existing) {
          nextThreads = prev.map((t) =>
            t.id === existing.id
              ? {
                  ...t,
                  customerId,
                  customerName,
                  messages: [...t.messages, msg],
                  unread: (t.unread || 0) + 1,
                  lastMessage: formatLastMessage(text, attachments),
                  lastTime: 'Just now',
                }
              : t
          );
        } else {
          const initialMessages: ChatMessage[] = [];
          if (targetThreadId === `customer-${customerId}`) {
            initialMessages.push({
              id: Date.now() - 1000,
              from: 'admin',
              senderName: 'Dream Jewels Support',
              text: `👋 Welcome to Dream Jewels, ${customerName}! How can our master jewelers assist you today?`,
              time: nowTime(),
              seenBy: ['customer'],
            });
          }
          initialMessages.push(msg);

          const newThread: ChatThread = {
            id: targetThreadId,
            customerName,
            customerId,
            participantRole: 'customer',
            messages: initialMessages,
            unread: 1,
            customerUnread: 0,
            lastMessage: formatLastMessage(text, attachments),
            lastTime: 'Just now',
          };
          nextThreads = [newThread, ...prev];
        }
        return nextThreads;
      });

      const notifTitle = `New message from ${customerName}`;
      const notifBody = text.length > 60 ? text.slice(0, 60) + '…' : text;

      const newNotifItem: AppNotification = {
        id: Date.now() + Math.floor(Math.random() * 100),
        role: 'admin',
        title: notifTitle,
        body: notifBody,
        time: 'Just now',
        read: false,
        type: 'chat',
        threadId: targetThreadId,
      };

      setNotifications((prev) => [newNotifItem, ...prev]);
      setNotifCounter((c) => c + 1);

      // Persist directly to Firebase RTDB and localStorage
      persistChatStateNow(
        nextThreads.length > 0 ? nextThreads : threads,
        [newNotifItem, ...notifications]
      );

      const badgeCount = notifications.filter((n) => n.role === 'admin' && !n.read).length + 1;
      sendChatPushNotification({
        senderId: currentUser?.id || customerId,
        targetRole: 'admin',
        title: notifTitle,
        body: notifBody,
        threadId: targetThreadId,
        badgeCount,
      });
    },
    [threads, notifications, currentUser?.id, persistChatStateNow]
  );

  const sendDesignerMessage = useCallback((threadId: string, designerName: string, text: string) => {
    const msg: ChatMessage = {
      id: newMessageId(),
      from: 'designer',
      senderName: designerName,
      text,
      time: nowTime(),
      seenBy: [],
    };

    let nextThreads: ChatThread[] = [];
    setThreads((prev) => {
      nextThreads = prev.map((t) =>
        t.id === threadId
          ? { ...t, messages: [...t.messages, msg], unread: t.unread + 1, lastMessage: text, lastTime: 'Just now' }
          : t
      );
      return nextThreads;
    });

    const notifTitle = `New message from Designer (${designerName})`;
    const notifBody = text.length > 60 ? text.slice(0, 60) + '…' : text;

    const newNotifItem: AppNotification = {
      id: Date.now() + Math.floor(Math.random() * 100),
      role: 'admin',
      title: notifTitle,
      body: notifBody,
      time: 'Just now',
      read: false,
      type: 'chat',
      threadId: threadId,
    };

    setNotifications((prev) => [newNotifItem, ...prev]);
    setNotifCounter((c) => c + 1);

    persistChatStateNow(
      nextThreads.length > 0 ? nextThreads : threads,
      [newNotifItem, ...notifications]
    );

    const badgeCount = notifications.filter((n) => n.role === 'admin' && !n.read).length + 1;
    sendChatPushNotification({
      senderId: currentUser?.id || threadId,
      targetRole: 'admin',
      title: notifTitle,
      body: notifBody,
      threadId,
      badgeCount,
    });
  }, [threads, notifications, currentUser?.id, persistChatStateNow]);

  const sendAdminMessage = useCallback((threadId: string, text: string, attachments: ChatAttachment[] = []) => {
    const msg: ChatMessage = {
      id: newMessageId(),
      from: 'admin',
      senderName: 'Dream Jewels Support',
      text,
      time: nowTime(),
      attachments: attachments.length > 0 ? attachments : undefined,
      seenBy: [],
    };

    let nextThreads: ChatThread[] = [];
    setThreads((prev) => {
      nextThreads = prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              messages: [...t.messages, msg],
              customerUnread: t.customerUnread + 1,
              lastMessage: formatLastMessage(text, attachments),
              lastTime: 'Just now',
            }
          : t
      );
      return nextThreads;
    });

    const thread = threads.find((t) => t.id === threadId);
    if (thread) {
      const recipientRole = thread.participantRole === 'designer' ? 'designer' : 'customer';
      const notifTitle = 'New message from Support';
      const notifBody = text.length > 60 ? text.slice(0, 60) + '…' : text;

      // Find user in users collection to resolve canonical user ID for push and notification routing
      const matchedUser = users.find(
        (u) =>
          (thread.customerId && (u.id === thread.customerId || u.username?.toLowerCase() === thread.customerId.toLowerCase())) ||
          (thread.customerName && (u.name?.toLowerCase() === thread.customerName.toLowerCase() || u.username?.toLowerCase() === thread.customerName.toLowerCase()))
      );

      const effectiveTargetUserId = matchedUser?.id || thread.customerId || (thread.id.startsWith('customer-') ? thread.id.replace('customer-', '') : '');

      const newNotifItem: AppNotification = {
        id: Date.now() + Math.floor(Math.random() * 100),
        role: recipientRole,
        userId: effectiveTargetUserId || thread.customerId,
        title: notifTitle,
        body: notifBody,
        time: 'Just now',
        read: false,
        type: 'chat',
        threadId: threadId,
      };

      setNotifications((prev) => [newNotifItem, ...prev]);
      setNotifCounter((c) => c + 1);

      persistChatStateNow(
        nextThreads.length > 0 ? nextThreads : threads,
        [newNotifItem, ...notifications]
      );

      const badgeCount =
        notifications.filter((n) => n.role === recipientRole && (n.userId === effectiveTargetUserId || n.userId === thread.customerId) && !n.read).length + 1;

      sendChatPushNotification({
        senderId: currentUser?.id || 'admin',
        targetUserId: effectiveTargetUserId || undefined,
        targetRole: recipientRole,
        title: notifTitle,
        body: notifBody,
        threadId,
        badgeCount,
      });
    }
  }, [threads, notifications, currentUser?.id, users, persistChatStateNow]);

  const markThreadRead = useCallback((threadId: string, as: 'admin' | 'customer' | 'designer') => {
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              unread: as === 'admin' ? 0 : t.unread,
              customerUnread: as === 'customer' || as === 'designer' ? 0 : t.customerUnread,
              messages: t.messages.map((message) => {
                if (getMessageAudienceRole(t, message) !== as) return message;
                if (message.seenBy?.includes(as)) return message;
                return { ...message, seenBy: [...(message.seenBy ?? []), as] };
              }),
            }
          : t
      )
    );

    // Mark chat notifications for this thread as read without deleting history
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.role === as && n.type === 'chat' && (n.threadId === threadId || n.threadId?.includes(threadId))) {
          return { ...n, read: true };
        }
        return n;
      })
    );
  }, []);

  const markAllNotificationsRead = useCallback((role: 'customer' | 'admin' | 'designer', userId?: string) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.role !== role) return n;
        if (role === 'customer' && userId && n.userId && n.userId !== userId) return n;
        if (role === 'designer' && userId && n.userId && n.userId !== userId) return n;
        return { ...n, read: true };
      })
    );
    setThreads((prev) =>
      prev.map((thread) => {
        if (role === 'admin') {
          return { ...thread, unread: 0 };
        }
        if (role === 'customer' && (!userId || thread.customerId === userId || thread.id === `customer-${userId}`)) {
          return { ...thread, customerUnread: 0 };
        }
        if (role === 'designer' && (!userId || thread.customerName === userId || thread.id.includes(userId))) {
          return { ...thread, customerUnread: 0 };
        }
        return thread;
      })
    );
  }, []);

  const markNotificationRead = useCallback((id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const clearAllNotifications = useCallback((role?: 'customer' | 'admin' | 'designer', userId?: string) => {
    if (!role) {
      setNotifications([]);
      return;
    }
    setNotifications((prev) =>
      prev.filter((n) => {
        if (n.role !== role) return true;
        if (role === 'customer' && userId && n.userId && n.userId !== userId) return true;
        if (role === 'designer' && userId && n.userId && n.userId !== userId) return true;
        return false;
      })
    );
  }, []);

  const getUnreadCount = useCallback(
    (role: 'customer' | 'admin' | 'designer', userId?: string) =>
      notifications.filter((n) => {
        if (n.read) return false;
        if (n.role !== role) return false;
        if (role === 'customer' && userId && n.userId && n.userId !== userId) return false;
        if (role === 'designer' && userId && n.userId && n.userId !== userId) return false;
        return true;
      }).length,
    [notifications]
  );

  const getChatUnreadCount = useCallback(
    (role: 'customer' | 'admin' | 'designer', userId?: string) => {
      if (role === 'admin') {
        return threads.reduce((sum, thread) => sum + (thread.unread || 0), 0);
      }

      return threads
        .filter((thread) => {
          if (role === 'customer') {
            if (userId) return thread.customerId === userId || thread.id === `customer-${userId}` || thread.id === `order-${userId}`;
            return thread.participantRole === 'customer';
          }
          if (role === 'designer') {
            if (userId) return thread.customerName === userId || thread.id.includes(userId);
            return thread.participantRole === 'designer';
          }
          return false;
        })
        .reduce((sum, thread) => sum + (thread.customerUnread || 0), 0);
    },
    [threads]
  );

  const triggerTestNotification = useCallback(
    (type: 'order_created' | 'order_approved' | 'order_rejected' | 'order_progress' | 'chat_message' | 'system_alert') => {
      const currentRole = currentUser?.role === 'super-admin' ? 'admin' : (currentUser?.role || 'admin');
      const currentCustId = currentUser?.id || 'usr-cust-1';
      const currentUserName = currentUser?.name || 'Customer';

      const testOrderId = `ORD-${Date.now().toString().slice(-4)}`;

      switch (type) {
        case 'order_created':
          addNotification({
            role: 'admin',
            title: `New Custom Order: Royal Diamond Ring`,
            body: `Order ${testOrderId} submitted by ${currentUserName} for ₹1,85,000.`,
            time: 'Just now',
            read: false,
            type: 'order',
            orderId: testOrderId,
          });
          break;
        case 'order_approved':
          addNotification({
            role: 'customer',
            userId: currentCustId,
            title: `Order Approved: Solitaire Ring (${testOrderId})`,
            body: 'Your custom jewelry order has been approved and moved to 3D CAD design stage.',
            time: 'Just now',
            read: false,
            type: 'order',
            orderId: testOrderId,
          });
          break;
        case 'order_rejected':
          addNotification({
            role: 'customer',
            userId: currentCustId,
            title: `Order Review Update (${testOrderId})`,
            body: 'Reason: Requested gemstones are currently out of stock. Please select an alternate cut.',
            time: 'Just now',
            read: false,
            type: 'order',
            orderId: testOrderId,
          });
          break;
        case 'order_progress':
          addNotification({
            role: currentRole,
            userId: currentCustId,
            title: `Production Progress: 75% (${testOrderId})`,
            body: 'Gemstone setting completed. Final polishing and hallmark inspection underway.',
            time: 'Just now',
            read: false,
            type: 'order',
            orderId: testOrderId,
          });
          break;
        case 'chat_message':
          addNotification({
            role: currentRole,
            userId: currentCustId,
            title: currentRole === 'admin' ? `New message from ${currentUserName}` : 'New message from Support',
            body: 'Hello! I uploaded the revised reference image for the pendant necklace.',
            time: 'Just now',
            read: false,
            type: 'chat',
            threadId: `customer-${currentCustId}`,
          });
          break;
        case 'system_alert':
          addNotification({
            role: currentRole,
            userId: currentCustId,
            title: 'System Announcement: Festive Logistics Active',
            body: 'Special priority dispatch enabled for all custom orders with real-time tracking.',
            time: 'Just now',
            read: false,
            type: 'system',
          });
          break;
      }
    },
    [addNotification]
  );

  const seedOrderTestChats = useCallback(() => {
    setOrders(INITIAL_ORDERS);
    setThreads(INITIAL_THREADS);
    if (firebaseDatabase) {
      set(ref(firebaseDatabase, 'orders'), sanitizeForFirebase(INITIAL_ORDERS)).catch(() => {});
      set(ref(firebaseDatabase, 'chatState/threads'), sanitizeForFirebase(INITIAL_THREADS)).catch(() => {});
      set(ref(firebaseDatabase, 'chatState'), sanitizeForFirebase({
        threads: INITIAL_THREADS,
        orders: INITIAL_ORDERS,
        users,
        notifications,
        notifCounter,
      })).catch(() => {});
    }
    addNotification({
      role: 'admin',
      title: 'Order Chats Initialized',
      body: '4 realistic order-wise test chat conversations synced to Firebase Realtime Database.',
      time: 'Just now',
      read: false,
      type: 'system',
    });
  }, [users, notifications, notifCounter, addNotification]);

  const deleteMessage = useCallback((threadId: string, messageId: number) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== threadId) return t;
        const filteredMessages = t.messages.filter((m) => m.id !== messageId);
        return {
          ...t,
          messages: filteredMessages,
        };
      })
    );
  }, []);

  const deleteThread = useCallback((threadId: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== threadId));
  }, []);

  const addUser = useCallback((newUser: User & { password?: string }) => {
    setUsers((prev) => {
      const updated = [newUser, ...prev.filter((u) => u.id !== newUser.id)];
      if (firebaseDatabase) {
        set(ref(firebaseDatabase, 'users'), sanitizeForFirebase(updated)).catch(() => {});
      }
      return updated;
    });
  }, []);

  const deleteUser = useCallback((userId: string) => {
    setUsers((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      if (firebaseDatabase) {
        set(ref(firebaseDatabase, 'users'), sanitizeForFirebase(updated)).catch(() => {});
      }
      return updated;
    });
  }, []);

  return (
    <ChatNotificationContext.Provider
      value={{
        threads,
        orders,
        notifications,
        users,
        addUser,
        deleteUser,
        sendCustomerMessage,
        sendDesignerMessage,
        sendAdminMessage,
        markThreadRead,
        getThreadByCustomer,
        getDesignerThread,
        ensureDesignerThread,
        ensureThreadForOrder,
        createThreadForOrder,
        upsertOrder,
        approveOrder,
        rejectOrder,
        deleteOrder,
        addNotification,
        markAllNotificationsRead,
        markNotificationRead,
        clearAllNotifications,
        getUnreadCount,
        getChatUnreadCount,
        triggerTestNotification,
        seedOrderTestChats,
        deleteMessage,
        deleteThread,
        enablePushNotifications,
        pushPermission,
        setAppBadgeCount: setAppBadge,
        clearAppBadgeCount: clearAppBadge,
      }}
    >
      {children}
    </ChatNotificationContext.Provider>
  );
}

export function useChatNotification() {
  const ctx = useContext(ChatNotificationContext);
  if (!ctx) throw new Error('useChatNotification must be used within ChatNotificationProvider');
  return ctx;
}
