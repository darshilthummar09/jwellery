import { Plus, Sliders } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { EmptyState } from '../../components/common/EmptyState';

const SAMPLE_FIELDS: Array<{ id: number; name: string; type: string; options: string; required: boolean }> = [];

export function DynamicFieldsPage() {
  return (
    <PageContainer>
      <PageTitle
        title="Dynamic Fields"
        subtitle="Define custom attributes for your jewellery products."
        className="mb-8"
        action={
          <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98]">
            <Plus size={16} />
            Add Field
          </button>
        }
      />
      {SAMPLE_FIELDS.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <EmptyState title="No dynamic fields yet" description="Add a field to define product attributes." />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Field Name</th>
                  <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Type</th>
                  <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Options</th>
                  <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {SAMPLE_FIELDS.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-880 whitespace-nowrap"><div className="flex items-center gap-2"><Sliders size={14} className="text-purple-400 flex-shrink-0" />{f.name}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium whitespace-nowrap">{f.type}</span></td>
                    <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">{f.options}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${f.required ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {f.required ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
