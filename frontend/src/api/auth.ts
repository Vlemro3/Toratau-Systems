/**
 * API авторизации
 */
import { api } from './client';
import type { LoginResponse, User } from '../types';

/** Вход в систему */
export async function login(username: string, password: string): Promise<LoginResponse> {
  return api.post<LoginResponse>('/auth/login', { username, password });
}

/** Получить текущего пользователя по токену */
export async function getMe(): Promise<User> {
  return api.get<User>('/auth/me');
}

/** Обновить профиль */
export async function updateProfile(data: { full_name: string }): Promise<User> {
  return api.put<User>('/auth/profile', data);
}

/** Сменить пароль */
export async function changePassword(data: { current_password: string; new_password: string }): Promise<void> {
  return api.post<void>('/auth/change-password', data);
}
