import { Plus, Sliders } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { EmptyState } from '../../components/common/EmptyState';

const SAMPLE_FIELDS = [
  { id: 1, name: 'Metal Type',   type: 'Select',   options: 'Gold, Silver, Platinum', required: true },
  { id: 2, name: 'Karat',        type: 'Select',   options: '14k, 18k, 22k, 24k',    required: true },
  { id: 3, name: 'Weight (g)',   type: 'Number',   options: '-',                      required: false },
  { id: 4, name: 'Engraving',    type: 'Text',     options: '-',                      required: false },
  { id: 5, name: 'Certificate',  type: 'Checkbox', options: '-',                      required: false },
];

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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Field Name</th>
              <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Type</th>
              <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Options</th>
              <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Required</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {SAMPLE_FIELDS.map((f) => (
              <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-2"><Sliders size={14} className="text-purple-400" />{f.name}</td>
                <td className="px-6 py-4"><span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">{f.type}</span></td>
                <td className="px-6 py-4 text-slate-400 text-xs">{f.options}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${f.required ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {f.required ? 'Yes' : 'No'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
