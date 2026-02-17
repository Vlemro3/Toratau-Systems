/**
 * API объектов (проектов)
 */
import { api } from './client';
import type { Project, ProjectCreate } from '../types';

export async function getProjects(): Promise<Project[]> {
  return api.get<Project[]>('/projects');
}

export async function getProject(id: number): Promise<Project> {
  return api.get<Project>(`/projects/${id}`);
}

export async function createProject(data: ProjectCreate): Promise<Project> {
  return api.post<Project>('/projects', data);
}

export async function updateProject(id: number, data: Partial<ProjectCreate>): Promise<Project> {
  return api.put<Project>(`/projects/${id}`, data);
}

export async function deleteProject(id: number): Promise<void> {
  return api.delete(`/projects/${id}`);
}
