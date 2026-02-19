import { api } from './client';
import type { Organization, OrganizationCreate } from '../types';

export const getOrganizations = () => api.get<Organization[]>('/organizations');
export const getOrganization = (id: number) => api.get<Organization>(`/organizations/${id}`);
export const createOrganization = (data: OrganizationCreate) => api.post<Organization>('/organizations', data);
export const updateOrganization = (id: number, data: Partial<OrganizationCreate>) => api.put<Organization>(`/organizations/${id}`, data);
export const deleteOrganization = (id: number) => api.delete(`/organizations/${id}`);
