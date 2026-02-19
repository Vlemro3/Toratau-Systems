/**
 * Корневой компонент с маршрутизацией
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './billing/SubscriptionContext';
import { SubscriptionGuard } from './billing/SubscriptionGuard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import Landing from './pages/Landing';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectPage } from './pages/ProjectPage';
import { ProjectFormPage } from './pages/ProjectFormPage';
import { CrewsPage } from './pages/CrewsPage';
import { CrewFormPage } from './pages/CrewFormPage';
import { WorkTypesPage } from './pages/WorkTypesPage';
import { WorkTypeFormPage } from './pages/WorkTypeFormPage';
import { WorkLogFormPage } from './pages/WorkLogFormPage';
import { PayoutFormPage } from './pages/PayoutFormPage';
import { CashInFormPage } from './pages/CashInFormPage';
import { ExpenseFormPage } from './pages/ExpenseFormPage';
import { ProfilePage } from './pages/ProfilePage';
import { EmployeesPage } from './pages/EmployeesPage';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { OrganizationFormPage } from './pages/OrganizationFormPage';
import { CounterpartiesPage } from './pages/CounterpartiesPage';
import { CounterpartyFormPage } from './pages/CounterpartyFormPage';
import { CounterpartyDocumentsPage } from './pages/CounterpartyDocumentsPage';
import { DocumentFormPage } from './pages/DocumentFormPage';
import { DocumentTemplatesPage } from './pages/DocumentTemplatesPage';
import { BillingPage } from './pages/BillingPage';
import { SuperAdminDashboard } from './modules/super-admin/pages/SuperAdminDashboard';
import { PortalsListPage } from './modules/super-admin/pages/PortalsListPage';
import { PortalDetailsPage } from './modules/super-admin/pages/PortalDetailsPage';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <SubscriptionProvider>
          <Routes>
            {/* Публичная landing страница */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Защищённые маршруты */}
            <Route
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Layout />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            >
              {/* Dashboard — список объектов */}
              <Route path="/dashboard" element={<DashboardPage />} />

            {/* Создание / редактирование объекта */}
            <Route path="/projects/new" element={
              <ProtectedRoute requiredRole="admin"><ProjectFormPage /></ProtectedRoute>
            } />
            <Route path="/projects/:id/edit" element={
              <ProtectedRoute requiredRole="admin"><ProjectFormPage /></ProtectedRoute>
            } />

            {/* Карточка объекта — секции из сайдбара */}
            <Route path="/projects/:id" element={<ProjectPage />} />
            <Route path="/projects/:id/works" element={<ProjectPage />} />
            <Route path="/projects/:id/expenses-payouts" element={<ProjectPage />} />
            <Route path="/projects/:id/payments" element={<ProjectPage />} />
            {/* Старые маршруты для обратной совместимости */}
            <Route path="/projects/:id/payouts" element={<ProjectPage />} />
            <Route path="/projects/:id/expenses" element={<ProjectPage />} />
            <Route path="/projects/:id/crews" element={<ProjectPage />} />

            {/* Формы операций внутри объекта (создание + редактирование) */}
            <Route path="/projects/:projectId/work-logs/new" element={<WorkLogFormPage />} />
            <Route path="/projects/:projectId/work-logs/:id/edit" element={<WorkLogFormPage />} />
            <Route path="/projects/:projectId/payouts/new" element={<PayoutFormPage />} />
            <Route path="/projects/:projectId/payouts/:id/edit" element={<PayoutFormPage />} />
            <Route path="/projects/:projectId/cashin/new" element={<CashInFormPage />} />
            <Route path="/projects/:projectId/cashin/:id/edit" element={<CashInFormPage />} />
            <Route path="/projects/:projectId/expenses/new" element={<ExpenseFormPage />} />
            <Route path="/projects/:projectId/expenses/:id/edit" element={<ExpenseFormPage />} />

            {/* Контакты подрядчиков (бывш. Бригады) */}
            <Route path="/contacts" element={
              <ProtectedRoute requiredRole="admin"><CrewsPage /></ProtectedRoute>
            } />
            <Route path="/contacts/new" element={
              <ProtectedRoute requiredRole="admin"><CrewFormPage /></ProtectedRoute>
            } />
            <Route path="/contacts/:id/edit" element={
              <ProtectedRoute requiredRole="admin"><CrewFormPage /></ProtectedRoute>
            } />

            {/* Расценки (общий справочник, для документов контрагентов) */}
            <Route path="/rates" element={
              <ProtectedRoute requiredRole="admin"><WorkTypesPage /></ProtectedRoute>
            } />
            <Route path="/rates/new" element={
              <ProtectedRoute requiredRole="admin"><WorkTypeFormPage /></ProtectedRoute>
            } />
            <Route path="/rates/:id/edit" element={
              <ProtectedRoute requiredRole="admin"><WorkTypeFormPage /></ProtectedRoute>
            } />

            {/* Личный кабинет */}
            <Route path="/profile" element={<ProfilePage />} />

            {/* Сотрудники */}
            <Route path="/employees" element={
              <ProtectedRoute requiredRole="admin"><EmployeesPage /></ProtectedRoute>
            } />

            {/* Мои организации */}
            <Route path="/organizations" element={
              <ProtectedRoute requiredRole="admin"><OrganizationsPage /></ProtectedRoute>
            } />
            <Route path="/organizations/new" element={
              <ProtectedRoute requiredRole="admin"><OrganizationFormPage /></ProtectedRoute>
            } />
            <Route path="/organizations/:id/edit" element={
              <ProtectedRoute requiredRole="admin"><OrganizationFormPage /></ProtectedRoute>
            } />

            {/* Контрагенты */}
            <Route path="/counterparties" element={
              <ProtectedRoute requiredRole="admin"><CounterpartiesPage /></ProtectedRoute>
            } />
            <Route path="/counterparties/new" element={
              <ProtectedRoute requiredRole="admin"><CounterpartyFormPage /></ProtectedRoute>
            } />
            <Route path="/counterparties/:id/edit" element={
              <ProtectedRoute requiredRole="admin"><CounterpartyFormPage /></ProtectedRoute>
            } />

            {/* Документы контрагента */}
            <Route path="/counterparties/:cpId/documents" element={
              <ProtectedRoute requiredRole="admin"><CounterpartyDocumentsPage /></ProtectedRoute>
            } />
            <Route path="/counterparties/:cpId/documents/new" element={
              <ProtectedRoute requiredRole="admin"><DocumentFormPage /></ProtectedRoute>
            } />
            <Route path="/counterparties/:cpId/documents/:id/edit" element={
              <ProtectedRoute requiredRole="admin"><DocumentFormPage /></ProtectedRoute>
            } />

            {/* Шаблоны документов */}
            <Route path="/document-templates" element={
              <ProtectedRoute requiredRole="admin"><DocumentTemplatesPage /></ProtectedRoute>
            } />

            {/* Оплата и подписка */}
            <Route path="/billing" element={
              <ProtectedRoute requiredRole="admin"><BillingPage /></ProtectedRoute>
            } />

            {/* Super Admin */}
            <Route path="/super-admin" element={
              <ProtectedRoute requiredRole="superAdmin"><SuperAdminDashboard /></ProtectedRoute>
            } />
            <Route path="/super-admin/portals" element={
              <ProtectedRoute requiredRole="superAdmin"><PortalsListPage /></ProtectedRoute>
            } />
            <Route path="/super-admin/portals/:id" element={
              <ProtectedRoute requiredRole="superAdmin"><PortalDetailsPage /></ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </SubscriptionProvider>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
}
