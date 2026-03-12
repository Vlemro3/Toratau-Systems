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

/** Пункты меню объекта для Администратора */
const PROJECT_ITEMS_ADMIN = [
  { path: '', icon: '📊', label: 'Сводка' },
  { path: '/works', icon: '🔨', label: 'Работы' },
  { path: '/expenses', icon: '🧾', label: 'Расходы' },
  { path: '/payouts', icon: '💸', label: 'Выплаты' },
  { path: '/payments', icon: '💰', label: 'Платежи' },
];

/** Пункты меню объекта для Прораба: Сводка, Работы, Расходы, Выплаты (без Платежей) */
const PROJECT_ITEMS_FOREMAN = [
  { path: '', icon: '📊', label: 'Сводка' },
  { path: '/works', icon: '🔨', label: 'Работы' },
  { path: '/expenses', icon: '🧾', label: 'Расходы' },
  { path: '/payouts', icon: '💸', label: 'Выплаты' },
];

export function Sidebar({ open, onClose }: Props) {
  const { isAdmin, isForeman, isSuperAdmin } = useAuth();
  const projectItems = isForeman ? PROJECT_ITEMS_FOREMAN : PROJECT_ITEMS_ADMIN;
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
              {projectItems.map((item) => {
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
            <NavLink to="/rates" className={linkClass} onClick={onClose}>
              <span className="sidebar__icon">📋</span>
              <span className="sidebar__text">Расценки</span>
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/estimates" end className={linkClass} onClick={onClose}>
              <span className="sidebar__icon">📐</span>
              <span className="sidebar__text">Сметы</span>
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/counterparties" className={linkClass} onClick={onClose}>
              <span className="sidebar__icon">🏢</span>
              <span className="sidebar__text">Контрагенты</span>
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/documents" className={linkClass} onClick={onClose}>
              <span className="sidebar__icon">📑</span>
              <span className="sidebar__text">Документы</span>
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/contacts" className={linkClass} onClick={onClose}>
              <span className="sidebar__icon">📇</span>
              <span className="sidebar__text">Контакты подрядчиков</span>
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/document-templates" className={linkClass} onClick={onClose}>
              <span className="sidebar__icon">📄</span>
              <span className="sidebar__text">Шаблоны документов</span>
            </NavLink>
          )}

          {isSuperAdmin && (
            <>
              <div className="sidebar__divider" />
              <div className="sidebar__section-title">Администрирование</div>
              <NavLink to="/super-admin" end className={linkClass} onClick={onClose}>
                <span className="sidebar__icon">🛡️</span>
                <span className="sidebar__text">Панель управления</span>
              </NavLink>
              <NavLink to="/super-admin/portals" className={linkClass} onClick={onClose}>
                <span className="sidebar__icon">🏗️</span>
                <span className="sidebar__text">Порталы</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar__footer">
          <small>Toratau Systems v0.1</small>
        </div>
      </aside>
    </>
  );
}
