import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { Loader } from '../components/common/Loader';

/**
 * ProtectedRoute — wraps routes that require authentication.
 * Redirects unauthenticated users to /login.
 * Saves the attempted URL so we can redirect back after login.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loader fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
