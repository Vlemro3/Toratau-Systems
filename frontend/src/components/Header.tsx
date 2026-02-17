/**
 * Верхняя панель: логотип (редактируемый) → селектор объекта → пользователь
 */
import { useAuth } from '../hooks/useAuth';
import { ROLE_LABELS } from '../utils/constants';
import { ProjectSelector } from './ProjectSelector';
import { EditableLogo } from './EditableLogo';

interface Props {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: Props) {
  const { user, logout } = useAuth();

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

      <div className="header__right">
        {user && (
          <>
            <span className="header__user">
              {user.full_name}
              <small className="header__role">{ROLE_LABELS[user.role] || user.role}</small>
            </span>
            <button className="btn btn--secondary btn--sm" onClick={logout}>
              Выйти
            </button>
          </>
        )}
      </div>
    </header>
  );
}
