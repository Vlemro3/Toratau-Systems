import { api } from './client';
import type { CpDocument, CpDocumentCreate } from '../types';

export const getDocuments = (counterpartyId?: number) =>
  api.get<CpDocument[]>(`/documents${counterpartyId ? `?counterparty_id=${counterpartyId}` : ''}`);
export const getDocument = (id: number) => api.get<CpDocument>(`/documents/${id}`);
export const createDocument = (data: CpDocumentCreate) => api.post<CpDocument>('/documents', data);
export const updateDocument = (id: number, data: Partial<CpDocumentCreate>) => api.put<CpDocument>(`/documents/${id}`, data);
export const deleteDocument = (id: number) => api.delete(`/documents/${id}`);
