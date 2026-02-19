/**
 * Главная страница Super Admin (редирект на список порталов).
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function SuperAdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/super-admin/portals', { replace: true });
  }, [navigate]);

  return null;
}
