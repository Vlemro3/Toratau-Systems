/**
 * Форма создания / редактирования объекта.
 * При создании проверяется лимит объектов по тарифу подписки.
 */
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createProject, getProject, updateProject, deleteProject, getProjects } from '../api/projects';
import { getCounterparties } from '../api/counterparties';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useSubscription } from '../billing/SubscriptionContext';
import { canAddProject } from '../billing/billingConfig';
import { PROJECT_STATUS_LABELS } from '../utils/constants';
import { toInputDate, todayISO } from '../utils/format';
import type { ProjectCreate, Counterparty } from '../types';

export function ProjectFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { subscription } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);

  const [form, setForm] = useState<ProjectCreate>({
    name: '', address: '', client: '',
    start_date: todayISO(), end_date: null, status: 'new',
    contract_amount: 0, planned_cost: 0, notes: '',
  });

  useEffect(() => {
    const promises: Promise<void>[] = [
      getCounterparties()
        .then(setCounterparties)
        .catch((err) => {
          if (import.meta.env.DEV) {
            console.error('Ошибка загрузки контрагентов:', err);
          }
        }),
    ];
    if (isEdit) {
      promises.push(
        getProject(Number(id))
          .then((p) =>
            setForm({
              name: p.name, address: p.address, client: p.client,
              start_date: toInputDate(p.start_date),
              end_date: toInputDate(p.end_date) || null,
              status: p.status,
              contract_amount: p.contract_amount,
              planned_cost: p.planned_cost,
              notes: p.notes,
            })
          )
          .catch((err) => setError(err.message))
      );
    }
    Promise.all(promises).finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      if (isEdit) {
        await updateProject(Number(id), form);
        navigate(`/projects/${id}`);
      } else {
        const projects = await getProjects();
        if (!canAddProject(subscription, projects.length)) {
          setShowUpgradeModal(true);
          setSaving(false);
          return;
        }
        const created = await createProject(form);
        navigate(`/projects/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await deleteProject(Number(id));
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    }
    setShowDelete(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__header-left">
          <h2 className="page__title">{isEdit ? 'Редактирование объекта' : 'Новый объект'}</h2>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <form onSubmit={handleSubmit} className="form form--wide">
        <div className="form-row">
          <div className="form-group">
            <label>Название объекта *</label>
            <input name="name" value={form.name} onChange={handleChange} required placeholder="Например: ЖК «Солнечный»" />
          </div>
          <div className="form-group">
            <label>Заказчик *</label>
            {counterparties.length > 0 ? (
              <select name="client" value={form.client} onChange={handleChange} required>
                <option value="">— Выберите контрагента —</option>
                {counterparties.map((cp) => (
                  <option key={cp.id} value={cp.name}>{cp.name}</option>
                ))}
              </select>
            ) : (
              <input name="client" value={form.client} onChange={handleChange} required placeholder="Сначала добавьте контрагента" />
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Адрес</label>
            <input name="address" value={form.address} onChange={handleChange} placeholder="ул. Центральная, 45" />
          </div>
          {isEdit ? (
            <div className="form-group">
              <label>Статус</label>
              <select name="status" value={form.status} onChange={handleChange}>
                {Object.entries(PROJECT_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="form-group" />
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Дата старта *</label>
            <input type="date" name="start_date" value={form.start_date} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Плановая дата окончания</label>
            <input type="date" name="end_date" value={form.end_date || ''} onChange={handleChange} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Сумма контракта (руб) *</label>
            <input type="number" name="contract_amount" value={form.contract_amount} onChange={handleChange} min="0" step="0.01" required />
          </div>
          <div className="form-group">
            <label>Плановая себестоимость (руб) *</label>
            <input type="number" name="planned_cost" value={form.planned_cost} onChange={handleChange} min="0" step="0.01" required />
          </div>
        </div>

        <div className="form-group">
          <label>Примечание</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder="Дополнительная информация..." />
        </div>

        <div className="form__actions">
          {isEdit && (
            <button type="button" className="btn btn--danger" onClick={() => setShowDelete(true)}>Удалить объект</button>
          )}
          <div className="form__actions-right">
            <button type="button" className="btn btn--secondary" onClick={() => navigate(-1)}>Отмена</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать объект'}
            </button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={showDelete}
        title="Удалить объект?"
        message={`Вы уверены, что хотите удалить «${form.name}»? Это действие необратимо.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        danger
      />

      {showUpgradeModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ maxWidth: 400, margin: 16 }}>
            <div className="card__body">
              <h3 style={{ marginTop: 0 }}>Достигнут лимит объектов</h3>
              <p className="text-muted">
                По вашему тарифу нельзя добавить больше объектов. Смените тариф в разделе «Оплата и подписка», чтобы создавать новые объекты.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="btn btn--secondary" onClick={() => setShowUpgradeModal(false)}>
                  Закрыть
                </button>
                <button type="button" className="btn btn--primary" onClick={() => navigate('/billing')}>
                  Перейти к тарифам
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
