/**
 * Централизованная конфигурация тарифов и параметров подписки.
 */
import type { PlanTier, BillingPlan } from './billingTypes';
import type { Subscription } from './billingTypes';

export interface TariffTierConfig {
  readonly label: string;
  readonly priceMonthly: number;
  /** null = без ограничений */
  readonly objectLimit: number | null;
  readonly highlighted?: boolean;
}

export const BILLING_CONFIG = {
  trial: {
    durationDays: 14,
  },

  /** Тарифные уровни: лимит объектов и цена за месяц */
  tiers: {
    start: {
      label: 'Start',
      priceMonthly: 1_500,
      objectLimit: 3,
      highlighted: false,
    },
    business: {
      label: 'Business',
      priceMonthly: 3_000,
      objectLimit: 6,
      highlighted: true,
    },
    premium: {
      label: 'Premium',
      priceMonthly: 5_000,
      objectLimit: 10,
      highlighted: false,
    },
    unlim: {
      label: 'Unlim',
      priceMonthly: 10_000,
      objectLimit: null,
      highlighted: false,
    },
  } as Record<PlanTier, TariffTierConfig>,

  /** Скидка при оплате за год (0.1 = 10%) */
  yearlyDiscountPercent: 10,

  expiringThresholdDays: 7,
  currency: '₽',
} as const;

/**
 * Лимит объектов по подписке. null = без ограничений.
 */
export function getObjectLimit(subscription: Subscription | null): number | null {
  if (!subscription?.planTier) return null;
  return BILLING_CONFIG.tiers[subscription.planTier].objectLimit;
}

/**
 * Проверка: можно ли создать ещё один объект.
 */
export function canAddProject(subscription: Subscription | null, currentProjectCount: number): boolean {
  const limit = getObjectLimit(subscription);
  if (limit === null) return true;
  return currentProjectCount < limit;
}

export function formatPrice(amount: number): string {
  return amount.toLocaleString('ru-RU') + ' ' + BILLING_CONFIG.currency;
}

/**
 * Цена за месяц при выборе тарифа и интервала.
 */
export function getTierPriceMonthly(planTier: PlanTier): number {
  return BILLING_CONFIG.tiers[planTier].priceMonthly;
}

/**
 * Сумма к оплате: за месяц или за год со скидкой.
 */
export function getInvoiceAmount(planTier: PlanTier, planInterval: BillingPlan): number {
  const monthly = BILLING_CONFIG.tiers[planTier].priceMonthly;
  if (planInterval === 'monthly') return monthly;
  const yearly = monthly * 12 * (1 - BILLING_CONFIG.yearlyDiscountPercent / 100);
  return Math.round(yearly);
}

/**
 * Экономия при оплате за год (в рублях).
 */
export function calcYearlySavings(planTier: PlanTier): number {
  const monthly = BILLING_CONFIG.tiers[planTier].priceMonthly;
  return monthly * 12 - getInvoiceAmount(planTier, 'yearly');
}
