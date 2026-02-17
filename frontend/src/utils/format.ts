/**
 * Утилиты форматирования для «Toratau Systems»
 */

/** Форматирование денежных сумм (руб) */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount) + ' руб';
}

/** Форматирование числа с разделителями */
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Форматирование даты в русском формате */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Форматирование даты и времени */
export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Дата в формате YYYY-MM-DD для input[type=date] */
export function toInputDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
}

/** Сегодняшняя дата в формате YYYY-MM-DD */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
