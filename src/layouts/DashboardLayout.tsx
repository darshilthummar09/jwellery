import { useState, useEffect } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { useRole } from '../hooks/useRole';
import { useAuth } from '../hooks/useAuth';
import { useChatNotification } from '../context/ChatNotificationContext';
import { setPwaAppBadge, requestBadgePermission } from '../utils/pwaBadge';

/**
 * DashboardLayout — the SaaS shell: sidebar + sticky header + scrollable content.
 * All authenticated dashboard pages render inside <Outlet />.
 */
export function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { role } = useRole();
  const { user } = useAuth();
  const { getChatUnreadCount, getUnreadCount, orders } = useChatNotification();
  const isCustomer = role === 'customer';

  // Request notification/badging permission on mount if running as PWA
  useEffect(() => {
    requestBadgePermission();
  }, []);

  // Automatically update native PWA Home Screen Icon Badge (iOS / Android / Desktop)
  useEffect(() => {
    const targetRole = role === 'super-admin' ? 'admin' : (role ?? 'customer');
    const notifUnread = getUnreadCount(targetRole as 'customer' | 'admin' | 'designer', user?.id);
    const pendingOrders = (role === 'admin' || role === 'super-admin')
      ? orders.filter((o) => o.status === 'Pending Approval').length
      : 0;

    const totalBadge = notifUnread + (role === 'admin' || role === 'super-admin' ? pendingOrders : 0);
    setPwaAppBadge(totalBadge);
  }, [role, user?.id, getChatUnreadCount, getUnreadCount, orders]);

  return (
    <div className="flex h-[100dvh] bg-slate-50 overflow-hidden">
      {/* Sidebar - only for admin & super-admin */}
      {!isCustomer && (
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Sticky header */}
        <Header onMenuClick={() => setMobileMenuOpen(true)} isCustomer={isCustomer} />

        {/* Scrollable page content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
