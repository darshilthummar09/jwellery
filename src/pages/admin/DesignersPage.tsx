import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { MessageSquare, Search, UserPlus } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { DetailCard } from '../../components/common/DetailCard';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { useChatNotification } from '../../context/ChatNotificationContext';

interface Designer {
  id: number;
  name: string;
  speciality: string;
  active: number;
  completed: number;
  status: 'Available' | 'Busy' | 'On Leave';
  email: string;
}

const INITIAL_DESIGNERS: Designer[] = [
  { id: 1, name: 'Riya Sharma', speciality: 'Rings & Necklaces', active: 0, completed: 0, status: 'Available', email: 'designer1@dreamjewels.com' },
];

const STATUS_MAP: Record<Designer['status'], 'success' | 'warning' | 'muted'> = {
  Available: 'success',
  Busy: 'warning',
  'On Leave': 'muted',
};

const blankDesigner = (id: number): Designer => ({
  id,
  name: '',
  speciality: '',
  active: 0,
  completed: 0,
  status: 'Available',
  email: '',
});

export function DesignersPage() {
  const navigate = useNavigate();
  const { ensureDesignerThread } = useChatNotification();
  const [designers, setDesigners] = useState(INITIAL_DESIGNERS);
  const [search, setSearch] = useState('');
  const [selectedDesigner, setSelectedDesigner] = useState<Designer | null>(null);
  const [draftDesigner, setDraftDesigner] = useState<Designer | null>(null);

  const filteredDesigners = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return designers;
    return designers.filter((designer) =>
      [designer.name, designer.email, designer.speciality, designer.status].some((value) => value.toLowerCase().includes(query))
    );
  }, [designers, search]);

  const saveDesigner = (event: FormEvent) => {
    event.preventDefault();
    if (!draftDesigner) return;

    setDesigners((current) => [draftDesigner, ...current]);
    setSelectedDesigner(draftDesigner);
    setDraftDesigner(null);
  };

  const messageDesigner = (designer: Designer) => {
    const threadId = ensureDesignerThread(designer.name);
    setSelectedDesigner(null);
    navigate(`/dashboard/admin/chats?thread=${encodeURIComponent(threadId)}`);
  };

  return (
    <PageContainer>
      <PageTitle
        title="Designers"
        subtitle="Manage your design team."
        className="mb-8"
        action={
          <button onClick={() => setDraftDesigner(blankDesigner(designers.length + 1))} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98]">
            <UserPlus size={16} />
            Add Designer
          </button>
        }
      />

      <div className="mb-5 flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-500 max-w-xs hover:border-emerald-300 transition-colors">
        <Search size={15} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} className="bg-transparent outline-none w-full placeholder-slate-400" placeholder="Search designers..." />
      </div>

      {filteredDesigners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <EmptyState title="No designers found" description="Try another search or add a designer." />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-5">
          {filteredDesigners.map((designer) => (
            <button key={designer.id} onClick={() => setSelectedDesigner(designer)} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-emerald-200 transition-all text-left">
              <div className="flex items-start justify-between mb-4">
                <Avatar user={{ name: designer.name }} size="md" />
                <Badge variant={STATUS_MAP[designer.status]}>{designer.status}</Badge>
              </div>
              <h3 className="font-semibold text-slate-800">{designer.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5 mb-4">{designer.speciality}</p>
              <div className="flex items-center gap-4 text-center border-t border-slate-50 pt-4">
                <div className="flex-1">
                  <div className="text-lg font-bold text-slate-800">{designer.active}</div>
                  <div className="text-[10px] text-slate-400">Active</div>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                <div className="flex-1">
                  <div className="text-lg font-bold text-slate-800">{designer.completed}</div>
                  <div className="text-[10px] text-slate-400">Completed</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedDesigner && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedDesigner(null)}>
          <div className="w-full max-w-2xl" onClick={(event) => event.stopPropagation()}>
            <DetailCard
              title={selectedDesigner.name}
              subtitle={selectedDesigner.email}
              className="shadow-2xl"
              onClose={() => setSelectedDesigner(null)}
              badge={<Badge variant={STATUS_MAP[selectedDesigner.status]}>{selectedDesigner.status}</Badge>}
              fields={[
                { label: 'Speciality', value: selectedDesigner.speciality },
                { label: 'Active Projects', value: selectedDesigner.active },
                { label: 'Completed Projects', value: selectedDesigner.completed },
                { label: 'Availability', value: selectedDesigner.status },
              ]}
              actions={
                <button onClick={() => messageDesigner(selectedDesigner)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors">
                  <MessageSquare size={14} />
                  Message Designer
                </button>
              }
            />
          </div>
        </div>
      )}

      {draftDesigner && (
        <Modal title="Add Designer" onClose={() => setDraftDesigner(null)}>
          <form onSubmit={saveDesigner} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-sm font-medium text-slate-700">
              Name
              <input required value={draftDesigner.name} onChange={(event) => setDraftDesigner({ ...draftDesigner, name: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Email
              <input required type="email" value={draftDesigner.email} onChange={(event) => setDraftDesigner({ ...draftDesigner, email: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Speciality
              <input required value={draftDesigner.speciality} onChange={(event) => setDraftDesigner({ ...draftDesigner, speciality: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Status
              <select value={draftDesigner.status} onChange={(event) => setDraftDesigner({ ...draftDesigner, status: event.target.value as Designer['status'] })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400">
                <option>Available</option>
                <option>Busy</option>
                <option>On Leave</option>
              </select>
            </label>
            <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setDraftDesigner(null)} className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-sm font-semibold rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors">Save Designer</button>
            </div>
          </form>
        </Modal>
      )}
    </PageContainer>
  );
}
