import { useState } from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { DetailCard } from '../../components/common/DetailCard';
import { Project, useChatNotification } from '../../context/ChatNotificationContext';
import { useAuth } from '../../hooks/useAuth';

const STATUS_COLORS: Record<string, string> = {
  Approved: 'bg-emerald-100 text-emerald-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  Review: 'bg-amber-100 text-amber-700',
  Completed: 'bg-emerald-100 text-emerald-700',
};

const PRIORITY_COLORS: Record<string, string> = {
  High: 'text-red-600',
  Medium: 'text-amber-600',
  Low: 'text-slate-400',
};

export function AssignedProjectsPage() {
  const { user } = useAuth();
  const { projects } = useChatNotification();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const assignedProjects = projects.filter(
    (project) =>
      project.status !== 'Pending Approval' &&
      project.status !== 'Rejected' &&
      project.designerName.toLowerCase() === (user?.name ?? '').toLowerCase()
  );

  return (
    <PageContainer>
      <PageTitle title="Assigned Projects" subtitle="Your current jewellery design assignments." className="mb-8" />
      <div className="space-y-5">
        {assignedProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-700">No assigned projects</p>
            <p className="text-xs text-slate-400 mt-1">Projects assigned by admin will appear here.</p>
          </div>
        ) : (
          assignedProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:border-emerald-200 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-400">{project.id}</span>
                    <span className={`text-xs font-semibold ${PRIORITY_COLORS[project.priority]}`}>● {project.priority} Priority</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-800">{project.name}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Client: {project.customerName}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[project.status] ?? 'bg-slate-100 text-slate-700'}`}>{project.status}</span>
                  <span className="flex items-center gap-1 text-xs text-slate-400"><Clock size={11} />{project.due}</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-start gap-2">
                <AlertCircle size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-600 italic">{project.notes || 'No extra notes were provided.'}</p>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors">Update Status</button>
                <button onClick={() => setSelectedProject(project)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors">View Details</button>
              </div>
            </div>
          ))
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
              badge={<span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selectedProject.status] ?? 'bg-slate-100 text-slate-700'}`}>{selectedProject.status}</span>}
              fields={[
                { label: 'Customer', value: selectedProject.customerName },
                { label: 'Budget', value: selectedProject.budget },
                { label: 'Due Date', value: selectedProject.due },
                { label: 'Priority', value: selectedProject.priority },
                { label: 'Metal', value: `${selectedProject.metal || 'Not specified'} ${selectedProject.karat ? `(${selectedProject.karat})` : ''}` },
                { label: 'Size', value: selectedProject.size || 'Not specified' },
                { label: 'Weight', value: selectedProject.weight || 'Not specified' },
                { label: 'Created', value: selectedProject.created },
                { label: 'Project ID', value: <span className="font-mono text-xs">{selectedProject.id}</span> },
              ]}
            >
              <div className="bg-slate-50 rounded-xl px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Project Notes</div>
                <p className="text-sm text-slate-600 leading-relaxed">{selectedProject.notes || 'No extra notes were provided.'}</p>
              </div>
              {(selectedProject.images?.length || selectedProject.image) && (
                <div className="bg-slate-50 rounded-xl px-4 py-3 mt-3">
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">Sample Images / Sketches</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(selectedProject.images?.length ? selectedProject.images : [{ id: 0, name: selectedProject.name, url: selectedProject.image ?? '', size: 0, type: 'image/*' }]).map((image) => (
                      <a key={image.id} href={image.url} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-slate-200 bg-white">
                        <img src={image.url} alt={image.name} className="h-32 w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </DetailCard>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
