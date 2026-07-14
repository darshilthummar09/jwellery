import { Link } from 'react-router';
import { ShoppingBag, Clock, CheckCircle2, Star } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { StatCard } from '../../components/common/StatCard';
import { useAuth } from '../../hooks/useAuth';

const MY_ORDERS = [
  { name: 'Solitaire Engagement Ring', status: 'In Design', progress: 60, eta: '25 Jul 2025' },
  { name: 'Gold Bangles Set',          status: 'Ready',     progress: 100, eta: 'Pickup Ready' },
  { name: 'Diamond Pendant',           status: 'In Review', progress: 80, eta: '30 Jul 2025' },
];

export function CustomerDashboard() {
  const { user } = useAuth();

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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard title="Active Orders"     value="3"   icon={ShoppingBag}  color="emerald" />
        <StatCard title="Ready for Pickup"  value="1"   icon={CheckCircle2} color="blue"    />
        <StatCard title="Avg. Delivery"     value="18d" icon={Clock}        color="purple"  />
      </div>

      {/* Orders */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-800">My Orders</h2>
          <span className="text-xs text-emerald-600 font-medium cursor-pointer hover:underline">View all</span>
        </div>
        <div className="space-y-5">
          {MY_ORDERS.map((order, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{order.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">ETA: {order.eta}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  order.status === 'Ready' ? 'bg-emerald-100 text-emerald-700' :
                  order.status === 'In Review' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {order.status}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${order.progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-slate-400">Progress</span>
                <span className="text-[10px] font-medium text-emerald-600">{order.progress}%</span>
              </div>
            </div>
          ))}
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
