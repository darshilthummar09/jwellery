import { Outlet } from 'react-router';
import { AuthProvider } from '../context/AuthContext';
import { ChatNotificationProvider } from '../context/ChatNotificationContext';

/**
 * AppLayout — root layout that wraps the entire app.
 * Provides AuthContext and ChatNotificationContext to all child routes.
 */
export function AppLayout() {
  return (
    <AuthProvider>
      <ChatNotificationProvider>
        <Outlet />
      </ChatNotificationProvider>
    </AuthProvider>
  );
}
