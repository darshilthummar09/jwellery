import { useState } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';

/**
 * DashboardLayout — the SaaS shell: sidebar + sticky header + scrollable content.
 * All authenticated dashboard pages render inside <Outlet />.
 */
export function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Sticky header */}
        <Header onMenuClick={() => setMobileMenuOpen(true)} />

        {/* Scrollable page content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
