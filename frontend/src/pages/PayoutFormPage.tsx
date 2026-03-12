/**
 * Форма создания / редактирования выплаты подрядчику
 */
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPayout, getPayout, updatePayout } from '../api/payouts';
import { getCrews, createCrew } from '../api/crews';
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
  const [showNewCrew, setShowNewCrew] = useState(false);
  const [newCrewForm, setNewCrewForm] = useState({ name: '', contact: '', phone: '' });
  const [savingCrew, setSavingCrew] = useState(false);

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
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally { setLoading(false); }
    };
    load();
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name === 'crew_id' && value === '__new__') {
      setShowNewCrew(true);
      setNewCrewForm({ name: '', contact: '', phone: '' });
      return;
    }
    const isNumeric = type === 'number' || name.endsWith('_id') || name === 'amount';
    setForm((prev) => ({
      ...prev,
      [name]: isNumeric ? (value === '' ? 0 : Number(value)) : value,
    }));
  };

  const handleCreateCrew = async () => {
    if (!newCrewForm.name.trim()) return;
    setSavingCrew(true);
    try {
      const created = await createCrew({ name: newCrewForm.name.trim(), contact: newCrewForm.contact.trim(), phone: newCrewForm.phone.trim() || undefined, is_active: true });
      setCrews((prev) => [...prev, created]);
      setForm((prev) => ({ ...prev, crew_id: created.id }));
      setShowNewCrew(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания контакта');
    } finally {
      setSavingCrew(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.crew_id) { setError('Выберите подрядчика'); return; }
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
          <label>Подрядчик *</label>
          <select name="crew_id" value={form.crew_id} onChange={handleChange}>
            <option value={0} disabled>— Выберите подрядчика —</option>
            {crews.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            <option value="__new__">+ Добавить контакт...</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Дата *</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Сумма (руб) *</label>
            <input type="number" name="amount" value={form.amount === 0 ? '' : form.amount} onChange={handleChange} min="0.01" step="0.01" required autoFocus />
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
              {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Добавить выплату'}
            </button>
          </div>
        </div>
      </form>

      {showNewCrew && (
        <div
          onClick={() => setShowNewCrew(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, maxWidth: 440, width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.18)', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 0' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Новый контакт подрядчика</h3>
              <button type="button" onClick={() => setShowNewCrew(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8', padding: 0, lineHeight: 1 }}>&times;</button>
            </div>
            <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Наименование *</label>
                <input className="input" value={newCrewForm.name} onChange={(e) => setNewCrewForm((f) => ({ ...f, name: e.target.value }))} placeholder="ООО «Строитель» или ФИО" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Контактное лицо</label>
                <input className="input" value={newCrewForm.contact} onChange={(e) => setNewCrewForm((f) => ({ ...f, contact: e.target.value }))} placeholder="Иванов Иван" />
              </div>
              <div className="form-group">
                <label className="form-label">Телефон</label>
                <input className="input" value={newCrewForm.phone} onChange={(e) => setNewCrewForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+7 (999) 000-00-00" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button type="button" className="btn btn--secondary" onClick={() => setShowNewCrew(false)}>Отмена</button>
                <button type="button" className="btn btn--primary" onClick={handleCreateCrew} disabled={savingCrew || !newCrewForm.name.trim()}>
                  {savingCrew ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
