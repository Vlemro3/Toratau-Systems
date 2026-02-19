import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCounterparties, deleteCounterparty } from '../api/counterparties';
import { DataTable, type Column } from '../components/DataTable';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { Counterparty } from '../types';

const ORG_TYPE_LABELS: Record<string, string> = {
  ip: 'ИП', legal: 'Юр. лицо', self_employed: 'Самозанятый', individual: 'Физ. лицо',
};

const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" />
  </svg>
);
const IconDocs = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
  </svg>
);
const IconDelete = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

export function CounterpartiesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Counterparty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    getCounterparties()
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (ids: number[]) => {
    if (!confirm(`Удалить ${ids.length} контрагент(ов)?`)) return;
    await Promise.all(ids.map(deleteCounterparty));
    load();
  };

  const askDeleteOne = async (id: number) => {
    if (!confirm('Удалить контрагента?')) return;
    await deleteCounterparty(id);
    load();
  };

  const columns: Column<Counterparty>[] = [
    { key: 'name', label: 'Название', sortValue: (c) => c.name },
    { key: 'org_type', label: 'Тип', sortValue: (c) => c.org_type },
    { key: 'inn', label: 'ИНН', sortValue: (c) => c.inn },
    { key: 'phone', label: 'Телефон' },
    { key: 'email', label: 'Email' },
    { key: 'actions', label: 'Действия' },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">Контрагенты</h2>
        <div className="page__actions">
          <button className="btn btn--primary" onClick={() => navigate('/counterparties/new')}>
            + Добавить
          </button>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <DataTable
        items={items}
        columns={columns}
        searchFields={(c) => `${c.name} ${c.inn} ${c.email} ${c.phone}`}
        onDeleteMany={handleDelete}
        emptyMessage="Нет контрагентов"
        emptyIcon="🏢"
        defaultSortKey="name"
        defaultSortDir="asc"
        renderRow={(cp, selected, toggle) => (
          <tr key={cp.id} className={selected ? 'tr--selected' : ''}>
            <td style={{ width: 40, textAlign: 'center' }}>
              <input type="checkbox" checked={selected} onChange={toggle} />
            </td>
            <td><strong>{cp.name}</strong></td>
            <td><span className="badge badge--default">{ORG_TYPE_LABELS[cp.org_type] || cp.org_type}</span></td>
            <td>{cp.inn || '—'}</td>
            <td>{cp.phone ? <a href={`tel:${cp.phone}`}>{cp.phone}</a> : '—'}</td>
            <td>{cp.email || '—'}</td>
            <td>
              <div className="table-actions">
                <Link to={`/counterparties/${cp.id}/edit`} className="table-action table-action--edit" title="Редактировать"><IconEdit /></Link>
                <Link to={`/counterparties/${cp.id}/documents`} className="table-action table-action--docs" title="Документы"><IconDocs /></Link>
                <button className="table-action table-action--delete" onClick={() => askDeleteOne(cp.id)} title="Удалить"><IconDelete /></button>
              </div>
            </td>
          </tr>
        )}
      />
    </div>
  );
}
