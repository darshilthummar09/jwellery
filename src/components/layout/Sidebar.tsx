import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import {
  LayoutDashboard, Users, Sliders, Tag, Settings, Briefcase,
  UserCheck, Palette, MessageSquare, ShoppingBag, MessageCircle,
  Bell, ClipboardList, ChevronLeft, ChevronRight, X, Gem,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useRole } from '../../hooks/useRole';
import { ROLE_NAV_MAP } from '../../constants/navigation';
import { NavItem } from '../../constants/navigation';
import { RoleBadge } from '../common/Badge';
import { Avatar } from '../common/Avatar';

// Map icon name strings to Lucide icon components
const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Users, Sliders, Tag, Settings, Briefcase,
  UserCheck, Palette, MessageSquare, ShoppingBag, MessageCircle,
  Bell, ClipboardList,
};

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function NavItemLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;

  return (
    <NavLink
      to={item.path}
      end={item.path.split('/').length <= 3}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`
      }
      title={collapsed ? item.label : undefined}
    >
      <Icon
        size={18}
        className="flex-shrink-0 transition-transform group-hover:scale-110"
      />
      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}
    </NavLink>
  );
}

function SidebarContent({
  collapsed,
  onToggle,
  onClose,
  isMobile = false,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onClose?: () => void;
  isMobile?: boolean;
}) {
  const { user, logout } = useAuth();
  const { role } = useRole();
  const navigate = useNavigate();
  const navItems = role ? ROLE_NAV_MAP[role] : [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-slate-100 ${collapsed && !isMobile ? 'justify-center' : 'gap-3'}`}>
        <img
          src="/logo.png"
          alt="Dream Jewels"
          className={`h-8 transition-all duration-300 ${
            collapsed && !isMobile ? 'w-8 object-cover object-left' : 'w-auto object-contain'
          }`}
        />
        {(!collapsed || isMobile) && (
          <div className="min-w-0">
            <div className="text-[10px] text-slate-400 font-bold leading-none tracking-widest uppercase">Dream Jewels</div>
          </div>
        )}
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="ml-auto text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
        {!isMobile && (
          <button
            onClick={onToggle}
            className={`${collapsed ? 'mx-auto' : 'ml-auto'} text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItemLink key={item.path} item={item} collapsed={collapsed && !isMobile} />
        ))}
      </nav>

      {/* User Profile Footer */}
      <div className={`p-3 border-t border-slate-100 ${collapsed && !isMobile ? 'flex justify-center' : ''}`}>
        {(!collapsed || isMobile) ? (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors group">
            <Avatar user={user} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-800 truncate">{user?.name}</div>
              {role && <RoleBadge role={role} className="mt-0.5" />}
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-slate-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
              title="Logout"
            >
              Out
            </button>
          </div>
        ) : (
          <Avatar user={user} size="sm" />
        )}
      </div>
    </div>
  );
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
        style={{ minHeight: '100vh' }}
      >
        <div className="sticky top-0 h-screen">
          <SidebarContent
            collapsed={collapsed}
            onToggle={() => setCollapsed((c) => !c)}
          />
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 z-50 lg:hidden transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent
          collapsed={false}
          onToggle={() => {}}
          onClose={onMobileClose}
          isMobile
        />
      </aside>
    </>
  );
}
