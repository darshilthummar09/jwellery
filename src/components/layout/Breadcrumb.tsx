import { Link, useLocation } from 'react-router';
import { ChevronRight, Home } from 'lucide-react';

/** Maps URL segments to human-readable labels */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  'super-admin': 'Super Admin',
  admin: 'Admin',
  customer: 'Customer',
  designer: 'Designer',
  users: 'Users',
  'dynamic-fields': 'Dynamic Fields',
  categories: 'Categories',
  settings: 'Settings',
  orders: 'Orders',
  customers: 'Customers',
  designers: 'Designers',
  chats: 'Chats',
  'my-products': 'My Products',
  chat: 'General Chat',
  notifications: 'Notifications',
  'assigned-orders': 'Assigned Orders',
};

function toLabel(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function Breadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1 overflow-hidden whitespace-nowrap text-ellipsis">
        <li>
          <Link
            to="/"
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
            aria-label="Home"
          >
            <Home size={14} />
          </Link>
        </li>

        {segments.map((seg, i) => {
          const path = '/' + segments.slice(0, i + 1).join('/');
          const isLast = i === segments.length - 1;

          return (
            <li key={path} className={`items-center gap-1 min-w-0 ${isLast ? 'flex' : 'hidden sm:flex'}`}>
              <ChevronRight size={13} className="text-slate-300 flex-shrink-0" />
              {isLast ? (
                <span className="text-sm font-semibold text-slate-800 px-1 truncate">
                  {toLabel(seg)}
                </span>
              ) : (
                <Link
                  to={path}
                  className="text-sm text-slate-500 hover:text-slate-700 px-1 py-0.5 rounded hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  {toLabel(seg)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
