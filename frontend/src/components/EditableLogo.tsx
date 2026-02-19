/**
 * Редактируемый логотип — название портала.
 * Хранится в localStorage. Админ видит иконку карандаша при наведении.
 */
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const STORAGE_KEY = 'portal_logo';
const DEFAULT_LOGO = 'TS';

export function EditableLogo() {
  const { isAdmin } = useAuth();
  const [name, setName] = useState(() => localStorage.getItem(STORAGE_KEY) || DEFAULT_LOGO);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const save = (value: string) => {
    const trimmed = value.trim() || DEFAULT_LOGO;
    setName(trimmed);
    localStorage.setItem(STORAGE_KEY, trimmed);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="header__logo-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={(e) => save(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save((e.target as HTMLInputElement).value);
          if (e.key === 'Escape') {
            setName(localStorage.getItem(STORAGE_KEY) || DEFAULT_LOGO);
            setEditing(false);
          }
        }}
        maxLength={20}
      />
    );
  }

  return (
    <div className={`header__logo-wrap ${isAdmin ? 'header__logo-wrap--editable' : ''}`}>
      <img src="/logo.png" alt="Toratau" className="header__logo-img" />
      <h1 className="header__logo">{name}</h1>
      {isAdmin && (
        <button
          className="header__logo-edit"
          onClick={() => setEditing(true)}
          title="Редактировать название"
        >
          ✎
        </button>
      )}
    </div>
  );
}
