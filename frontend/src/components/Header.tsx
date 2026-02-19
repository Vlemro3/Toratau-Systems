/**
 * Верхняя панель: логотип (редактируемый) → селектор объекта → пользователь с выпадающим меню
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../billing/SubscriptionContext';
import { ROLE_LABELS } from '../utils/constants';
import { ProjectSelector } from './ProjectSelector';
import { EditableLogo } from './EditableLogo';

interface Props {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: Props) {
  const { user, logout, isAdmin } = useAuth();
  const { showWarning, remainingDays, subscription } = useSubscription();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const go = (path: string) => { setOpen(false); navigate(path); };

  return (
    <header className="header">
      <div className="header__left">
        <button className="header__menu-btn" onClick={onMenuToggle} title="Меню">
          ☰
        </button>
        <EditableLogo />
        <div className="header__selector">
          <ProjectSelector />
        </div>
      </div>

      {showWarning && isAdmin && (
        <button className="header__subscription-warning" onClick={() => navigate('/billing')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          {subscription?.status === 'trial' ? 'Пробный период' : 'Подписка'}
          : {remainingDays} {remainingDays === 1 ? 'день' : remainingDays < 5 ? 'дня' : 'дней'}
        </button>
      )}

      <div className="header__right">
        {user && (
          <div className="header__user-menu" ref={ref}>
            <button className="header__user-btn" onClick={() => setOpen((v) => !v)}>
              <span className="header__user">
                {user.full_name}
                <small className="header__role">{ROLE_LABELS[user.role] || user.role}</small>
              </span>
              <svg className={`header__chevron ${open ? 'header__chevron--open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {open && (
              <div className="header__dropdown">
                <button className="header__dropdown-item" onClick={() => go('/profile')}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Личный кабинет
                </button>
                {isAdmin && (
                  <button className="header__dropdown-item" onClick={() => go('/employees')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    Сотрудники
                  </button>
                )}
                {isAdmin && (
                  <button className="header__dropdown-item" onClick={() => go('/organizations')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    Мои организации
                  </button>
                )}
                {isAdmin && (
                  <button className="header__dropdown-item" onClick={() => go('/billing')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    Оплата и подписка
                  </button>
                )}
                <div className="header__dropdown-divider" />
                <button className="header__dropdown-item header__dropdown-item--danger" onClick={() => { setOpen(false); logout(); }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Выйти
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
