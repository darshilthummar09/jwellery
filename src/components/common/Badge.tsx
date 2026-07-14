import { UserRole } from '../../types/role.types';
import { ROLE_LABELS, ROLE_COLORS } from '../../constants/roles';

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function RoleBadge({ role, className = '' }: RoleBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ROLE_COLORS[role]} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {ROLE_LABELS[role]}
    </span>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
  className?: string;
}

const BADGE_VARIANTS = {
  default: 'bg-slate-100 text-slate-700 border-slate-200',
  success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  danger:  'bg-red-100 text-red-700 border-red-200',
  info:    'bg-blue-100 text-blue-700 border-blue-200',
  muted:   'bg-slate-50 text-slate-500 border-slate-100',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${BADGE_VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
