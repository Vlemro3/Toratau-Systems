/**
 * Форма создания / редактирования выплаты бригаде
 */
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPayout, getPayout, updatePayout } from '../api/payouts';
import { getCrews } from '../api/crews';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { todayISO } from '../utils/format';
import { PAYMENT_METHOD_LABELS } from '../utils/constants';
import type { Crew, PayoutCreate } from '../types';

export function PayoutFormPage() {
  const navigate = useNavigate();
  const { projectId, id } = useParams<{ projectId: string; id: string }>();
  const projId = Number(projectId);
  const isEdit = !!id;

  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<PayoutCreate>({
    project_id: projId,
    crew_id: 0,
    date: todayISO(),
    amount: 0,
    payment_method: 'cash',
    comment: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const crs = await getCrews();
        const active = crs.filter((c) => c.is_active);
        setCrews(active);

        if (isEdit) {
          const p = await getPayout(Number(id));
          setForm({
            project_id: p.project_id,
            crew_id: p.crew_id,
            date: p.date.slice(0, 10),
            amount: p.amount,
            payment_method: p.payment_method,
            comment: p.comment || '',
          });
        } else if (active.length > 0) {
          setForm((prev) => ({ ...prev, crew_id: active[0].id }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally { setLoading(false); }
    };
    load();
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isNumeric = type === 'number' || name.endsWith('_id') || name === 'amount';
    setForm((prev) => ({ ...prev, [name]: isNumeric ? Number(value) : value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.crew_id) { setError('Выберите бригаду'); return; }
    setError(''); setSaving(true);
    try {
      if (isEdit) {
        await updatePayout(Number(id), form);
      } else {
        await createPayout(form);
      }
      navigate(`/projects/${projId}/payouts`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__header-left">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate(`/projects/${projId}/payouts`)}>← Назад</button>
          <h2 className="page__title">{isEdit ? 'Редактирование выплаты' : 'Новая выплата'}</h2>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <form onSubmit={handleSubmit} className="form form--wide">
        <div className="form-group">
          <label>Бригада *</label>
          <select name="crew_id" value={form.crew_id} onChange={handleChange}>
            {crews.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
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
          <label>Способ оплаты</label>
          <select name="payment_method" value={form.payment_method} onChange={handleChange}>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Комментарий</label>
          <textarea name="comment" value={form.comment} onChange={handleChange} rows={2} placeholder="Например: Аванс за штукатурку..." />
        </div>

        <div className="form__actions">
          <div className="form__actions-right">
            <button type="button" className="btn btn--secondary" onClick={() => navigate(`/projects/${projId}/payouts`)}>Отмена</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать выплату'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
