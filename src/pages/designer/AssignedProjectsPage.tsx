import { Palette, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';

const PROJECTS = [
  { id: 'PRJ-001', name: 'Patel Wedding Set',  client: 'Priya Patel',  due: '20 Jul', priority: 'High',   status: 'In Progress', notes: 'Client prefers rose gold finish.' },
  { id: 'PRJ-003', name: 'Custom Necklace',    client: 'Sunita Roy',   due: '01 Aug', priority: 'Medium', status: 'Design',      notes: 'Diamond pendant, 18k yellow gold chain.' },
  { id: 'PRJ-002', name: 'Engagement Ring',    client: 'Kavya Iyer',   due: '28 Jul', priority: 'High',   status: 'Review',      notes: 'Round brilliant cut, 1ct, platinum band.' },
];

const STATUS_COLORS: Record<string, string> = {
  'In Progress': 'bg-blue-100 text-blue-700',
  'Design':      'bg-purple-100 text-purple-700',
  'Review':      'bg-amber-100 text-amber-700',
};

const PRIORITY_COLORS: Record<string, string> = {
  'High':   'text-red-600',
  'Medium': 'text-amber-600',
  'Low':    'text-slate-400',
};

export function AssignedProjectsPage() {
  return (
    <PageContainer>
      <PageTitle title="Assigned Projects" subtitle="Your current jewellery design assignments." className="mb-8" />
      <div className="space-y-5">
        {PROJECTS.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:border-emerald-200 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-slate-400">{p.id}</span>
                  <span className={`text-xs font-semibold ${PRIORITY_COLORS[p.priority]}`}>● {p.priority} Priority</span>
                </div>
                <h3 className="text-base font-bold text-slate-800">{p.name}</h3>
                <p className="text-sm text-slate-500 mt-0.5">Client: {p.client}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                <span className="flex items-center gap-1 text-xs text-slate-400"><Clock size={11} />{p.due}</span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-start gap-2">
              <AlertCircle size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-slate-600 italic">{p.notes}</p>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors">Update Status</button>
              <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors">View Details</button>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
