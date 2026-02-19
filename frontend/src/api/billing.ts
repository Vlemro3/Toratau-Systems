/**
 * API-клиент для модуля биллинга.
 */
import { api } from './client';
import type { Subscription, Invoice, PaymentLog, BillingPlan } from '../billing/billingTypes';

export function getSubscription(): Promise<Subscription> {
  return api.get<Subscription>('/billing/subscription');
}

export function getPortalSubscription(): Promise<Subscription> {
  return api.get<Subscription>('/billing/portal-subscription');
}

export function subscribe(plan: BillingPlan): Promise<{ subscription: Subscription; invoice: Invoice }> {
  return api.post<{ subscription: Subscription; invoice: Invoice }>('/billing/subscribe', { plan });
}

export function simulatePaymentSuccess(invoiceId: number): Promise<{ subscription: Subscription; invoice: Invoice }> {
  return api.post<{ subscription: Subscription; invoice: Invoice }>('/billing/simulate-payment-success', { invoiceId });
}

export function simulatePaymentFail(invoiceId: number): Promise<{ subscription: Subscription; invoice: Invoice }> {
  return api.post<{ subscription: Subscription; invoice: Invoice }>('/billing/simulate-payment-fail', { invoiceId });
}

export function adminBlock(userId: number, reason: string): Promise<Subscription> {
  return api.post<Subscription>('/billing/block', { userId, reason });
}

export function getInvoices(): Promise<Invoice[]> {
  return api.get<Invoice[]>('/billing/invoices');
}

export function getPaymentLogs(): Promise<PaymentLog[]> {
  return api.get<PaymentLog[]>('/billing/logs');
}
