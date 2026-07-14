import { UserPlus, Search } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { Avatar } from '../../components/common/Avatar';

const CUSTOMERS = [
  { id: 1, name: 'Priya Patel',  email: 'priya@example.com',  orders: 3, spent: '₹4,30,000', joined: 'Jan 2024' },
  { id: 2, name: 'Anita Mehta',  email: 'anita@example.com',  orders: 1, spent: '₹85,000',   joined: 'Feb 2024' },
  { id: 3, name: 'Sunita Roy',   email: 'sunita@example.com', orders: 2, spent: '₹2,05,000',  joined: 'Mar 2024' },
  { id: 4, name: 'Kavya Iyer',   email: 'kavya@example.com',  orders: 4, spent: '₹5,60,000',  joined: 'Dec 2023' },
  { id: 5, name: 'Meera Singh',  email: 'meera@example.com',  orders: 1, spent: '₹3,10,000',  joined: 'Apr 2024' },
];

export function CustomersPage() {
  return (
    <PageContainer>
      <PageTitle
        title="Customers"
        subtitle="View and manage your customer accounts."
        className="mb-8"
        action={
          <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98]">
            <UserPlus size={16} />
            Add Customer
          </button>
        }
      />
      <div className="mb-4 flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-500 max-w-xs hover:border-emerald-300 transition-colors">
        <Search size={15} />
        <input className="bg-transparent outline-none w-full placeholder-slate-400" placeholder="Search customers…" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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
            {CUSTOMERS.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/60 transition-colors cursor-pointer">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar user={{ name: c.name }} size="sm" />
                    <div>
                      <div className="font-medium text-slate-800">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-700">{c.orders}</td>
                <td className="px-6 py-4 font-semibold text-slate-800">{c.spent}</td>
                <td className="px-6 py-4 text-slate-400 text-xs">{c.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
