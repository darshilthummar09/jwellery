import { Briefcase, Users, MessageSquare, TrendingUp, Clock } from 'lucide-react';
import { useNavigate } from 'react-router';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { StatCard } from '../../components/common/StatCard';
import { useAuth } from '../../hooks/useAuth';
import { useChatNotification } from '../../context/ChatNotificationContext';
import { MOCK_USERS } from '../../data/mock-users';

const STATUS_COLORS: Record<string, string> = {
  'Pending Approval': 'bg-amber-100 text-amber-700',
  'Approved': 'bg-emerald-100 text-emerald-700',
  'Rejected': 'bg-red-100 text-red-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Review':      'bg-amber-100 text-amber-700',
  'Completed':   'bg-emerald-100 text-emerald-700',
};

export function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { projects, threads } = useChatNotification();

  const activeProjects = projects.filter(p => p.status !== 'Completed' && p.status !== 'Rejected');
  const recentProjects = [...projects].reverse().slice(0, 5);
  
  // Calculate open chats (threads with unread admin messages)
  const openChatsCount = threads.filter(t => t.unread > 0).length;

  const totalCustomers = MOCK_USERS.filter(u => u.role === 'customer').length;
  const totalDesigners = MOCK_USERS.filter(u => u.role === 'designer').length;

  return (
    <PageContainer>
      <PageTitle
        title={`Good day, ${user?.name?.split(' ')[0]} 👋`}
        subtitle="Here's a snapshot of your jewellery projects today."
        className="mb-8"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard title="Active Projects" value={activeProjects.length.toString()} icon={Briefcase}     color="emerald" onClick={() => navigate('/dashboard/admin/projects')} />
        <StatCard title="Customers"       value={totalCustomers.toString()} icon={Users}         color="blue" onClick={() => navigate('/dashboard/admin/customers')} />
        <StatCard title="Designers"       value={totalDesigners.toString()} icon={TrendingUp}    color="purple" onClick={() => navigate('/dashboard/admin/designers')} />
        <StatCard title="Open Chats"      value={openChatsCount.toString()} icon={MessageSquare} color="orange" onClick={() => navigate('/dashboard/admin/chats')} />
      </div>

      {/* Recent Projects Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Recent Projects</h2>
          <button
            onClick={() => navigate('/dashboard/admin/projects')}
            className="text-xs text-emerald-600 cursor-pointer hover:underline font-medium"
          >
            View all projects
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Project</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Customer</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Designer</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentProjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">No recent projects</td>
                </tr>
              ) : (
                recentProjects.map((p) => (
                  <tr key={p.id} onClick={() => navigate('/dashboard/admin/projects')} className="hover:bg-slate-50/60 transition-colors cursor-pointer">
                    <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{p.customerName}</td>
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{p.designerName || '-'}</td>
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
    </PageContainer>
  );
}
