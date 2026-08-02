import { Users, Settings, Tag, Sliders, Activity, ShoppingBag, Briefcase, Clock } from 'lucide-react';
import { useNavigate } from 'react-router';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { StatCard } from '../../components/common/StatCard';
import { useAuth } from '../../hooks/useAuth';
import { useChatNotification } from '../../context/ChatNotificationContext';
import { MOCK_USERS } from '../../data/mock-users';
import { CATEGORIES } from './CategoriesPage';
import { SAMPLE_FIELDS } from './DynamicFieldsPage';

const STATUS_COLORS: Record<string, string> = {
  'Pending Approval': 'bg-amber-100 text-amber-700',
  'Approved': 'bg-emerald-100 text-emerald-700',
  'Rejected': 'bg-red-100 text-red-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Review':      'bg-amber-100 text-amber-700',
  'Completed':   'bg-emerald-100 text-emerald-700',
};

export function SuperAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { projects } = useChatNotification();

  const activeProjects = projects.filter(p => p.status !== 'Completed' && p.status !== 'Rejected');
  const recentProjects = [...projects].reverse().slice(0, 5);

  const totalUsers = MOCK_USERS.length;
  const totalCategories = CATEGORIES.length;
  const totalFields = SAMPLE_FIELDS.length;

  return (
    <PageContainer>
      <PageTitle
        title={`Welcome back, ${user?.name?.split(' ')[0]} 👋`}
        subtitle="Here's what's happening in your jewellery platform today."
        className="mb-8"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard title="Active Projects"   value={activeProjects.length.toString()} icon={Briefcase} color="emerald" onClick={() => navigate('/dashboard/super-admin/projects')} />
        <StatCard title="Total Users"       value={totalUsers.toString()}   icon={Users}    color="blue" onClick={() => navigate('/dashboard/super-admin/users')} />
        <StatCard title="Active Categories" value={totalCategories.toString()}   icon={Tag}      color="purple" onClick={() => navigate('/dashboard/super-admin/categories')} />
        <StatCard title="Dynamic Fields"    value={totalFields.toString()}   icon={Sliders}  color="orange" onClick={() => navigate('/dashboard/super-admin/dynamic-fields')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Recent Projects</h2>
            <button onClick={() => navigate('/dashboard/super-admin/projects')} className="text-xs text-emerald-600 cursor-pointer hover:underline font-medium">View all</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Project</th>
                  <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Customer</th>
                  <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentProjects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">No recent projects</td>
                  </tr>
                ) : (
                  recentProjects.map((p) => (
                    <tr key={p.id} onClick={() => navigate('/dashboard/super-admin/projects')} className="hover:bg-slate-50/60 transition-colors cursor-pointer">
                      <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{p.customerName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[p.status] || 'bg-slate-100 text-slate-700'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-slate-300 flex-shrink-0" />
                          {p.due}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
            ].map(({ label, icon: Icon, color, path }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all text-left group cursor-pointer"
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
