/**
 * Боковое меню навигации.
 * - Всегда развёрнуто (иконка + текст)
 * - Пункты объекта показываются всегда (берёт projectId из URL или localStorage)
 * - Глобальные пункты внизу
 */
import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const STORAGE_KEY = 'last_project_id';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Пункты меню объекта */
const PROJECT_ITEMS = [
  { path: '',         icon: '📊', label: 'Сводка' },
  { path: '/works',   icon: '🔨', label: 'Работы' },
  { path: '/payouts', icon: '💸', label: 'Выплаты' },
  { path: '/payments',icon: '💰', label: 'Платежи' },
  { path: '/expenses',icon: '🧾', label: 'Расходы' },
  { path: '/crews',   icon: '👷', label: 'Бригады' },
  { path: '/rates',   icon: '📋', label: 'Расценки' },
];

export function Sidebar({ open, onClose }: Props) {
  const { isAdmin } = useAuth();
  const location = useLocation();

  /* projectId из URL (приоритет) или из localStorage (резерв) */
  const urlMatch = location.pathname.match(/\/projects\/(\d+)/);
  const urlProjectId = urlMatch ? Number(urlMatch[1]) : null;
  const storedId = localStorage.getItem(STORAGE_KEY);
  const projectId = urlProjectId ?? (storedId ? Number(storedId) : null);

  /* Сохраняем в localStorage при каждом изменении URL с projectId */
  useEffect(() => {
    if (urlProjectId) {
      localStorage.setItem(STORAGE_KEY, String(urlProjectId));
    }
  }, [urlProjectId]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`;

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <nav className="sidebar__nav">
          {/* Пункты объекта — всегда видны, если есть projectId */}
          {projectId ? (
            <>
              <div className="sidebar__section-title">Объект</div>
              {PROJECT_ITEMS.map((item) => {
                const to = `/projects/${projectId}${item.path}`;
                const isExact = item.path === '';
                return (
                  <NavLink
                    key={item.path || 'summary'}
                    to={to}
                    end={isExact}
                    className={linkClass}
                    onClick={onClose}
                  >
                    <span className="sidebar__icon">{item.icon}</span>
                    <span className="sidebar__text">{item.label}</span>
                  </NavLink>
                );
              })}
              <div className="sidebar__divider" />
            </>
          ) : (
            <div className="sidebar__hint">
              Выберите объект в верхнем меню
            </div>
          )}

          {/* Глобальные пункты */}
          <div className="sidebar__section-title">Общее</div>
          {isAdmin && (
            <NavLink to="/contacts" className={linkClass} onClick={onClose}>
              <span className="sidebar__icon">📇</span>
              <span className="sidebar__text">Контакты подрядчиков</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar__footer">
          <small>Toratau Systems v0.1</small>
        </div>
      </aside>
    </>
  );
}
