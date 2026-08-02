import { useState, FormEvent } from 'react';
import { UserPlus, Search, Filter, Trash2 } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { EmptyState } from '../../components/common/EmptyState';
import { RoleBadge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { Modal } from '../../components/common/Modal';
import { MOCK_USERS, User } from '../../data/mock-users';

export function UsersPage() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [draftUser, setDraftUser] = useState<Partial<User> | null>(null);

  const saveUser = (event: FormEvent) => {
    event.preventDefault();
    if (!draftUser) return;
    
    const newUser: User = {
      id: `u${Date.now()}`,
      name: draftUser.name || '',
      username: draftUser.username || '',
      role: (draftUser.role as User['role']) || 'customer',
      email: draftUser.email || '',
      createdAt: new Date().toISOString(),
      avatarUrl: `https://i.pravatar.cc/150?u=${Date.now()}`,
    };
    
    setUsers((prev) => [newUser, ...prev]);
    setDraftUser(null);
  };

  return (
    <PageContainer>
      <PageTitle
        title="Users"
        subtitle="Manage all platform users across every role."
        className="mb-8"
        action={
          <button 
            onClick={() => setDraftUser({ name: '', username: '', email: '', role: 'customer' })}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-200 transition-all active:scale-[0.98]"
          >
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">User</th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Username</th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Role</th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Email</th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Joined</th>
                <th className="text-right px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Avatar user={u} size="sm" />
                      <span className="font-medium text-slate-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs whitespace-nowrap">{u.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><RoleBadge role={u.role} /></td>
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{u.email}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => setDeletingUser(u)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete User"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {deletingUser && (
        <ConfirmModal
          title="Delete User"
          message={`Are you sure you want to delete ${deletingUser.name}? This action cannot be undone.`}
          confirmLabel="Delete User"
          onConfirm={() => {
            setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
            setDeletingUser(null);
          }}
          onClose={() => setDeletingUser(null)}
        />
      )}

      {draftUser && (
        <Modal title="Add New User" onClose={() => setDraftUser(null)}>
          <form onSubmit={saveUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-sm font-medium text-slate-700">
              Full Name
              <input required value={draftUser.name} onChange={(e) => setDraftUser({ ...draftUser, name: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Username
              <input required value={draftUser.username} onChange={(e) => setDraftUser({ ...draftUser, username: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Email Address
              <input required type="email" value={draftUser.email} onChange={(e) => setDraftUser({ ...draftUser, email: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Role
              <select value={draftUser.role} onChange={(e) => setDraftUser({ ...draftUser, role: e.target.value as User['role'] })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100">
                <option value="customer">Customer</option>
                <option value="designer">Designer</option>
                <option value="admin">Admin</option>
                <option value="super-admin">Super Admin</option>
              </select>
            </label>
            <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setDraftUser(null)} className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-sm font-semibold rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-emerald-200">Create User</button>
            </div>
          </form>
        </Modal>
      )}
    </PageContainer>
  );
}
