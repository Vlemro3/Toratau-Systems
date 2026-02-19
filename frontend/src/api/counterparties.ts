import { api } from './client';
import type { Counterparty, CounterpartyCreate } from '../types';

export const getCounterparties = () => api.get<Counterparty[]>('/counterparties');
export const getCounterparty = (id: number) => api.get<Counterparty>(`/counterparties/${id}`);
export const createCounterparty = (data: CounterpartyCreate) => api.post<Counterparty>('/counterparties', data);
export const updateCounterparty = (id: number, data: Partial<CounterpartyCreate>) => api.put<Counterparty>(`/counterparties/${id}`, data);
export const deleteCounterparty = (id: number) => api.delete(`/counterparties/${id}`);
