/**
 * API бригад
 */
import { api } from './client';
import type { Crew, CrewCreate } from '../types';

export async function getCrews(): Promise<Crew[]> {
  return api.get<Crew[]>('/crews');
}

export async function getCrew(id: number): Promise<Crew> {
  return api.get<Crew>(`/crews/${id}`);
}

export async function createCrew(data: CrewCreate): Promise<Crew> {
  return api.post<Crew>('/crews', data);
}

export async function updateCrew(id: number, data: Partial<CrewCreate>): Promise<Crew> {
  return api.put<Crew>(`/crews/${id}`, data);
}

export async function deleteCrew(id: number): Promise<void> {
  return api.delete(`/crews/${id}`);
}
