/**
 * Централизованная конфигурация тарифов и параметров подписки.
 *
 * Все цены, сроки и пороги вынесены сюда, чтобы при подключении
 * реального платёжного шлюза менять только этот файл.
 */
import type { BillingPlan } from './billingTypes';

export interface PlanConfig {
  readonly label: string;
  readonly price: number;
  readonly durationDays: number;
  readonly discountPercent: number;
}

export const BILLING_CONFIG = {
  trial: {
    durationDays: 14,
  },

  plans: {
    monthly: {
      label: 'Месяц',
      price: 5_000,
      durationDays: 30,
      discountPercent: 0,
    },
    yearly: {
      label: 'Год',
      price: 54_000,
      durationDays: 365,
      discountPercent: 10,
    },
  } as Record<BillingPlan, PlanConfig>,

  /** За сколько дней до окончания показывать предупреждение */
  expiringThresholdDays: 7,

  /** Валюта для отображения */
  currency: '₽',

  /** Базовая месячная цена (для расчёта скидки в UI) */
  baseMonthlyPrice: 5_000,
} as const;

/**
 * Форматирование суммы в рублях: 5 000 ₽
 */
export function formatPrice(amount: number): string {
  return amount.toLocaleString('ru-RU') + ' ' + BILLING_CONFIG.currency;
}

/**
 * Расчёт экономии при годовом плане по сравнению с помесячной оплатой
 */
export function calcYearlySavings(): number {
  const monthlyTotal = BILLING_CONFIG.plans.monthly.price * 12;
  return monthlyTotal - BILLING_CONFIG.plans.yearly.price;
}
