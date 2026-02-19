import { useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { updateProfile, changePassword } from '../api/auth';
import { ROLE_LABELS } from '../utils/constants';

export function ProfilePage() {
  const { user, setUser } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileSaving(true);
    try {
      const updated = await updateProfile({ full_name: fullName });
      setUser(updated);
      setProfileMsg('Профиль обновлён');
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setPwMsg('');
    setPwError('');
    if (newPw !== confirmPw) { setPwError('Пароли не совпадают'); return; }
    if (newPw.length < 4) { setPwError('Пароль должен быть не менее 4 символов'); return; }
    setPwSaving(true);
    try {
      await changePassword({ current_password: currentPw, new_password: newPw });
      setPwMsg('Пароль изменён');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setPwSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">Личный кабинет</h2>
      </div>

      <div className="profile-grid">
        {/* Info card */}
        <div className="card">
          <div className="card__header"><h3>Информация о пользователе</h3></div>
          <div className="card__body">
            <div className="profile-info">
              <div className="profile-info__avatar">
                {user.full_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="profile-info__name">{user.full_name}</div>
                <div className="profile-info__meta">
                  <span className="badge badge--primary">{ROLE_LABELS[user.role] || user.role}</span>
                  <span className="text-muted">Логин: {user.username}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleProfileSave} className="form" style={{ marginTop: 24 }}>
              <div className="form-group">
                <label>ФИО</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Логин</label>
                <input value={user.username} disabled className="input--disabled" />
              </div>
              {profileMsg && <div className="alert alert--success">{profileMsg}</div>}
              <button type="submit" className="btn btn--primary" disabled={profileSaving}>
                {profileSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </form>
          </div>
        </div>

        {/* Password change */}
        <div className="card">
          <div className="card__header"><h3>Смена пароля</h3></div>
          <div className="card__body">
            <form onSubmit={handlePasswordChange} className="form">
              <div className="form-group">
                <label>Текущий пароль</label>
                <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Новый пароль</label>
                <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Повторите новый пароль</label>
                <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />
              </div>
              {pwError && <div className="alert alert--error">{pwError}</div>}
              {pwMsg && <div className="alert alert--success">{pwMsg}</div>}
              <button type="submit" className="btn btn--primary" disabled={pwSaving}>
                {pwSaving ? 'Сохранение...' : 'Изменить пароль'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
