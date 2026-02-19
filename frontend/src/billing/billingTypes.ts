/**
 * Типы модуля биллинга / подписки.
 *
 * Состояния образуют конечный автомат (state machine):
 *
 *   trial ──→ expiring ──→ expired ──→ blocked
 *                              ↑
 *     active ──→ expiring ─────┘
 *        ↑
 *   pending_payment ──(success)──→ active
 *                     (fail)──→ [предыдущее состояние]
 */

export type SubscriptionStatus =
  | 'trial'
  | 'active'
  | 'expiring'
  | 'expired'
  | 'blocked'
  | 'pending_payment';

export type BillingPlan = 'monthly' | 'yearly';

export type InvoiceStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

export interface Subscription {
  id: number;
  userId: number;
  status: SubscriptionStatus;
  plan: BillingPlan | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt: string | null;
  cancelledAt: string | null;
  blockedAt: string | null;
  blockedReason: string | null;
  /** Статус до pending_payment — для отката при неудаче */
  previousStatus: SubscriptionStatus | null;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: number;
  subscriptionId: number;
  amount: number;
  plan: BillingPlan;
  status: InvoiceStatus;
  createdAt: string;
  paidAt: string | null;
}

export interface PaymentLog {
  id: number;
  invoiceId: number;
  action: string;
  status: string;
  amount: number;
  timestamp: string;
  details: string;
}

export interface SubscribeRequest {
  plan: BillingPlan;
}

export interface SubscriptionInfo {
  subscription: Subscription;
  invoices: Invoice[];
  logs: PaymentLog[];
}

/** Статусы, при которых доступ к порталу разрешён */
export const ACCESS_ALLOWED_STATUSES: readonly SubscriptionStatus[] = [
  'trial',
  'active',
  'expiring',
  'pending_payment',
] as const;

/** Статусы, при которых показывается предупреждение */
export const WARNING_STATUSES: readonly SubscriptionStatus[] = [
  'expiring',
] as const;
