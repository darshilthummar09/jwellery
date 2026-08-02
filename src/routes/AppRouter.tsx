import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AppLayout } from '../layouts/AppLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';

// Super Admin Pages
import { SuperAdminDashboard } from '../pages/super-admin/SuperAdminDashboard';
import { UsersPage } from '../pages/super-admin/UsersPage';
import { DynamicFieldsPage } from '../pages/super-admin/DynamicFieldsPage';
import { CategoriesPage } from '../pages/super-admin/CategoriesPage';
import { SettingsPage } from '../pages/super-admin/SettingsPage';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { ProjectsPage } from '../pages/admin/ProjectsPage';
import { CustomersPage } from '../pages/admin/CustomersPage';
import { DesignersPage } from '../pages/admin/DesignersPage';
import { ChatsPage } from '../pages/admin/ChatsPage';

// Customer Pages
import { CustomerDashboard } from '../pages/customer/CustomerDashboard';
import { MyProductsPage } from '../pages/customer/MyProductsPage';
import { GeneralChatPage } from '../pages/customer/GeneralChatPage';
import { CustomerNotificationsPage } from '../pages/customer/NotificationsPage';
import { AiStudioPage } from '../pages/customer/AiStudioPage';

// Designer Pages
import { DesignerDashboard } from '../pages/designer/DesignerDashboard';
import { AssignedProjectsPage } from '../pages/designer/AssignedProjectsPage';
import { DesignerChatPage } from '../pages/designer/DesignerChatPage';
import { DesignerNotificationsPage } from '../pages/designer/NotificationsPage';

// Utility Pages
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { NotFoundPage } from '../pages/NotFoundPage';


export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>

          {/* ─── Public: Redirect to Login ─── */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ─── Auth ─── */}
          <Route path="/login" element={<LoginPage />} />

          {/* ─── Utility ─── */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />

          {/* ─── Protected Dashboard Routes ─── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>

              {/* Super Admin */}
              <Route element={<RoleRoute allowedRoles={['super-admin']} />}>
                <Route path="/dashboard/super-admin" element={<SuperAdminDashboard />} />
                <Route path="/dashboard/super-admin/projects" element={<ProjectsPage />} />
                <Route path="/dashboard/super-admin/chats" element={<ChatsPage />} />
                <Route path="/dashboard/super-admin/users" element={<UsersPage />} />
                <Route path="/dashboard/super-admin/dynamic-fields" element={<DynamicFieldsPage />} />
                <Route path="/dashboard/super-admin/categories" element={<CategoriesPage />} />
                <Route path="/dashboard/super-admin/settings" element={<SettingsPage />} />
              </Route>

              {/* Admin */}
              <Route element={<RoleRoute allowedRoles={['admin']} />}>
                <Route path="/dashboard/admin" element={<AdminDashboard />} />
                <Route path="/dashboard/admin/projects" element={<ProjectsPage />} />
                <Route path="/dashboard/admin/customers" element={<CustomersPage />} />
                <Route path="/dashboard/admin/designers" element={<DesignersPage />} />
                <Route path="/dashboard/admin/chats" element={<ChatsPage />} />
              </Route>

              {/* Customer */}
              <Route element={<RoleRoute allowedRoles={['customer']} />}>
                <Route path="/dashboard/customer" element={<CustomerDashboard />} />
                <Route path="/dashboard/customer/ai-studio" element={<AiStudioPage />} />
                <Route path="/dashboard/customer/my-products" element={<MyProductsPage />} />
                <Route path="/dashboard/customer/chat" element={<GeneralChatPage />} />
                <Route path="/dashboard/customer/notifications" element={<CustomerNotificationsPage />} />
              </Route>

              {/* Designer */}
              <Route element={<RoleRoute allowedRoles={['designer']} />}>
                <Route path="/dashboard/designer" element={<DesignerDashboard />} />
                <Route path="/dashboard/designer/assigned-projects" element={<AssignedProjectsPage />} />
                <Route path="/dashboard/designer/chat" element={<DesignerChatPage />} />
                <Route path="/dashboard/designer/notifications" element={<DesignerNotificationsPage />} />
              </Route>

              {/* Generic /dashboard → redirect to role dashboard */}
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
            </Route>
          </Route>

        </Route>
      </Routes>
    </BrowserRouter>
  );
}
