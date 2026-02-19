/**
 * Детальная страница портала.
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPortal, updatePortal, blockPortal, unblockPortal } from '../../../api/superAdmin';
import { PortalForm } from '../components/PortalForm';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { EmptyState } from '../../../components/EmptyState';
import type { Portal, PortalUpdate } from '../../../types';

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Активен',
  blocked: 'Заблокирован',
  deleted: 'Удалён',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ru-RU');
}

export function PortalDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [portal, setPortal] = useState<Portal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (id) loadPortal();
  }, [id]);

  const loadPortal = async () => {
    if (!id) return;
    try {
      setError('');
      setLoading(true);
      const data = await getPortal(id);
      setPortal(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки портала');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: PortalUpdate) => {
    if (!id) return;
    try {
      await updatePortal(id, data);
      await loadPortal();
      setEditing(false);
    } catch (err) {
      throw err;
    }
  };

  const handleBlock = async () => {
    if (!id) return;
    try {
      await blockPortal(id);
      await loadPortal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка блокировки');
    }
  };

  const handleUnblock = async () => {
    if (!id) return;
    try {
      await unblockPortal(id);
      await loadPortal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка разблокировки');
    }
  };

  if (loading) {
    return (
      <div className="page">
        <LoadingSpinner />
      </div>
    );
  }

  if (!portal) {
    return <EmptyState message="Портал не найден" />;
  }

  const isExpired = portal.subscription.paidUntil
    ? new Date(portal.subscription.paidUntil) < new Date()
    : !portal.subscription.isPaid;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <Link to="/super-admin/portals" className="btn btn--secondary btn--sm">
            ← Назад к списку
          </Link>
          <h2 className="page__title" style={{ marginTop: 16 }}>
            Портал: {portal.name}
          </h2>
        </div>
        <div>
          {portal.status === 'blocked' ? (
            <button className="btn btn--success" onClick={handleUnblock}>
              Разблокировать
            </button>
          ) : portal.status === 'active' ? (
            <button className="btn btn--danger" onClick={handleBlock}>
              Заблокировать
            </button>
          ) : null}
          {!editing && (
            <button className="btn btn--primary" onClick={() => setEditing(true)}>
              Редактировать
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {editing ? (
        <div className="card">
          <div className="card__body">
            <PortalForm
              portal={portal}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(false)}
            />
          </div>
        </div>
      ) : (
        <div className="super-admin-details">
          <div className="card">
            <div className="card__header">
              <h3>Основная информация</h3>
            </div>
            <div className="card__body">
              <div className="super-admin-details__row">
                <div className="super-admin-details__label">ID:</div>
                <div className="super-admin-details__value">{portal.id}</div>
              </div>
              <div className="super-admin-details__row">
                <div className="super-admin-details__label">Название:</div>
                <div className="super-admin-details__value">{portal.name}</div>
              </div>
              <div className="super-admin-details__row">
                <div className="super-admin-details__label">Email владельца:</div>
                <div className="super-admin-details__value">{portal.ownerEmail}</div>
              </div>
              <div className="super-admin-details__row">
                <div className="super-admin-details__label">Статус:</div>
                <div className="super-admin-details__value">
                  <span className="badge">{STATUS_LABELS[portal.status]}</span>
                </div>
              </div>
              <div className="super-admin-details__row">
                <div className="super-admin-details__label">Создан:</div>
                <div className="super-admin-details__value">{formatDate(portal.createdAt)}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card__header">
              <h3>Подписка</h3>
            </div>
            <div className="card__body">
              <div className="super-admin-details__row">
                <div className="super-admin-details__label">Тариф:</div>
                <div className="super-admin-details__value">{PLAN_LABELS[portal.subscription.plan]}</div>
              </div>
              <div className="super-admin-details__row">
                <div className="super-admin-details__label">Оплачен:</div>
                <div className="super-admin-details__value">
                  {portal.subscription.isPaid && !isExpired ? (
                    <span className="badge badge--success">Да</span>
                  ) : (
                    <span className="badge badge--danger">Нет</span>
                  )}
                </div>
              </div>
              <div className="super-admin-details__row">
                <div className="super-admin-details__label">Оплачен до:</div>
                <div className="super-admin-details__value">
                  {portal.subscription.paidUntil ? (
                    <span className={isExpired ? 'text-danger' : ''}>
                      {formatDate(portal.subscription.paidUntil)}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card__header">
              <h3>Лимиты и использование</h3>
            </div>
            <div className="card__body">
              <div className="super-admin-details__row">
                <div className="super-admin-details__label">Пользователей:</div>
                <div className="super-admin-details__value">
                  {portal.usersCount} / {portal.limits.maxUsers}
                </div>
              </div>
              <div className="super-admin-details__row">
                <div className="super-admin-details__label">Хранилище:</div>
                <div className="super-admin-details__value">
                  {portal.limits.maxStorageMb} МБ
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
