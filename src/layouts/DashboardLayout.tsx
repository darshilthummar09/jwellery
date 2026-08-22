import { useState } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { useRole } from '../hooks/useRole';

/**
 * DashboardLayout — the SaaS shell: sidebar + sticky header + scrollable content.
 * All authenticated dashboard pages render inside <Outlet />.
 */
export function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { role } = useRole();
  const isCustomer = role === 'customer';

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
