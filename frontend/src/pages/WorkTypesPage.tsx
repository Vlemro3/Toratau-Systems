/**
 * Расценки — справочник видов работ, привязанный к текущему объекту.
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getWorkTypes, deleteWorkType } from '../api/workTypes';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DataTable } from '../components/DataTable';
import { formatMoney } from '../utils/format';
import type { WorkType } from '../types';

const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" />
  </svg>
);
const IconDelete = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

export function WorkTypesPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = id ? Number(id) : null;
  const basePath = projectId ? `/projects/${projectId}/rates` : '/work-types';

  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; action: () => Promise<void> } | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try { setWorkTypes(await getWorkTypes()); }
    finally { setLoading(false); }
  }

  const askDelete = (wt: WorkType) => {
    setConfirmAction({
      title: 'Удалить расценку?',
      message: `Вы уверены, что хотите удалить «${wt.name}»?`,
      action: async () => { await deleteWorkType(wt.id); await loadData(); },
    });
  };

  const askDeleteMany = (ids: number[]) => {
    setConfirmAction({
      title: 'Удалить расценки?',
      message: `Удалить выбранные расценки (${ids.length})?`,
      action: async () => { for (const i of ids) await deleteWorkType(i); await loadData(); },
    });
  };

  const doConfirm = async () => {
    if (!confirmAction) return;
    try { await confirmAction.action(); }
    catch (err) { alert(err instanceof Error ? err.message : 'Ошибка'); }
    setConfirmAction(null);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">Расценки</h2>
      </div>

      <div className="tab-header">
        <Link to={`${basePath}/new`} className="btn btn--primary btn--sm">+ Добавить расценку</Link>
      </div>

      <DataTable
        items={workTypes}
        searchFields={(wt) => `${wt.name} ${wt.unit} ${wt.category || ''}`}
        emptyMessage="Справочник пуст" emptyIcon="📋"
        onDeleteMany={askDeleteMany}
        renderHead={() => <>
          <th>Название</th><th>Ед. изм.</th><th className="text-right">Ставка</th><th>Категория</th><th className="text-center">Статус</th><th className="text-center">Действия</th>
        </>}
        renderRow={(wt, sel, toggle) => (
          <tr key={wt.id} className={sel ? 'table-row--selected' : ''}>
            <td style={{ textAlign: 'center' }}><input type="checkbox" checked={sel} onChange={toggle} /></td>
            <td><strong>{wt.name}</strong></td>
            <td>{wt.unit}</td>
            <td className="text-right">{formatMoney(wt.rate)}</td>
            <td>{wt.category || '—'}</td>
            <td className="text-center">
              <span className={`status-dot ${wt.is_active ? 'status-dot--green' : 'status-dot--gray'}`} />
              {wt.is_active ? 'Активна' : 'Неактивна'}
            </td>
            <td><div className="table-actions">
              <Link to={`${basePath}/${wt.id}/edit`} className="table-action table-action--edit" title="Редактировать"><IconEdit /></Link>
              <button className="table-action table-action--delete" onClick={() => askDelete(wt)} title="Удалить"><IconDelete /></button>
            </div></td>
          </tr>
        )}
      />

      <ConfirmDialog
        open={!!confirmAction} title={confirmAction?.title || ''} message={confirmAction?.message || ''}
        onConfirm={doConfirm} onCancel={() => setConfirmAction(null)} danger
      />
    </div>
  );
}
