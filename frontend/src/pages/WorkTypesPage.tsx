/**
 * Расценки — общий справочник видов работ (используется в документах контрагентов).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getWorkTypes, deleteWorkType, adjustAllRates } from '../api/workTypes';
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

const BASE_PATH = '/rates';

export function WorkTypesPage() {
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; action: () => Promise<void> } | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustPercentage, setAdjustPercentage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

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

  const handleAdjustRates = async () => {
    const percentage = parseFloat(adjustPercentage);
    if (isNaN(percentage) || percentage === 0) {
      alert('Введите корректный процент изменения (не равный нулю)');
      return;
    }
    if (percentage < -100) {
      alert('Процент не может быть меньше -100%');
      return;
    }
    
    const action = percentage > 0 ? 'повысить' : 'понизить';
    const absPercent = Math.abs(percentage);
    if (!confirm(`Вы уверены, что хотите ${action} все ставки на ${absPercent}%? Это действие изменит все ${workTypes.length} расценок.`)) {
      return;
    }
    
    try {
      const updated = await adjustAllRates(percentage);
      setWorkTypes(updated);
      setShowAdjustModal(false);
      setAdjustPercentage('');
      alert(`Все ставки успешно ${action} на ${absPercent}%`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка изменения ставок');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__header-left">
          <h2 className="page__title">Расценки</h2>
        </div>
        <div className="page__actions">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setShowAdjustModal(true)}
            style={{ marginRight: 8 }}
          >
            Изменить все ставки
          </button>
          <Link to={`${BASE_PATH}/new`} className="btn btn--primary">+ Добавить расценку</Link>
        </div>
      </div>

      <DataTable
        items={workTypes}
        columns={[
          { key: 'name', label: 'Название', sortValue: (wt) => wt.name },
          { key: 'unit', label: 'Ед. изм.', sortValue: (wt) => wt.unit },
          { key: 'rate', label: 'Ставка', className: 'text-right', sortValue: (wt) => wt.rate },
          { key: 'category', label: 'Категория', sortValue: (wt) => wt.category || '' },
          { key: 'status', label: 'Статус', className: 'text-center', sortValue: (wt) => wt.is_active ? 1 : 0 },
          { key: 'actions', label: 'Действия', className: 'text-center' },
        ]}
        defaultSortKey="name"
        defaultSortDir="asc"
        searchFields={(wt) => `${wt.name} ${wt.unit} ${wt.category || ''}`}
        emptyMessage="Справочник пуст" emptyIcon="📋"
        onDeleteMany={askDeleteMany}
        renderRow={(wt, sel, toggle) => (
          <tr key={wt.id} className={sel ? 'tr--selected' : ''}>
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
              <Link to={`${BASE_PATH}/${wt.id}/edit`} className="table-action table-action--edit" title="Редактировать"><IconEdit /></Link>
              <button className="table-action table-action--delete" onClick={() => askDelete(wt)} title="Удалить"><IconDelete /></button>
            </div></td>
          </tr>
        )}
      />

      <ConfirmDialog
        open={!!confirmAction} title={confirmAction?.title || ''} message={confirmAction?.message || ''}
        onConfirm={doConfirm} onCancel={() => setConfirmAction(null)} danger
      />

      {/* Модальное окно изменения ставок */}
      {showAdjustModal && (
        <div className="modal-overlay" onClick={() => setShowAdjustModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal__header">
              <h3>Изменение всех ставок</h3>
              <button className="modal__close" onClick={() => setShowAdjustModal(false)}>&times;</button>
            </div>
            <div className="modal__body">
              <p className="text-muted" style={{ marginBottom: 16 }}>
                Введите процент изменения ставок. Положительное значение повысит ставки, отрицательное — понизит.
              </p>
              <div className="form-group">
                <label>Процент изменения:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    value={adjustPercentage}
                    onChange={(e) => setAdjustPercentage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAdjustRates();
                      }
                    }}
                    placeholder="10 или -5"
                    step="0.01"
                    className="form-control"
                    style={{ flex: 1 }}
                    autoFocus
                  />
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>%</span>
                </div>
                <p className="text-muted" style={{ fontSize: '0.8125rem', marginTop: 8, marginBottom: 0 }}>
                  Примеры: <code>10</code> — повысить на 10%, <code>-5</code> — понизить на 5%
                </p>
              </div>
              <div className="modal__actions" style={{ marginTop: 20 }}>
                <button className="btn btn--secondary" onClick={() => { setShowAdjustModal(false); setAdjustPercentage(''); }}>
                  Отмена
                </button>
                <button className="btn btn--primary" onClick={handleAdjustRates}>
                  Применить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
