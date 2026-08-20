import { Users, Settings, Tag, Sliders, ShoppingBag, Briefcase, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { StatCard } from '../../components/common/StatCard';
import { Avatar } from '../../components/common/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { Order, useChatNotification } from '../../context/ChatNotificationContext';
import { MOCK_USERS } from '../../data/mock-users';
import { INITIAL_CUSTOMERS } from '../../data/mock-customers';
import { CATEGORIES } from './CategoriesPage';
import { SAMPLE_FIELDS } from './DynamicFieldsPage';

interface ClientSummary {
  id: string;
  name: string;
  email: string;
  orderCount: number;
  lastOrderDate: string | null;
}

function buildClientSummaries(orders: Order[]): ClientSummary[] {
  const map = new Map<string, ClientSummary>();

  INITIAL_CUSTOMERS.forEach((customer) => {
    map.set(customer.id, { id: customer.id, name: customer.name, email: customer.email, orderCount: 0, lastOrderDate: null });
  });

  orders.forEach((order) => {
    const existing =
      map.get(order.customerId) ??
      Array.from(map.values()).find((client) => client.name.toLowerCase() === order.customerName.toLowerCase());

    if (existing) {
      existing.orderCount += 1;
      existing.lastOrderDate = order.created;
    } else {
      map.set(order.customerId, {
        id: order.customerId,
        name: order.customerName,
        email: '—',
        orderCount: 1,
        lastOrderDate: order.created,
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => b.orderCount - a.orderCount);
}

export function SuperAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { orders } = useChatNotification();

  const activeOrders = orders.filter(o => o.status !== 'Completed' && o.status !== 'Rejected');
  const clients = buildClientSummaries(orders).slice(0, 6);

  const totalUsers = MOCK_USERS.length;
  const totalCategories = CATEGORIES.length;
  const totalFields = SAMPLE_FIELDS.length;

  const goToClientOrders = (client: ClientSummary) => {
    navigate(`/dashboard/super-admin/orders?customerId=${encodeURIComponent(client.id)}&customerName=${encodeURIComponent(client.name)}`);
  };

  return (
    <PageContainer>
      <PageTitle
        title={`Welcome back, ${user?.name?.split(' ')[0]} 👋`}
        subtitle="Here's what's happening in your jewellery platform today."
        className="mb-6 sm:mb-8"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-6 sm:mb-8">
        <StatCard title="Active Orders"     value={activeOrders.length.toString()} icon={Briefcase} color="emerald" onClick={() => navigate('/dashboard/super-admin/orders')} />
        <StatCard title="Total Users"       value={totalUsers.toString()}   icon={Users}    color="blue" onClick={() => navigate('/dashboard/super-admin/users')} />
        <StatCard title="Active Categories" value={totalCategories.toString()}   icon={Tag}      color="purple" onClick={() => navigate('/dashboard/super-admin/categories')} />
        <StatCard title="Dynamic Fields"    value={totalFields.toString()}   icon={Sliders}  color="orange" onClick={() => navigate('/dashboard/super-admin/dynamic-fields')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clients */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Clients</h2>
              <p className="text-xs text-slate-400 mt-0.5">Select a client to see all of their orders.</p>
            </div>
            <button onClick={() => navigate('/dashboard/super-admin/orders')} className="text-xs text-emerald-600 cursor-pointer hover:underline font-medium whitespace-nowrap flex-shrink-0">View orders</button>
          </div>

          {clients.length === 0 ? (
            <div className="px-6 py-10 text-center text-slate-500 text-sm">No clients yet</div>
          ) : (
            <>
              {/* Desktop / tablet table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Client</th>
                      <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Orders</th>
                      <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Last Order</th>
                      <th className="px-6 py-3 whitespace-nowrap" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {clients.map((client) => (
                      <tr key={client.id} onClick={() => goToClientOrders(client)} className="hover:bg-slate-50/60 transition-colors cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Avatar user={{ name: client.name }} size="sm" />
                            <div className="font-medium text-slate-800">{client.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                            {client.orderCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{client.lastOrderDate ?? '—'}</td>
                        <td className="px-6 py-4 text-right"><ChevronRight size={16} className="text-slate-300 inline-block" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-slate-50">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => goToClientOrders(client)}
                    className="w-full flex items-center gap-3 px-4 py-4 text-left active:bg-slate-50 transition-colors"
                  >
                    <Avatar user={{ name: client.name }} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 text-sm truncate">{client.name}</div>
                      <div className="text-xs text-slate-400 truncate">
                        {client.lastOrderDate ? `Last order: ${client.lastOrderDate}` : 'No orders yet'}
                      </div>
                    </div>
                    <span className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold flex-shrink-0">
                      {client.orderCount}
                    </span>
                    <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: 'Manage Users',    icon: Users,       color: 'bg-emerald-50 text-emerald-600', path: '/dashboard/super-admin/users' },
              { label: 'Add Category',    icon: Tag,         color: 'bg-blue-50 text-blue-600',       path: '/dashboard/super-admin/categories' },
              { label: 'Dynamic Fields',  icon: Sliders,     color: 'bg-purple-50 text-purple-600',   path: '/dashboard/super-admin/dynamic-fields' },
              { label: 'System Settings', icon: Settings,    color: 'bg-slate-50 text-slate-600',     path: '/dashboard/super-admin/settings' },
            ].map(({ label, icon: Icon, color, path }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all text-left group cursor-pointer"
              >
                <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
                  <Icon size={16} />
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{label}</span>
                <ShoppingBag size={13} className="ml-auto text-slate-300 group-hover:text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
