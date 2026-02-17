/**
 * Форма создания / редактирования бригады
 */
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createCrew, getCrew, updateCrew } from '../api/crews';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { CrewCreate } from '../types';

export function CrewFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<CrewCreate>({
    name: '',
    contact: '',
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    if (isEdit) {
      getCrew(Number(id))
        .then((c) =>
          setForm({
            name: c.name,
            contact: c.contact,
            notes: c.notes,
            is_active: c.is_active,
          })
        )
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await updateCrew(Number(id), form);
      } else {
        await createCrew(form);
      }
      navigate('/contacts');
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
        <h2 className="page__title">{isEdit ? 'Редактирование подрядчика' : 'Новый подрядчик'}</h2>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Название бригады *</label>
          <input name="name" value={form.name} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Контакт (имя / телефон)</label>
          <input name="contact" value={form.contact} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Примечание</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} />
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
          <button type="button" className="btn btn--secondary" onClick={() => navigate('/crews')}>
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
