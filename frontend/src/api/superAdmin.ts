/**
 * API-клиент для модуля Super Admin.
 */
import { api } from './client';
import type { Portal, PortalCreate, PortalUpdate } from '../types';

export function getAllPortals(): Promise<Portal[]> {
  return api.get<Portal[]>('/super-admin/portals');
}

export function getPortal(id: string): Promise<Portal> {
  return api.get<Portal>(`/super-admin/portals/${id}`);
}

export function createPortal(data: PortalCreate): Promise<Portal> {
  return api.post<Portal>('/super-admin/portals', data);
}

export function updatePortal(id: string, data: PortalUpdate): Promise<Portal> {
  return api.put<Portal>(`/super-admin/portals/${id}`, data);
}

export function deletePortal(id: string): Promise<void> {
  return api.delete<void>(`/super-admin/portals/${id}`);
}

export function blockPortal(id: string): Promise<Portal> {
  return api.post<Portal>(`/super-admin/portals/${id}/block`, {});
}

export function unblockPortal(id: string): Promise<Portal> {
  return api.post<Portal>(`/super-admin/portals/${id}/unblock`, {});
}
