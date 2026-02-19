/**
 * Компонент статистики порталов (верхний блок дашборда).
 */
import type { Portal } from '../../../types';

interface Props {
  portals: Portal[];
}

export function SummaryStats({ portals }: Props) {
  const total = portals.length;
  const active = portals.filter((p) => p.status === 'active').length;
  const blocked = portals.filter((p) => p.status === 'blocked').length;

  // Просроченные: isPaid = false или paidUntil < now
  const expired = portals.filter((p) => {
    if (!p.subscription.isPaid) return true;
    if (p.subscription.paidUntil && new Date(p.subscription.paidUntil) < new Date()) return true;
    return false;
  }).length;

  // MRR (Monthly Recurring Revenue) - только платные активные порталы
  const mrr = portals
    .filter((p) => p.status === 'active' && p.subscription.isPaid && p.subscription.plan !== 'free')
    .reduce((sum, p) => {
      const planPrices: Record<string, number> = {
        basic: 5000,
        pro: 10000,
        enterprise: 20000,
      };
      return sum + (planPrices[p.subscription.plan] || 0);
    }, 0);

  return (
    <div className="super-admin-stats">
      <div className="super-admin-stats__card">
        <div className="super-admin-stats__value">{total}</div>
        <div className="super-admin-stats__label">Всего порталов</div>
      </div>
      <div className="super-admin-stats__card super-admin-stats__card--success">
        <div className="super-admin-stats__value">{active}</div>
        <div className="super-admin-stats__label">Активных</div>
      </div>
      <div className="super-admin-stats__card super-admin-stats__card--danger">
        <div className="super-admin-stats__value">{blocked}</div>
        <div className="super-admin-stats__label">Заблокированных</div>
      </div>
      <div className="super-admin-stats__card super-admin-stats__card--warning">
        <div className="super-admin-stats__value">{expired}</div>
        <div className="super-admin-stats__label">Просроченных</div>
      </div>
      <div className="super-admin-stats__card super-admin-stats__card--primary">
        <div className="super-admin-stats__value">{mrr.toLocaleString('ru-RU')} ₽</div>
        <div className="super-admin-stats__label">MRR</div>
      </div>
    </div>
  );
}
