/**
 * API расходов по объекту
 */
import { api } from './client';
import type { Expense, ExpenseCreate } from '../types';

export async function getExpenses(projectId?: number): Promise<Expense[]> {
  const query = projectId ? `?project_id=${projectId}` : '';
  return api.get<Expense[]>(`/expenses${query}`);
}

export async function getExpense(id: number): Promise<Expense> {
  return api.get<Expense>(`/expenses/${id}`);
}

export async function createExpense(data: ExpenseCreate): Promise<Expense> {
  return api.post<Expense>('/expenses', data);
}

export async function updateExpense(id: number, data: Partial<ExpenseCreate>): Promise<Expense> {
  return api.put<Expense>(`/expenses/${id}`, data);
}

export async function deleteExpense(id: number): Promise<void> {
  return api.delete(`/expenses/${id}`);
}
