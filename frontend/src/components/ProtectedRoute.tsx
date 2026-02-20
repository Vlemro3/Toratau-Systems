/**
 * Защищённый маршрут — перенаправляет на /login если нет авторизации.
 * Опционально проверяет роль.
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface Props {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.is_active) {
    logout();
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    if (requiredRole === 'admin' && user.role === 'superAdmin') {
      // SuperAdmin может иметь доступ к admin-маршрутам
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
