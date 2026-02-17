/**
 * Словари и константы приложения
 */
import type { ProjectStatus, WorkLogStatus, PayoutStatus, ExpenseCategory, PaymentMethod } from '../types';

/** Названия статусов объекта */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  paused: 'Пауза',
  completed: 'Завершён',
  archived: 'Архив',
};

/** Цвета статусов объекта */
export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  new: '#3b82f6',
  in_progress: '#16a34a',
  paused: '#eab308',
  completed: '#6b7280',
  archived: '#9ca3af',
};

/** Названия статусов записи работ */
export const WORKLOG_STATUS_LABELS: Record<WorkLogStatus, string> = {
  draft: 'Черновик',
  pending: 'На подтверждении',
  approved: 'Подтверждено',
  rejected: 'Отклонено',
};

export const WORKLOG_STATUS_COLORS: Record<WorkLogStatus, string> = {
  draft: '#9ca3af',
  pending: '#eab308',
  approved: '#16a34a',
  rejected: '#dc2626',
};

/** Названия статусов выплаты */
export const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  created: 'Создано',
  approved: 'Подтверждено',
  cancelled: 'Отменено',
};

export const PAYOUT_STATUS_COLORS: Record<PayoutStatus, string> = {
  created: '#eab308',
  approved: '#16a34a',
  cancelled: '#dc2626',
};

/** Категории расходов */
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  materials: 'Материалы',
  tools: 'Инструмент',
  transport: 'Транспорт',
  other: 'Прочее',
};

/** Способы оплаты */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Наличные',
  transfer: 'Перевод',
};

/** Единицы измерения для быстрого выбора */
export const COMMON_UNITS = ['м²', 'м.п.', 'шт', 'день', 'час', 'м³', 'комплект'];

/** Категории работ */
export const WORK_CATEGORIES = [
  'Общестроительные',
  'Отделочные',
  'Электромонтаж',
  'Сантехника',
  'Кровельные',
  'Прочие',
];

/** Роли пользователей */
export const ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор',
  foreman: 'Прораб',
};
