import { UserPlus } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';

const DESIGNERS = [
  { id: 1, name: 'Riya Sharma',   speciality: 'Rings & Necklaces', active: 2, completed: 18, status: 'Available'  },
  { id: 2, name: 'Dev Kumar',     speciality: 'Bangles & Bracelets', active: 1, completed: 24, status: 'Busy'      },
  { id: 3, name: 'Aryan Kapoor',  speciality: 'Earrings',           active: 0, completed: 9,  status: 'Available'  },
  { id: 4, name: 'Sneha Das',     speciality: 'Pendants',           active: 1, completed: 12, status: 'On Leave'   },
];

const STATUS_MAP: Record<string, 'success' | 'warning' | 'muted'> = {
  'Available': 'success',
  'Busy':      'warning',
  'On Leave':  'muted',
};

export function DesignersPage() {
  return (
    <PageContainer>
      <PageTitle
        title="Designers"
        subtitle="Manage your design team."
        className="mb-8"
        action={
          <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98]">
            <UserPlus size={16} />
            Add Designer
          </button>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-5">
        {DESIGNERS.map((d) => (
          <div key={d.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <Avatar user={{ name: d.name }} size="md" />
              <Badge variant={STATUS_MAP[d.status]}>{d.status}</Badge>
            </div>
            <h3 className="font-semibold text-slate-800">{d.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5 mb-4">{d.speciality}</p>
            <div className="flex items-center gap-4 text-center border-t border-slate-50 pt-4">
              <div className="flex-1">
                <div className="text-lg font-bold text-slate-800">{d.active}</div>
                <div className="text-[10px] text-slate-400">Active</div>
              </div>
              <div className="w-px h-8 bg-slate-100" />
              <div className="flex-1">
                <div className="text-lg font-bold text-slate-800">{d.completed}</div>
                <div className="text-[10px] text-slate-400">Completed</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
