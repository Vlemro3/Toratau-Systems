import { useState, useEffect, useCallback } from 'react';
import { getEmployees, createEmployee, updateEmployee, getEmployee, deleteEmployee } from '../api/employees';
import { getProjects } from '../api/projects';
import { DataTable, type Column } from '../components/DataTable';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ROLE_LABELS } from '../utils/constants';
import type { Employee, EmployeeCreate, Project } from '../types';

type FormData = Omit<EmployeeCreate, 'password'> & {
  password: string;
  project_ids: number[];
  is_active: boolean;
};

const emptyForm: FormData = {
  username: '', password: '', full_name: '', role: 'foreman',
  project_ids: [], is_active: true,
};

export function EmployeesPage() {
  const [items, setItems] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormData>({ ...emptyForm });

  const load = useCallback(async () => {
    try {
      const [employees, projs] = await Promise.all([getEmployees(), getProjects()]);
      setItems(employees);
      setProjects(projs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'role' && value !== 'foreman') {
        updated.project_ids = [];
      }
      return updated;
    });
  };

  const handleProjectToggle = (projectId: number) => {
    setForm((prev) => {
      const ids = prev.project_ids.includes(projectId)
        ? prev.project_ids.filter((id) => id !== projectId)
        : [...prev.project_ids, projectId];
      return { ...prev, project_ids: ids };
    });
  };

  const handleSelectAll = () => {
    const allIds = projects.map((p) => p.id);
    const allSelected = allIds.every((id) => form.project_ids.includes(id));
    setForm((prev) => ({
      ...prev,
      project_ids: allSelected ? [] : allIds,
    }));
  };

  const handleEdit = async (id: number) => {
    try {
      const emp = await getEmployee(id);
      setForm({
        username: emp.username,
        password: '',
        full_name: emp.full_name,
        role: emp.role,
        project_ids: emp.project_ids || [],
        is_active: emp.is_active,
      });
      setEditingId(id);
      setShowForm(true);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    }
  };

  const handleCancel = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setSaving(true);
    try {
      if (editingId) {
        const payload: Partial<EmployeeCreate> & { is_active?: boolean } = {
          full_name: form.full_name,
          role: form.role,
          project_ids: form.project_ids,
          is_active: form.is_active,
        };
        if (form.password) payload.password = form.password;
        await updateEmployee(editingId, payload);
      } else {
        await createEmployee({
          username: form.username,
          password: form.password,
          full_name: form.full_name,
          role: form.role,
          project_ids: form.project_ids,
        });
      }
      handleCancel();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ids: number[]) => {
    if (!confirm(`Удалить ${ids.length} сотрудник(ов)?`)) return;
    try {
      const results = await Promise.allSettled(ids.map(deleteEmployee));
      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        setError(`Не удалось удалить ${failures.length} из ${ids.length} сотрудников`);
      }
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    }
  };

  const handleToggleActive = async (emp: Employee) => {
    try {
      await updateEmployee(emp.id, { is_active: !emp.is_active } as never);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  const getProjectNames = (ids?: number[]) => {
    if (!ids || ids.length === 0) return '—';
    return ids
      .map((id) => projects.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const columns: Column<Employee>[] = [
    { key: 'full_name', label: 'ФИО', sortValue: (e) => e.full_name },
    { key: 'username', label: 'Логин', sortValue: (e) => e.username },
    { key: 'role', label: 'Роль', sortValue: (e) => e.role },
    { key: 'status', label: 'Статус', sortValue: (e) => (e.is_active ? 'a' : 'z') },
    { key: 'objects', label: 'Объекты' },
    { key: 'actions', label: 'Действия' },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">Сотрудники</h2>
        <div className="page__actions">
          <button
            className="btn btn--primary"
            onClick={() => { if (showForm) handleCancel(); else { setShowForm(true); setEditingId(null); setForm({ ...emptyForm }); } }}
          >
            {showForm ? 'Отмена' : '+ Добавить'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card__header">
            <h3>{editingId ? 'Редактирование сотрудника' : 'Новый сотрудник'}</h3>
          </div>
          <div className="card__body">
            <form onSubmit={handleSubmit} className="form form--wide">
              <div className="form-row">
                <div className="form-group">
                  <label>ФИО *</label>
                  <input name="full_name" value={form.full_name} onChange={handleChange} required placeholder="Иванов Иван Иванович" />
                </div>
                <div className="form-group">
                  <label>Роль *</label>
                  <select name="role" value={form.role} onChange={handleChange}>
                    <option value="admin">Администратор</option>
                    <option value="foreman">Прораб</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Логин *</label>
                  <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    required={!editingId}
                    disabled={!!editingId}
                    placeholder="Уникальный логин"
                    autoComplete="off"
                  />
                </div>
                <div className="form-group">
                  <label>{editingId ? 'Новый пароль' : 'Пароль *'}</label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required={!editingId}
                    placeholder={editingId ? 'Оставьте пустым, чтобы не менять' : 'Минимум 4 символа'}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {editingId && (
                <div className="form-row">
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                      />
                      Пользователь активен
                    </label>
                    <small className="text-muted">
                      {form.is_active ? 'Сотрудник может входить в систему' : 'Доступ заблокирован'}
                    </small>
                  </div>
                </div>
              )}

              {form.role === 'foreman' && (
                <div className="form-row" style={{ display: 'block' }}>
                  <div className="form-group" style={{ width: '100%', maxWidth: '100%' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Доступ к объектам</span>
                      <button
                        type="button"
                        className="btn btn--sm btn--ghost"
                        onClick={handleSelectAll}
                        style={{ fontSize: 12, padding: '2px 8px' }}
                      >
                        {projects.every((p) => form.project_ids.includes(p.id)) ? 'Снять все' : 'Выбрать все'}
                      </button>
                    </label>
                    <div style={{
                      border: '1px solid var(--border, #e0e0e0)',
                      borderRadius: 8,
                      padding: 12,
                      maxHeight: 220,
                      overflowY: 'auto',
                      background: 'var(--bg-secondary, #f7f8fa)',
                    }}>
                      {projects.length === 0 ? (
                        <p className="text-muted" style={{ margin: 0 }}>Нет объектов</p>
                      ) : (
                        projects.map((p) => (
                          <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={form.project_ids.includes(p.id)}
                              onChange={() => handleProjectToggle(p.id)}
                            />
                            <span>
                              {p.name}
                              <small className="text-muted" style={{ marginLeft: 8 }}>{p.client}</small>
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                    {form.project_ids.length === 0 && (
                      <small className="text-muted" style={{ marginTop: 4, display: 'block' }}>
                        Если не выбрано ни одного объекта — сотрудник не увидит никаких данных
                      </small>
                    )}
                  </div>
                </div>
              )}

              <div className="form__actions">
                <div className="form__actions-right">
                  <button type="button" className="btn btn--secondary" onClick={handleCancel}>Отмена</button>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={saving}
                  >
                    {saving ? 'Сохранение...' : editingId ? 'Сохранить' : 'Создать'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <DataTable
        items={items}
        columns={columns}
        searchFields={(e) => `${e.full_name} ${e.username} ${e.role}`}
        onDeleteMany={handleDelete}
        emptyMessage="Нет сотрудников"
        emptyIcon="👤"
        defaultSortKey="full_name"
        defaultSortDir="asc"
        renderRow={(emp, selected, toggle) => (
          <tr key={emp.id} className={selected ? 'tr--selected' : ''} style={{ opacity: emp.is_active ? 1 : 0.5 }}>
            <td style={{ width: 40, textAlign: 'center' }}>
              <input type="checkbox" checked={selected} onChange={toggle} />
            </td>
            <td><strong>{emp.full_name}</strong></td>
            <td><code>{emp.username}</code></td>
            <td>
              <span className={`badge ${emp.role === 'admin' ? 'badge--primary' : 'badge--default'}`}>
                {ROLE_LABELS[emp.role] || emp.role}
              </span>
            </td>
            <td>
              <span className={`status-dot ${emp.is_active ? 'status-dot--active' : 'status-dot--inactive'}`} />
              {emp.is_active ? 'Активен' : 'Заблокирован'}
            </td>
            <td style={{ maxWidth: 200 }}>
              {emp.role === 'foreman' ? (
                <small className="text-muted" title={getProjectNames(emp.project_ids)}>
                  {(emp.project_ids?.length || 0) > 0
                    ? `${emp.project_ids!.length} объект${emp.project_ids!.length === 1 ? '' : emp.project_ids!.length < 5 ? 'а' : 'ов'}`
                    : 'Нет объектов'}
                </small>
              ) : (
                <small className="text-muted">Все объекты</small>
              )}
            </td>
            <td>
              <div className="table-actions">
                <button className="table-action table-action--edit" onClick={() => handleEdit(emp.id)} title="Редактировать">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                </button>
                <button className="table-action table-action--delete" onClick={() => handleDelete([emp.id])} title="Удалить">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                </button>
              </div>
            </td>
          </tr>
        )}
      />
    </div>
  );
}
