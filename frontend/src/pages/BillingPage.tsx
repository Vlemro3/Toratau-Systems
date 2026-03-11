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
import { createTochkaPayment } from '../api/tochkaPayments';

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
  const { subscription, loading, paying, remainingDays, refresh } = useSubscription();

  const [selectedTier, setSelectedTier] = useState<PlanTier>('business');
  const [selectedInterval, setSelectedInterval] = useState<BillingPlan>('yearly');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [activeTab, setActiveTab] = useState<'plan' | 'history' | 'logs'>('plan');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState('');
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  useEffect(() => {
    billingApi.getInvoices().then(setInvoices).catch(() => {});
    billingApi.getPaymentLogs().then(setLogs).catch(() => {});
  }, [subscription]);

  /** Проверить статус pending-счёта в Точке (polling fallback) */
  const handleVerifyPayment = async (invoiceId: number) => {
    setVerifyingId(invoiceId);
    setPaymentError('');
    try {
      const result = await billingApi.verifyPayment(invoiceId);
      if (result.verified) {
        setPaymentSuccess(true);
        setTimeout(() => setPaymentSuccess(false), 8000);
        await refresh();
        billingApi.getInvoices().then(setInvoices).catch(() => {});
        billingApi.getPaymentLogs().then(setLogs).catch(() => {});
      } else {
        setPaymentError(`Статус в Точке: ${result.tochkaStatus || 'неизвестен'}. Попробуйте позже.`);
      }
    } catch (e) {
      setPaymentError(e instanceof Error ? e.message : 'Ошибка проверки оплаты');
    } finally {
      setVerifyingId(null);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    if (paymentStatus === 'success') {
      const invoiceIdFromUrl = params.get('invoice');
      window.history.replaceState({}, '', window.location.pathname);
      // Auto-verify: проверить конкретный invoice (из URL) или последний pending
      billingApi.getInvoices().then((invs) => {
        setInvoices(invs);
        let target: Invoice | undefined;
        if (invoiceIdFromUrl) {
          target = invs.find((i) => String(i.id) === invoiceIdFromUrl);
        }
        if (!target) {
          // Fallback: последний pending invoice (самый новый)
          target = [...invs].reverse().find((i) => i.status === 'pending');
        }
        if (target) {
          handleVerifyPayment(target.id);
        } else {
          setPaymentSuccess(true);
          setTimeout(() => setPaymentSuccess(false), 8000);
          refresh();
        }
      }).catch(() => {
        setPaymentSuccess(true);
        setTimeout(() => setPaymentSuccess(false), 8000);
        refresh();
      });
    } else if (paymentStatus === 'fail') {
      setPaymentError('Оплата не прошла. Попробуйте ещё раз.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleSubscribe = async () => {
    setPaymentSuccess(false);
    setPaymentError('');
    setPaymentUrl(null);

    try {
      const result = await createTochkaPayment({
        plan_tier: selectedTier,
        plan_interval: selectedInterval,
        amount,
      });
      if (result.payment_url) {
        setPaymentUrl(result.payment_url);
        return;
      }
      setPaymentError('Не удалось создать ссылку на оплату');
    } catch (e) {
      setPaymentError(e instanceof Error ? e.message : 'Ошибка создания платежа');
    }
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

      {paymentError && (
        <div className="alert alert--error" style={{ marginBottom: 20 }}>
          {paymentError}
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
                  {[...invoices].reverse().map((inv) => (
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
                        {inv.status === 'pending' && (
                          <button
                            className="btn btn--sm btn--secondary"
                            style={{ marginLeft: 8 }}
                            onClick={() => handleVerifyPayment(inv.id)}
                            disabled={verifyingId !== null}
                          >
                            {verifyingId === inv.id ? 'Проверка...' : 'Проверить оплату'}
                          </button>
                        )}
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

      {/* Модальное окно с платёжной ссылкой Точка */}
      {paymentUrl && (
        <div
          onClick={() => setPaymentUrl(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, maxWidth: 480, width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.18)', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 0' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Оплата через Точка Банк</h3>
              <button type="button" onClick={() => setPaymentUrl(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8', padding: 0, lineHeight: 1 }}>&times;</button>
            </div>
            <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#64748b', fontSize: 13 }}>Тариф</span>
                  <span style={{ fontWeight: 600 }}>{BILLING_CONFIG.tiers[selectedTier].label} ({selectedInterval === 'monthly' ? 'мес.' : 'год'})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontSize: 13 }}>К оплате</span>
                  <span style={{ fontWeight: 700, fontSize: 18, color: '#16a34a' }}>{formatPrice(amount)}</span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                Вы будете перенаправлены на защищённую страницу оплаты банка Точка. Доступна оплата банковской картой, через СБП и Tinkoff Pay.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn--secondary" style={{ flex: 1 }} onClick={() => setPaymentUrl(null)}>Отмена</button>
                <a
                  href={paymentUrl}
                  className="btn btn--primary"
                  style={{ flex: 2, textAlign: 'center', textDecoration: 'none' }}
                >
                  Перейти к оплате
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
