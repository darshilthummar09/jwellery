import { Navigate, Outlet } from 'react-router';
import { useRole } from '../hooks/useRole';
import { UserRole } from '../types/role.types';

interface RoleRouteProps {
  allowedRoles: UserRole[];
}

/**
 * RoleRoute — wraps routes that require specific role(s).
 * Redirects to /unauthorized if the user's role is not in allowedRoles.
 * Must be nested inside <ProtectedRoute>.
 */
export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { hasAnyRole } = useRole();

  if (!hasAnyRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
