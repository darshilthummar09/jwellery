import { Link } from 'react-router';
import { ShoppingBag, Clock, CheckCircle2, Star } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { StatCard } from '../../components/common/StatCard';
import { useAuth } from '../../hooks/useAuth';

import { useChatNotification } from '../../context/ChatNotificationContext';

export function CustomerDashboard() {
  const { user } = useAuth();
  const { orders } = useChatNotification();

  const customerId = user?.id ?? user?.email ?? 'customer';
  const customerName = user?.name ?? 'Customer';

  const myOrders = orders.filter(
    (o) =>
      o.customerId === customerId ||
      o.customerName.toLowerCase() === customerName.toLowerCase()
  );

  const activeOrders = myOrders.filter(o => o.status !== 'Completed' && o.status !== 'Rejected');
  const readyOrders = myOrders.filter(o => o.status === 'Completed');

  return (
    <PageContainer>
      <PageTitle
        title={`Hello, ${user?.name?.split(' ')[0]} 💎`}
        subtitle="Track your jewellery orders and stay in touch with our team."
        className="mb-8"
        action={
          <Link
            to="/dashboard/customer/my-products?new=true"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-100 transition-all active:scale-[0.98]"
          >
            + Request Custom Order
          </Link>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5 mb-8">
        <StatCard title="Active Orders"     value={activeOrders.length.toString()} icon={ShoppingBag}  color="emerald" />
        <StatCard title="Ready for Pickup"  value={readyOrders.length.toString()} icon={CheckCircle2} color="blue"    />
        <StatCard title="Avg. Delivery"     value={activeOrders.length > 0 ? "3 weeks" : "-"} icon={Clock}        color="purple"  />
      </div>

      {/* Orders */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-800">My Orders</h2>
          <Link to="/dashboard/customer/my-products" className="text-xs text-emerald-600 font-medium hover:underline">View all</Link>
        </div>
        <div className="space-y-5">
          {myOrders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
              <p className="text-sm font-semibold text-slate-700">No orders yet</p>
              <p className="text-xs text-slate-400 mt-1">Your custom jewellery requests will appear here.</p>
            </div>
          ) : (
            myOrders.map((order) => (
              <div key={order.id} className="p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{order.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Due Date: {order.due}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                    order.status === 'Pending Approval' ? 'bg-amber-100 text-amber-700' :
                    order.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all"
                    style={{ width: order.progress }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-slate-400">Progress</span>
                  <span className="text-[10px] font-medium text-emerald-600">{order.progress}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Rating prompt */}
      <div className="mt-6 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <Star size={32} className="text-white/80 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-lg">Enjoying Dream Jewels?</h3>
            <p className="text-emerald-100 text-sm mt-0.5">Your feedback helps us improve your experience.</p>
          </div>
          <button className="ml-auto flex-shrink-0 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors backdrop-blur-sm">
            Rate Us
          </button>
        </div>
      </div>
    </PageContainer>
  );
}
