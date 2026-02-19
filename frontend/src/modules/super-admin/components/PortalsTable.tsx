/**
 * Таблица порталов с сортировкой и действиями.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Portal, PortalPlan, PortalStatus } from '../../../types';

interface Props {
  portals: Portal[];
  onBlock: (id: string) => void;
  onUnblock: (id: string) => void;
  onDelete: (id: string) => void;
}

type SortField = 'createdAt' | 'paidUntil' | 'usersCount' | 'name';
type SortDirection = 'asc' | 'desc';

const PLAN_LABELS: Record<PortalPlan, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

const STATUS_LABELS: Record<PortalStatus, string> = {
  active: 'Активен',
  blocked: 'Заблокирован',
};

const STATUS_COLORS: Record<PortalStatus, string> = {
  active: 'var(--color-success)',
  blocked: 'var(--color-danger)',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU');
}

export function PortalsTable({ portals, onBlock, onUnblock, onDelete }: Props) {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedPortals = [...portals].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

    switch (sortField) {
      case 'createdAt':
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
        break;
      case 'paidUntil':
        aVal = a.subscription.paidUntil ? new Date(a.subscription.paidUntil).getTime() : 0;
        bVal = b.subscription.paidUntil ? new Date(b.subscription.paidUntil).getTime() : 0;
        break;
      case 'usersCount':
        aVal = a.usersCount;
        bVal = b.usersCount;
        break;
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="super-admin-table-wrapper">
      <table className="super-admin-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('name')} className="super-admin-table__sortable">
              Название <SortIcon field="name" />
            </th>
            <th>Email владельца</th>
            <th onClick={() => handleSort('usersCount')} className="super-admin-table__sortable">
              Пользователи <SortIcon field="usersCount" />
            </th>
            <th>Тариф</th>
            <th>Оплачен</th>
            <th onClick={() => handleSort('paidUntil')} className="super-admin-table__sortable">
              Оплачен до <SortIcon field="paidUntil" />
            </th>
            <th>Статус</th>
            <th onClick={() => handleSort('createdAt')} className="super-admin-table__sortable">
              Создан <SortIcon field="createdAt" />
            </th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {sortedPortals.length === 0 ? (
            <tr>
              <td colSpan={9} className="super-admin-table__empty">
                Порталы не найдены
              </td>
            </tr>
          ) : (
            sortedPortals.map((portal) => {
              const isExpired = portal.subscription.paidUntil
                ? new Date(portal.subscription.paidUntil) < new Date()
                : !portal.subscription.isPaid;

              return (
                <tr key={portal.id}>
                  <td>
                    <strong>{portal.name}</strong>
                    <br />
                    <small className="text-muted">ID: {portal.id}</small>
                  </td>
                  <td>{portal.ownerEmail}</td>
                  <td>{portal.usersCount}</td>
                  <td>{PLAN_LABELS[portal.subscription.plan]}</td>
                  <td>
                    {portal.subscription.isPaid && !isExpired ? (
                      <span className="badge badge--success">Да</span>
                    ) : (
                      <span className="badge badge--danger">Нет</span>
                    )}
                  </td>
                  <td>
                    {portal.subscription.paidUntil ? (
                      <span className={isExpired ? 'text-danger' : ''}>
                        {formatDate(portal.subscription.paidUntil)}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: STATUS_COLORS[portal.status] + '20',
                        color: STATUS_COLORS[portal.status],
                      }}
                    >
                      {STATUS_LABELS[portal.status]}
                    </span>
                  </td>
                  <td>{formatDate(portal.createdAt)}</td>
                  <td>
                    <div className="super-admin-table__actions">
                      <button
                        className="btn btn--sm btn--secondary"
                        onClick={() => navigate(`/super-admin/portals/${portal.id}`)}
                        title="Детали"
                      >
                        Открыть
                      </button>
                      {portal.status === 'blocked' ? (
                        <button
                          className="btn btn--sm btn--success"
                          onClick={() => onUnblock(portal.id)}
                          title="Разблокировать"
                        >
                          Разблок.
                        </button>
                      ) : portal.status === 'active' ? (
                        <button
                          className="btn btn--sm btn--danger"
                          onClick={() => onBlock(portal.id)}
                          title="Заблокировать"
                        >
                          Блок.
                        </button>
                      ) : null}
                      <button
                        className="btn btn--sm btn--danger"
                        onClick={() => onDelete(portal.id)}
                        title="Удалить"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
