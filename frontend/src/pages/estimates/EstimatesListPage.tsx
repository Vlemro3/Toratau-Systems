import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getEstimates, deleteEstimate, downloadEstimatePositions, STATUS_LABELS, STATUS_COLORS } from '../../api/estimates';
import type { Estimate } from '../../api/estimates';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/StatusBadge';

export function EstimatesListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    getEstimates()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить смету?')) return;
    await deleteEstimate(id);
    load();
  };

  const filtered = items.filter((e) =>
    `${e.name} ${e.region} ${e.fileName}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">Сметы</h2>
        <div className="page__actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to="/estimates/settings" className="table-action table-action--edit" title="Настройки сметы" style={{ width: 36, height: 36 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </Link>
          <button className="btn btn--primary" onClick={() => navigate('/estimates/new')}>+ Добавить смету</button>
        </div>
      </div>

      <div className="data-table__toolbar" style={{ marginBottom: 16 }}>
        <div className="data-table__search">
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="data-table__search-clear" onClick={() => setSearch('')} title="Очистить" type="button">
              &times;
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📐</div>
          <p className="text-muted">Нет смет</p>
          <button className="btn btn--primary" style={{ marginTop: 12 }} onClick={() => navigate('/estimates/new')}>
            Загрузить первую смету
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Регион</th>
                <th>База</th>
                <th>Файл</th>
                <th>Статус</th>
                <th>Дата</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((est) => (
                <tr key={est.id}>
                  <td><Link to={`/estimates/${est.id}`} style={{ fontWeight: 600 }}>{est.name}</Link></td>
                  <td>{est.region}</td>
                  <td><span className="badge badge--default">{est.baseType}</span></td>
                  <td className="text-muted" style={{ fontSize: '0.875rem' }}>{est.fileName}</td>
                  <td><StatusBadge label={STATUS_LABELS[est.status]} color={STATUS_COLORS[est.status]} /></td>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(est.createdAt).toLocaleDateString('ru-RU')}</td>
                  <td>
                    <div className="table-actions">
                      <button className="table-action table-action--docs" title="Скачать смету" onClick={() => downloadEstimatePositions(est)} type="button">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      </button>
                      <Link to={`/estimates/${est.id}`} className="table-action table-action--edit" title="Открыть">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </Link>
                      <button className="table-action table-action--delete" title="Удалить" onClick={() => handleDelete(est.id)} type="button">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
