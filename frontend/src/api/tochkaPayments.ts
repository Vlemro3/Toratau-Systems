/**
 * API клиент для интеграции с банком Точка.
 * Работает через backend proxy: /api/tochka/*
 */
import { api } from './client';

export interface CreatePaymentRequest {
  plan_tier: string;
  plan_interval: string;
  amount: number;
  purpose?: string;
}

export interface CreatePaymentResponse {
  payment_url: string;
  payment_id: string;
  amount: number;
  status: string;
}

export interface TochkaConnectionStatus {
  connected: boolean;
  message: string;
  retailers?: unknown;
}

/** Создать платёжную ссылку для оплаты подписки */
export async function createTochkaPayment(data: CreatePaymentRequest): Promise<CreatePaymentResponse> {
  return api.post<CreatePaymentResponse>('/tochka/create-payment', data);
}

/** Проверить статус платежа */
export async function getTochkaPaymentStatus(paymentId: string): Promise<unknown> {
  return api.get<unknown>(`/tochka/payment-status/${paymentId}`);
}

/** Проверить подключение к API Точка */
export async function checkTochkaConnection(): Promise<TochkaConnectionStatus> {
  return api.get<TochkaConnectionStatus>('/tochka/check-connection');
}
