import { useState, useEffect, useCallback } from 'react';
import { getEmployees, createEmployee, deleteEmployee } from '../api/employees';
import { DataTable, type Column } from '../components/DataTable';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ROLE_LABELS } from '../utils/constants';
import type { Employee, EmployeeCreate, UserRole } from '../types';

export function EmployeesPage() {
  const [items, setItems] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<EmployeeCreate>({
    username: '', password: '', full_name: '', role: 'foreman',
  });

  const load = useCallback(() => {
    getEmployees()
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await createEmployee(form);
      setForm({ username: '', password: '', full_name: '', role: 'foreman' });
      setShowForm(false);
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

  const columns: Column<Employee>[] = [
    { key: 'full_name', label: 'ФИО', sortValue: (e) => e.full_name },
    { key: 'username', label: 'Логин', sortValue: (e) => e.username },
    { key: 'role', label: 'Роль', sortValue: (e) => e.role },
    { key: 'status', label: 'Статус', sortValue: (e) => (e.is_active ? 'a' : 'z') },
    { key: 'created_at', label: 'Создан', sortValue: (e) => e.created_at },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">Сотрудники</h2>
        <div className="page__actions">
          <button className="btn btn--primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Отмена' : '+ Добавить'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card__header"><h3>Новый сотрудник</h3></div>
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
                  <input name="username" value={form.username} onChange={handleChange} required placeholder="Уникальный логин" autoComplete="off" />
                </div>
                <div className="form-group">
                  <label>Пароль *</label>
                  <input type="password" name="password" value={form.password} onChange={handleChange} required placeholder="Минимум 4 символа" autoComplete="new-password" />
                </div>
              </div>
              <div className="form__actions">
                <div className="form__actions-right">
                  <button type="button" className="btn btn--secondary" onClick={() => setShowForm(false)}>Отмена</button>
                  <button type="submit" className="btn btn--primary" disabled={saving}>
                    {saving ? 'Сохранение...' : 'Создать'}
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
          <tr key={emp.id} className={selected ? 'tr--selected' : ''}>
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
              {emp.is_active ? 'Активен' : 'Неактивен'}
            </td>
            <td>{new Date(emp.created_at).toLocaleDateString('ru-RU')}</td>
          </tr>
        )}
      />
    </div>
  );
}
