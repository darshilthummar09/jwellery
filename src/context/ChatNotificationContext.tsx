import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onValue, ref, set } from 'firebase/database';
import { firebaseDatabase } from '../services/firebase';
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
import { MOCK_USERS } from '../data/mock-users';
import { User } from '../types/user.types';

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
const INITIAL_NOTIFICATIONS: AppNotification[] = [];

const DEFAULT_DESIGNER_NAME = 'Riya Sharma';

const createDesignerThreadId = (designerName: string) =>
  `designer-${designerName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

const formatLastMessage = (text: string, attachments?: ChatAttachment[]) => {
  if (text && text.trim()) return text.trim();
  if (!attachments || attachments.length === 0) return '';
  return attachments.length === 1 ? `Sent ${attachments[0].name}` : `Sent ${attachments.length} files`;
};

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

/** Strips undefined properties so Firebase Realtime Database set() never rejects */
function sanitizeForFirebase<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_, val) => (val === undefined ? null : val)));
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ChatNotificationProvider({ children }: { children: React.ReactNode }) {
  const { user: currentUser } = useAuth();
  const storedState = loadStoredChatState();
  const [threads, setThreads] = useState<ChatThread[]>(storedState ? parseThreadsFromState(storedState.threads) : INITIAL_THREADS);
  const [orders, setOrders] = useState<Order[]>(storedState ? readOrders(storedState) : INITIAL_ORDERS);
  const [users, setUsers] = useState<User[]>(storedState?.users ? parseUsersFromState(storedState.users) : MOCK_USERS);
  const [notifications, setNotifications] = useState<AppNotification[]>(storedState ? parseNotificationsFromState(storedState.notifications) : INITIAL_NOTIFICATIONS);
  const [notifCounter, setNotifCounter] = useState(storedState?.notifCounter ?? 9000);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>(getPushPermissionState());
  const clientIdRef = useRef(`chat-client-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // ─── Deduplication State to Ensure Strict 1 Notification Per Message ─────
  const notifiedMessageIdsRef = useRef<Set<string | number>>(new Set());
  const initialMessageSyncDoneRef = useRef<boolean>(false);

  const isMessageAlreadyNotified = useCallback((id: number | string): boolean => {
    if (notifiedMessageIdsRef.current.has(id)) return true;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage.getItem(`dj_notif_${id}`)) {
        return true;
      }
    } catch {}
    return false;
  }, []);

  const markMessageAsNotified = useCallback((id: number | string): void => {
    notifiedMessageIdsRef.current.add(id);
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(`dj_notif_${id}`, '1');
      }
    } catch {}
  }, []);

  // ─── Automated PWA App Icon Badging & Tab Title Synchronization ──────────
  useEffect(() => {
    const currentRole = currentUser?.role === 'super-admin' ? 'admin' : (currentUser?.role || 'admin');
    const currentCustId = currentUser?.id || '';

    const unreadNotifications = notifications.filter((n) => {
      if (n.read) return false;
      if (n.role !== currentRole) return false;
      if (currentRole === 'customer' && currentCustId && n.userId && n.userId !== currentCustId) return false;
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

    const totalUnread = unreadNotifications + unreadMessages;
    setAppBadge(totalUnread);

    try {
      const baseTitle = 'Dream Jewels';
      if (totalUnread > 0) {
        document.title = `(${totalUnread}) ${baseTitle}`;
      } else if (document.title.startsWith('(')) {
        document.title = baseTitle;
      }
    } catch { }
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

      if (pushType === 'session-takeover') {
        showLocalNotification(title, { body, tag: 'session-takeover' });
        return;
      }

      if (pushType === 'chat-message') {
        const messageId = payload.data?.messageId;
        if (messageId && isMessageAlreadyNotified(messageId)) {
          // Strict deduplication: already displayed via RTDB listener or previous push
          return;
        }
        if (messageId) {
          markMessageAsNotified(messageId);
        }

        const targetUserId = payload.data?.userId || undefined;
        const senderId = payload.data?.senderId || undefined;
        const role =
          (payload.data?.role as 'customer' | 'admin' | 'designer' | undefined) ||
          (targetUserId ? 'customer' : 'admin');

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

        if (!isForThisUser || isFromThisUser) return;

        showLocalNotification(title, {
          body,
          tag: messageId ? `chat-msg-${messageId}` : undefined,
          data: {
            url: payload.data?.url,
            threadId: payload.data?.threadId,
            messageId,
          }
        });
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
  }, [currentUser?.id, currentUser?.role, isMessageAlreadyNotified, markMessageAsNotified]);

  const enablePushNotifications = useCallback(async (userId?: string) => {
    const res = await requestPushPermission(userId);
    setPushPermission(getPushPermissionState());
    return res;
  }, []);

  const addNotification = useCallback((n: Omit<AppNotification, 'id'> | Array<Omit<AppNotification, 'id'>>) => {
    const items = Array.isArray(n) ? n : [n];
    setNotifications((prev) => {
      const newItems = items.map((item, idx) => ({
        ...item,
        id: Date.now() + idx + Math.floor(Math.random() * 100),
      }));
      const updated = [...newItems, ...prev];
      if (firebaseDatabase) {
        set(ref(firebaseDatabase, 'chatState/notifications'), sanitizeForFirebase(updated)).catch(() => {});
      }
      return updated;
    });
    setNotifCounter((c) => c + items.length);

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

  // ─── Firebase Realtime Database Stream Listeners ──────────────────────────
  useEffect(() => {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(CHAT_CHANNEL_NAME);
      channelRef.current = channel;
    }

    const unsubs: Array<() => void> = [];

    if (firebaseDatabase) {
      // 1. Orders Node Listener (/orders)
      const ordersRef = ref(firebaseDatabase, 'orders');
      const unsubOrders = onValue(ordersRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          const parsed = parseOrdersFromState(val);
          setOrders((prev) => {
            const prevStr = JSON.stringify(sanitizeForFirebase(prev));
            const newStr = JSON.stringify(sanitizeForFirebase(parsed));
            return prevStr === newStr ? prev : parsed;
          });
        }
      }, (err) => console.warn('Firebase RTDB orders sync:', err.message));
      unsubs.push(unsubOrders);

      // 2. Users Node Listener (/users)
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
        }
      }, (err) => console.warn('Firebase RTDB users sync:', err.message));
      unsubs.push(unsubUsers);

      // 3. Threads Node Listener (/chatState/threads)
      const threadsRef = ref(firebaseDatabase, 'chatState/threads');
      const unsubThreads = onValue(threadsRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          const parsedThreads = parseThreadsFromState(val);

          // Real-time message detection & single-fire notification for receiver
          if (initialMessageSyncDoneRef.current) {
            parsedThreads.forEach((thread) => {
              (thread.messages || []).forEach((msg) => {
                if (isMessageAlreadyNotified(msg.id)) return;

                const myRole = currentUser?.role === 'super-admin' ? 'admin' : currentUser?.role;
                const myId = currentUser?.id || '';

                let isForMe = false;
                if (myRole === 'admin') {
                  isForMe = msg.from === 'customer' || msg.from === 'designer';
                } else if (myRole === 'customer') {
                  isForMe = (msg.from === 'admin' || msg.from === 'designer') &&
                    (!myId || thread.customerId === myId || thread.id === `customer-${myId}` || thread.id === `order-${myId}`);
                } else if (myRole === 'designer') {
                  isForMe = msg.from === 'admin' &&
                    (!myId || thread.customerName === myId || thread.id.includes(myId));
                }

                markMessageAsNotified(msg.id);

                if (isForMe) {
                  const notifTitle = msg.senderName || (myRole === 'customer' ? 'Dream Jewels Support' : 'Customer Message');
                  const previewText = msg.text || (msg.attachments && msg.attachments.length > 0 ? 'Sent an attachment' : 'New message');
                  const targetUrl = myRole === 'admin'
                    ? `/dashboard/admin/chats?thread=${encodeURIComponent(thread.id)}`
                    : `/dashboard/customer/chat?thread=${encodeURIComponent(thread.id)}`;

                  showLocalNotification(notifTitle, {
                    body: previewText,
                    tag: `chat-msg-${msg.id}`,
                    data: {
                      threadId: thread.id,
                      messageId: msg.id,
                      url: targetUrl,
                    },
                  });
                }
              });
            });
          } else {
            // First database snapshot: register existing message IDs without alerting
            parsedThreads.forEach((thread) => {
              (thread.messages || []).forEach((msg) => {
                markMessageAsNotified(msg.id);
              });
            });
            initialMessageSyncDoneRef.current = true;
          }

          setThreads((prev) => {
            const prevStr = JSON.stringify(sanitizeForFirebase(prev));
            const newStr = JSON.stringify(sanitizeForFirebase(parsedThreads));
            return prevStr === newStr ? prev : parsedThreads;
          });
        }
      }, (err) => console.warn('Firebase RTDB threads sync:', err.message));
      unsubs.push(unsubThreads);

      // 4. Notifications Node Listener (/chatState/notifications)
      const notifsRef = ref(firebaseDatabase, 'chatState/notifications');
      const unsubNotifs = onValue(notifsRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          const parsedNotifs = parseNotificationsFromState(val);
          setNotifications((prev) => {
            const prevStr = JSON.stringify(sanitizeForFirebase(prev));
            const newStr = JSON.stringify(sanitizeForFirebase(parsedNotifs));
            return prevStr === newStr ? prev : parsedNotifs;
          });
        }
      }, (err) => console.warn('Firebase RTDB notifications sync:', err.message));
      unsubs.push(unsubNotifs);
    }

    return () => {
      channelRef.current?.close();
      channelRef.current = null;
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  // ─── Local state persistence ───────────────────────────────────────────────
  useEffect(() => {
    try {
      const payload = sanitizeForFirebase({
        threads,
        orders,
        users,
        notifications,
        notifCounter,
      });
      window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
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

      const updated = [newThread, ...prev];
      if (firebaseDatabase) {
        set(ref(firebaseDatabase, 'chatState/threads'), sanitizeForFirebase(updated)).catch(() => {});
      }

      return updated;
    });

    return threadId;
  }, []);

  const ensureThreadForOrder = useCallback((order: Order) => {
    const threadId = `order-${order.id}`;

    setThreads((prev) => {
      const existing = prev.find((t) => t.id === threadId);
      if (existing) return prev;

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

      const updated = [newThread, ...prev];
      if (firebaseDatabase) {
        set(ref(firebaseDatabase, 'chatState/threads'), sanitizeForFirebase(updated)).catch(() => {});
      }

      return updated;
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
      if (order.size) lines.push(`📏 Size       : No. ${order.size}`);
      if (order.weight) lines.push(`⚖️  Weight     : ${order.weight}`);
      if (order.deliveryDate) lines.push(`📅 Target Date: ${order.deliveryDate}`);
      if (order.notes) lines.push(`📝 Notes      : ${order.notes}`);
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

      setThreads((prev) => {
        const updated = [newThread, ...prev.filter((t) => t.id !== threadId)];
        if (firebaseDatabase) {
          set(ref(firebaseDatabase, 'chatState/threads'), sanitizeForFirebase(updated)).catch(() => {});
        }
        return updated;
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
          set(ref(firebaseDatabase, 'orders'), sanitizeForFirebase(updated)).catch(() => { });
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
          type: 'order',
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
        set(ref(firebaseDatabase, 'orders'), sanitizeForFirebase(updated)).catch(() => { });
      }

      if (existing) {
        const statusChanged = existing.status !== order.status;
        const progressChanged = existing.progress !== order.progress;

        if (statusChanged || progressChanged) {
          const statusText = statusChanged ? `status to ${order.status}` : '';
          const progressText = progressChanged ? `progress to ${order.progress}` : '';
          const andText = statusChanged && progressChanged ? ' and ' : '';
          const changeDesc = `${statusText}${andText}${progressText}`;

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

  const approveOrder = useCallback((orderId: string) => {
    setOrders((current) => {
      const order = current.find((item) => item.id === orderId);
      if (!order) return current;

      const updated = current.map((item) =>
        item.id === orderId ? { ...item, status: 'Approved' as const } : item
      );

      if (firebaseDatabase) {
        set(ref(firebaseDatabase, 'orders'), sanitizeForFirebase(updated)).catch(() => { });
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
        set(ref(firebaseDatabase, 'orders'), sanitizeForFirebase(updated)).catch(() => { });
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
        set(ref(firebaseDatabase, 'orders'), sanitizeForFirebase(updated)).catch(() => { });
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
      const msgId = newMessageId();
      markMessageAsNotified(msgId);

      const msg: ChatMessage = {
        id: msgId,
        from: 'customer',
        senderName: customerName,
        text,
        time: nowTime(),
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
        seenBy: [],
      };

      const targetThreadId = optionalThreadId || `customer-${customerId}`;

      setThreads((prev) => {
        const existing = prev.find((t) => t.id === targetThreadId);
        let updated: ChatThread[];

        if (existing) {
          const updatedThread: ChatThread = {
            ...existing,
            customerId,
            customerName,
            messages: [...existing.messages, msg],
            unread: (existing.unread || 0) + 1,
            lastMessage: formatLastMessage(text, attachments),
            lastTime: 'Just now',
          };
          updated = prev.map((t) => (t.id === existing.id ? updatedThread : t));
        } else {
          const initialMessages: ChatMessage[] = [];
          if (targetThreadId === `customer-${customerId}`) {
            const welcomeId = Date.now() - 1000;
            markMessageAsNotified(welcomeId);
            initialMessages.push({
              id: welcomeId,
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
          updated = [newThread, ...prev];
        }

        if (firebaseDatabase) {
          set(ref(firebaseDatabase, 'chatState/threads'), sanitizeForFirebase(updated)).catch((err) => {
            console.warn('Firebase error sending customer message:', err);
          });
        }

        return updated;
      });

      const notifTitle = `New message from ${customerName}`;
      const notifBody = text.length > 60 ? text.slice(0, 60) + '…' : (text || (attachments && attachments.length > 0 ? 'Sent attachment' : 'New message'));
      const badgeCount = threads.reduce((sum, t) => sum + (t.unread || 0), 0) + 1;

      sendChatPushNotification({
        senderId: currentUser?.id || customerId,
        messageId: msgId,
        targetRole: 'admin',
        title: notifTitle,
        body: notifBody,
        threadId: targetThreadId,
        badgeCount,
      });
    },
    [threads, currentUser?.id, markMessageAsNotified]
  );

  const sendDesignerMessage = useCallback((threadId: string, designerName: string, text: string) => {
    const msgId = newMessageId();
    markMessageAsNotified(msgId);

    const msg: ChatMessage = {
      id: msgId,
      from: 'designer',
      senderName: designerName,
      text,
      time: nowTime(),
      seenBy: [],
    };

    setThreads((prev) => {
      const updated = prev.map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            messages: [...t.messages, msg],
            unread: (t.unread || 0) + 1,
            lastMessage: text,
            lastTime: 'Just now',
          };
        }
        return t;
      });

      if (firebaseDatabase) {
        set(ref(firebaseDatabase, 'chatState/threads'), sanitizeForFirebase(updated)).catch((err) => {
          console.warn('Firebase error sending designer message:', err);
        });
      }

      return updated;
    });

    const notifTitle = `New message from Designer (${designerName})`;
    const notifBody = text.length > 60 ? text.slice(0, 60) + '…' : text;
    const badgeCount = threads.reduce((sum, t) => sum + (t.unread || 0), 0) + 1;

    sendChatPushNotification({
      senderId: currentUser?.id || threadId,
      messageId: msgId,
      targetRole: 'admin',
      title: notifTitle,
      body: notifBody,
      threadId,
      badgeCount,
    });
  }, [threads, currentUser?.id, markMessageAsNotified]);

  const sendAdminMessage = useCallback((threadId: string, text: string, attachments: ChatAttachment[] = []) => {
    const msgId = newMessageId();
    markMessageAsNotified(msgId);

    const msg: ChatMessage = {
      id: msgId,
      from: 'admin',
      senderName: 'Dream Jewels Support',
      text,
      time: nowTime(),
      attachments: attachments.length > 0 ? attachments : undefined,
      seenBy: [],
    };

    setThreads((prev) => {
      const updated = prev.map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            messages: [...t.messages, msg],
            customerUnread: (t.customerUnread || 0) + 1,
            lastMessage: formatLastMessage(text, attachments),
            lastTime: 'Just now',
          };
        }
        return t;
      });

      if (firebaseDatabase) {
        set(ref(firebaseDatabase, 'chatState/threads'), sanitizeForFirebase(updated)).catch((err) => {
          console.warn('Firebase error sending admin message:', err);
        });
      }

      return updated;
    });

    const thread = threads.find((t) => t.id === threadId);
    if (thread) {
      const recipientRole = thread.participantRole === 'designer' ? 'designer' : 'customer';
      const notifTitle = 'New message from Support';
      const notifBody = text.length > 60 ? text.slice(0, 60) + '…' : (text || (attachments && attachments.length > 0 ? 'Sent attachment' : 'New message'));

      const matchedUser = users.find(
        (u) =>
          (thread.customerId && (u.id === thread.customerId || u.username?.toLowerCase() === thread.customerId.toLowerCase())) ||
          (thread.customerName && (u.name?.toLowerCase() === thread.customerName.toLowerCase() || u.username?.toLowerCase() === thread.customerName.toLowerCase()))
      );

      const effectiveTargetUserId = matchedUser?.id || thread.customerId || (thread.id.startsWith('customer-') ? thread.id.replace('customer-', '') : '');

      sendChatPushNotification({
        senderId: currentUser?.id || 'admin',
        messageId: msgId,
        targetUserId: effectiveTargetUserId || undefined,
        targetRole: recipientRole,
        title: notifTitle,
        body: notifBody,
        threadId,
        badgeCount: (thread.customerUnread || 0) + 1,
      });
    }
  }, [threads, currentUser?.id, users, markMessageAsNotified]);

  const markThreadRead = useCallback((threadId: string, as: 'admin' | 'customer' | 'designer') => {
    setThreads((prev) => {
      const target = prev.find((t) => t.id === threadId);
      if (!target) return prev;

      const unreadCount = as === 'admin' ? target.unread : target.customerUnread;
      if (unreadCount === 0) return prev;

      const updated = prev.map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            unread: as === 'admin' ? 0 : t.unread,
            customerUnread: as === 'customer' || as === 'designer' ? 0 : t.customerUnread,
            messages: t.messages.map((message) => {
              if (getMessageAudienceRole(t, message) !== as) return message;
              if (message.seenBy?.includes(as)) return message;
              return { ...message, seenBy: [...(message.seenBy ?? []), as] };
            }),
          };
        }
        return t;
      });

      if (firebaseDatabase) {
        set(ref(firebaseDatabase, 'chatState/threads'), sanitizeForFirebase(updated)).catch(() => {});
      }

      return updated;
    });

    setNotifications((prev) => {
      const updated = prev.map((n) => {
        if (n.role === as && n.type === 'chat' && (n.threadId === threadId || n.threadId?.includes(threadId))) {
          return { ...n, read: true };
        }
        return n;
      });
      if (firebaseDatabase) {
        set(ref(firebaseDatabase, 'chatState/notifications'), sanitizeForFirebase(updated)).catch(() => {});
      }
      return updated;
    });
  }, []);

  const markAllNotificationsRead = useCallback((role: 'customer' | 'admin' | 'designer', userId?: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => {
        if (n.role !== role) return n;
        if (role === 'customer' && userId && n.userId && n.userId !== userId) return n;
        if (role === 'designer' && userId && n.userId && n.userId !== userId) return n;
        return { ...n, read: true };
      });
      if (firebaseDatabase) {
        set(ref(firebaseDatabase, 'chatState/notifications'), sanitizeForFirebase(updated)).catch(() => {});
      }
      return updated;
    });

    setThreads((prev) => {
      const updated = prev.map((thread) => {
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
      });
      if (firebaseDatabase) {
        set(ref(firebaseDatabase, 'chatState/threads'), sanitizeForFirebase(updated)).catch(() => {});
      }
      return updated;
    });
  }, []);

  const markNotificationRead = useCallback((id: number) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      if (firebaseDatabase) {
        set(ref(firebaseDatabase, 'chatState/notifications'), sanitizeForFirebase(updated)).catch(() => {});
      }
      return updated;
    });
  }, []);

  const clearAllNotifications = useCallback((role?: 'customer' | 'admin' | 'designer', userId?: string) => {
    setNotifications((prev) => {
      let updated: AppNotification[] = [];
      if (role) {
        updated = prev.filter((n) => {
          if (n.role !== role) return true;
          if (role === 'customer' && userId && n.userId && n.userId !== userId) return true;
          if (role === 'designer' && userId && n.userId && n.userId !== userId) return true;
          return false;
        });
      }
      if (firebaseDatabase) {
        set(ref(firebaseDatabase, 'chatState/notifications'), sanitizeForFirebase(updated)).catch(() => {});
      }
      return updated;
    });
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
    [addNotification, currentUser?.role, currentUser?.id, currentUser?.name]
  );

  const seedOrderTestChats = useCallback(() => {
    setOrders(INITIAL_ORDERS);
    setThreads(INITIAL_THREADS);
    if (firebaseDatabase) {
      set(ref(firebaseDatabase, 'orders'), sanitizeForFirebase(INITIAL_ORDERS)).catch(() => { });
      set(ref(firebaseDatabase, 'chatState/threads'), sanitizeForFirebase(INITIAL_THREADS)).catch(() => { });
      set(ref(firebaseDatabase, 'chatState/notifications'), sanitizeForFirebase([])).catch(() => { });
    }
    addNotification({
      role: 'admin',
      title: 'Order Chats Initialized',
      body: '4 realistic order-wise test chat conversations synced to Firebase Realtime Database.',
      time: 'Just now',
      read: false,
      type: 'system',
    });
  }, [addNotification]);

  const deleteMessage = useCallback((threadId: string, messageId: number) => {
    setThreads((prev) => {
      const updated = prev.map((t) => {
        if (t.id !== threadId) return t;
        const filteredMessages = t.messages.filter((m) => m.id !== messageId);
        const lastMsg = filteredMessages[filteredMessages.length - 1];
        return {
          ...t,
          messages: filteredMessages,
          lastMessage: lastMsg ? formatLastMessage(lastMsg.text, lastMsg.attachments) : 'No messages',
          lastTime: lastMsg ? lastMsg.time : '',
        };
      });

      if (firebaseDatabase) {
        set(ref(firebaseDatabase, 'chatState/threads'), sanitizeForFirebase(updated)).catch(() => {});
      }

      return updated;
    });
  }, []);

  const deleteThread = useCallback((threadId: string) => {
    setThreads((prev) => {
      const updated = prev.filter((t) => t.id !== threadId);
      if (firebaseDatabase) {
        set(ref(firebaseDatabase, 'chatState/threads'), sanitizeForFirebase(updated)).catch(() => {});
      }
      return updated;
    });
  }, []);

  const addUser = useCallback((newUser: User & { password?: string }) => {
    setUsers((prev) => {
      const updated = [newUser, ...prev.filter((u) => u.id !== newUser.id)];
      if (firebaseDatabase) {
        set(ref(firebaseDatabase, 'users'), sanitizeForFirebase(updated)).catch(() => { });
      }
      return updated;
    });
  }, []);

  const deleteUser = useCallback((userId: string) => {
    setUsers((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      if (firebaseDatabase) {
        set(ref(firebaseDatabase, 'users'), sanitizeForFirebase(updated)).catch(() => { });
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
