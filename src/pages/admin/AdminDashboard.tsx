import { Briefcase, Users, MessageSquare, TrendingUp, Clock } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { StatCard } from '../../components/common/StatCard';
import { useAuth } from '../../hooks/useAuth';

const RECENT_PROJECTS = [
  { name: 'Patel Wedding Set',      customer: 'Priya Patel',    status: 'In Progress', designer: 'Riya Sharma',  due: '20 Jul' },
  { name: 'Anniversary Ring',       customer: 'Anita Mehta',    status: 'Review',      designer: 'Dev Kumar',   due: '25 Jul' },
  { name: 'Custom Necklace',        customer: 'Sunita Roy',     status: 'Design',      designer: 'Riya Sharma',  due: '01 Aug' },
  { name: 'Diamond Earrings Set',   customer: 'Kavya Iyer',     status: 'Completed',   designer: 'Aryan Kapoor', due: '12 Jul' },
];

const STATUS_COLORS: Record<string, string> = {
  'In Progress': 'bg-blue-100 text-blue-700',
  'Review':      'bg-amber-100 text-amber-700',
  'Design':      'bg-purple-100 text-purple-700',
  'Completed':   'bg-emerald-100 text-emerald-700',
};

export function AdminDashboard() {
  const { user } = useAuth();

  return (
    <PageContainer>
      <PageTitle
        title={`Good day, ${user?.name?.split(' ')[0]} 👋`}
        subtitle="Here's a snapshot of your jewellery projects today."
        className="mb-8"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard title="Active Projects" value="12"  icon={Briefcase}     trend={{ value: '+2', direction: 'up' }}      color="emerald" />
        <StatCard title="Customers"       value="38"  icon={Users}         trend={{ value: '+5', direction: 'up' }}      color="blue"    />
        <StatCard title="Designers"       value="6"   icon={TrendingUp}    trend={{ value: 'stable', direction: 'neutral' }} color="purple" />
        <StatCard title="Open Chats"      value="9"   icon={MessageSquare} trend={{ value: '-3', direction: 'down' }}    color="orange"  />
      </div>

      {/* Recent Projects Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Recent Projects</h2>
          <span className="text-xs text-emerald-600 cursor-pointer hover:underline font-medium">View all projects</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Project</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Customer</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Designer</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {RECENT_PROJECTS.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                  <td className="px-6 py-4 text-slate-600">{p.customer}</td>
                  <td className="px-6 py-4 text-slate-600">{p.designer}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-300" />
                    {p.due}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
