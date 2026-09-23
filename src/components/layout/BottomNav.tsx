import { NavLink, useLocation, useSearchParams } from 'react-router';
import {
  LayoutDashboard,
  Briefcase,
  ShoppingBag,
  MessageSquare,
  MessageCircle,
  Bell,
  Menu,
} from 'lucide-react';
import { useRole } from '../../hooks/useRole';
import { useAuth } from '../../hooks/useAuth';
import { useChatNotification } from '../../context/ChatNotificationContext';

interface BottomNavProps {
  onMenuClick?: () => void;
}

export function BottomNav({ onMenuClick }: BottomNavProps) {
  const { role } = useRole();
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { getChatUnreadCount, getUnreadCount } = useChatNotification();

  const isCustomer = role === 'customer';
  const isAdmin = role === 'admin' || role === 'super-admin';
  const targetRole = role === 'super-admin' ? 'admin' : (role ?? 'customer');

  const notifUnread = getUnreadCount(targetRole as 'customer' | 'admin' | 'designer', user?.id);
  const chatUnread = getChatUnreadCount(targetRole as 'customer' | 'admin' | 'designer', user?.id);

  // Hide bottom nav when actively inside a mobile chat conversation to give full space to keyboard & messages
  const hasThreadOpen = !!searchParams.get('thread');
  const isChatRoute = location.pathname.includes('/chat');
  if (isChatRoute && hasThreadOpen) {
    return null;
  }

  interface BottomItem {
    label: string;
    path: string;
    icon: React.ElementType;
    badge?: number;
    action?: () => void;
  }

  const items: BottomItem[] = isCustomer
    ? [
        {
          label: 'Orders',
          path: '/dashboard/customer',
          icon: LayoutDashboard,
        },
        {
          label: 'My Products',
          path: '/dashboard/customer/my-products',
          icon: ShoppingBag,
        },
        {
          label: 'Chat',
          path: '/dashboard/customer/chat',
          icon: MessageCircle,
          badge: chatUnread,
        },
        {
          label: 'Alerts',
          path: '/dashboard/customer/notifications',
          icon: Bell,
          badge: notifUnread,
        },
      ]
    : isAdmin
    ? [
        {
          label: 'Home',
          path: role === 'super-admin' ? '/dashboard/super-admin' : '/dashboard/admin',
          icon: LayoutDashboard,
        },
        {
          label: 'Orders',
          path: role === 'super-admin' ? '/dashboard/super-admin/orders' : '/dashboard/admin/orders',
          icon: Briefcase,
        },
        {
          label: 'Chats',
          path: role === 'super-admin' ? '/dashboard/super-admin/chats' : '/dashboard/admin/chats',
          icon: MessageSquare,
          badge: chatUnread,
        },
        {
          label: 'Alerts',
          path: role === 'super-admin' ? '/dashboard/super-admin/notifications' : '/dashboard/admin/notifications',
          icon: Bell,
          badge: notifUnread,
        },
        {
          label: 'Menu',
          path: '#menu',
          icon: Menu,
          action: onMenuClick,
        },
      ]
    : [];

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;

          if (item.action) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-500 hover:text-slate-900 active:scale-95 transition-all cursor-pointer select-none"
              >
                <div className="relative">
                  <Icon size={20} />
                </div>
                <span className="text-[11px] font-medium mt-1 leading-none">{item.label}</span>
              </button>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard/customer' || item.path === '/dashboard/admin' || item.path === '/dashboard/super-admin'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 transition-all select-none active:scale-95 ${
                  isActive
                    ? 'text-emerald-600 font-bold'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <div
                      className={`p-1 rounded-xl transition-colors ${
                        isActive ? 'bg-emerald-50 text-emerald-600' : ''
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-white animate-pulse">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] mt-0.5 leading-none ${isActive ? 'font-semibold' : ''}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
