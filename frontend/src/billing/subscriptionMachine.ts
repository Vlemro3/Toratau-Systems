/**
 * Конечный автомат (state machine) подписки.
 *
 * Чистые функции, не зависящие от React/DOM — ядро бизнес-логики.
 * Каждый переход явно определён: из какого состояния, какое событие,
 * в какое состояние, и какая мутация данных выполняется.
 *
 * Позволяет тестировать логику изолированно от UI.
 */
import type { Subscription, SubscriptionStatus, BillingPlan } from './billingTypes';
import { BILLING_CONFIG } from './billingConfig';

export type SubscriptionEvent =
  | { type: 'REGISTER'; userId: number }
  | { type: 'CHECK_EXPIRY' }
  | { type: 'PAYMENT_INITIATED'; plan: BillingPlan }
  | { type: 'PAYMENT_SUCCESS'; plan: BillingPlan }
  | { type: 'PAYMENT_FAILED' }
  | { type: 'ADMIN_BLOCK'; reason: string }
  | { type: 'ADMIN_UNBLOCK' };

function isoNow(): string {
  return new Date().toISOString();
}

function addDays(date: string | Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

/**
 * Создание начальной подписки при регистрации.
 * Всегда начинается с trial.
 */
export function createTrialSubscription(userId: number, id: number): Subscription {
  const now = isoNow();
  const trialEnd = addDays(now, BILLING_CONFIG.trial.durationDays);

  return {
    id,
    userId,
    status: 'trial',
    plan: null,
    currentPeriodStart: now,
    currentPeriodEnd: trialEnd,
    trialEndsAt: trialEnd,
    cancelledAt: null,
    blockedAt: null,
    blockedReason: null,
    previousStatus: null,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Проверка: нужно ли перевести подписку в EXPIRING или EXPIRED.
 * Вызывается при каждой загрузке страницы (аналог cron).
 */
export function checkAndTransition(sub: Subscription): Subscription {
  const remaining = daysUntil(sub.currentPeriodEnd);

  if (sub.status === 'trial' || sub.status === 'active') {
    if (remaining <= 0) {
      return {
        ...sub,
        status: 'expired',
        updatedAt: isoNow(),
      };
    }
    if (remaining <= BILLING_CONFIG.expiringThresholdDays) {
      return {
        ...sub,
        status: 'expiring',
        updatedAt: isoNow(),
      };
    }
  }

  if (sub.status === 'expiring') {
    if (remaining <= 0) {
      return {
        ...sub,
        status: 'expired',
        updatedAt: isoNow(),
      };
    }
  }

  return sub;
}

/**
 * Основная функция перехода состояний.
 * Возвращает новую подписку или null, если переход невозможен.
 */
export function transition(
  sub: Subscription,
  event: SubscriptionEvent
): Subscription | null {
  const now = isoNow();

  switch (event.type) {
    case 'REGISTER':
      return createTrialSubscription(event.userId, sub.id);

    case 'CHECK_EXPIRY':
      return checkAndTransition(sub);

    case 'PAYMENT_INITIATED': {
      const canInitiate: SubscriptionStatus[] = [
        'trial', 'active', 'expiring', 'expired', 'blocked',
      ];
      if (!canInitiate.includes(sub.status)) return null;

      return {
        ...sub,
        status: 'pending_payment',
        previousStatus: sub.status,
        updatedAt: now,
      };
    }

    case 'PAYMENT_SUCCESS': {
      const canSucceed: SubscriptionStatus[] = [
        'pending_payment', 'expired', 'blocked', 'trial', 'expiring',
      ];
      if (!canSucceed.includes(sub.status)) return null;

      const planConfig = BILLING_CONFIG.plans[event.plan];
      const periodStart = now;
      /**
       * Если подписка ещё активна (expiring / trial) — продлеваем от конца текущего периода,
       * а не от текущего момента, чтобы не «срезать» оплаченные дни.
       */
      const extendFrom =
        (sub.status === 'expiring' || sub.status === 'trial') &&
        daysUntil(sub.currentPeriodEnd) > 0
          ? sub.currentPeriodEnd
          : periodStart;
      const periodEnd = addDays(extendFrom, planConfig.durationDays);

      return {
        ...sub,
        status: 'active',
        plan: event.plan,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        trialEndsAt: sub.trialEndsAt,
        blockedAt: null,
        blockedReason: null,
        previousStatus: null,
        updatedAt: now,
      };
    }

    case 'PAYMENT_FAILED': {
      if (sub.status !== 'pending_payment') return null;

      return {
        ...sub,
        status: sub.previousStatus || 'expired',
        previousStatus: null,
        updatedAt: now,
      };
    }

    case 'ADMIN_BLOCK': {
      return {
        ...sub,
        status: 'blocked',
        blockedAt: now,
        blockedReason: event.reason,
        previousStatus: sub.status,
        updatedAt: now,
      };
    }

    case 'ADMIN_UNBLOCK': {
      if (sub.status !== 'blocked') return null;

      const restored = sub.previousStatus || 'expired';
      const unblocked: Subscription = {
        ...sub,
        status: restored,
        blockedAt: null,
        blockedReason: null,
        previousStatus: null,
        updatedAt: now,
      };
      return checkAndTransition(unblocked);
    }

    default:
      return null;
  }
}

/** Утилита: сколько дней осталось до конца периода */
export function getRemainingDays(sub: Subscription): number {
  return daysUntil(sub.currentPeriodEnd);
}

/** Проверка: разрешён ли доступ к порталу */
export function isAccessAllowed(sub: Subscription): boolean {
  const allowed: SubscriptionStatus[] = [
    'trial', 'active', 'expiring', 'pending_payment',
  ];
  return allowed.includes(sub.status);
}

/** Проверка: нужно ли показывать предупреждение */
export function shouldShowWarning(sub: Subscription): boolean {
  return sub.status === 'expiring';
}
