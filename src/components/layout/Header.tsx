import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Menu, Bell, Search, ChevronDown, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useRole } from '../../hooks/useRole';
import { Avatar } from '../common/Avatar';
import { RoleBadge } from '../common/Badge';
import { Breadcrumb } from './Breadcrumb';
import { useChatNotification } from '../../context/ChatNotificationContext';


interface HeaderProps {
  onMenuClick: () => void;
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, markAllNotificationsRead, markNotificationRead, getUnreadCount, getChatUnreadCount } = useChatNotification();
  const { role } = useRole();
  const navigate = useNavigate();

  // Map role to notification role
  const notifRole = role === 'super-admin' ? 'admin' : (role as 'customer' | 'admin' | 'designer') ?? 'admin';
  const myNotifications = notifications.filter((n) => n.role === notifRole).slice(0, 5);
  const notificationUnreadCount = getUnreadCount(notifRole);
  const chatUnreadCount = getChatUnreadCount(notifRole);
  const unreadCount = notificationUnreadCount + chatUnreadCount;

  const handleMarkAllRead = () => {
    markAllNotificationsRead(notifRole);
  };

  const handleViewAll = () => {
    setOpen(false);
    if (role === 'admin') navigate('/dashboard/admin/chats');
    else if (role === 'customer') navigate('/dashboard/customer/notifications');
    else if (role === 'designer') navigate('/dashboard/designer/notifications');
  };

  const handleOpenChats = () => {
    setOpen(false);
    if (role === 'admin') navigate('/dashboard/admin/chats');
    else if (role === 'customer') navigate('/dashboard/customer/chat');
    else if (role === 'designer') navigate('/dashboard/designer/chat');
  };

  return (
    <div className="relative">
      <button
        id="notification-bell"
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {/* Unread dot / count */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 z-20 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </span>
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-emerald-600 font-medium cursor-pointer hover:underline"
              >
                Mark all read
              </button>
            </div>
            <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
              {chatUnreadCount > 0 && (
                <div
                  onClick={handleOpenChats}
                  className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">Unread chat messages</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {chatUnreadCount} message{chatUnreadCount === 1 ? '' : 's'} waiting in chat.
                    </p>
                    <p className="text-[10px] text-slate-300 mt-0.5">Just now</p>
                  </div>
                </div>
              )}
              {myNotifications.length === 0 && chatUnreadCount === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-400">No notifications</div>
              ) : (
                myNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={`px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer ${n.read ? 'opacity-60' : ''}`}
                  >
                    {!n.read && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    )}
                    {n.read && <span className="mt-1.5 w-2 h-2 flex-shrink-0" />}
                    <div>
                      <p className="text-sm font-medium text-slate-800">{n.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-slate-300 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="px-4 py-2.5 border-t border-slate-100 text-center">
              <span
                onClick={handleViewAll}
                className="text-xs text-slate-500 cursor-pointer hover:text-emerald-600 hover:underline transition-colors"
              >
                View all notifications
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


function UserDropdown() {
  const { user, logout } = useAuth();
  const { role } = useRole();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        id="user-dropdown-trigger"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-slate-100 transition-colors group"
        aria-label="User menu"
        aria-expanded={open}
      >
        <Avatar user={user} size="sm" />
        <div className="hidden sm:block text-left min-w-0">
          <div className="text-sm font-semibold text-slate-800 leading-none truncate max-w-[120px]">
            {user?.name}
          </div>
          {role && <RoleBadge role={role} className="mt-1" />}
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 z-20 overflow-hidden">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <div className="text-sm font-semibold text-slate-800">{user?.name}</div>
            <div className="text-xs text-slate-400 mt-0.5">{user?.email}</div>
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
              <UserIcon size={15} className="text-slate-400" />
              My Profile
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
              <Settings size={15} className="text-slate-400" />
              Preferences
            </button>
          </div>

          <div className="border-t border-slate-100 py-1.5">
            <button
              id="logout-button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={15} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200 flex items-center px-4 sm:px-6 gap-4">
      {/* Mobile menu toggle */}
      <button
        id="mobile-menu-toggle"
        onClick={onMenuClick}
        className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Breadcrumb */}
      <div className="flex-1 min-w-0">
        <Breadcrumb />
      </div>

      {/* Search (desktop) */}
      <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:border-emerald-200 hover:text-slate-600 transition-colors cursor-pointer min-w-[180px]">
        <Search size={15} />
        <span className="text-sm">Quick search...</span>
        <kbd className="ml-auto text-[10px] bg-white border border-slate-200 text-slate-400 px-1.5 py-0.5 rounded-md font-mono">
          ⌘K
        </kbd>
      </div>

      {/* Notification bell */}
      <NotificationBell />

      {/* User dropdown */}
      <UserDropdown />
    </header>
  );
}
