import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onValue, ref, set } from 'firebase/database';
import { firebaseDatabase, isFirebaseConfigured } from '../services/firebase';
import {
  setAppBadge,
  clearAppBadge,
  requestPushPermission,
  getPushPermissionState,
  registerForegroundPushListener,
  showLocalNotification,
} from '../services/notificationService';

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
  ensureDesignerThread: (designerName: string, orderName?: string) => string;
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

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-101',
    name: 'Custom Solitaire Diamond Ring',
    customerId: 'usr_customer_001',
    customerName: 'Priya Patel',
    designerName: 'Riya Sharma',
    status: 'Approved',
    due: 'Aug 28, 2026',
    budget: '₹85,000',
    priority: 'High',
    category: 'Rings',
    metal: 'Yellow Gold',
    karat: '18 KT',
    size: '14',
    weight: '4.2g',
    notes: '1.25ct oval cut center diamond, 4-prong setting with cathedral shoulders.',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
    created: 'Aug 23, 2026',
    progress: '75%',
  },
  {
    id: 'ORD-102',
    name: 'Emerald & Gold Royal Choker',
    customerId: 'usr_customer_001',
    customerName: 'Priya Patel',
    designerName: 'Riya Sharma',
    status: 'Pending Approval',
    due: 'Sep 05, 2026',
    budget: '₹3,20,000',
    priority: 'Medium',
    category: 'Necklaces',
    metal: 'Yellow Gold',
    karat: '22 KT',
    weight: '48g',
    notes: 'Traditional bridal choker with genuine Zambian emerald drops and uncut polki diamonds.',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
    created: 'Aug 23, 2026',
    progress: '0%',
  },
  {
    id: 'ORD-103',
    name: 'Diamond Tennis Bracelet',
    customerId: 'usr_customer_001',
    customerName: 'Priya Patel',
    designerName: 'Riya Sharma',
    status: 'Approved',
    due: 'Sep 12, 2026',
    budget: '₹1,50,000',
    priority: 'High',
    category: 'Bracelets',
    metal: 'White Gold',
    karat: '18 KT',
    size: '7 inches',
    weight: '12.4g',
    notes: '3.5 TCW round brilliant diamonds, four-prong basket setting with double safety lock.',
    image: 'https://images.unsplash.com/photo-1611591475825-79a957e0797f?auto=format&fit=crop&w=800&q=80',
    created: 'Aug 22, 2026',
    progress: '60%',
  },
  {
    id: 'ORD-104',
    name: 'Pear-Cut Sapphire Drop Earrings',
    customerId: 'usr_customer_001',
    customerName: 'Priya Patel',
    designerName: 'Riya Sharma',
    status: 'In Progress',
    due: 'Aug 28, 2026',
    budget: '₹1,10,000',
    priority: 'Medium',
    category: 'Earrings',
    metal: 'Platinum',
    karat: '950 Platinum',
    weight: '8.2g',
    notes: 'Deep Ceylon blue sapphires surrounded by micro-halo diamonds with secure leverback clasp.',
    image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80',
    created: 'Aug 21, 2026',
    progress: '50%',
  },
  {
    id: 'ORD-105',
    name: 'Custom Nameplate Gold Pendant',
    customerId: 'usr_customer_001',
    customerName: 'Priya Patel',
    designerName: 'Riya Sharma',
    status: 'Review',
    due: 'Aug 30, 2026',
    budget: '₹45,000',
    priority: 'Low',
    category: 'Pendants',
    metal: 'Yellow Gold',
    karat: '18 KT',
    weight: '5.1g',
    notes: 'Script typography with diamond accent on the dot of the letter i.',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
    created: 'Aug 20, 2026',
    progress: '85%',
  },
  {
    id: 'ORD-106',
    name: 'Vintage Filigree Bridal Kada Bangle',
    customerId: 'usr_customer_001',
    customerName: 'Priya Patel',
    designerName: 'Riya Sharma',
    status: 'Completed',
    due: 'Aug 15, 2026',
    budget: '₹1,95,000',
    priority: 'High',
    category: 'Bangles',
    metal: 'Yellow Gold',
    karat: '22 KT',
    size: '2.6',
    weight: '32.5g',
    notes: 'Antique matte finish with intricate jaali filigree work and screw hinge.',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
    created: 'Aug 10, 2026',
    progress: '100%',
  },
  {
    id: 'ORD-107',
    name: "Men's Matte Onyx Signet Ring",
    customerId: 'usr_customer_002',
    customerName: 'Aarav Shah',
    designerName: 'Riya Sharma',
    status: 'Pending Approval',
    due: 'Sep 02, 2026',
    budget: '₹62,000',
    priority: 'Medium',
    category: 'Rings',
    metal: 'Yellow Gold',
    karat: '18 KT',
    size: '22',
    weight: '10.2g',
    notes: 'Hexagonal flat-top natural black onyx stone with brushed satin gold finish.',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
    created: 'Aug 23, 2026',
    progress: '0%',
  },
  {
    id: 'ORD-108',
    name: 'Cuban Link Gold Chain',
    customerId: 'usr_customer_002',
    customerName: 'Aarav Shah',
    designerName: 'Riya Sharma',
    status: 'In Progress',
    due: 'Sep 10, 2026',
    budget: '₹2,10,000',
    priority: 'High',
    category: 'Chains',
    metal: 'Yellow Gold',
    karat: '22 KT',
    size: '22 inches',
    weight: '42g',
    notes: 'Solid 6mm flat diamond-cut cuban links with custom box clasp.',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
    created: 'Aug 22, 2026',
    progress: '40%',
  },
];

export const INITIAL_THREADS: ChatThread[] = [
  {
    id: 'order-ORD-101',
    orderId: 'ORD-101',
    orderName: 'Custom Solitaire Diamond Ring',
    customerId: 'usr_customer_001',
    customerName: 'Priya Patel',
    participantRole: 'customer',
    unread: 0,
    customerUnread: 0,
    lastMessage: 'Your 3D CAD renders are ready! The 1.25ct oval diamond in 18K Yellow Gold is moving to casting.',
    lastTime: 'Aug 23, 03:30 PM',
    messages: [
      {
        id: 101001,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: `📋 ORDER DETAILS — Custom Solitaire Diamond Ring\n──────────────────────────\n👤 Customer   : Priya Patel\n💍 Category   : Rings\n⚙️  Metal      : Yellow Gold (18 KT)\n📏 Size       : No. 14\n⚖️  Weight     : 4.2g\n💰 Budget     : ₹85,000\n📅 Target Date: Aug 28, 2026\n📝 Notes      : 1.25ct oval cut center diamond, 4-prong setting with cathedral shoulders.\n──────────────────────────\n🔖 Status     : Approved (75% Progress)`,
        time: 'Aug 23, 10:00 AM',
      },
      {
        id: 101002,
        from: 'customer',
        senderName: 'Priya Patel',
        text: 'Hi team! Could you confirm if the oval center diamond is eye-clean with excellent symmetry?',
        time: 'Aug 23, 10:30 AM',
      },
      {
        id: 101003,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: 'Hello Priya! Yes, our gemologist hand-selected an eye-clean VS1 oval diamond with ideal proportions to maximize brilliance and fire. Prongs are being micro-claw set in 18K Yellow Gold.',
        time: 'Aug 23, 11:15 AM',
      },
      {
        id: 101004,
        from: 'customer',
        senderName: 'Priya Patel',
        text: 'Wonderful! Can I get an update on the delivery schedule for Mumbai?',
        time: 'Aug 23, 02:45 PM',
      },
      {
        id: 101005,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: 'Your 3D CAD renders are ready! The 1.25ct oval diamond in 18K Yellow Gold is moving to casting. Estimated dispatch by Aug 28 with tamper-evident insured delivery.',
        time: 'Aug 23, 03:30 PM',
      },
    ],
  },
  {
    id: 'order-ORD-102',
    orderId: 'ORD-102',
    orderName: 'Emerald & Gold Royal Choker',
    customerId: 'usr_customer_001',
    customerName: 'Priya Patel',
    participantRole: 'customer',
    unread: 1,
    customerUnread: 0,
    lastMessage: 'Can we adjust the necklace length by 0.5 inches?',
    lastTime: 'Aug 23, 12:40 PM',
    messages: [
      {
        id: 102001,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: `📋 ORDER DETAILS — Emerald & Gold Royal Choker\n──────────────────────────\n👤 Customer   : Priya Patel\n💍 Category   : Necklaces\n⚙️  Metal      : Yellow Gold (22 KT)\n⚖️  Weight     : 48g\n💰 Budget     : ₹3,20,000\n📅 Target Date: Sep 05, 2026\n📝 Notes      : Traditional bridal choker with genuine Zambian emerald drops and uncut polki diamonds.\n──────────────────────────\n🔖 Status     : Pending Approval`,
        time: 'Aug 23, 11:00 AM',
      },
      {
        id: 102002,
        from: 'customer',
        senderName: 'Priya Patel',
        text: 'Hello! I submitted this order for my sister wedding in September. Can we adjust the necklace length by 0.5 inches?',
        time: 'Aug 23, 12:40 PM',
      },
    ],
  },
  {
    id: 'order-ORD-103',
    orderId: 'ORD-103',
    orderName: 'Diamond Tennis Bracelet',
    customerId: 'usr_customer_001',
    customerName: 'Priya Patel',
    participantRole: 'customer',
    unread: 0,
    customerUnread: 0,
    lastMessage: 'The double safety clasp with hidden security tongue is being hand-fitted right now.',
    lastTime: 'Aug 22, 05:00 PM',
    messages: [
      {
        id: 103001,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: `📋 ORDER DETAILS — Diamond Tennis Bracelet\n──────────────────────────\n👤 Customer   : Priya Patel\n💍 Category   : Bracelets\n⚙️  Metal      : White Gold (18 KT)\n📏 Size       : 7 inches\n⚖️  Weight     : 12.4g\n💰 Budget     : ₹1,50,000\n📅 Target Date: Sep 12, 2026\n📝 Notes      : 3.5 TCW round brilliant diamonds, four-prong basket setting with double safety lock.\n──────────────────────────\n🔖 Status     : Approved (60% Progress)`,
        time: 'Aug 22, 02:00 PM',
      },
      {
        id: 103002,
        from: 'customer',
        senderName: 'Priya Patel',
        text: 'Please confirm that all diamonds are uniform in size and color.',
        time: 'Aug 22, 03:15 PM',
      },
      {
        id: 103003,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: 'The double safety clasp with hidden security tongue is being hand-fitted right now. All 48 diamonds are calibrated to 2.4mm each with GH color & VS clarity.',
        time: 'Aug 22, 05:00 PM',
      },
    ],
  },
  {
    id: 'order-ORD-104',
    orderId: 'ORD-104',
    orderName: 'Pear-Cut Sapphire Drop Earrings',
    customerId: 'usr_customer_001',
    customerName: 'Priya Patel',
    participantRole: 'customer',
    unread: 0,
    customerUnread: 0,
    lastMessage: 'Both Ceylon sapphires have been set into the Platinum 950 bezels.',
    lastTime: 'Aug 21, 04:30 PM',
    messages: [
      {
        id: 104001,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: `📋 ORDER DETAILS — Pear-Cut Sapphire Drop Earrings\n──────────────────────────\n👤 Customer   : Priya Patel\n💍 Category   : Earrings\n⚙️  Metal      : Platinum (950 Platinum)\n⚖️  Weight     : 8.2g\n💰 Budget     : ₹1,10,000\n📅 Target Date: Aug 28, 2026\n📝 Notes      : Deep Ceylon blue sapphires surrounded by micro-halo diamonds with secure leverback clasp.\n──────────────────────────\n🔖 Status     : In Progress (50% Progress)`,
        time: 'Aug 21, 11:30 AM',
      },
      {
        id: 104002,
        from: 'customer',
        senderName: 'Priya Patel',
        text: 'Hello! I love the Ceylon sapphire color tone. Could you confirm the earrings have secure leverbacks?',
        time: 'Aug 21, 01:20 PM',
      },
      {
        id: 104003,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: 'Both Ceylon sapphires have been set into the Platinum 950 bezels with handcrafted leverback clasps for maximum comfort and security.',
        time: 'Aug 21, 04:30 PM',
      },
    ],
  },
  {
    id: 'order-ORD-105',
    orderId: 'ORD-105',
    orderName: 'Custom Nameplate Gold Pendant',
    customerId: 'usr_customer_001',
    customerName: 'Priya Patel',
    participantRole: 'customer',
    unread: 0,
    customerUnread: 0,
    lastMessage: 'Vector lettering proof approved. High-gloss diamond-cut beveling underway.',
    lastTime: 'Aug 20, 06:15 PM',
    messages: [
      {
        id: 105001,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: `📋 ORDER DETAILS — Custom Nameplate Gold Pendant\n──────────────────────────\n👤 Customer   : Priya Patel\n💍 Category   : Pendants\n⚙️  Metal      : Yellow Gold (18 KT)\n⚖️  Weight     : 5.1g\n💰 Budget     : ₹45,000\n📅 Target Date: Aug 30, 2026\n📝 Notes      : Script typography with diamond accent on the dot of the letter i.\n──────────────────────────\n🔖 Status     : Review (85% Progress)`,
        time: 'Aug 20, 02:00 PM',
      },
      {
        id: 105002,
        from: 'customer',
        senderName: 'Priya Patel',
        text: 'The script font layout looks stunning! Please ensure the chain loop accommodates a 2mm chain.',
        time: 'Aug 20, 04:10 PM',
      },
      {
        id: 105003,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: 'Vector lettering proof approved. High-gloss diamond-cut beveling underway with a 3mm hidden bail.',
        time: 'Aug 20, 06:15 PM',
      },
    ],
  },
  {
    id: 'order-ORD-106',
    orderId: 'ORD-106',
    orderName: 'Vintage Filigree Bridal Kada Bangle',
    customerId: 'usr_customer_001',
    customerName: 'Priya Patel',
    participantRole: 'customer',
    unread: 0,
    customerUnread: 0,
    lastMessage: 'Order completed and ready for pickup / delivery with 100% BIS hallmark certification.',
    lastTime: 'Aug 15, 01:00 PM',
    messages: [
      {
        id: 106001,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: `📋 ORDER DETAILS — Vintage Filigree Bridal Kada Bangle\n──────────────────────────\n👤 Customer   : Priya Patel\n💍 Category   : Bangles\n⚙️  Metal      : Yellow Gold (22 KT)\n📏 Size       : 2.6\n⚖️  Weight     : 32.5g\n💰 Budget     : ₹1,95,000\n📅 Target Date: Aug 15, 2026\n📝 Notes      : Antique matte finish with intricate jaali filigree work and screw hinge.\n──────────────────────────\n🔖 Status     : Completed (100% Progress)`,
        time: 'Aug 10, 10:00 AM',
      },
      {
        id: 106002,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: 'Order completed and ready for pickup / delivery with 100% BIS hallmark certification.',
        time: 'Aug 15, 01:00 PM',
      },
    ],
  },
  {
    id: 'order-ORD-107',
    orderId: 'ORD-107',
    orderName: "Men's Matte Onyx Signet Ring",
    customerId: 'usr_customer_002',
    customerName: 'Aarav Shah',
    participantRole: 'customer',
    unread: 1,
    customerUnread: 0,
    lastMessage: 'Can we engrave my initials AS on the inside shank?',
    lastTime: 'Aug 23, 01:10 PM',
    messages: [
      {
        id: 107001,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: `📋 ORDER DETAILS — Men's Matte Onyx Signet Ring\n──────────────────────────\n👤 Customer   : Aarav Shah\n💍 Category   : Rings\n⚙️  Metal      : Yellow Gold (18 KT)\n📏 Size       : 22\n⚖️  Weight     : 10.2g\n💰 Budget     : ₹62,000\n📅 Target Date: Sep 02, 2026\n📝 Notes      : Hexagonal flat-top natural black onyx stone with brushed satin gold finish.\n──────────────────────────\n🔖 Status     : Pending Approval`,
        time: 'Aug 23, 11:30 AM',
      },
      {
        id: 107002,
        from: 'customer',
        senderName: 'Aarav Shah',
        text: 'Hi, can we engrave my initials AS in Roman serif font on the inside shank?',
        time: 'Aug 23, 01:10 PM',
      },
    ],
  },
  {
    id: 'order-ORD-108',
    orderId: 'ORD-108',
    orderName: 'Cuban Link Gold Chain',
    customerId: 'usr_customer_002',
    customerName: 'Aarav Shah',
    participantRole: 'customer',
    unread: 0,
    customerUnread: 0,
    lastMessage: 'Solid 6mm hand-assembled links passing through final diamond-cutting lathe.',
    lastTime: 'Aug 22, 06:20 PM',
    messages: [
      {
        id: 108001,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: `📋 ORDER DETAILS — Cuban Link Gold Chain\n──────────────────────────\n👤 Customer   : Aarav Shah\n💍 Category   : Chains\n⚙️  Metal      : Yellow Gold (22 KT)\n📏 Size       : 22 inches\n⚖️  Weight     : 42g\n💰 Budget     : ₹2,10,000\n📅 Target Date: Sep 10, 2026\n📝 Notes      : Solid 6mm flat diamond-cut cuban links with custom box clasp.\n──────────────────────────\n🔖 Status     : In Progress (40% Progress)`,
        time: 'Aug 22, 10:15 AM',
      },
      {
        id: 108002,
        from: 'customer',
        senderName: 'Aarav Shah',
        text: 'Please ensure the box clasp has double side safety latches.',
        time: 'Aug 22, 02:30 PM',
      },
      {
        id: 108003,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: 'Solid 6mm hand-assembled links passing through final diamond-cutting lathe with custom double-latch box clasp.',
        time: 'Aug 22, 06:20 PM',
      },
    ],
  },
  {
    id: 'customer-usr_customer_001',
    customerId: 'usr_customer_001',
    customerName: 'Priya Patel',
    participantRole: 'customer',
    unread: 0,
    customerUnread: 0,
    lastMessage: 'We would love to help craft bespoke pieces for your bridal trousseau!',
    lastTime: 'Aug 19, 11:00 AM',
    messages: [
      {
        id: 100001,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: '👋 Welcome to Dream Jewels, Priya! How can our master jewelers assist you today?',
        time: 'Aug 19, 10:00 AM',
      },
      {
        id: 100002,
        from: 'customer',
        senderName: 'Priya Patel',
        text: 'Hello! I am planning a bridal jewellery suite for December and had a few questions.',
        time: 'Aug 19, 10:15 AM',
      },
      {
        id: 100003,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: 'We would love to help craft bespoke pieces for your bridal trousseau! You can discuss specific orders directly under each order or chat here anytime.',
        time: 'Aug 19, 11:00 AM',
      },
    ],
  },
  {
    id: 'customer-usr_customer_002',
    customerId: 'usr_customer_002',
    customerName: 'Aarav Shah',
    participantRole: 'customer',
    unread: 0,
    customerUnread: 0,
    lastMessage: 'Welcome to Dream Jewels concierge! Let us know if you need assistance with custom men jewellery.',
    lastTime: 'Aug 18, 02:00 PM',
    messages: [
      {
        id: 200001,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: '👋 Welcome to Dream Jewels concierge! Let us know if you need assistance with custom men jewellery.',
        time: 'Aug 18, 02:00 PM',
      },
    ],
  },
];

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
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>(getPushPermissionState());
  const clientIdRef = useRef(`chat-client-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const lastSerializedStateRef = useRef('');
  const channelRef = useRef<BroadcastChannel | null>(null);

  // ─── Automated PWA App Icon Badging & Tab Title Synchronization ──────────
  useEffect(() => {
    let currentRole: 'admin' | 'customer' | 'designer' = 'admin';
    let currentCustId = '';
    try {
      const storedAuth = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user');
      if (storedAuth) {
        const u = JSON.parse(storedAuth);
        if (u.role) currentRole = u.role === 'super-admin' ? 'admin' : u.role;
        if (u.id) currentCustId = u.id;
      }
    } catch {}

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
  }, [notifications, threads]);

  // ─── Foreground Push Notification Listener ──────────────────────────────────
  useEffect(() => {
    const unsub = registerForegroundPushListener((payload) => {
      const title = payload.notification?.title || payload.data?.title || 'Dream Jewels Update';
      const body = payload.notification?.body || payload.data?.body || 'You have a new update.';
      
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
  }, []);

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
      return [...newItems, ...prev];
    });
    setNotifCounter((c) => c + items.length);

    // Trigger local desktop banner & Web Audio sound
    try {
      const first = items[0];
      if (first) {
        showLocalNotification(first.title, { body: first.body });
      }
    } catch (e) {
      console.debug('Notification trigger notice:', e);
    }
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
          } else {
            set(ref(firebaseDatabase, 'chatState/threads'), sanitizeForFirebase(INITIAL_THREADS)).catch(() => {});
            setThreads(INITIAL_THREADS);
          }

          setNotifications((prev) => {
            const prevStr = JSON.stringify(sanitizeForFirebase(prev));
            const newStr = JSON.stringify(sanitizeForFirebase(parsedNotifs));
            return prevStr === newStr ? prev : parsedNotifs;
          });

          if (typeof value.notifCounter === 'number') {
            setNotifCounter((prev) => (prev === value.notifCounter ? prev : value.notifCounter!));
          }
        } else {
          set(ref(firebaseDatabase, 'chatState/threads'), sanitizeForFirebase(INITIAL_THREADS)).catch(() => {});
          setThreads(INITIAL_THREADS);
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

    lastSerializedStateRef.current = serialized;

    const timer = setTimeout(() => {
      // Update LocalStorage & BroadcastChannel
      try {
        window.localStorage.setItem(CHAT_STORAGE_KEY, serialized);
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }
      channelRef.current?.postMessage({
        source: clientIdRef.current,
        state: serialized,
      });

      // Write to dedicated Firebase Realtime Database nodes
      if (firebaseDatabase) {
        try {
          set(ref(firebaseDatabase, 'orders'), sanitizeForFirebase(orders)).catch(() => {});
          set(ref(firebaseDatabase, 'users'), sanitizeForFirebase(users)).catch(() => {});
          set(ref(firebaseDatabase, 'chatState'), payload).catch(() => {});
        } catch (e) {
          console.error('Failed to save state to Firebase:', e);
        }
      }
    }, 250);

    return () => clearTimeout(timer);
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
          threadId: `customer-${customerId}`,
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

          addNotification([
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

      return updated;
    });
  }, [addNotification]);

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
      setThreads((prev) => {
        const targetThreadId = optionalThreadId || `customer-${customerId}`;
        const existing = prev.find((t) => t.id === targetThreadId);

        if (existing) {
          return prev.map((t) =>
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
        }

        const newThread: ChatThread = {
          id: targetThreadId,
          customerName,
          customerId,
          participantRole: 'customer',
          messages: [msg],
          unread: 1,
          customerUnread: 0,
          lastMessage: formatLastMessage(text, attachments),
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
        threadId: optionalThreadId || `customer-${customerId}`,
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
        userId: thread.customerId,
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
      let currentRole: 'admin' | 'customer' | 'designer' = 'admin';
      let currentCustId = 'cust-1';
      let currentUserName = 'Priya Patel';
      try {
        const storedAuth = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user');
        if (storedAuth) {
          const u = JSON.parse(storedAuth);
          if (u.role) currentRole = u.role === 'super-admin' ? 'admin' : u.role;
          if (u.id) currentCustId = u.id;
          if (u.name) currentUserName = u.name;
        }
      } catch {}

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
