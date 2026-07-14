import { UserRole } from '../types/role.types';

export const ROLE_LABELS: Record<UserRole, string> = {
  'super-admin': 'Super Admin',
  'admin': 'Admin',
  'designer': 'Designer',
  'customer': 'Customer',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  'super-admin': 'bg-purple-100 text-purple-700 border-purple-200',
  'admin': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'designer': 'bg-blue-100 text-blue-700 border-blue-200',
  'customer': 'bg-orange-100 text-orange-700 border-orange-200',
};

export const ROLE_BADGE_DOT: Record<UserRole, string> = {
  'super-admin': 'bg-purple-500',
  'admin': 'bg-emerald-500',
  'designer': 'bg-blue-500',
  'customer': 'bg-orange-500',
};

export const ALL_ROLES: UserRole[] = ['super-admin', 'admin', 'designer', 'customer'];
