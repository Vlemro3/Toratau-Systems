/**
 * Форма добавления / редактирования входящего платежа от заказчика
 */
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createCashIn, getCashIn, updateCashIn } from '../api/cashIn';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { todayISO } from '../utils/format';
import type { CashInCreate } from '../types';

export function CashInFormPage() {
  const navigate = useNavigate();
  const { projectId, id } = useParams<{ projectId: string; id: string }>();
  const projId = Number(projectId);
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<CashInCreate>({
    project_id: projId,
    date: todayISO(),
    amount: 0,
    comment: '',
  });

  useEffect(() => {
    if (isEdit) {
      getCashIn(Number(id))
        .then((ci) => setForm({
          project_id: ci.project_id,
          date: ci.date.slice(0, 10),
          amount: ci.amount,
          comment: ci.comment || '',
        }))
        .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка загрузки'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isNumeric = type === 'number' || name === 'amount';
    setForm((prev) => ({ ...prev, [name]: isNumeric ? Number(value) : value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      if (isEdit) {
        await updateCashIn(Number(id), form);
      } else {
        await createCashIn(form);
      }
      navigate(`/projects/${projId}/payments`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page__header">
        <button className="btn btn--ghost btn--sm" onClick={() => navigate(`/projects/${projId}/payments`)}>← Назад</button>
        <h2 className="page__title">{isEdit ? 'Редактирование платежа' : 'Добавить платёж от заказчика'}</h2>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <div className="form-group">
            <label>Дата *</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Сумма (руб) *</label>
            <input type="number" name="amount" value={form.amount || ''} onChange={handleChange} min="0.01" step="0.01" required autoFocus />
          </div>
        </div>

        <div className="form-group">
          <label>Комментарий</label>
          <textarea name="comment" value={form.comment} onChange={handleChange} rows={2} placeholder="Например: Первый транш по договору..." />
        </div>

        <div className="form__actions">
          <div className="form__actions-right">
            <button type="button" className="btn btn--secondary" onClick={() => navigate(`/projects/${projId}/payments`)}>Отмена</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Добавить платёж'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
