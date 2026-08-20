import { Briefcase, Users, MessageSquare, TrendingUp, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { StatCard } from '../../components/common/StatCard';
import { Avatar } from '../../components/common/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { Order, useChatNotification } from '../../context/ChatNotificationContext';
import { MOCK_USERS } from '../../data/mock-users';
import { INITIAL_CUSTOMERS } from '../../data/mock-customers';

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

export function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { orders, threads } = useChatNotification();

  const activeOrders = orders.filter(o => o.status !== 'Completed' && o.status !== 'Rejected');

  // Calculate open chats (threads with unread admin messages)
  const openChatsCount = threads.filter(t => t.unread > 0).length;

  const totalCustomers = MOCK_USERS.filter(u => u.role === 'customer').length;
  const totalDesigners = MOCK_USERS.filter(u => u.role === 'designer').length;

  const clients = buildClientSummaries(orders).slice(0, 6);

  const goToClientOrders = (client: ClientSummary) => {
    navigate(`/dashboard/admin/orders?customerId=${encodeURIComponent(client.id)}&customerName=${encodeURIComponent(client.name)}`);
  };

  return (
    <PageContainer>
      <PageTitle
        title={`Good day, ${user?.name?.split(' ')[0]} 👋`}
        subtitle="Here's a snapshot of your jewellery clients and orders today."
        className="mb-6 sm:mb-8"
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
        <StatCard title="Active Orders" value={activeOrders.length.toString()} icon={Briefcase}     color="emerald" onClick={() => navigate('/dashboard/admin/orders')} />
        <StatCard title="Customers"     value={totalCustomers.toString()} icon={Users}         color="blue" onClick={() => navigate('/dashboard/admin/customers')} />
        <StatCard title="Designers"     value={totalDesigners.toString()} icon={TrendingUp}    color="purple" onClick={() => navigate('/dashboard/admin/designers')} />
        <StatCard title="Open Chats"    value={openChatsCount.toString()} icon={MessageSquare} color="orange" onClick={() => navigate('/dashboard/admin/chats')} />
      </div>

      {/* Clients */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Clients</h2>
            <p className="text-xs text-slate-400 mt-0.5">Select a client to see all of their orders.</p>
          </div>
          <button
            onClick={() => navigate('/dashboard/admin/customers')}
            className="text-xs text-emerald-600 cursor-pointer hover:underline font-medium whitespace-nowrap flex-shrink-0"
          >
            View all
          </button>
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
                          <div>
                            <div className="font-medium text-slate-800">{client.name}</div>
                            {client.email !== '—' && <div className="text-xs text-slate-400">{client.email}</div>}
                          </div>
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
    </PageContainer>
  );
}
