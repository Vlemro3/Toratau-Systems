/**
 * Форма добавления / редактирования расхода по объекту
 */
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createExpense, getExpense, updateExpense } from '../api/expenses';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { todayISO } from '../utils/format';
import { EXPENSE_CATEGORY_LABELS } from '../utils/constants';
import type { ExpenseCreate } from '../types';

export function ExpenseFormPage() {
  const navigate = useNavigate();
  const { projectId, id } = useParams<{ projectId: string; id: string }>();
  const projId = Number(projectId);
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<ExpenseCreate>({
    project_id: projId,
    date: todayISO(),
    amount: 0,
    category: 'materials',
    comment: '',
  });

  useEffect(() => {
    if (isEdit) {
      getExpense(Number(id))
        .then((e) => setForm({
          project_id: e.project_id,
          date: e.date.slice(0, 10),
          amount: e.amount,
          category: e.category,
          comment: e.comment || '',
        }))
        .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка загрузки'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isNumeric = type === 'number' || name === 'amount';
    setForm((prev) => ({ ...prev, [name]: isNumeric ? Number(value) : value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      if (isEdit) {
        await updateExpense(Number(id), form);
      } else {
        await createExpense(form);
      }
      navigate(`/projects/${projId}/expenses`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__header-left">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate(`/projects/${projId}/expenses`)}>← Назад</button>
          <h2 className="page__title">{isEdit ? 'Редактирование расхода' : 'Добавить расход'}</h2>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <form onSubmit={handleSubmit} className="form form--wide">
        <div className="form-group">
          <label>Категория *</label>
          <select name="category" value={form.category} onChange={handleChange}>
            {Object.entries(EXPENSE_CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

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
          <textarea name="comment" value={form.comment} onChange={handleChange} rows={2} placeholder="Например: Цемент, 50 мешков..." />
        </div>

        <div className="form__actions">
          <div className="form__actions-right">
            <button type="button" className="btn btn--secondary" onClick={() => navigate(`/projects/${projId}/expenses`)}>Отмена</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Добавить расход'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
