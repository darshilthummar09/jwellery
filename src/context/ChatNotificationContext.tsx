import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: number;
  from: 'customer' | 'admin';
  senderName: string;
  text: string;
  time: string;
}

export interface ChatThread {
  id: string;
  customerName: string;
  customerId: string;
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
  hasImage?: boolean;
}

interface ChatNotificationContextValue {
  threads: ChatThread[];
  notifications: AppNotification[];
  sendCustomerMessage: (customerId: string, customerName: string, text: string) => void;
  sendAdminMessage: (threadId: string, text: string) => void;
  markThreadRead: (threadId: string, as: 'admin' | 'customer') => void;
  getThreadByCustomer: (customerId: string) => ChatThread | undefined;
  createThreadForOrder: (customerId: string, customerName: string, order: OrderDetails) => void;
  addNotification: (n: Omit<AppNotification, 'id'>) => void;
  markAllNotificationsRead: (role: 'customer' | 'admin' | 'designer') => void;
  markNotificationRead: (id: number) => void;
  getUnreadCount: (role: 'customer' | 'admin' | 'designer') => number;
}

const ChatNotificationContext = createContext<ChatNotificationContextValue | null>(null);

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_THREADS: ChatThread[] = [
  {
    id: 'customer-priya',
    customerName: 'Priya Patel',
    customerId: 'priya',
    messages: [
      { id: 1, from: 'customer', senderName: 'Priya Patel', text: 'Hi! Can we update the ring size to 22?', time: '10:00 AM' },
      { id: 2, from: 'admin', senderName: 'Dream Jewels Support', text: 'Of course! We will update it right away.', time: '10:02 AM' },
    ],
    unread: 2,
    customerUnread: 0,
    lastMessage: 'Can we update the ring size?',
    lastTime: '2m ago',
  },
  {
    id: 'customer-anita',
    customerName: 'Anita Mehta',
    customerId: 'anita',
    messages: [
      { id: 1, from: 'customer', senderName: 'Anita Mehta', text: 'Thank you for the update!', time: '9:00 AM' },
    ],
    unread: 0,
    customerUnread: 0,
    lastMessage: 'Thank you for the update!',
    lastTime: '1h ago',
  },
  {
    id: 'customer-sunita',
    customerName: 'Sunita Roy',
    customerId: 'sunita',
    messages: [
      { id: 1, from: 'customer', senderName: 'Sunita Roy', text: 'What is the estimated delivery date?', time: '8:00 AM' },
    ],
    unread: 1,
    customerUnread: 0,
    lastMessage: 'What is the estimated delivery date?',
    lastTime: '3h ago',
  },
];

const SEED_NOTIFICATIONS: AppNotification[] = [
  { id: 1, role: 'customer', title: 'Your ring is in final polishing', body: 'Your Solitaire Engagement Ring is nearly ready!', time: '2 min ago', read: false },
  { id: 2, role: 'customer', title: 'New message from support', body: 'Dream Jewels Support sent you a message.', time: '1 hour ago', read: false },
  { id: 3, role: 'customer', title: 'Order confirmed: Diamond Pendant', body: 'Your order has been confirmed and is in design.', time: '2 days ago', read: true },
  { id: 1000, role: 'admin', title: 'New custom order placed', body: 'A customer placed a new custom jewellery order.', time: '5 min ago', read: false },
  { id: 1001, role: 'admin', title: 'Customer message received', body: 'Priya Patel sent a new message.', time: '2 min ago', read: false },
  { id: 2000, role: 'designer', title: 'New project assigned: Patel Wedding Set', body: 'High priority. Due 20 Jul.', time: '5 min ago', read: false },
  { id: 2001, role: 'designer', title: 'Review requested: Engagement Ring', body: 'Admin has requested a design review.', time: '2 hours ago', read: false },
];

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ChatNotificationProvider({ children }: { children: React.ReactNode }) {
  const [threads, setThreads] = useState<ChatThread[]>(SEED_THREADS);
  const [notifications, setNotifications] = useState<AppNotification[]>(SEED_NOTIFICATIONS);
  const [notifCounter, setNotifCounter] = useState(9000);

  const nowTime = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getThreadByCustomer = useCallback(
    (customerId: string) => threads.find((t) => t.customerId === customerId),
    [threads]
  );

  const createThreadForOrder = useCallback(
    (customerId: string, customerName: string, order: OrderDetails) => {
      const orderName = order.name;

      // Message 1: Greeting visible to the customer
      const greetMsg: ChatMessage = {
        id: Date.now(),
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: `👋 Hi ${customerName}! Your custom order "${orderName}" has been received. Our team will review the details and get back to you shortly.`,
        time: nowTime(),
      };

      // Message 2: Full order details card (also visible to both in thread)
      const lines: string[] = [
        `📋 ORDER DETAILS — ${orderName}`,
        `──────────────────────────`,
        `👤 Customer   : ${customerName}`,
        `💍 Category   : ${order.category}`,
        `⚙️  Metal      : ${order.metal} (${order.karat})`,
      ];
      if (order.size)        lines.push(`📏 Size       : No. ${order.size}`);
      if (order.weight)      lines.push(`⚖️  Weight     : ${order.weight}`);
      lines.push(`💰 Budget     : ${order.budget}`);
      if (order.deliveryDate) lines.push(`📅 Placed On  : ${order.deliveryDate}`);
      if (order.notes)       lines.push(`📝 Notes      : ${order.notes}`);
      if (order.hasImage)    lines.push(`🖼️  Image      : Sample image attached`);
      lines.push(`──────────────────────────`);
      lines.push(`🔖 Status     : In Design`);

      const detailMsg: ChatMessage = {
        id: Date.now() + 1,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: lines.join('\n'),
        time: nowTime(),
      };

      const systemMsg = greetMsg;

      setThreads((prev) => {
        const existing = prev.find((t) => t.customerId === customerId);
        if (existing) {
          return prev.map((t) =>
            t.customerId === customerId
              ? {
                  ...t,
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
          messages: [greetMsg, detailMsg],
          unread: 1,           // admin has unread order details
          customerUnread: 1,   // customer gets greeting
          lastMessage: `New order: ${orderName}`,
          lastTime: 'Just now',
        };
        return [newThread, ...prev];
      });

      setNotifCounter((c) => {
        const id = c + 1;
        setNotifications((prev) => [
          {
            id,
            role: 'admin',
            title: `New order from ${customerName}`,
            body: `"${orderName}" submitted for review.`,
            time: 'Just now',
            read: false,
          },
          ...prev,
        ]);
        // Customer notification: order placed
        setNotifications((prev) => [
          {
            id: id + 1,
            role: 'customer',
            title: `Order placed: ${orderName}`,
            body: 'Your custom order has been received. Check your chat for updates.',
            time: 'Just now',
            read: false,
          },
          ...prev,
        ]);
        return id + 1;
      });
    },
    []
  );

  const sendCustomerMessage = useCallback(
    (customerId: string, customerName: string, text: string) => {
      const msg: ChatMessage = {
        id: Date.now(),
        from: 'customer',
        senderName: customerName,
        text,
        time: nowTime(),
      };
      setThreads((prev) => {
        const existing = prev.find((t) => t.customerId === customerId);
        if (existing) {
          return prev.map((t) =>
            t.customerId === customerId
              ? { ...t, messages: [...t.messages, msg], unread: t.unread + 1, lastMessage: text, lastTime: 'Just now' }
              : t
          );
        }
        const newThread: ChatThread = {
          id: `customer-${customerId}`,
          customerName,
          customerId,
          messages: [msg],
          unread: 1,
          customerUnread: 0,
          lastMessage: text,
          lastTime: 'Just now',
        };
        return [newThread, ...prev];
      });

      setNotifCounter((c) => {
        const id = c + 1;
        setNotifications((prev) => [
          {
            id,
            role: 'admin',
            title: `New message from ${customerName}`,
            body: text.length > 60 ? text.slice(0, 60) + '…' : text,
            time: 'Just now',
            read: false,
          },
          ...prev,
        ]);
        return id;
      });
    },
    []
  );

  const sendAdminMessage = useCallback((threadId: string, text: string) => {
    const msg: ChatMessage = {
      id: Date.now(),
      from: 'admin',
      senderName: 'Dream Jewels Support',
      text,
      time: nowTime(),
    };
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? { ...t, messages: [...t.messages, msg], customerUnread: t.customerUnread + 1, lastMessage: text, lastTime: 'Just now' }
          : t
      )
    );
  }, []);

  const markThreadRead = useCallback((threadId: string, as: 'admin' | 'customer') => {
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? { ...t, unread: as === 'admin' ? 0 : t.unread, customerUnread: as === 'customer' ? 0 : t.customerUnread }
          : t
      )
    );
  }, []);

  const addNotification = useCallback((n: Omit<AppNotification, 'id'>) => {
    setNotifCounter((c) => {
      const id = c + 1;
      setNotifications((prev) => [{ ...n, id }, ...prev]);
      return id;
    });
  }, []);

  const markAllNotificationsRead = useCallback((role: 'customer' | 'admin' | 'designer') => {
    setNotifications((prev) => prev.map((n) => (n.role === role ? { ...n, read: true } : n)));
  }, []);

  const markNotificationRead = useCallback((id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const getUnreadCount = useCallback(
    (role: 'customer' | 'admin' | 'designer') =>
      notifications.filter((n) => n.role === role && !n.read).length,
    [notifications]
  );

  return (
    <ChatNotificationContext.Provider
      value={{
        threads,
        notifications,
        sendCustomerMessage,
        sendAdminMessage,
        markThreadRead,
        getThreadByCustomer,
        createThreadForOrder,
        addNotification,
        markAllNotificationsRead,
        markNotificationRead,
        getUnreadCount,
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
