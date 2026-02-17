/**
 * API записей выполненных работ
 */
import { api } from './client';
import type { WorkLog, WorkLogCreate } from '../types';

export async function getWorkLogs(projectId?: number): Promise<WorkLog[]> {
  const query = projectId ? `?project_id=${projectId}` : '';
  return api.get<WorkLog[]>(`/work-logs${query}`);
}

export async function getWorkLog(id: number): Promise<WorkLog> {
  return api.get<WorkLog>(`/work-logs/${id}`);
}

export async function createWorkLog(data: WorkLogCreate): Promise<WorkLog> {
  return api.post<WorkLog>('/work-logs', data);
}

export async function updateWorkLog(id: number, data: Partial<WorkLogCreate>): Promise<WorkLog> {
  return api.put<WorkLog>(`/work-logs/${id}`, data);
}

export async function deleteWorkLog(id: number): Promise<void> {
  return api.delete(`/work-logs/${id}`);
}

/** Подтвердить выполненную работу (только Админ) */
export async function approveWorkLog(id: number): Promise<WorkLog> {
  return api.post<WorkLog>(`/work-logs/${id}/approve`);
}

/** Отклонить выполненную работу (только Админ) */
export async function rejectWorkLog(id: number): Promise<WorkLog> {
  return api.post<WorkLog>(`/work-logs/${id}/reject`);
}

/** Загрузить фото к записи работ */
export async function uploadWorkLogPhotos(id: number, files: File[]): Promise<WorkLog> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  return api.upload<WorkLog>(`/work-logs/${id}/photos`, formData);
}
