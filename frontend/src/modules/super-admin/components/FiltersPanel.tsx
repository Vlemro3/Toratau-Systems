/**
 * Панель фильтров и поиска порталов.
 */
import type { PortalPlan, PortalStatus } from '../../../types';

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: PortalStatus | 'all';
  onStatusFilterChange: (value: PortalStatus | 'all') => void;
  planFilter: PortalPlan | 'all';
  onPlanFilterChange: (value: PortalPlan | 'all') => void;
  paidFilter: 'all' | 'paid' | 'unpaid';
  onPaidFilterChange: (value: 'all' | 'paid' | 'unpaid') => void;
}

const STATUS_OPTIONS: { value: PortalStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Все статусы' },
  { value: 'active', label: 'Активные' },
  { value: 'blocked', label: 'Заблокированные' },
];

const PLAN_OPTIONS: { value: PortalPlan | 'all'; label: string }[] = [
  { value: 'all', label: 'Все тарифы' },
  { value: 'free', label: 'Free' },
  { value: 'basic', label: 'Basic' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
];

const PAID_OPTIONS: { value: 'all' | 'paid' | 'unpaid'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'paid', label: 'Оплаченные' },
  { value: 'unpaid', label: 'Неоплаченные' },
];

export function FiltersPanel({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  planFilter,
  onPlanFilterChange,
  paidFilter,
  onPaidFilterChange,
}: Props) {
  return (
    <div className="super-admin-filters">
      <div className="super-admin-filters__search">
        <input
          type="text"
          placeholder="Поиск по ID, названию, email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="super-admin-filters__input"
        />
      </div>

      <div className="super-admin-filters__group">
        <label className="super-admin-filters__label">Статус:</label>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as PortalStatus | 'all')}
          className="super-admin-filters__select"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="super-admin-filters__group">
        <label className="super-admin-filters__label">Тариф:</label>
        <select
          value={planFilter}
          onChange={(e) => onPlanFilterChange(e.target.value as PortalPlan | 'all')}
          className="super-admin-filters__select"
        >
          {PLAN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="super-admin-filters__group">
        <label className="super-admin-filters__label">Оплата:</label>
        <select
          value={paidFilter}
          onChange={(e) => onPaidFilterChange(e.target.value as 'all' | 'paid' | 'unpaid')}
          className="super-admin-filters__select"
        >
          {PAID_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
