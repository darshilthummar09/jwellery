export type UserRole = 'super-admin' | 'admin' | 'customer' /* | 'designer' */;

export const USER_ROLES = {
  SUPER_ADMIN: 'super-admin' as UserRole,
  ADMIN: 'admin' as UserRole,
  // DESIGNER: 'designer' as UserRole,
  CUSTOMER: 'customer' as UserRole,
} as const;
