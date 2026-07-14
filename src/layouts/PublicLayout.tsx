import { Outlet } from 'react-router';

/**
 * PublicLayout — wraps the public-facing landing page.
 * Keep this thin; all styling is inside the landing page components.
 */
export function PublicLayout() {
  return <Outlet />;
}
