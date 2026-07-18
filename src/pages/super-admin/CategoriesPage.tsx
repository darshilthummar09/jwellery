import { Plus, Tag } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { EmptyState } from '../../components/common/EmptyState';

const CATEGORIES: Array<{ name: string; count: number; icon: string; color: string }> = [];

export function CategoriesPage() {
  return (
    <PageContainer>
      <PageTitle
        title="Categories"
        subtitle="Organise your jewellery products by category."
        className="mb-8"
        action={
          <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98]">
            <Plus size={16} />
            Add Category
          </button>
        }
      />
      {CATEGORIES.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <EmptyState title="No categories yet" description="Add a category to start organising products." />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              className={`bg-white rounded-2xl border ${cat.color.split(' ')[2]} p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{cat.icon}</span>
                <Tag size={16} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 mb-1">{cat.name}</h3>
              <p className="text-sm text-slate-500">{cat.count} products</p>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
