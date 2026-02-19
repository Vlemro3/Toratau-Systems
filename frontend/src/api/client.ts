/**
 * HTTP-клиент для взаимодействия с бэкендом.
 * Автоматически подставляет JWT-токен и обрабатывает ошибки.
 *
 * Если VITE_MOCK=true — все запросы обрабатываются локальным мок-хранилищем.
 */
import { handleMockRequest } from './mockStore';

const BASE_URL = import.meta.env.VITE_API_URL || '';
const USE_MOCK = import.meta.env.VITE_MOCK === 'true';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  /** Основной метод запроса */
  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const method = options.method || 'GET';

    /* --- Мок-режим: обработка без сервера --- */
    if (USE_MOCK) {
      try {
        const body = typeof options.body === 'string' ? options.body : null;
        const result = await handleMockRequest(method, path, body);
        return result as T;
      } catch (err) {
        throw err instanceof Error ? err : new Error(String(err));
      }
    }

    /* --- Реальный запрос к бэкенду --- */
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login - don't throw error as redirect handles it
      window.location.href = '/login';
      return Promise.reject(new Error('Сессия истекла'));
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Ошибка сервера' }));
      throw new Error(err.detail || `Ошибка ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  post<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(path: string, data: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  patch<T>(path: string, data: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  /** Загрузка файлов (FormData) */
  upload<T>(path: string, formData: FormData): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: formData,
    });
  }
}

export const api = new ApiClient();
