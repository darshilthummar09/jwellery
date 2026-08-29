import { useState, useMemo, FormEvent } from 'react';
import { UserPlus, Search, Filter, Trash2, KeyRound } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { EmptyState } from '../../components/common/EmptyState';
import { RoleBadge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { Modal } from '../../components/common/Modal';
import { useChatNotification } from '../../context/ChatNotificationContext';
import { User } from '../../types/user.types';

export function UsersPage() {
  const { users, addUser, deleteUser } = useChatNotification();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | User['role']>('all');
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [draftUser, setDraftUser] = useState<Partial<User & { password?: string }> | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        search.trim() === '' ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const saveUser = (event: FormEvent) => {
    event.preventDefault();
    if (!draftUser?.name || !draftUser?.username) return;

    const newUser: User & { password?: string } = {
      id: `usr_${Date.now()}`,
      name: draftUser.name.trim(),
      username: draftUser.username.trim().toLowerCase(),
      role: (draftUser.role as User['role']) || 'customer',
      email: draftUser.email?.trim() || `${draftUser.username.trim()}@dreamjewels.com`,
      password: draftUser.password?.trim() || '123456',
      createdAt: new Date().toISOString(),
      avatarUrl: `https://i.pravatar.cc/150?u=${Date.now()}`,
    };

    addUser(newUser);
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
            onClick={() =>
              setDraftUser({
                name: '',
                username: '',
                email: '',
                password: '',
                role: 'customer',
              })
            }
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-200 transition-all active:scale-[0.98] cursor-pointer"
          >
            <UserPlus size={16} />
            Add User
          </button>
        }
      />

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-500 flex-1 min-w-[240px] max-w-xs hover:border-emerald-300 transition-colors">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none w-full text-slate-700 placeholder-slate-400"
            placeholder="Search users by name, username, email…"
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600">
          <Filter size={15} className="text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | User['role'])}
            className="bg-transparent text-sm font-medium outline-none text-slate-700 cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="super-admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="customer">Customer</option>
          </select>
        </div>
        <span className="text-xs text-slate-400 font-medium ml-auto">
          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredUsers.length === 0 ? (
          <EmptyState title="No users found" description="Try adjusting your search or role filter." />
        ) : (
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
                {filteredUsers.map((u) => (
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
                    <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setDeletingUser(u)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
        )}
      </div>

      {deletingUser && (
        <ConfirmModal
          title="Delete User"
          message={`Are you sure you want to delete ${deletingUser.name}? This action cannot be undone.`}
          confirmLabel="Delete User"
          onConfirm={() => {
            deleteUser(deletingUser.id);
            setDeletingUser(null);
          }}
          onClose={() => setDeletingUser(null)}
        />
      )}

      {draftUser && (
        <Modal title="Add New User" onClose={() => setDraftUser(null)}>
          <form onSubmit={saveUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-sm font-medium text-slate-700">
              Full Name *
              <input
                required
                value={draftUser.name || ''}
                onChange={(e) => setDraftUser({ ...draftUser, name: e.target.value })}
                placeholder="e.g. Priya Sharma"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Username *
              <input
                required
                value={draftUser.username || ''}
                onChange={(e) => setDraftUser({ ...draftUser, username: e.target.value })}
                placeholder="e.g. priya123"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Email Address *
              <input
                required
                type="email"
                value={draftUser.email || ''}
                onChange={(e) => setDraftUser({ ...draftUser, email: e.target.value })}
                placeholder="e.g. priya@dreamjewels.com"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Password (for login) *
              <div className="relative mt-1.5">
                <input
                  required
                  type="password"
                  value={draftUser.password || ''}
                  onChange={(e) => setDraftUser({ ...draftUser, password: e.target.value })}
                  placeholder="Set account password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-8 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
                <KeyRound size={15} className="absolute right-3 top-3 text-slate-400" />
              </div>
            </label>
            <label className="sm:col-span-2 text-sm font-medium text-slate-700">
              Role
              <select
                value={draftUser.role || 'customer'}
                onChange={(e) => setDraftUser({ ...draftUser, role: e.target.value as User['role'] })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 cursor-pointer"
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
                <option value="super-admin">Super Admin</option>
              </select>
            </label>
            <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDraftUser(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-emerald-200 cursor-pointer"
              >
                Create User
              </button>
            </div>
          </form>
        </Modal>
      )}
    </PageContainer>
  );
}
