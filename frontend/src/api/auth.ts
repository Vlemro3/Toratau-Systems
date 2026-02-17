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
