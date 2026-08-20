import { ClipboardList, CheckCircle2, Clock, Palette } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { StatCard } from '../../components/common/StatCard';
import { useAuth } from '../../hooks/useAuth';

import { useChatNotification } from '../../context/ChatNotificationContext';

export function DesignerDashboard() {
  const { user } = useAuth();
  const { orders } = useChatNotification();

  const designerOrders = orders.filter(
    (order) =>
      order.status !== 'Pending Approval' &&
      order.status !== 'Rejected' &&
      order.designerName.toLowerCase() === (user?.name ?? '').toLowerCase()
  );

  const activeOrders = designerOrders.filter(o => o.status !== 'Completed');
  const completedOrders = designerOrders.filter(o => o.status === 'Completed');

  return (
    <PageContainer>
      <PageTitle
        title={`Hello, ${user?.name?.split(' ')[0]} 🎨`}
        subtitle="Here are your current design assignments."
        className="mb-8"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-6 sm:mb-8">
        <StatCard title="Assigned Orders" value={activeOrders.length.toString()} icon={ClipboardList} color="emerald" />
        <StatCard title="Completed"       value={completedOrders.length.toString()} icon={CheckCircle2}  color="blue"    />
        <StatCard title="Avg. Completion" value={completedOrders.length > 0 ? "8 days" : "-"} icon={Clock}         color="purple"  />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-800">Current Orders</h2>
          <Palette size={18} className="text-slate-300" />
        </div>
        <div className="space-y-4">
          {designerOrders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
              <p className="text-sm font-semibold text-slate-700">No assigned orders</p>
              <p className="text-xs text-slate-400 mt-1">New assignments will appear here.</p>
            </div>
          ) : (
            designerOrders.map((order) => (
              <div key={order.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Palette size={18} className="text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">{order.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Client: {order.customerName} · Due: {order.due}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 sm:ml-auto">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                    order.priority === 'High' ? 'text-red-600 bg-red-50 border-red-200' :
                    order.priority === 'Medium' ? 'text-amber-600 bg-amber-50 border-amber-200' :
                    'text-slate-500 bg-slate-50 border-slate-200'
                  }`}>
                    {order.priority}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    order.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'Review' ? 'bg-amber-100 text-amber-700' :
                    order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageContainer>
  );
}
