import { useAuth } from './useAuth';
import { UserRole } from '../types/role.types';

/**
 * useRole — provides role-checking utilities.
 * Usage: const { isRole, hasAnyRole } = useRole();
 *
 * Never hardcode role checks inside UI components — always use this hook.
 */
export function useRole() {
  const { user } = useAuth();
  const role = user?.role ?? null;

  /** Checks if the current user has exactly the given role. */
  const isRole = (r: UserRole): boolean => role === r;

  /** Checks if the current user has any of the given roles. */
  const hasAnyRole = (roles: UserRole[]): boolean =>
    role !== null && roles.includes(role);

  return { role, isRole, hasAnyRole };
}
