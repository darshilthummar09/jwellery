import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; direction: 'up' | 'down' | 'neutral' };
  description?: string;
  color?: 'emerald' | 'blue' | 'purple' | 'orange' | 'rose';
  onClick?: () => void;
}

const COLOR_MAP = {
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', iconBg: 'bg-emerald-100' },
  blue:    { bg: 'bg-blue-50',    icon: 'text-blue-600',    iconBg: 'bg-blue-100' },
  purple:  { bg: 'bg-purple-50',  icon: 'text-purple-600',  iconBg: 'bg-purple-100' },
  orange:  { bg: 'bg-orange-50',  icon: 'text-orange-600',  iconBg: 'bg-orange-100' },
  rose:    { bg: 'bg-rose-50',    icon: 'text-rose-600',    iconBg: 'bg-rose-100' },
};

const TREND_ICON = {
  up:      { icon: TrendingUp,   cls: 'text-emerald-600' },
  down:    { icon: TrendingDown, cls: 'text-red-500' },
  neutral: { icon: Minus,        cls: 'text-slate-400' },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  color = 'emerald',
  onClick,
}: StatCardProps) {
  const c = COLOR_MAP[color];
  const TrendIcon = trend ? TREND_ICON[trend.direction].icon : null;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-6 shadow-sm hover:shadow-md transition-all ${
        onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-100 active:scale-[0.98]' : ''
      }`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-start justify-between mb-2.5 sm:mb-4">
        <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl ${c.iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} className={`${c.icon} sm:hidden`} />
          <Icon size={20} className={`${c.icon} hidden sm:block`} />
        </div>
        {trend && TrendIcon && (
          <div className={`flex items-center gap-1 text-[11px] sm:text-xs font-medium ${TREND_ICON[trend.direction].cls}`}>
            <TrendIcon size={12} />
            {trend.value}
          </div>
        )}
      </div>
      <div className="text-xl sm:text-2xl font-bold text-slate-900 mb-0.5 sm:mb-1">{value}</div>
      <div className="text-xs sm:text-sm font-medium text-slate-600 truncate">{title}</div>
      {description && <div className="text-[11px] sm:text-xs text-slate-400 mt-1 truncate">{description}</div>}
    </div>
  );
}

