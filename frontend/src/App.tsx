/**
 * Корневой компонент с маршрутизацией
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Защищённые маршруты */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Главная — список объектов */}
            <Route path="/" element={<DashboardPage />} />

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
            <Route path="/projects/:id/payouts" element={<ProjectPage />} />
            <Route path="/projects/:id/payments" element={<ProjectPage />} />
            <Route path="/projects/:id/expenses" element={<ProjectPage />} />
            <Route path="/projects/:id/crews" element={<ProjectPage />} />
            <Route path="/projects/:id/rates" element={<WorkTypesPage />} />

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

            {/* Расценки — создание / редактирование */}
            <Route path="/projects/:projectId/rates/new" element={
              <ProtectedRoute requiredRole="admin"><WorkTypeFormPage /></ProtectedRoute>
            } />
            <Route path="/projects/:projectId/rates/:id/edit" element={
              <ProtectedRoute requiredRole="admin"><WorkTypeFormPage /></ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
