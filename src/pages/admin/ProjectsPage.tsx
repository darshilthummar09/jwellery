import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Check, Clock, Filter, Plus, X } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { DetailCard } from '../../components/common/DetailCard';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { Project, ProjectStatus, useChatNotification } from '../../context/ChatNotificationContext';

const STATUS_COLORS: Record<ProjectStatus, string> = {
  'Pending Approval': 'bg-orange-100 text-orange-700',
  Approved: 'bg-emerald-100 text-emerald-700',
  Rejected: 'bg-red-100 text-red-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  Review: 'bg-amber-100 text-amber-700',
  Completed: 'bg-emerald-100 text-emerald-700',
};

const emptyProject = (nextId: string): Project => ({
  id: nextId,
  name: '',
  customerId: `manual-${Date.now()}`,
  customerName: '',
  designerName: 'Riya Sharma',
  status: 'Pending Approval',
  due: '',
  budget: '',
  priority: 'Medium',
  category: '',
  metal: '',
  karat: '',
  progress: '0%',
  created: 'Today',
  notes: '',
});

export function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, ensureDesignerThread, upsertProject, approveProject, rejectProject } = useChatNotification();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [rejectingProject, setRejectingProject] = useState<Project | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ProjectStatus>('All');

  const filteredProjects = useMemo(
    () => projects.filter((project) => statusFilter === 'All' || project.status === statusFilter),
    [projects, statusFilter]
  );

  const openNewProjectModal = () => {
    const nextId = `PRJ-${String(projects.length + 1).padStart(3, '0')}`;
    setEditingProject(emptyProject(nextId));
  };

  const saveProject = (event: FormEvent) => {
    event.preventDefault();
    if (!editingProject) return;

    upsertProject(editingProject);
    setSelectedProject(editingProject);
    setEditingProject(null);
  };

  const openDesignerChat = () => {
    if (!selectedProject) return;

    const threadId = ensureDesignerThread(selectedProject.designerName, selectedProject.name);
    setSelectedProject(null);
    navigate(`/dashboard/admin/chats?thread=${encodeURIComponent(threadId)}`);
  };

  const handleApproveProject = (project: Project) => {
    approveProject(project.id);
    setSelectedProject({ ...project, status: 'Approved', progress: project.progress === '0%' ? '10%' : project.progress });
  };

  const handleRejectProject = (event: FormEvent) => {
    event.preventDefault();
    if (!rejectingProject) return;

    rejectProject(rejectingProject.id, rejectionReason);
    setSelectedProject(null);
    setRejectingProject(null);
    setRejectionReason('');
  };

  return (
    <PageContainer>
      <PageTitle
        title="Projects"
        subtitle="Manage all jewellery design projects."
        className="mb-8"
        action={
          <button onClick={openNewProjectModal} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98]">
            <Plus size={16} />
            New Project
          </button>
        }
      />

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-slate-500">{filteredProjects.length} projects</span>
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <Filter size={14} />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'All' | ProjectStatus)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-emerald-400"
            >
              <option value="All">All statuses</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Completed">Completed</option>
            </select>
          </label>
        </div>

        {filteredProjects.length === 0 ? (
          <EmptyState title="No projects found" description="Change the filter or create a new project." />
        ) : (
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
                  <th className="text-right px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProjects.map((project) => (
                  <tr key={project.id} onClick={() => setSelectedProject(project)} className="hover:bg-slate-50/60 transition-colors cursor-pointer">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{project.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{project.name}</td>
                    <td className="px-6 py-4 text-slate-600">{project.customerName}</td>
                    <td className="px-6 py-4 text-slate-600">{project.designerName}</td>
                    <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[project.status]}`}>{project.status}</span></td>
                    <td className="px-6 py-4 font-medium text-slate-700">{project.budget}</td>
                    <td className="px-6 py-4 text-slate-500 flex items-center gap-1.5"><Clock size={12} className="text-slate-300" />{project.due}</td>
                    <td className="px-6 py-4">
                      {project.status === 'Pending Approval' ? (
                        <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                          <button onClick={() => handleApproveProject(project)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors">
                            <Check size={13} /> Accept
                          </button>
                          <button onClick={() => setRejectingProject(project)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 text-xs font-semibold rounded-lg transition-colors">
                            <X size={13} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="block text-right text-xs text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => setSelectedProject(null)}>
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            <DetailCard
              title={selectedProject.name}
              subtitle={`${selectedProject.id} - ${selectedProject.category}`}
              className="shadow-2xl"
              onClose={() => setSelectedProject(null)}
              badge={<span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selectedProject.status]}`}>{selectedProject.status}</span>}
              fields={[
                { label: 'Customer', value: selectedProject.customerName },
                { label: 'Designer', value: selectedProject.designerName },
                { label: 'Budget', value: selectedProject.budget },
                { label: 'Due Date', value: selectedProject.due },
                { label: 'Priority', value: selectedProject.priority },
                { label: 'Metal', value: `${selectedProject.metal || 'Not specified'} ${selectedProject.karat ? `(${selectedProject.karat})` : ''}` },
                { label: 'Size', value: selectedProject.size || 'Not specified' },
                { label: 'Weight', value: selectedProject.weight || 'Not specified' },
                { label: 'Progress', value: selectedProject.progress },
                { label: 'Created', value: selectedProject.created },
                { label: 'Project ID', value: <span className="font-mono text-xs">{selectedProject.id}</span> },
              ]}
              actions={
                <>
                  {selectedProject.status === 'Pending Approval' && (
                    <>
                      <button onClick={() => handleApproveProject(selectedProject)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors">
                        <Check size={14} /> Approve
                      </button>
                      <button onClick={() => setRejectingProject(selectedProject)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 text-xs font-semibold rounded-xl transition-colors">
                        <X size={14} /> Reject
                      </button>
                    </>
                  )}
                  <button onClick={() => setEditingProject(selectedProject)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors">Edit Project</button>
                  <button onClick={openDesignerChat} className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-colors">Message Designer</button>
                </>
              }
            >
              <div className="bg-slate-50 rounded-xl px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Notes</div>
                <p className="text-sm text-slate-600 leading-relaxed">{selectedProject.notes}</p>
              </div>
              {selectedProject.image && (
                <div className="bg-slate-50 rounded-xl px-4 py-3 mt-3">
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">Sample Image / Sketch</div>
                  <a href={selectedProject.image} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-slate-200 bg-white max-w-xs">
                    <img src={selectedProject.image} alt={selectedProject.name} className="h-40 w-full object-cover" />
                  </a>
                  <p className="text-[10px] text-slate-400 mt-2">Additional files (PDFs, sketches) are visible in the customer's chat thread.</p>
                </div>
              )}
              {selectedProject.rejectionReason && (
                <div className="bg-red-50 rounded-xl px-4 py-3 mt-3 border border-red-100">
                  <div className="text-xs font-medium uppercase tracking-wider text-red-400 mb-1">Rejection Reason</div>
                  <p className="text-sm text-red-700 leading-relaxed">{selectedProject.rejectionReason}</p>
                </div>
              )}
            </DetailCard>
          </div>
        </div>
      )}

      {editingProject && (
        <Modal title={projects.some((project) => project.id === editingProject.id) ? 'Edit Project' : 'New Project'} subtitle={editingProject.id} onClose={() => setEditingProject(null)}>
          <form onSubmit={saveProject} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ['Project Name', 'name'],
              ['Customer', 'customerName'],
              ['Designer', 'designerName'],
              ['Category', 'category'],
              ['Metal', 'metal'],
              ['Karat', 'karat'],
              ['Budget', 'budget'],
              ['Due Date', 'due'],
              ['Progress', 'progress'],
            ].map(([label, key]) => (
              <label key={key} className="text-sm font-medium text-slate-700">
                {label}
                <input
                  required
                  value={String(editingProject[key as keyof Project])}
                  onChange={(event) => setEditingProject({ ...editingProject, [key]: event.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            ))}
            <label className="text-sm font-medium text-slate-700">
              Status
              <select value={editingProject.status} onChange={(event) => setEditingProject({ ...editingProject, status: event.target.value as ProjectStatus })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400">
                <option>Pending Approval</option>
                <option>Approved</option>
                <option>Rejected</option>
                <option>In Progress</option>
                <option>Review</option>
                <option>Completed</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Priority
              <select value={editingProject.priority} onChange={(event) => setEditingProject({ ...editingProject, priority: event.target.value as Project['priority'] })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </label>
            <label className="sm:col-span-2 text-sm font-medium text-slate-700">
              Notes
              <textarea value={editingProject.notes} onChange={(event) => setEditingProject({ ...editingProject, notes: event.target.value })} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
            </label>
            <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditingProject(null)} className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-sm font-semibold rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors">Save Project</button>
            </div>
          </form>
        </Modal>
      )}

      {rejectingProject && (
        <Modal title="Reject Project" subtitle={rejectingProject.name} onClose={() => setRejectingProject(null)}>
          <form onSubmit={handleRejectProject} className="space-y-4">
            <label className="text-sm font-medium text-slate-700">
              Reason shared with customer
              <textarea
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                rows={3}
                placeholder="Optional reason for rejection"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setRejectingProject(null)} className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-sm font-semibold rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors">Reject Project</button>
            </div>
          </form>
        </Modal>
      )}
    </PageContainer>
  );
}
