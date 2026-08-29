import { useState } from 'react';
import { Plus, Sliders, Trash2 } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { Modal } from '../../components/common/Modal';
import {
  DynamicFieldItem,
  getStoredDynamicFields,
  saveStoredDynamicFields,
} from '../../services/categoryService';

export function DynamicFieldsPage() {
  const [fields, setFields] = useState<DynamicFieldItem[]>(() => getStoredDynamicFields());
  const [deletingField, setDeletingField] = useState<number | null>(null);
  const [draftField, setDraftField] = useState<Partial<DynamicFieldItem> | null>(null);

  const saveField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftField?.name) return;

    const newField: DynamicFieldItem = {
      id: Date.now(),
      name: draftField.name.trim(),
      type: draftField.type || 'Text',
      options: draftField.options?.trim() || '-',
      required: draftField.required || false,
    };

    const updated = [...fields, newField];
    setFields(updated);
    saveStoredDynamicFields(updated);
    setDraftField(null);
  };

  const handleDeleteField = (fieldId: number) => {
    const updated = fields.filter((f) => f.id !== fieldId);
    setFields(updated);
    saveStoredDynamicFields(updated);
    setDeletingField(null);
  };

  return (
    <PageContainer>
      <PageTitle
        title="Dynamic Fields"
        subtitle="Define custom attributes for your jewellery products."
        className="mb-8"
        action={
          <button
            onClick={() => setDraftField({ name: '', type: 'Text', options: '', required: false })}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus size={16} />
            Add Field
          </button>
        }
      />
      {fields.length === 0 ? (
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
                  <th className="text-right px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {fields.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Sliders size={14} className="text-purple-500 flex-shrink-0" />
                        {f.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium whitespace-nowrap">
                        {f.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">{f.options}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${f.required ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {f.required ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setDeletingField(f.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Field"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deletingField !== null && (
        <ConfirmModal
          title="Delete Field"
          message={`Are you sure you want to delete this field? This action cannot be undone.`}
          confirmLabel="Delete Field"
          onConfirm={() => handleDeleteField(deletingField)}
          onClose={() => setDeletingField(null)}
        />
      )}

      {draftField && (
        <Modal title="Add New Dynamic Field" onClose={() => setDraftField(null)}>
          <form onSubmit={saveField} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Field Name *
              <input
                required
                value={draftField.name || ''}
                onChange={(e) => setDraftField({ ...draftField, name: e.target.value })}
                placeholder="e.g. Diamond Clarity, Gold Hallmark"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium text-slate-700">
                Field Type
                <select
                  value={draftField.type || 'Text'}
                  onChange={(e) => setDraftField({ ...draftField, type: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 cursor-pointer"
                >
                  <option value="Text">Text</option>
                  <option value="Number">Number</option>
                  <option value="Select">Dropdown Select</option>
                  <option value="Date">Date</option>
                  <option value="Checkbox">Checkbox</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Required Field?
                <select
                  value={draftField.required ? 'true' : 'false'}
                  onChange={(e) => setDraftField({ ...draftField, required: e.target.value === 'true' })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 cursor-pointer"
                >
                  <option value="false">No (Optional)</option>
                  <option value="true">Yes (Mandatory)</option>
                </select>
              </label>
            </div>
            <label className="block text-sm font-medium text-slate-700">
              Options / Hint (e.g. "VVS, VS, SI" or "in mm")
              <input
                value={draftField.options || ''}
                onChange={(e) => setDraftField({ ...draftField, options: e.target.value })}
                placeholder="Comma-separated options or unit"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDraftField(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-emerald-200 cursor-pointer"
              >
                Add Field
              </button>
            </div>
          </form>
        </Modal>
      )}
    </PageContainer>
  );
}
