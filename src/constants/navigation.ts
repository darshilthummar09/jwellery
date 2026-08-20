import { UserRole } from '../types/role.types';

export interface NavItem {
  label: string;
  path: string;
  icon: string; // Lucide icon name
  description?: string;
}

export const SUPER_ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard',      path: '/dashboard/super-admin',               icon: 'LayoutDashboard', description: 'Overview & metrics' },
  { label: 'Orders',         path: '/dashboard/super-admin/orders',        icon: 'Briefcase',       description: 'Manage orders' },
  { label: 'Chats',          path: '/dashboard/super-admin/chats',         icon: 'MessageSquare',   description: 'Platform chats' },
  { label: 'Users',          path: '/dashboard/super-admin/users',         icon: 'Users',           description: 'Manage all users' },
  { label: 'Dynamic Fields', path: '/dashboard/super-admin/dynamic-fields',icon: 'Sliders',         description: 'Custom field management' },
  { label: 'Categories',     path: '/dashboard/super-admin/categories',    icon: 'Tag',             description: 'Product categories' },
  { label: 'Settings',       path: '/dashboard/super-admin/settings',      icon: 'Settings',        description: 'System settings' },
];

export const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard',  path: '/dashboard/admin',            icon: 'LayoutDashboard', description: 'Overview & metrics' },
  { label: 'Orders',     path: '/dashboard/admin/orders',     icon: 'Briefcase',       description: 'Manage orders' },
  { label: 'Customers',  path: '/dashboard/admin/customers',  icon: 'UserCheck',       description: 'Manage customers' },
  { label: 'Designers',  path: '/dashboard/admin/designers',  icon: 'Palette',         description: 'Manage designers' },
  { label: 'Chats',      path: '/dashboard/admin/chats',      icon: 'MessageSquare',   description: 'Customer chats' },
];

export const CUSTOMER_NAV: NavItem[] = [
  { label: 'Dashboard',        path: '/dashboard/customer',                icon: 'LayoutDashboard', description: 'Your overview' },
  { label: 'AI Design Studio', path: '/dashboard/customer/ai-studio',       icon: 'Sparkles',        description: 'Co-create with AI' },
  { label: 'My Products',      path: '/dashboard/customer/my-products',    icon: 'ShoppingBag',     description: 'Your orders & products' },
  { label: 'General Chat',     path: '/dashboard/customer/chat',           icon: 'MessageCircle',   description: 'Chat with support' },
  { label: 'Notifications',    path: '/dashboard/customer/notifications',  icon: 'Bell',            description: 'Your notifications' },
];

export const DESIGNER_NAV: NavItem[] = [
  { label: 'Dashboard',          path: '/dashboard/designer',                     icon: 'LayoutDashboard', description: 'Your overview' },
  { label: 'Assigned Orders',    path: '/dashboard/designer/assigned-orders',     icon: 'ClipboardList',   description: 'Orders assigned to you' },
  { label: 'Admin Chat',         path: '/dashboard/designer/chat',                icon: 'MessageSquare',   description: 'Chat with admin' },
  { label: 'Notifications',      path: '/dashboard/designer/notifications',        icon: 'Bell',            description: 'Your notifications' },
];

export const ROLE_NAV_MAP: Record<UserRole, NavItem[]> = {
  'super-admin': SUPER_ADMIN_NAV,
  'admin':       ADMIN_NAV,
  'customer':    CUSTOMER_NAV,
  'designer':    DESIGNER_NAV,
};

export const ROLE_DASHBOARD_PATH: Record<UserRole, string> = {
  'super-admin': '/dashboard/super-admin',
  'admin':       '/dashboard/admin',
  'customer':    '/dashboard/customer',
  'designer':    '/dashboard/designer',
};
