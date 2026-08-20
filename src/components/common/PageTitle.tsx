interface PageTitleProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageTitle({ title, subtitle, action, className = '' }: PageTitleProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 ${className}`}>
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 leading-relaxed">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
