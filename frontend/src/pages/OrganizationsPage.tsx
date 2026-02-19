import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrganizations, deleteOrganization } from '../api/organizations';
import { DataTable, type Column } from '../components/DataTable';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { Organization } from '../types';

const ORG_TYPE_LABELS: Record<string, string> = {
  ip: 'ИП',
  legal: 'Юр. лицо',
  self_employed: 'Самозанятый',
  individual: 'Физ. лицо',
};

export function OrganizationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    getOrganizations()
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (ids: number[]) => {
    if (!confirm(`Удалить ${ids.length} организацию(ий)?`)) return;
    await Promise.all(ids.map(deleteOrganization));
    load();
  };

  const columns: Column<Organization>[] = [
    { key: 'name', label: 'Название', sortValue: (o) => o.name },
    { key: 'org_type', label: 'Тип', sortValue: (o) => o.org_type },
    { key: 'inn', label: 'ИНН', sortValue: (o) => o.inn },
    { key: 'phone', label: 'Телефон' },
    { key: 'email', label: 'Email' },
    { key: 'actions', label: 'Действия' },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">Мои организации</h2>
        <div className="page__actions">
          <button className="btn btn--primary" onClick={() => navigate('/organizations/new')}>
            + Добавить
          </button>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <DataTable
        items={items}
        columns={columns}
        searchFields={(o) => `${o.name} ${o.inn} ${o.email} ${o.phone}`}
        onDeleteMany={handleDelete}
        emptyMessage="Нет организаций"
        emptyIcon="🏢"
        defaultSortKey="name"
        defaultSortDir="asc"
        renderRow={(org, selected, toggle) => (
          <tr key={org.id} className={selected ? 'tr--selected' : ''}>
            <td style={{ width: 40, textAlign: 'center' }}>
              <input type="checkbox" checked={selected} onChange={toggle} />
            </td>
            <td><strong>{org.name}</strong></td>
            <td><span className="badge badge--default">{ORG_TYPE_LABELS[org.org_type] || org.org_type}</span></td>
            <td>{org.inn || '—'}</td>
            <td>{org.phone || '—'}</td>
            <td>{org.email || '—'}</td>
            <td className="td-actions">
              <button className="btn-icon" title="Редактировать" onClick={() => navigate(`/organizations/${org.id}/edit`)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              </button>
            </td>
          </tr>
        )}
      />
    </div>
  );
}
