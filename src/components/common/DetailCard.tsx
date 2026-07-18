import React from 'react';
import { X } from 'lucide-react';

export interface DetailCardField {
  label: string;
  value: React.ReactNode;
}

interface DetailCardProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  fields?: DetailCardField[];
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export function DetailCard({
  title,
  subtitle,
  badge,
  fields = [],
  children,
  actions,
  className = '',
  onClose,
}: DetailCardProps) {
  return (
    <section className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${className}`}>
      <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            {badge}
          </div>
          {subtitle && <p className="text-sm text-slate-500 leading-relaxed">{subtitle}</p>}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close details"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {fields.length > 0 && (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 px-6 py-5">
          {fields.map((field) => (
            <div key={field.label}>
              <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">{field.label}</dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">{field.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {children && <div className="px-6 pb-5">{children}</div>}

      {actions && (
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </section>
  );
}
