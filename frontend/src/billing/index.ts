/**
 * Публичный API модуля биллинга.
 *
 * Архитектура:
 *
 *   billingConfig.ts        — Тарифы, цены, конфигурация (константы)
 *   billingTypes.ts         — TypeScript-типы: Subscription, Invoice, PaymentLog
 *   subscriptionMachine.ts  — Чистая бизнес-логика: state machine, переходы, проверки
 *   paymentService.ts       — Mock-платёжный адаптер (заменяется на реальный шлюз)
 *   SubscriptionContext.tsx  — React-контекст: загрузка, кеш, действия
 *   SubscriptionGuard.tsx   — Guard: блокировка UI при expired/blocked
 *
 * Расширение:
 *   Для подключения реального платёжного шлюза реализуйте PaymentAdapter
 *   из paymentService.ts и передайте в конструктор PaymentService.
 */
export {
  BILLING_CONFIG, formatPrice, calcYearlySavings,
  getObjectLimit, canAddProject, getTierPriceMonthly, getInvoiceAmount,
} from './billingConfig';
export type { TariffTierConfig } from './billingConfig';

export type {
  SubscriptionStatus, BillingPlan, PlanTier, InvoiceStatus,
  Subscription, Invoice, PaymentLog, SubscribeRequest, SubscriptionInfo,
} from './billingTypes';
export { ACCESS_ALLOWED_STATUSES, WARNING_STATUSES } from './billingTypes';

export {
  createTrialSubscription, checkAndTransition, transition,
  getRemainingDays, isAccessAllowed, shouldShowWarning,
} from './subscriptionMachine';
export type { SubscriptionEvent } from './subscriptionMachine';

export { PaymentService, MockPaymentAdapter } from './paymentService';
export type { PaymentAdapter } from './paymentService';

export { SubscriptionProvider, useSubscription } from './SubscriptionContext';
export { SubscriptionGuard } from './SubscriptionGuard';
