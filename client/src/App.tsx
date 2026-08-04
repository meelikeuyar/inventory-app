import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import AppLayout from './components/layout/AppLayout';
import { SocketProvider } from './context/SocketContext';

// Lazy-loaded pages — each page is downloaded only when the user navigates to it
const LoginPage = lazy(() => import('./pages/LoginPage'));
// RegisterPage removed — user creation is admin-only via UsersPage
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const SitesPage = lazy(() => import('./pages/SitesPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const InventoryDetailPage = lazy(() => import('./pages/InventoryDetailPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const ActivityPage = lazy(() => import('./pages/ActivityPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const GlobalInventoryPage = lazy(() => import('./pages/GlobalInventoryPage'));
const DepartmentsPage = lazy(() => import('./pages/DepartmentsPage'));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'));
const InsightsPage = lazy(() => import('./pages/InsightsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#74BCC8]" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <SocketProvider>
            <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontFamily: 'Inter, sans-serif', fontSize: '13px' } }} />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<Navigate to="/login" replace />} />
                <Route element={<AppLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/:projectId/sites" element={<SitesPage />} />
                  <Route path="/projects/:projectId/sites/:siteId/inventory" element={<InventoryPage />} />
                  <Route path="/projects/:projectId/sites/:siteId/inventory/:itemId" element={<InventoryDetailPage />} />
                  <Route path="/inventory" element={<GlobalInventoryPage />} />
                  <Route path="/departments" element={<DepartmentsPage />} />
                  <Route path="/maintenance" element={<MaintenancePage />} />
                  <Route path="/insights" element={<InsightsPage />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/activity" element={<ActivityPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                </Route>
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
