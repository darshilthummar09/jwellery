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
  type?: 'order' | 'chat' | 'project';
  projectId?: string;
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

export type ProjectStatus = 'Pending Approval' | 'Approved' | 'Rejected' | 'In Progress' | 'Review' | 'Completed';

export interface Project {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  designerName: string;
  status: ProjectStatus;
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
  projects: Project[];
  notifications: AppNotification[];
  sendCustomerMessage: (customerId: string, customerName: string, text: string, optionalThreadId?: string) => void;
  sendDesignerMessage: (threadId: string, designerName: string, text: string) => void;
  sendAdminMessage: (threadId: string, text: string, attachments?: ChatAttachment[]) => void;
  markThreadRead: (threadId: string, as: 'admin' | 'customer' | 'designer') => void;
  getThreadByCustomer: (customerId: string) => ChatThread | undefined;
  getDesignerThread: (designerName: string) => ChatThread | undefined;
  ensureDesignerThread: (designerName: string, projectName?: string) => string;
  createThreadForOrder: (customerId: string, customerName: string, order: OrderDetails) => void;
  upsertProject: (project: Project) => void;
  approveProject: (projectId: string) => void;
  rejectProject: (projectId: string, reason?: string) => void;
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
const INITIAL_PROJECTS: Project[] = [];
const DEFAULT_DESIGNER_NAME = 'Riya Sharma';

const createDesignerThreadId = (designerName: string) =>
  `designer-${designerName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

const formatLastMessage = (text: string, attachments?: ChatAttachment[]) => {
  if (text.trim()) return text.trim();
  if (!attachments || attachments.length === 0) return '';
  return attachments.length === 1 ? `Sent ${attachments[0].name}` : `Sent ${attachments.length} files`;
};

function loadStoredChatState() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as {
      threads?: ChatThread[];
      projects?: Project[];
      notifications?: AppNotification[];
      notifCounter?: number;
    };
  } catch {
    return null;
  }
}

interface StoredChatState {
  threads?: ChatThread[];
  projects?: Project[];
  notifications?: AppNotification[];
  notifCounter?: number;
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

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ChatNotificationProvider({ children }: { children: React.ReactNode }) {
  const storedState = removeDeletedSeedData(loadStoredChatState());
  const [threads, setThreads] = useState<ChatThread[]>(storedState?.threads ?? INITIAL_THREADS);
  const [projects, setProjects] = useState<Project[]>(storedState?.projects ?? INITIAL_PROJECTS);
  const [notifications, setNotifications] = useState<AppNotification[]>(storedState?.notifications ?? INITIAL_NOTIFICATIONS);
  const [notifCounter, setNotifCounter] = useState(storedState?.notifCounter ?? 9000);
  const [remoteReady, setRemoteReady] = useState(!isFirebaseConfigured);
  const clientIdRef = useRef(`chat-client-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const lastSerializedStateRef = useRef('');
  const channelRef = useRef<BroadcastChannel | null>(null);
  const initialStateRef = useRef({ threads, projects, notifications, notifCounter });

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

  const applyStoredState = useCallback((raw: string | null) => {
    const stored = parseStoredChatState(raw);
    if (!stored) return;

    const serialized = JSON.stringify(stored);
    if (serialized === lastSerializedStateRef.current) return;

    lastSerializedStateRef.current = serialized;
    const sanitized = removeDeletedSeedData(stored);
    if (!sanitized) return;

    setThreads(sanitized.threads ?? INITIAL_THREADS);
    setProjects(sanitized.projects ?? INITIAL_PROJECTS);
    setNotifications(sanitized.notifications ?? INITIAL_NOTIFICATIONS);
    setNotifCounter(sanitized.notifCounter ?? 9000);
  }, []);

  const applyChatState = useCallback((stored: StoredChatState) => {
    const sanitized = removeDeletedSeedData(stored);
    if (!sanitized) return;

    const serialized = JSON.stringify(sanitized);
    if (serialized === lastSerializedStateRef.current) return;

    lastSerializedStateRef.current = serialized;
    setThreads(sanitized.threads ?? INITIAL_THREADS);
    setProjects(sanitized.projects ?? INITIAL_PROJECTS);
    setNotifications(sanitized.notifications ?? INITIAL_NOTIFICATIONS);
    setNotifCounter(sanitized.notifCounter ?? 9000);
  }, []);

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

    let unsubscribeFirebase: (() => void) | undefined;
    let fallbackTimer: NodeJS.Timeout | undefined;

    if (firebaseDatabase) {
      const chatStateRef = ref(firebaseDatabase, 'chatState');
      
      // If Firebase takes more than 2.5 seconds to reply, fallback to local storage
      fallbackTimer = setTimeout(() => {
        console.warn('Firebase RTDB connection timeout. Falling back to local storage.');
        setRemoteReady(true);
      }, 2500);

      unsubscribeFirebase = onValue(chatStateRef, (snapshot) => {
        if (fallbackTimer) clearTimeout(fallbackTimer);
        const value = snapshot.val() as StoredChatState | null;
        if (value) {
          const sanitized = removeDeletedSeedData(value);
          if (sanitized && JSON.stringify(sanitized) !== JSON.stringify(value)) {
            try {
              set(chatStateRef, JSON.parse(JSON.stringify(sanitized)));
            } catch (e) {
              console.error('Failed to update sanitized state in Firebase:', e);
            }
          }
          applyChatState(sanitized ?? value);
        } else {
          try {
            set(chatStateRef, JSON.parse(JSON.stringify(initialStateRef.current)));
          } catch (e) {
            console.error('Failed to initialize Firebase state:', e);
          }
        }
        setRemoteReady(true);
      });
    }

    return () => {
      window.removeEventListener('storage', handleStorage);
      channelRef.current?.close();
      channelRef.current = null;
      unsubscribeFirebase?.();
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [applyChatState, applyStoredState]);

  useEffect(() => {
    const serialized = JSON.stringify({ threads, projects, notifications, notifCounter });
    if (serialized === lastSerializedStateRef.current) return;

    // Always update local storage and notify other tabs immediately
    lastSerializedStateRef.current = serialized;
    try {
      window.localStorage.setItem(CHAT_STORAGE_KEY, serialized);
    } catch (e) {
      console.warn('Failed to save state to localStorage (likely quota exceeded):', e);
    }
    channelRef.current?.postMessage({
      source: clientIdRef.current,
      state: serialized,
    });

    // Write to Firebase only if remote is ready
    if (remoteReady && firebaseDatabase) {
      try {
        const cleanState = JSON.parse(serialized);
        set(ref(firebaseDatabase, 'chatState'), cleanState);
      } catch (e) {
        console.error('Failed to save state to Firebase:', e);
      }
    }
  }, [threads, projects, notifications, notifCounter, remoteReady]);

  const buildProjectDetailsText = (project: Project) => {
    const lines = [
      `Project: ${project.name}`,
      `Customer: ${project.customerName}`,
      `Category: ${project.category}`,
      `Metal: ${project.metal} (${project.karat})`,
      `Budget: ${project.budget}`,
      `Due: ${project.due}`,
      `Priority: ${project.priority}`,
      `Project ID: ${project.id}`,
    ];

    if (project.size) lines.push(`Size: No. ${project.size}`);
    if (project.weight) lines.push(`Weight: ${project.weight}`);
    if (project.notes) lines.push(`Notes: ${project.notes}`);
    if (project.image) lines.push('Sample image/sketch attached in the customer order.');

    return lines.join('\n');
  };

  const ensureDesignerThread = useCallback((designerName: string, projectName?: string) => {
    const threadId = createDesignerThreadId(designerName);

    setThreads((prev) => {
      if (prev.some((t) => t.id === threadId)) return prev;

      const introText = projectName
        ? `Project discussion started for ${projectName}.`
        : 'Designer conversation started.';

      const newThread: ChatThread = {
        id: threadId,
        customerName: designerName,
        customerId: threadId,
        participantRole: 'designer',
        messages: [
          {
            id: Date.now(),
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
      const projectId = `PRJ-${Date.now()}`;

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
      lines.push(`💰 Budget     : ${order.budget}`);
      if (order.deliveryDate) lines.push(`📅 Placed On  : ${order.deliveryDate}`);
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

      const newProject: Project = {
        id: projectId,
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
        created: order.deliveryDate ?? new Date().toLocaleDateString(),
        progress: '0%',
      };

      setProjects((prev) => [newProject, ...prev.filter((project) => project.id !== projectId)]);

      addNotification([
        {
          role: 'admin',
          title: `New order from ${customerName}`,
          body: `"${orderName}" submitted for review.`,
          time: 'Just now',
          read: false,
          type: 'order',
          projectId: projectId,
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

  const upsertProject = useCallback((project: Project) => {
    const existing = projects.find((item) => item.id === project.id);

    setProjects((current) => {
      const exists = current.some((item) => item.id === project.id);
      return exists
        ? current.map((item) => (item.id === project.id ? project : item))
        : [project, ...current];
    });

    if (existing) {
      const statusChanged = existing.status !== project.status;
      const progressChanged = existing.progress !== project.progress;

      if (statusChanged || progressChanged) {
        const statusText = statusChanged ? `status to ${project.status}` : '';
        const progressText = progressChanged ? `progress to ${project.progress}` : '';
        const andText = statusChanged && progressChanged ? ' and ' : '';
        const changeDesc = `${statusText}${andText}${progressText}`;

        addNotification([
          {
            role: 'customer',
            title: `Project Update: ${project.name}`,
            body: `Your project has been updated: ${changeDesc}.`,
            time: 'Just now',
            read: false,
            type: 'project',
            projectId: project.id,
          },
          {
            role: 'admin',
            title: `Project Update: ${project.name}`,
            body: `Designer ${project.designerName} updated ${changeDesc}.`,
            time: 'Just now',
            read: false,
            type: 'project',
            projectId: project.id,
          }
        ]);
      }
    }
  }, [projects, addNotification]);

  const approveProject = useCallback((projectId: string) => {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;

    const approvedProject: Project = {
      ...project,
      status: 'Approved',
      progress: project.progress === '0%' ? '10%' : project.progress,
    };

    setProjects((current) =>
      current.map((item) => (item.id === projectId ? approvedProject : item))
    );

    const designerThreadId = createDesignerThreadId(approvedProject.designerName);

    // Extract and format customer images into chat attachments
    const attachments: ChatAttachment[] = [];
    if (approvedProject.image) {
      attachments.push({
        id: Date.now() + 999,
        name: `${approvedProject.name}_design.png`,
        size: 450000,
        type: 'image/png',
        url: approvedProject.image,
        kind: 'image',
      });
    }
    if (approvedProject.images && approvedProject.images.length > 0) {
      approvedProject.images.forEach((img, idx) => {
        if (img.url !== approvedProject.image) {
          attachments.push({
            id: Date.now() + idx,
            name: img.name || `attachment_${idx}.png`,
            size: img.size || 200000,
            type: img.type || 'image/png',
            url: img.url,
            kind: 'image',
          });
        }
      });
    }

    const detailText = `Approved project assigned:\n${buildProjectDetailsText(approvedProject)}`;
    const msg: ChatMessage = {
      id: Date.now(),
      from: 'admin',
      senderName: 'Dream Jewels Support',
      text: detailText,
      time: nowTime(),
      attachments: attachments.length > 0 ? attachments : undefined,
      seenBy: [],
    };

    setThreads((prev) =>
      prev.some((thread) => thread.id === designerThreadId)
        ? prev.map((thread) =>
            thread.id === designerThreadId
              ? {
                  ...thread,
                  messages: [...thread.messages, msg],
                  customerUnread: thread.customerUnread + 1,
                  lastMessage: `Assigned: ${approvedProject.name}`,
                  lastTime: 'Just now',
                }
              : thread
          )
        : [
            {
              id: designerThreadId,
              customerName: approvedProject.designerName,
              customerId: designerThreadId,
              participantRole: 'designer',
              messages: [msg],
              unread: 0,
              customerUnread: 1,
              lastMessage: `Assigned: ${approvedProject.name}`,
              lastTime: 'Just now',
            },
            ...prev,
          ]
    );

    addNotification([
      {
        role: 'customer',
        title: `Project approved: ${approvedProject.name}`,
        body: 'Your custom order has been approved and moved into design.',
        time: 'Just now',
        read: false,
        type: 'project',
        projectId: approvedProject.id,
      },
      {
        role: 'designer',
        title: `New project assigned: ${approvedProject.name}`,
        body: `${approvedProject.customerName}'s full project details are ready for design.`,
        time: 'Just now',
        read: false,
        type: 'project',
        projectId: approvedProject.id,
      }
    ]);
  }, [projects, addNotification]);

  const rejectProject = useCallback((projectId: string, reason?: string) => {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;

    const rejectedProject: Project = {
      ...project,
      status: 'Rejected',
      rejectionReason: reason?.trim() || undefined,
    };

    setProjects((current) =>
      current.map((item) => (item.id === projectId ? rejectedProject : item))
    );

    addNotification({
      role: 'customer',
      title: `Project rejected: ${rejectedProject.name}`,
      body: rejectedProject.rejectionReason
        ? `Reason: ${rejectedProject.rejectionReason}`
        : 'Your custom order could not be approved at this time.',
      time: 'Just now',
      read: false,
      type: 'project',
      projectId: rejectedProject.id,
    });
  }, [projects, addNotification]);

  const sendCustomerMessage = useCallback(
    (customerId: string, customerName: string, text: string, optionalThreadId?: string) => {
      const msg: ChatMessage = {
        id: Date.now(),
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
      id: Date.now(),
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
      id: Date.now(),
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
        projects,
        notifications,
        sendCustomerMessage,
        sendDesignerMessage,
        sendAdminMessage,
        markThreadRead,
        getThreadByCustomer,
        getDesignerThread,
        ensureDesignerThread,
        createThreadForOrder,
        upsertProject,
        approveProject,
        rejectProject,
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
