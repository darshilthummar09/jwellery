import { Users, Settings, Tag, Sliders, TrendingUp, Activity, ShoppingBag } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { StatCard } from '../../components/common/StatCard';
import { useAuth } from '../../hooks/useAuth';

const RECENT_ACTIVITY: Array<{ action: string; time: string; type: string }> = [];

export function SuperAdminDashboard() {
  const { user } = useAuth();

  return (
    <PageContainer>
      <PageTitle
        title={`Welcome back, ${user?.name?.split(' ')[0]} 👋`}
        subtitle="Here's what's happening in your jewellery platform today."
        className="mb-8"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard title="Total Users"       value="4"   icon={Users}    color="emerald" />
        <StatCard title="Active Categories" value="0"   icon={Tag}      color="blue" />
        <StatCard title="Dynamic Fields"    value="0"   icon={Sliders}  color="purple" />
        <StatCard title="Platform Health"   value="-"   icon={Activity} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-slate-800">Recent Activity</h2>
            <span className="text-xs text-emerald-600 cursor-pointer hover:underline font-medium">View all</span>
          </div>
          <div className="space-y-4">
            {RECENT_ACTIVITY.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                <p className="text-sm font-semibold text-slate-700">No activity yet</p>
                <p className="text-xs text-slate-400 mt-1">Platform activity will appear here.</p>
              </div>
            ) : (
              RECENT_ACTIVITY.map((a, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <TrendingUp size={14} className="text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{a.action}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: 'Manage Users',    icon: Users,       color: 'bg-emerald-50 text-emerald-600', path: '/dashboard/super-admin/users' },
              { label: 'Add Category',    icon: Tag,         color: 'bg-blue-50 text-blue-600',       path: '/dashboard/super-admin/categories' },
              { label: 'Dynamic Fields',  icon: Sliders,     color: 'bg-purple-50 text-purple-600',   path: '/dashboard/super-admin/dynamic-fields' },
              { label: 'System Settings', icon: Settings,    color: 'bg-slate-50 text-slate-600',     path: '/dashboard/super-admin/settings' },
            ].map(({ label, icon: Icon, color }) => (
              <button
                key={label}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all text-left group"
              >
                <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
                  <Icon size={16} />
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{label}</span>
                <ShoppingBag size={13} className="ml-auto text-slate-300 group-hover:text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
