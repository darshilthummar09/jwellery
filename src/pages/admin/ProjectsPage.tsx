import { Plus, Briefcase, Clock, Filter } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { EmptyState } from '../../components/common/EmptyState';

const PROJECTS = [
  { id: 'PRJ-001', name: 'Patel Wedding Set',     customer: 'Priya Patel',  designer: 'Riya Sharma',  status: 'In Progress', due: '20 Jul', budget: '₹2,45,000' },
  { id: 'PRJ-002', name: 'Anniversary Ring',       customer: 'Anita Mehta', designer: 'Dev Kumar',    status: 'Review',      due: '25 Jul', budget: '₹85,000'   },
  { id: 'PRJ-003', name: 'Custom Necklace',        customer: 'Sunita Roy',  designer: 'Riya Sharma',  status: 'Design',      due: '01 Aug', budget: '₹1,20,000' },
  { id: 'PRJ-004', name: 'Diamond Earrings',       customer: 'Kavya Iyer',  designer: 'Aryan Kapoor', status: 'Completed',   due: '12 Jul', budget: '₹65,000'   },
  { id: 'PRJ-005', name: 'Gold Bangle Set',        customer: 'Meera Singh', designer: 'Dev Kumar',    status: 'In Progress', due: '05 Aug', budget: '₹3,10,000' },
];

const STATUS_COLORS: Record<string, string> = {
  'In Progress': 'bg-blue-100 text-blue-700',
  'Review':      'bg-amber-100 text-amber-700',
  'Design':      'bg-purple-100 text-purple-700',
  'Completed':   'bg-emerald-100 text-emerald-700',
};

export function ProjectsPage() {
  return (
    <PageContainer>
      <PageTitle
        title="Projects"
        subtitle="Manage all jewellery design projects."
        className="mb-8"
        action={
          <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98]">
            <Plus size={16} />
            New Project
          </button>
        }
      />
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-500">{PROJECTS.length} projects</span>
          <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <Filter size={14} /> Filter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">ID</th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Project</th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Customer</th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Designer</th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Budget</th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {PROJECTS.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors cursor-pointer">
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">{p.id}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                  <td className="px-6 py-4 text-slate-600">{p.customer}</td>
                  <td className="px-6 py-4 text-slate-600">{p.designer}</td>
                  <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]}`}>{p.status}</span></td>
                  <td className="px-6 py-4 font-medium text-slate-700">{p.budget}</td>
                  <td className="px-6 py-4 text-slate-500 flex items-center gap-1.5"><Clock size={12} className="text-slate-300" />{p.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
