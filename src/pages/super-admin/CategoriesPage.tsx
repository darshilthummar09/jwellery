import { Plus, Tag } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';

const CATEGORIES = [
  { name: 'Rings',      count: 124, icon: '💍', color: 'bg-pink-50 text-pink-600 border-pink-200' },
  { name: 'Necklaces',  count: 86,  icon: '📿', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { name: 'Earrings',   count: 210, icon: '✨', color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { name: 'Bracelets',  count: 73,  icon: '🔱', color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { name: 'Bangles',    count: 95,  icon: '⭕', color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { name: 'Pendants',   count: 54,  icon: '💎', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
];

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
    </PageContainer>
  );
}
