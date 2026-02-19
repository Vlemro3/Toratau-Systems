/**
 * Страница «Оплата и подписка».
 *
 * Показывает текущий статус, тарифы, историю платежей.
 * Позволяет выбрать план и оплатить (mock).
 */
import { useState, useEffect } from 'react';
import { useSubscription } from '../billing/SubscriptionContext';
import { BILLING_CONFIG, formatPrice, calcYearlySavings } from '../billing/billingConfig';
import type { BillingPlan, Invoice, PaymentLog } from '../billing/billingTypes';
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

export function BillingPage() {
  const {
    subscription, loading, paying, remainingDays,
    subscribe, refresh,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<BillingPlan>('monthly');
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
    const invoice = await subscribe(selectedPlan);
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
  const planConfig = BILLING_CONFIG.plans[selectedPlan];

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

      {/* Status card */}
      <div className="billing-status-card">
        <div className="billing-status-card__header">
          <div className="billing-status-card__badge" style={{ background: statusInfo.color }}>
            {statusInfo.label}
          </div>
          {subscription.plan && (
            <div className="billing-status-card__plan">
              Тариф: {BILLING_CONFIG.plans[subscription.plan].label}
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
            <span className="billing-status-card__value" style={{
              color: remainingDays <= 7 ? 'var(--color-danger)' : 'var(--color-text)',
            }}>
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

      {/* Tabs */}
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

      {/* Plans tab */}
      {activeTab === 'plan' && (
        <div className="billing-plans">
          <div
            className={`billing-plan-card ${selectedPlan === 'monthly' ? 'billing-plan-card--selected' : ''}`}
            onClick={() => setSelectedPlan('monthly')}
          >
            <div className="billing-plan-card__header">
              <h3>Месяц</h3>
            </div>
            <div className="billing-plan-card__price">
              {formatPrice(BILLING_CONFIG.plans.monthly.price)}
              <span className="billing-plan-card__period">/мес</span>
            </div>
            <ul className="billing-plan-card__features">
              <li>Полный доступ ко всем функциям</li>
              <li>Неограниченное кол-во объектов</li>
              <li>Неограниченное кол-во пользователей</li>
            </ul>
            <div className="billing-plan-card__radio">
              <input
                type="radio"
                name="plan"
                checked={selectedPlan === 'monthly'}
                onChange={() => setSelectedPlan('monthly')}
              />
              <label>Выбрать</label>
            </div>
          </div>

          <div
            className={`billing-plan-card ${selectedPlan === 'yearly' ? 'billing-plan-card--selected' : ''}`}
            onClick={() => setSelectedPlan('yearly')}
          >
            <div className="billing-plan-card__header">
              <h3>Год</h3>
              <span className="billing-plan-card__badge">
                Выгода {formatPrice(calcYearlySavings())}
              </span>
            </div>
            <div className="billing-plan-card__price">
              {formatPrice(BILLING_CONFIG.plans.yearly.price)}
              <span className="billing-plan-card__period">/год</span>
            </div>
            <div className="billing-plan-card__monthly-equiv">
              ≈ {formatPrice(Math.round(BILLING_CONFIG.plans.yearly.price / 12))}/мес
            </div>
            <ul className="billing-plan-card__features">
              <li>Всё из месячного тарифа</li>
              <li>Скидка {BILLING_CONFIG.plans.yearly.discountPercent}%</li>
              <li>Приоритетная поддержка</li>
            </ul>
            <div className="billing-plan-card__radio">
              <input
                type="radio"
                name="plan"
                checked={selectedPlan === 'yearly'}
                onChange={() => setSelectedPlan('yearly')}
              />
              <label>Выбрать</label>
            </div>
          </div>

          <div className="billing-summary">
            <div className="billing-summary__row">
              <span>Тариф</span>
              <span>{planConfig.label}</span>
            </div>
            <div className="billing-summary__row">
              <span>Срок</span>
              <span>{planConfig.durationDays} дней</span>
            </div>
            <div className="billing-summary__row billing-summary__row--total">
              <span>К оплате</span>
              <span>{formatPrice(planConfig.price)}</span>
            </div>
            <button
              className="btn btn--primary btn--lg billing-summary__btn"
              onClick={handleSubscribe}
              disabled={paying}
            >
              {paying ? 'Обработка оплаты...' : `Оплатить ${formatPrice(planConfig.price)}`}
            </button>
            <p className="billing-summary__note">
              Оплата будет обработана через mock-платёжную систему
            </p>
          </div>
        </div>
      )}

      {/* Invoices tab */}
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
                      <td>{BILLING_CONFIG.plans[inv.plan]?.label || inv.plan}</td>
                      <td>{formatPrice(inv.amount)}</td>
                      <td>
                        <span className={`badge badge--${inv.status === 'paid' ? 'success' : inv.status === 'failed' ? 'danger' : 'warning'}`}>
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

      {/* Logs tab */}
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
                        <span className={`badge badge--${log.status === 'paid' ? 'success' : log.status === 'failed' ? 'danger' : 'warning'}`}>
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
