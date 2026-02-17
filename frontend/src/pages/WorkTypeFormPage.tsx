/**
 * Форма создания / редактирования расценки
 */
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createWorkType, getWorkType, updateWorkType } from '../api/workTypes';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { COMMON_UNITS, WORK_CATEGORIES } from '../utils/constants';
import type { WorkTypeCreate } from '../types';

export function WorkTypeFormPage() {
  const navigate = useNavigate();
  const { id, projectId } = useParams<{ id: string; projectId: string }>();
  const isEdit = !!id;
  const backPath = projectId ? `/projects/${projectId}/rates` : '/';

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<WorkTypeCreate>({
    name: '',
    unit: 'м²',
    rate: 0,
    category: '',
    is_active: true,
  });

  useEffect(() => {
    if (isEdit) {
      getWorkType(Number(id))
        .then((wt) =>
          setForm({
            name: wt.name,
            unit: wt.unit,
            rate: wt.rate,
            category: wt.category,
            is_active: wt.is_active,
          })
        )
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === 'number'
          ? Number(value)
          : type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await updateWorkType(Number(id), form);
      } else {
        await createWorkType(form);
      }
      navigate(backPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">{isEdit ? 'Редактирование расценки' : 'Новая расценка'}</h2>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Название *</label>
          <input name="name" value={form.name} onChange={handleChange} required placeholder="Например: Штукатурка стен" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Ед. измерения *</label>
            <select name="unit" value={form.unit} onChange={handleChange}>
              {COMMON_UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Ставка оплаты (руб за ед.) *</label>
            <input
              type="number"
              name="rate"
              value={form.rate}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Категория</label>
          <select name="category" value={form.category} onChange={handleChange}>
            <option value="">— Без категории —</option>
            {WORK_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="form-group form-group--checkbox">
          <label>
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />
            Активна
          </label>
        </div>

        <div className="form__actions">
          <button type="button" className="btn btn--secondary" onClick={() => navigate(backPath)}>
            Отмена
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </form>
    </div>
  );
}
