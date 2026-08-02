import { useState } from 'react';
import { Plus, Tag, Trash2 } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { Modal } from '../../components/common/Modal';

export const CATEGORIES: Array<{ name: string; count: number; icon: string; color: string }> = [];

export function CategoriesPage() {
  const [categories, setCategories] = useState(CATEGORIES);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  const [draftCategory, setDraftCategory] = useState<Partial<{ name: string; icon: string; color: string }> | null>(null);

  const saveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftCategory?.name || !draftCategory?.icon) return;
    
    setCategories(prev => [...prev, {
      name: draftCategory.name!,
      icon: draftCategory.icon!,
      color: draftCategory.color || 'bg-slate-50 text-slate-700 border-slate-200',
      count: 0
    }]);
    setDraftCategory(null);
  };

  return (
    <PageContainer>
      <PageTitle
        title="Categories"
        subtitle="Organise your jewellery products by category."
        className="mb-8"
        action={
          <button 
            onClick={() => setDraftCategory({ name: '', icon: '✨', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' })}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus size={16} />
            Add Category
          </button>
        }
      />
      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <EmptyState title="No categories yet" description="Add a category to start organising products." />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className={`bg-white rounded-2xl border ${cat.color.split(' ')[2]} p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{cat.icon}</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingCategory(cat.name);
                    }}
                    className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <Tag size={16} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
                </div>
              </div>
              <h3 className="text-base font-semibold text-slate-800 mb-1">{cat.name}</h3>
              <p className="text-sm text-slate-500">{cat.count} products</p>
            </div>
          ))}
        </div>
      )}

      {deletingCategory && (
        <ConfirmModal
          title="Delete Category"
          message={`Are you sure you want to delete the category "${deletingCategory}"? This action cannot be undone.`}
          confirmLabel="Delete Category"
          onConfirm={() => {
            setCategories((prev) => prev.filter((c) => c.name !== deletingCategory));
            setDeletingCategory(null);
          }}
          onClose={() => setDeletingCategory(null)}
        />
      )}

      {draftCategory && (
        <Modal title="Add New Category" onClose={() => setDraftCategory(null)}>
          <form onSubmit={saveCategory} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Category Name
              <input required value={draftCategory.name} onChange={(e) => setDraftCategory({ ...draftCategory, name: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Emoji Icon (e.g., 💍, 👑)
              <input required maxLength={2} value={draftCategory.icon} onChange={(e) => setDraftCategory({ ...draftCategory, icon: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Theme Color
              <select value={draftCategory.color} onChange={(e) => setDraftCategory({ ...draftCategory, color: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100">
                <option value="bg-emerald-50 text-emerald-700 border-emerald-200">Emerald</option>
                <option value="bg-blue-50 text-blue-700 border-blue-200">Blue</option>
                <option value="bg-purple-50 text-purple-700 border-purple-200">Purple</option>
                <option value="bg-orange-50 text-orange-700 border-orange-200">Orange</option>
                <option value="bg-rose-50 text-rose-700 border-rose-200">Rose</option>
              </select>
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setDraftCategory(null)} className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-sm font-semibold rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-emerald-200">Save Category</button>
            </div>
          </form>
        </Modal>
      )}
    </PageContainer>
  );
}
