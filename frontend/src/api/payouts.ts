/**
 * API выплат бригадам
 */
import { api } from './client';
import type { Payout, PayoutCreate } from '../types';

export async function getPayouts(projectId?: number): Promise<Payout[]> {
  const query = projectId ? `?project_id=${projectId}` : '';
  return api.get<Payout[]>(`/payouts${query}`);
}

export async function getPayout(id: number): Promise<Payout> {
  return api.get<Payout>(`/payouts/${id}`);
}

export async function createPayout(data: PayoutCreate): Promise<Payout> {
  return api.post<Payout>('/payouts', data);
}

export async function updatePayout(id: number, data: Partial<PayoutCreate>): Promise<Payout> {
  return api.put<Payout>(`/payouts/${id}`, data);
}

export async function deletePayout(id: number): Promise<void> {
  return api.delete(`/payouts/${id}`);
}

/** Подтвердить выплату (только Админ) */
export async function approvePayout(id: number): Promise<Payout> {
  return api.post<Payout>(`/payouts/${id}/approve`);
}

/** Отменить выплату */
export async function cancelPayout(id: number): Promise<Payout> {
  return api.post<Payout>(`/payouts/${id}/cancel`);
}
