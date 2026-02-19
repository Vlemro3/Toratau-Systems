/**
 * Форма создания/редактирования портала.
 */
import { useState, type FormEvent } from 'react';
import type { Portal, PortalCreate, PortalPlan, PortalStatus } from '../../../types';

interface Props {
  portal?: Portal;
  onSubmit: (data: PortalCreate | Partial<Portal>) => Promise<void>;
  onCancel: () => void;
}

const PLAN_OPTIONS: { value: PortalPlan; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'basic', label: 'Basic' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
];

const STATUS_OPTIONS: { value: PortalStatus; label: string }[] = [
  { value: 'active', label: 'Активен' },
  { value: 'blocked', label: 'Заблокирован' },
];

export function PortalForm({ portal, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(portal?.name || '');
  const [ownerEmail, setOwnerEmail] = useState(portal?.ownerEmail || '');
  const [plan, setPlan] = useState<PortalPlan>(portal?.subscription.plan || 'free');
  const [isPaid, setIsPaid] = useState(portal?.subscription.isPaid ?? false);
  const [paidUntil, setPaidUntil] = useState(
    portal?.subscription.paidUntil ? portal.subscription.paidUntil.slice(0, 10) : ''
  );
  const [status, setStatus] = useState<PortalStatus>(portal?.status || 'active');
  const [maxUsers, setMaxUsers] = useState(portal?.limits.maxUsers || 10);
  const [maxStorageMb, setMaxStorageMb] = useState(portal?.limits.maxStorageMb || 1000);
  const [usersCount, setUsersCount] = useState(portal?.usersCount || 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const data: PortalCreate | Partial<Portal> = portal
        ? {
            name,
            subscription: {
              plan,
              isPaid,
              paidUntil: paidUntil || null,
            },
            status,
            limits: {
              maxUsers,
              maxStorageMb,
            },
            usersCount,
          }
        : {
            name,
            ownerEmail,
            subscription: {
              plan,
              isPaid,
              paidUntil: paidUntil || null,
            },
            status,
            limits: {
              maxUsers,
              maxStorageMb,
            },
          };

      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      {error && <div className="alert alert--error">{error}</div>}

      <div className="form-row">
        <div className="form-group">
          <label>Название портала *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={saving}
          />
        </div>

        {!portal && (
          <div className="form-group">
            <label>Email владельца *</label>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              required
              disabled={saving}
            />
          </div>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Тариф</label>
          <select value={plan} onChange={(e) => setPlan(e.target.value as PortalPlan)} disabled={saving}>
            {PLAN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Статус</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as PortalStatus)} disabled={saving}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={isPaid}
              onChange={(e) => setIsPaid(e.target.checked)}
              disabled={saving}
            />{' '}
            Оплачен
          </label>
        </div>

        <div className="form-group">
          <label>Оплачен до</label>
          <input
            type="date"
            value={paidUntil}
            onChange={(e) => setPaidUntil(e.target.value)}
            disabled={saving}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Макс. пользователей</label>
          <input
            type="number"
            value={maxUsers}
            onChange={(e) => setMaxUsers(Number(e.target.value))}
            min="1"
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label>Макс. хранилище (МБ)</label>
          <input
            type="number"
            value={maxStorageMb}
            onChange={(e) => setMaxStorageMb(Number(e.target.value))}
            min="1"
            disabled={saving}
          />
        </div>
      </div>

      {portal && (
        <div className="form-group">
          <label>Количество пользователей (для mock)</label>
          <input
            type="number"
            value={usersCount}
            onChange={(e) => setUsersCount(Number(e.target.value))}
            min="0"
            disabled={saving}
          />
        </div>
      )}

      <div className="form__actions">
        <button type="button" className="btn btn--secondary" onClick={onCancel} disabled={saving}>
          Отмена
        </button>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Сохранение...' : portal ? 'Сохранить' : 'Создать'}
        </button>
      </div>
    </form>
  );
}
