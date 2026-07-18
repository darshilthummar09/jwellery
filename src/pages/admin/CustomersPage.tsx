import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { MessageSquare, Search, UserPlus } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { Avatar } from '../../components/common/Avatar';
import { DetailCard } from '../../components/common/DetailCard';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { useChatNotification } from '../../context/ChatNotificationContext';

interface Customer {
  id: string;
  name: string;
  email: string;
  orders: number;
  spent: string;
  joined: string;
  phone: string;
}

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'usr_customer_001', name: 'Priya Patel', email: 'customer1@dreamjewels.com', orders: 0, spent: 'Rs. 0', joined: 'Jan 2024', phone: '+91 98765 10001' },
];

const blankCustomer: Customer = {
  id: '',
  name: '',
  email: '',
  orders: 0,
  spent: 'Rs. 0',
  joined: 'Today',
  phone: '',
};

export function CustomersPage() {
  const navigate = useNavigate();
  const { createThreadForOrder } = useChatNotification();
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [draftCustomer, setDraftCustomer] = useState<Customer | null>(null);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone].some((value) => value.toLowerCase().includes(query))
    );
  }, [customers, search]);

  const saveCustomer = (event: FormEvent) => {
    event.preventDefault();
    if (!draftCustomer) return;

    const id = draftCustomer.id || draftCustomer.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const customerToSave = { ...draftCustomer, id };
    setCustomers((current) => [customerToSave, ...current]);
    setSelectedCustomer(customerToSave);
    setDraftCustomer(null);
  };

  const messageCustomer = (customer: Customer) => {
    createThreadForOrder(customer.id, customer.name, {
      name: 'General Inquiry',
      category: 'General',
      metal: '-',
      karat: '-',
      budget: 'Not specified',
    });
    setSelectedCustomer(null);
    navigate(`/dashboard/admin/chats?thread=${encodeURIComponent(`customer-${customer.id}`)}`);
  };

  return (
    <PageContainer>
      <PageTitle
        title="Customers"
        subtitle="View and manage your customer accounts."
        className="mb-8"
        action={
          <button onClick={() => setDraftCustomer(blankCustomer)} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98]">
            <UserPlus size={16} />
            Add Customer
          </button>
        }
      />

      <div className="mb-4 flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-500 max-w-xs hover:border-emerald-300 transition-colors">
        <Search size={15} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} className="bg-transparent outline-none w-full placeholder-slate-400" placeholder="Search customers..." />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <EmptyState title="No customers found" description="Try another search or add a new customer." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Customer</th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Orders</th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Total Spent</th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} onClick={() => setSelectedCustomer(customer)} className="hover:bg-slate-50/60 transition-colors cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar user={{ name: customer.name }} size="sm" />
                      <div>
                        <div className="font-medium text-slate-800">{customer.name}</div>
                        <div className="text-xs text-slate-400">{customer.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{customer.orders}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{customer.spent}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs">{customer.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedCustomer(null)}>
          <div className="w-full max-w-2xl" onClick={(event) => event.stopPropagation()}>
            <DetailCard
              title={selectedCustomer.name}
              subtitle={selectedCustomer.email}
              className="shadow-2xl"
              onClose={() => setSelectedCustomer(null)}
              fields={[
                { label: 'Phone', value: selectedCustomer.phone },
                { label: 'Orders', value: selectedCustomer.orders },
                { label: 'Total Spent', value: selectedCustomer.spent },
                { label: 'Joined', value: selectedCustomer.joined },
              ]}
              actions={
                <button onClick={() => messageCustomer(selectedCustomer)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors">
                  <MessageSquare size={14} />
                  Message Customer
                </button>
              }
            />
          </div>
        </div>
      )}

      {draftCustomer && (
        <Modal title="Add Customer" onClose={() => setDraftCustomer(null)}>
          <form onSubmit={saveCustomer} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-sm font-medium text-slate-700">
              Name
              <input required value={draftCustomer.name} onChange={(event) => setDraftCustomer({ ...draftCustomer, name: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Email
              <input required type="email" value={draftCustomer.email} onChange={(event) => setDraftCustomer({ ...draftCustomer, email: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Phone
              <input required value={draftCustomer.phone} onChange={(event) => setDraftCustomer({ ...draftCustomer, phone: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Total Spent
              <input value={draftCustomer.spent} onChange={(event) => setDraftCustomer({ ...draftCustomer, spent: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400" />
            </label>
            <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setDraftCustomer(null)} className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-sm font-semibold rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors">Save Customer</button>
            </div>
          </form>
        </Modal>
      )}
    </PageContainer>
  );
}
