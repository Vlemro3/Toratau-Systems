/**
 * Форма добавления / редактирования выполненной работы.
 */
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createWorkLog, getWorkLog, updateWorkLog, uploadWorkLogPhotos } from '../api/workLogs';
import { getWorkTypes } from '../api/workTypes';
import { getCrews } from '../api/crews';
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
    const isNumeric = type === 'number' || name.endsWith('_id') || name === 'volume' || name === 'accrued_amount';
    setForm((prev) => ({ ...prev, [name]: isNumeric ? Number(value) : value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.crew_id || !form.work_type_id) { setError('Выберите бригаду и вид работ'); return; }
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
            {workTypes.map((wt) => (
              <option key={wt.id} value={wt.id}>{wt.name} ({wt.unit}, {formatMoney(wt.rate)}/ед.)</option>
            ))}
          </select>
        </div>

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
            <label>Объём ({selectedWorkType?.unit || 'ед.'}) *</label>
            <input type="number" name="volume" value={form.volume || ''} onChange={handleChange} min="0.01" step="0.01" required placeholder="0" />
          </div>
        </div>

        <div className="form-group">
          <label>Сумма (руб) *</label>
          <input type="number" name="accrued_amount" value={form.accrued_amount || ''} onChange={handleChange} min="0" step="0.01" required placeholder="0" />
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
    </div>
  );
}
