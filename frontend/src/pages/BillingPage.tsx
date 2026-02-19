/**
 * Страница «Оплата и подписка».
 * Тарифы: Start, Business, Premium, Unlim. Интервал: месяц / год (скидка 10%).
 */
import { useState, useEffect } from 'react';
import { useSubscription } from '../billing/SubscriptionContext';
import {
  BILLING_CONFIG,
  formatPrice,
  getInvoiceAmount,
  calcYearlySavings,
  getObjectLimit,
} from '../billing/billingConfig';
import type { PlanTier, BillingPlan, Invoice, PaymentLog } from '../billing/billingTypes';
import * as billingApi from '../api/billing';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  trial: { label: 'Пробный период', color: 'var(--color-primary)' },
  active: { label: 'Активна', color: 'var(--color-success)' },
  expiring: { label: 'Скоро закончится', color: 'var(--color-warning)' },
  expired: { label: 'Истекла', color: 'var(--color-danger)' },
  blocked: { label: 'Заблокирована', color: 'var(--color-danger)' },
  pending_payment: { label: 'Ожидание оплаты', color: 'var(--color-warning)' },
};

const INVOICE_STATUS: Record<string, string> = {
  pending: 'Ожидает',
  paid: 'Оплачен',
  failed: 'Отклонён',
  cancelled: 'Отменён',
};

const TIER_ORDER: PlanTier[] = ['start', 'business', 'premium', 'unlim'];

function formatObjectLimit(limit: number | null): string {
  if (limit === null) return 'Объектов без ограничений';
  return `До ${limit} объектов`;
}

export function BillingPage() {
  const { subscription, loading, paying, remainingDays, subscribe, refresh } = useSubscription();

  const [selectedTier, setSelectedTier] = useState<PlanTier>('business');
  const [selectedInterval, setSelectedInterval] = useState<BillingPlan>('monthly');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [activeTab, setActiveTab] = useState<'plan' | 'history' | 'logs'>('plan');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    billingApi.getInvoices().then(setInvoices).catch(() => {});
    billingApi.getPaymentLogs().then(setLogs).catch(() => {});
  }, [subscription]);

  const handleSubscribe = async () => {
    setPaymentSuccess(false);
    const invoice = await subscribe(selectedTier, selectedInterval);
    if (invoice && invoice.status === 'paid') {
      setPaymentSuccess(true);
      setTimeout(() => setPaymentSuccess(false), 5000);
    }
    await refresh();
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="page">
        <div className="alert alert--error">Не удалось загрузить данные подписки</div>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[subscription.status] || { label: subscription.status, color: '#666' };
  const periodEnd = new Date(subscription.currentPeriodEnd).toLocaleDateString('ru-RU');
  const currentTierLabel = subscription.planTier ? BILLING_CONFIG.tiers[subscription.planTier].label : null;
  const currentLimit = getObjectLimit(subscription);
  const amount = getInvoiceAmount(selectedTier, selectedInterval);
  const isYearly = selectedInterval === 'yearly';
  const savings = isYearly ? calcYearlySavings(selectedTier) : 0;

  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">Оплата и подписка</h2>
      </div>

      {paymentSuccess && (
        <div className="alert alert--success" style={{ marginBottom: 20 }}>
          Оплата прошла успешно! Подписка активирована.
        </div>
      )}

      <div className="billing-status-card">
        <div className="billing-status-card__header">
          <div className="billing-status-card__badge" style={{ background: statusInfo.color }}>
            {statusInfo.label}
          </div>
          {currentTierLabel && (
            <div className="billing-status-card__plan">
              Тариф: {currentTierLabel} · {currentLimit === null ? 'без ограничений' : `до ${currentLimit} объектов`}
            </div>
          )}
        </div>
        <div className="billing-status-card__details">
          <div className="billing-status-card__item">
            <span className="billing-status-card__label">Действует до</span>
            <span className="billing-status-card__value">{periodEnd}</span>
          </div>
          <div className="billing-status-card__item">
            <span className="billing-status-card__label">Осталось дней</span>
            <span
              className="billing-status-card__value"
              style={{
                color: remainingDays <= 7 ? 'var(--color-danger)' : 'var(--color-text)',
              }}
            >
              {Math.max(0, remainingDays)}
            </span>
          </div>
          {subscription.status === 'blocked' && subscription.blockedReason && (
            <div className="billing-status-card__item">
              <span className="billing-status-card__label">Причина блокировки</span>
              <span className="billing-status-card__value" style={{ color: 'var(--color-danger)' }}>
                {subscription.blockedReason}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="billing-tabs">
        <button
          className={`billing-tabs__tab ${activeTab === 'plan' ? 'billing-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('plan')}
        >
          Тарифы
        </button>
        <button
          className={`billing-tabs__tab ${activeTab === 'history' ? 'billing-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          История платежей
        </button>
        <button
          className={`billing-tabs__tab ${activeTab === 'logs' ? 'billing-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          Журнал операций
        </button>
      </div>

      {activeTab === 'plan' && (
        <div className="billing-plans">
          {TIER_ORDER.map((tier) => {
            const config = BILLING_CONFIG.tiers[tier];
            const isSelected = selectedTier === tier;
            return (
              <div
                key={tier}
                className={`billing-plan-card ${isSelected ? 'billing-plan-card--selected' : ''} ${config.highlighted ? 'billing-plan-card--highlight' : ''}`}
                onClick={() => setSelectedTier(tier)}
              >
                <div className="billing-plan-card__header">
                  <h3>{config.label}</h3>
                  {config.highlighted && (
                    <span className="billing-plan-card__badge">Популярный выбор</span>
                  )}
                </div>
                <div className="billing-plan-card__price">
                  {formatPrice(config.priceMonthly)}
                  <span className="billing-plan-card__period">/мес</span>
                </div>
                <p className="billing-plan-card__limit">{formatObjectLimit(config.objectLimit)}</p>
                <ul className="billing-plan-card__features">
                  <li>Полный доступ к функциям портала</li>
                  <li>Стоимость за всю компанию</li>
                </ul>
                <div className="billing-plan-card__radio">
                  <input
                    type="radio"
                    name="tier"
                    checked={isSelected}
                    onChange={() => setSelectedTier(tier)}
                  />
                  <label>Выбрать</label>
                </div>
              </div>
            );
          })}

          <div className="billing-interval" style={{ gridColumn: '1 / -1', marginTop: 8 }}>
            <label style={{ marginRight: 16 }}>
              <input
                type="radio"
                name="interval"
                checked={selectedInterval === 'monthly'}
                onChange={() => setSelectedInterval('monthly')}
              />
              Оплата помесячно
            </label>
            <label>
              <input
                type="radio"
                name="interval"
                checked={selectedInterval === 'yearly'}
                onChange={() => setSelectedInterval('yearly')}
              />
              Оплата за год (скидка {BILLING_CONFIG.yearlyDiscountPercent}%)
            </label>
          </div>

          <div className="billing-summary">
            <div className="billing-summary__row">
              <span>Тариф</span>
              <span>{BILLING_CONFIG.tiers[selectedTier].label}</span>
            </div>
            <div className="billing-summary__row">
              <span>Объектов</span>
              <span>{formatObjectLimit(BILLING_CONFIG.tiers[selectedTier].objectLimit)}</span>
            </div>
            <div className="billing-summary__row">
              <span>Период</span>
              <span>{selectedInterval === 'monthly' ? '1 месяц' : '12 месяцев'}</span>
            </div>
            {isYearly && savings > 0 && (
              <div className="billing-summary__row" style={{ color: 'var(--color-success)' }}>
                <span>Выгода за год</span>
                <span>{formatPrice(savings)}</span>
              </div>
            )}
            <div className="billing-summary__row billing-summary__row--total">
              <span>К оплате</span>
              <span>{formatPrice(amount)}</span>
            </div>
            <button
              className="btn btn--primary btn--lg billing-summary__btn"
              onClick={handleSubscribe}
              disabled={paying}
            >
              {paying ? 'Обработка оплаты...' : `Оплатить ${formatPrice(amount)}`}
            </button>
            <p className="billing-summary__note">
              Стоимость указана за месяц использования портала. При оплате за год — скидка 10%.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <div className="card__body">
            {invoices.length === 0 ? (
              <p className="text-muted" style={{ textAlign: 'center', padding: 32 }}>
                Платежей пока нет
              </p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>№</th>
                    <th>Дата</th>
                    <th>Тариф</th>
                    <th>Сумма</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>#{inv.id}</td>
                      <td>{new Date(inv.createdAt).toLocaleDateString('ru-RU')}</td>
                      <td>{BILLING_CONFIG.tiers[inv.planTier]?.label ?? inv.planTier}</td>
                      <td>{formatPrice(inv.amount)}</td>
                      <td>
                        <span
                          className={`badge badge--${inv.status === 'paid' ? 'success' : inv.status === 'failed' ? 'danger' : 'warning'}`}
                        >
                          {INVOICE_STATUS[inv.status] || inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="card">
          <div className="card__body">
            {logs.length === 0 ? (
              <p className="text-muted" style={{ textAlign: 'center', padding: 32 }}>
                Операций пока нет
              </p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Время</th>
                    <th>Действие</th>
                    <th>Статус</th>
                    <th>Сумма</th>
                    <th>Детали</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice().reverse().map((log) => (
                    <tr key={log.id}>
                      <td>{new Date(log.timestamp).toLocaleString('ru-RU')}</td>
                      <td>{log.action}</td>
                      <td>
                        <span
                          className={`badge badge--${log.status === 'paid' ? 'success' : log.status === 'failed' ? 'danger' : 'warning'}`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td>{formatPrice(log.amount)}</td>
                      <td className="text-muted">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
