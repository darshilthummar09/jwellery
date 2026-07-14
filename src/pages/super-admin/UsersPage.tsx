import { UserPlus, Search, Filter } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { EmptyState } from '../../components/common/EmptyState';
import { RoleBadge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { MOCK_USERS } from '../../data/mock-users';

export function UsersPage() {
  return (
    <PageContainer>
      <PageTitle
        title="Users"
        subtitle="Manage all platform users across every role."
        className="mb-8"
        action={
          <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-200 transition-all active:scale-[0.98]">
            <UserPlus size={16} />
            Add User
          </button>
        }
      />

      {/* Filters Bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-500 flex-1 max-w-xs hover:border-emerald-300 transition-colors">
          <Search size={15} />
          <input className="bg-transparent outline-none w-full text-slate-700 placeholder-slate-400" placeholder="Search users…" />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:border-slate-300 transition-colors">
          <Filter size={15} />
          Filter
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">User</th>
              <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Username</th>
              <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Role</th>
              <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Email</th>
              <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {MOCK_USERS.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/60 transition-colors cursor-pointer">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar user={u} size="sm" />
                    <span className="font-medium text-slate-800">{u.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500 font-mono text-xs">{u.username}</td>
                <td className="px-6 py-4"><RoleBadge role={u.role} /></td>
                <td className="px-6 py-4 text-slate-500">{u.email}</td>
                <td className="px-6 py-4 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
