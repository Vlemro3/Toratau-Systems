/**
 * Форма добавления / редактирования выполненной работы.
 */
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createWorkLog, getWorkLog, updateWorkLog, uploadWorkLogPhotos } from '../api/workLogs';
import { getWorkTypes, createWorkType } from '../api/workTypes';
import { getCrews, createCrew } from '../api/crews';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { FileUpload } from '../components/FileUpload';
import { formatMoney, todayISO } from '../utils/format';
import type { WorkType, Crew, WorkLogCreate } from '../types';

export function WorkLogFormPage() {
  const navigate = useNavigate();
  const { projectId, id } = useParams<{ projectId: string; id: string }>();
  const projId = Number(projectId);
  const isEdit = !!id;

  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [showNewRate, setShowNewRate] = useState(false);
  const [newRateForm, setNewRateForm] = useState({ name: '', unit: '', rate: 0, category: '' });
  const [savingRate, setSavingRate] = useState(false);
  const [showNewCrew, setShowNewCrew] = useState(false);
  const [newCrewForm, setNewCrewForm] = useState({ name: '', contact: '', phone: '' });
  const [savingCrew, setSavingCrew] = useState(false);

  const [form, setForm] = useState<WorkLogCreate>({
    project_id: projId,
    crew_id: 0,
    work_type_id: 0,
    date: todayISO(),
    volume: 0,
    accrued_amount: 0,
    comment: '',
  });

  const selectedWorkType = workTypes.find((wt) => wt.id === form.work_type_id);

  useEffect(() => {
    const load = async () => {
      try {
        const [wts, crs] = await Promise.all([getWorkTypes(), getCrews()]);
        const activeWts = wts.filter((w) => w.is_active);
        const activeCrs = crs.filter((c) => c.is_active);
        setWorkTypes(activeWts);
        setCrews(activeCrs);

        if (isEdit) {
          const wl = await getWorkLog(Number(id));
          setForm({
            project_id: wl.project_id,
            crew_id: wl.crew_id,
            work_type_id: wl.work_type_id,
            date: wl.date.slice(0, 10),
            volume: wl.volume,
            accrued_amount: wl.accrued_amount,
            comment: wl.comment || '',
          });
        } else {
          setForm((prev) => ({
            ...prev,
            work_type_id: activeWts[0]?.id || 0,
            crew_id: activeCrs[0]?.id || 0,
          }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally { setLoading(false); }
    };
    load();
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name === 'work_type_id' && value === '__new__') {
      setShowNewRate(true);
      setNewRateForm({ name: '', unit: '', rate: 0, category: '' });
      return;
    }
    if (name === 'crew_id' && value === '__new__') {
      setShowNewCrew(true);
      setNewCrewForm({ name: '', contact: '', phone: '' });
      return;
    }
    const isNumeric = type === 'number' || name.endsWith('_id') || name === 'volume' || name === 'accrued_amount';
    setForm((prev) => ({
      ...prev,
      [name]: isNumeric ? (value === '' ? 0 : Number(value)) : value,
    }));
  };

  const handleCreateRate = async () => {
    if (!newRateForm.name.trim() || !newRateForm.unit.trim()) return;
    setSavingRate(true);
    try {
      const created = await createWorkType({
        name: newRateForm.name.trim(),
        unit: newRateForm.unit.trim(),
        rate: newRateForm.rate,
        category: newRateForm.category.trim() || undefined,
        is_active: true,
      });
      setWorkTypes((prev) => [...prev, created]);
      setForm((prev) => ({ ...prev, work_type_id: created.id }));
      setShowNewRate(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания расценки');
    } finally {
      setSavingRate(false);
    }
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
    if (!form.crew_id || !form.work_type_id) { setError('Выберите подрядчика и вид работ'); return; }
    if (form.accrued_amount == null || form.accrued_amount < 0) { setError('Укажите сумму'); return; }
    setError(''); setSaving(true);
    try {
      if (isEdit) {
        await updateWorkLog(Number(id), form);
      } else {
        const created = await createWorkLog(form);
        if (photos.length > 0) await uploadWorkLogPhotos(created.id, photos);
      }
      navigate(`/projects/${projId}/works`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__header-left">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate(`/projects/${projId}/works`)}>← Назад</button>
          <h2 className="page__title">{isEdit ? 'Редактирование работы' : 'Добавить работу'}</h2>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <form onSubmit={handleSubmit} className="form form--wide">
        <div className="form-group">
          <label>Вид работ *</label>
          <select name="work_type_id" value={form.work_type_id} onChange={handleChange}>
            <option value={0} disabled>— Выберите вид работ —</option>
            {workTypes.map((wt) => (
              <option key={wt.id} value={wt.id}>{wt.name} ({wt.unit}, {formatMoney(wt.rate)}/ед.)</option>
            ))}
            <option value="__new__">+ Добавить расценку...</option>
          </select>
        </div>

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
            <label>Объём ({selectedWorkType?.unit || 'ед.'}) *</label>
            <input type="number" name="volume" value={form.volume === 0 ? '' : form.volume} onChange={handleChange} min="0.01" step="0.01" required placeholder="0" />
          </div>
        </div>

        <div className="form-group">
          <label>Сумма (руб) *</label>
          <input type="number" name="accrued_amount" value={form.accrued_amount === 0 ? '' : form.accrued_amount} onChange={handleChange} min="0" step="0.01" required placeholder="0" />
        </div>

        {!isEdit && (
          <div className="form-group">
            <label>Фото (до 3)</label>
            <FileUpload maxFiles={3} onFilesChange={setPhotos} />
          </div>
        )}

        <div className="form-group">
          <label>Комментарий</label>
          <textarea name="comment" value={form.comment} onChange={handleChange} rows={2} placeholder="Описание выполненных работ..." />
        </div>

        <div className="form__actions">
          <div className="form__actions-right">
            <button type="button" className="btn btn--secondary" onClick={() => navigate(`/projects/${projId}/works`)}>Отмена</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Добавить'}
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

      {showNewRate && (
        <div
          onClick={() => setShowNewRate(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, maxWidth: 440, width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.18)', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 0' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Новая расценка</h3>
              <button type="button" onClick={() => setShowNewRate(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8', padding: 0, lineHeight: 1 }}>&times;</button>
            </div>
            <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Наименование *</label>
                <input className="input" value={newRateForm.name} onChange={(e) => setNewRateForm((f) => ({ ...f, name: e.target.value }))} placeholder="Устройство стяжки" autoFocus />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Ед. измерения *</label>
                  <input className="input" value={newRateForm.unit} onChange={(e) => setNewRateForm((f) => ({ ...f, unit: e.target.value }))} placeholder="м², м³, шт." />
                </div>
                <div className="form-group">
                  <label className="form-label">Расценка (₽) *</label>
                  <input className="input" type="number" min={0} step={0.01} value={newRateForm.rate === 0 ? '' : newRateForm.rate} onChange={(e) => setNewRateForm((f) => ({ ...f, rate: e.target.value === '' ? 0 : Number(e.target.value) }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Категория</label>
                <input className="input" value={newRateForm.category} onChange={(e) => setNewRateForm((f) => ({ ...f, category: e.target.value }))} placeholder="Опционально" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button type="button" className="btn btn--secondary" onClick={() => setShowNewRate(false)}>Отмена</button>
                <button type="button" className="btn btn--primary" onClick={handleCreateRate} disabled={savingRate || !newRateForm.name.trim() || !newRateForm.unit.trim()}>
                  {savingRate ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
