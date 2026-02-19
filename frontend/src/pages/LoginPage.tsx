/**
 * Страница авторизации
 */
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const IS_MOCK = import.meta.env.VITE_MOCK === 'true';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  /** Быстрый вход для демо */
  const quickLogin = async (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError('');
    setLoading(true);
    try {
      await login(user, pass);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <h1 className="login-card__logo">Toratau Systems</h1>
          <p className="login-card__subtitle">Управление строительными объектами</p>
        </div>

        <form onSubmit={handleSubmit} className="login-card__form">
          {error && <div className="alert alert--error">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Логин</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите логин"
              required
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>

          {IS_MOCK && (
            <div className="demo-hint">
              <p className="demo-hint__title">Демо-режим</p>
              <div className="demo-hint__buttons">
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => quickLogin('admin', 'admin123')}
                  disabled={loading}
                >
                  Войти как Админ
                </button>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => quickLogin('foreman', 'foreman123')}
                  disabled={loading}
                >
                  Войти как Прораб
                </button>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => quickLogin('superadmin', 'superadmin123')}
                  disabled={loading}
                >
                  Войти как Super Admin
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
