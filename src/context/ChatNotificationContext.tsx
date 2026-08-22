import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onValue, ref, set } from 'firebase/database';
import { firebaseDatabase, isFirebaseConfigured } from '../services/firebase';

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
  title: string;
  body: string;
  time: string;
  read: boolean;
  type?: 'order' | 'chat';
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
  sendCustomerMessage: (customerId: string, customerName: string, text: string, optionalThreadId?: string) => void;
  sendDesignerMessage: (threadId: string, designerName: string, text: string) => void;
  sendAdminMessage: (threadId: string, text: string, attachments?: ChatAttachment[]) => void;
  markThreadRead: (threadId: string, as: 'admin' | 'customer' | 'designer') => void;
  getThreadByCustomer: (customerId: string) => ChatThread | undefined;
  getDesignerThread: (designerName: string) => ChatThread | undefined;
  ensureDesignerThread: (designerName: string, orderName?: string) => string;
  createThreadForOrder: (customerId: string, customerName: string, order: OrderDetails) => void;
  upsertOrder: (order: Order) => void;
  approveOrder: (orderId: string) => void;
  rejectOrder: (orderId: string, reason?: string) => void;
  deleteOrder: (orderId: string) => void;
  addNotification: (n: Omit<AppNotification, 'id'>) => void;
  markAllNotificationsRead: (role: 'customer' | 'admin' | 'designer') => void;
  markNotificationRead: (id: number) => void;
  getUnreadCount: (role: 'customer' | 'admin' | 'designer') => number;
  getChatUnreadCount: (role: 'customer' | 'admin' | 'designer') => number;
  deleteMessage: (threadId: string, messageId: number) => void;
}

const ChatNotificationContext = createContext<ChatNotificationContextValue | null>(null);
const CHAT_STORAGE_KEY = 'dream-jewels-chat-state';
const CHAT_CHANNEL_NAME = 'dream-jewels-live-chat';

// ─── Seed data ────────────────────────────────────────────────────────────────

const INITIAL_THREADS: ChatThread[] = [];
const INITIAL_ORDERS: Order[] = [];
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

/** Strips undefined properties so Firebase Realtime Database set() never rejects */
function sanitizeForFirebase<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_, val) => (val === undefined ? null : val)));
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ChatNotificationProvider({ children }: { children: React.ReactNode }) {
  const storedState = removeDeletedSeedData(loadStoredChatState());
  const [threads, setThreads] = useState<ChatThread[]>(storedState ? parseThreadsFromState(storedState.threads) : INITIAL_THREADS);
  const [orders, setOrders] = useState<Order[]>(storedState ? readOrders(storedState) : INITIAL_ORDERS);
  const [users, setUsers] = useState<User[]>(storedState?.users ? parseUsersFromState(storedState.users) : MOCK_USERS);
  const [notifications, setNotifications] = useState<AppNotification[]>(storedState ? parseNotificationsFromState(storedState.notifications) : INITIAL_NOTIFICATIONS);
  const [notifCounter, setNotifCounter] = useState(storedState?.notifCounter ?? 9000);
  const clientIdRef = useRef(`chat-client-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const lastSerializedStateRef = useRef('');
  const channelRef = useRef<BroadcastChannel | null>(null);

  const addNotification = useCallback((n: Omit<AppNotification, 'id'> | Array<Omit<AppNotification, 'id'>>) => {
    const items = Array.isArray(n) ? n : [n];
    setNotifications((prev) => {
      const newItems = items.map((item, idx) => ({
        ...item,
        id: Date.now() + idx,
      }));
      return [...newItems, ...prev];
    });
    setNotifCounter((c) => c + items.length);
  }, []);

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
      // 1. Orders Node Listener (/orders)
      const ordersRef = ref(firebaseDatabase, 'orders');
      const unsubOrders = onValue(ordersRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          const parsed = parseOrdersFromState(val);
          setOrders(parsed);
        }
      }, (err) => console.warn('Firebase RTDB orders sync:', err.message));
      unsubs.push(unsubOrders);

      // 2. Users Node Listener (/users)
      const usersRef = ref(firebaseDatabase, 'users');
      const unsubUsers = onValue(usersRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          const parsed = parseUsersFromState(val);
          setUsers(parsed);
        } else {
          // Initialize users in Firebase if not set
          try {
            set(usersRef, sanitizeForFirebase(MOCK_USERS));
          } catch {
            // ignore
          }
        }
      }, (err) => console.warn('Firebase RTDB users sync:', err.message));
      unsubs.push(unsubUsers);

      // 3. Chats / Main State Listener (/chats & /chatState)
      const chatStateRef = ref(firebaseDatabase, 'chatState');
      const unsubChat = onValue(chatStateRef, (snapshot) => {
        const value = snapshot.val() as StoredChatState | null;
        if (value) {
          applyChatState(value);
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
  }, [applyChatState, applyStoredState]);

  // ─── Sync changes to Firebase & localStorage ──────────────────────────────────
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

    lastSerializedStateRef.current = serialized;

    // Update LocalStorage & BroadcastChannel immediately across tabs
    try {
      window.localStorage.setItem(CHAT_STORAGE_KEY, serialized);
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
    channelRef.current?.postMessage({
      source: clientIdRef.current,
      state: serialized,
    });

    // Write to dedicated Firebase Realtime Database nodes:
    // /orders, /users, and /chatState
    if (firebaseDatabase) {
      try {
        // Node 1: Orders (dedicated /orders node)
        set(ref(firebaseDatabase, 'orders'), sanitizeForFirebase(orders)).catch(() => {});

        // Node 2: Users (dedicated /users node)
        set(ref(firebaseDatabase, 'users'), sanitizeForFirebase(users)).catch(() => {});

        // Node 3: Chat State & Threads (/chatState & /chats)
        set(ref(firebaseDatabase, 'chatState'), payload).catch((err) => {
          console.warn('Firebase RTDB write note (ensure Firebase Rules are set to read: true, write: true):', err.message || err);
        });
      } catch (e) {
        console.error('Failed to save state to Firebase:', e);
      }
    }
  }, [threads, orders, users, notifications, notifCounter]);

  const ensureDesignerThread = useCallback((designerName: string, orderName?: string) => {
    const threadId = createDesignerThreadId(designerName);

    setThreads((prev) => {
      if (prev.some((t) => t.id === threadId)) return prev;

      const introText = orderName
        ? `Order discussion started for ${orderName}.`
        : 'Designer conversation started.';

      const newThread: ChatThread = {
        id: threadId,
        customerName: designerName,
        customerId: threadId,
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
        const existing = prev.find(
          (t) =>
            t.participantRole !== 'designer' &&
            (t.customerId === customerId || t.customerName.toLowerCase() === customerName.toLowerCase())
        );
        if (existing) {
          return prev.map((t) =>
            t.id === existing.id
              ? {
                  ...t,
                  customerId,
                  messages: [...t.messages, greetMsg, detailMsg],
                  unread: t.unread + 1,        // admin sees new messages
                  customerUnread: t.customerUnread + 1,
                  lastMessage: `New order: ${orderName}`,
                  lastTime: 'Just now',
                }
              : t
          );
        }
        const newThread: ChatThread = {
          id: `customer-${customerId}`,
          customerName,
          customerId,
          participantRole: 'customer',
          messages: [greetMsg, detailMsg],
          unread: 1,           // admin has unread order details
          customerUnread: 1,   // customer gets greeting
          lastMessage: `New order: ${orderName}`,
          lastTime: 'Just now',
        };
        return [newThread, ...prev];
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

      setOrders((prev) => [newOrder, ...prev.filter((order) => order.id !== orderId)]);

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
          title: `Order placed: ${orderName}`,
          body: 'Your custom order has been received. Check your chat for updates.',
          time: 'Just now',
          read: false,
          type: 'chat',
          threadId: `customer-${customerId}`,
        }
      ]);
    },
    [addNotification]
  );

  const upsertOrder = useCallback((order: Order) => {
    const existing = orders.find((item) => item.id === order.id);

    setOrders((current) => {
      const exists = current.some((item) => item.id === order.id);
      return exists
        ? current.map((item) => (item.id === order.id ? order : item))
        : [order, ...current];
    });

    if (existing) {
      const statusChanged = existing.status !== order.status;
      const progressChanged = existing.progress !== order.progress;

      if (statusChanged || progressChanged) {
        const statusText = statusChanged ? `status to ${order.status}` : '';
        const progressText = progressChanged ? `progress to ${order.progress}` : '';
        const andText = statusChanged && progressChanged ? ' and ' : '';
        const changeDesc = `${statusText}${andText}${progressText}`;

        addNotification([
          {
            role: 'customer',
            title: `Order Update: ${order.name}`,
            body: `Your order has been updated: ${changeDesc}.`,
            time: 'Just now',
            read: false,
            type: 'order',
            orderId: order.id,
          },
          {
            role: 'admin',
            title: `Order Update: ${order.name}`,
            body: `Designer ${order.designerName} updated ${changeDesc}.`,
            time: 'Just now',
            read: false,
            type: 'order',
            orderId: order.id,
          }
        ]);
      }
    }
  }, [orders, addNotification]);

  // Approval only flips the status. It does NOT message or push data to the
  // designer -- that only happens when the admin explicitly generates and
  // sends a PDF brief (see OrdersPage's Generate/Send PDF actions).
  const approveOrder = useCallback((orderId: string) => {
    const order = orders.find((item) => item.id === orderId);
    if (!order) return;

    setOrders((current) =>
      current.map((item) => (item.id === orderId ? { ...item, status: 'Approved' as const } : item))
    );

    addNotification({
      role: 'customer',
      title: `Order approved: ${order.name}`,
      body: 'Your custom order has been approved and moved into design.',
      time: 'Just now',
      read: false,
      type: 'order',
      orderId: order.id,
    });
  }, [orders, addNotification]);

  const deleteOrder = useCallback((orderId: string) => {
    setOrders((current) => current.filter((item) => item.id !== orderId));
  }, []);

  const rejectOrder = useCallback((orderId: string, reason?: string) => {
    const order = orders.find((item) => item.id === orderId);
    if (!order) return;

    const rejectedOrder: Order = {
      ...order,
      status: 'Rejected',
      rejectionReason: reason?.trim() || undefined,
    };

    setOrders((current) =>
      current.map((item) => (item.id === orderId ? rejectedOrder : item))
    );

    addNotification({
      role: 'customer',
      title: `Order rejected: ${rejectedOrder.name}`,
      body: rejectedOrder.rejectionReason
        ? `Reason: ${rejectedOrder.rejectionReason}`
        : 'Your custom order could not be approved at this time.',
      time: 'Just now',
      read: false,
      type: 'order',
      orderId: rejectedOrder.id,
    });
  }, [orders, addNotification]);

  const sendCustomerMessage = useCallback(
    (customerId: string, customerName: string, text: string, optionalThreadId?: string) => {
      const msg: ChatMessage = {
        id: newMessageId(),
        from: 'customer',
        senderName: customerName,
        text,
        time: nowTime(),
        seenBy: [],
      };
      setThreads((prev) => {
        const existing = prev.find(
          (t) => optionalThreadId ? t.id === optionalThreadId : (
            t.participantRole !== 'designer' &&
            (t.customerId === customerId || t.customerName.toLowerCase() === customerName.toLowerCase())
          )
        );
        if (existing) {
          return prev.map((t) =>
            t.id === existing.id
              ? { ...t, customerId, messages: [...t.messages, msg], unread: t.unread + 1, lastMessage: text, lastTime: 'Just now' }
              : t
          );
        }
        const newThread: ChatThread = {
          id: `customer-${customerId}`,
          customerName,
          customerId,
          participantRole: 'customer',
          messages: [msg],
          unread: 1,
          customerUnread: 0,
          lastMessage: text,
          lastTime: 'Just now',
        };
        return [newThread, ...prev];
      });

      addNotification({
        role: 'admin',
        title: `New message from ${customerName}`,
        body: text.length > 60 ? text.slice(0, 60) + '…' : text,
        time: 'Just now',
        read: false,
        type: 'chat',
        threadId: `customer-${customerId}`,
      });
    },
    [addNotification]
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

    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? { ...t, messages: [...t.messages, msg], unread: t.unread + 1, lastMessage: text, lastTime: 'Just now' }
          : t
      )
    );

    addNotification({
      role: 'admin',
      title: `New message from Designer (${designerName})`,
      body: text.length > 60 ? text.slice(0, 60) + '…' : text,
      time: 'Just now',
      read: false,
      type: 'chat',
      threadId: threadId,
    });
  }, [addNotification]);

  const sendAdminMessage = useCallback((threadId: string, text: string, attachments: ChatAttachment[] = []) => {
    const msg: ChatMessage = {
      id: newMessageId(),
      from: 'admin',
      senderName: 'Dream Jewels Support',
      text,
      time: nowTime(),
      attachments,
      seenBy: [],
    };
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              messages: [...t.messages, msg],
              customerUnread: t.customerUnread + 1,
              lastMessage: formatLastMessage(text, attachments),
              lastTime: 'Just now',
            }
          : t
      )
    );

    const thread = threads.find((t) => t.id === threadId);
    if (thread) {
      const recipientRole = thread.participantRole === 'designer' ? 'designer' : 'customer';
      addNotification({
        role: recipientRole,
        title: 'New message from Support',
        body: text.length > 60 ? text.slice(0, 60) + '…' : text,
        time: 'Just now',
        read: false,
        type: 'chat',
        threadId: threadId,
      });
    }
  }, [threads, addNotification]);

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
    setNotifications((prev) => prev.filter((n) => n.role !== as || !isChatNotification(n)));
  }, []);



  const markAllNotificationsRead = useCallback((role: 'customer' | 'admin' | 'designer') => {
    setNotifications((prev) => prev.map((n) => (n.role === role ? { ...n, read: true } : n)));
    setThreads((prev) =>
      prev.map((thread) => ({
        ...thread,
        unread: role === 'admin' ? 0 : thread.unread,
        customerUnread: role === 'customer' || role === 'designer' ? 0 : thread.customerUnread,
      }))
    );
  }, []);

  const markNotificationRead = useCallback((id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const getUnreadCount = useCallback(
    (role: 'customer' | 'admin' | 'designer') =>
      notifications.filter((n) => n.role === role && !n.read).length,
    [notifications]
  );

  const getChatUnreadCount = useCallback(
    (role: 'customer' | 'admin' | 'designer') => {
      if (role === 'admin') {
        return threads.reduce((sum, thread) => sum + thread.unread, 0);
      }

      return threads
        .filter((thread) => thread.participantRole === role)
        .reduce((sum, thread) => sum + thread.customerUnread, 0);
    },
    [threads]
  );

  const deleteMessage = useCallback((threadId: string, messageId: number) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== threadId) return t;
        const filteredMessages = t.messages.filter((m) => m.id !== messageId);
        const lastMsgObj = filteredMessages[filteredMessages.length - 1];
        return {
          ...t,
          messages: filteredMessages,
          lastMessage: lastMsgObj ? lastMsgObj.text : '',
          lastTime: lastMsgObj ? lastMsgObj.time : '',
        };
      })
    );
  }, []);

  return (
    <ChatNotificationContext.Provider
      value={{
        threads,
        orders,
        notifications,
        sendCustomerMessage,
        sendDesignerMessage,
        sendAdminMessage,
        markThreadRead,
        getThreadByCustomer,
        getDesignerThread,
        ensureDesignerThread,
        createThreadForOrder,
        upsertOrder,
        approveOrder,
        rejectOrder,
        deleteOrder,
        addNotification,
        markAllNotificationsRead,
        markNotificationRead,
        getUnreadCount,
        getChatUnreadCount,
        deleteMessage,
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
