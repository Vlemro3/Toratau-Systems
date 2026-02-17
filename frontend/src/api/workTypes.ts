/**
 * API справочника видов работ
 */
import { api } from './client';
import type { WorkType, WorkTypeCreate } from '../types';

export async function getWorkTypes(): Promise<WorkType[]> {
  return api.get<WorkType[]>('/work-types');
}

export async function getWorkType(id: number): Promise<WorkType> {
  return api.get<WorkType>(`/work-types/${id}`);
}

export async function createWorkType(data: WorkTypeCreate): Promise<WorkType> {
  return api.post<WorkType>('/work-types', data);
}

export async function updateWorkType(id: number, data: Partial<WorkTypeCreate>): Promise<WorkType> {
  return api.put<WorkType>(`/work-types/${id}`, data);
}

export async function deleteWorkType(id: number): Promise<void> {
  return api.delete(`/work-types/${id}`);
}
