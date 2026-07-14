export type UserRole = 'super-admin' | 'admin' | 'designer' | 'customer';

export const USER_ROLES = {
  SUPER_ADMIN: 'super-admin' as UserRole,
  ADMIN: 'admin' as UserRole,
  DESIGNER: 'designer' as UserRole,
  CUSTOMER: 'customer' as UserRole,
} as const;
