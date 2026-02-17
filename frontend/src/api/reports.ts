/**
 * API отчётов
 */
import { api } from './client';
import type { ProjectReport } from '../types';

/** Получить агрегированный отчёт по объекту */
export async function getProjectReport(projectId: number): Promise<ProjectReport> {
  return api.get<ProjectReport>(`/reports/project/${projectId}`);
}
