/**
 * API входящих платежей от заказчика
 */
import { api } from './client';
import type { CashIn, CashInCreate } from '../types';

export async function getCashIns(projectId?: number): Promise<CashIn[]> {
  const query = projectId ? `?project_id=${projectId}` : '';
  return api.get<CashIn[]>(`/cashin${query}`);
}

export async function getCashIn(id: number): Promise<CashIn> {
  return api.get<CashIn>(`/cashin/${id}`);
}

export async function createCashIn(data: CashInCreate): Promise<CashIn> {
  return api.post<CashIn>('/cashin', data);
}

export async function updateCashIn(id: number, data: Partial<CashInCreate>): Promise<CashIn> {
  return api.put<CashIn>(`/cashin/${id}`, data);
}

export async function deleteCashIn(id: number): Promise<void> {
  return api.delete(`/cashin/${id}`);
}
