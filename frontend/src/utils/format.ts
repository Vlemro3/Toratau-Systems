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

/** Преобразование числа в сумму прописью (рублей) */
export function numberToWords(num: number): string {
  const ones = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  const onesFem = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
  const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
  const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];

  function convertHundreds(n: number, isFem: boolean = false): string {
    if (n === 0) return '';
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const o = n % 10;
    let result = '';
    if (h > 0) result += hundreds[h] + ' ';
    if (t === 1) {
      result += teens[o] + ' ';
    } else {
      if (t > 1) result += tens[t] + ' ';
      if (o > 0) result += (isFem ? onesFem[o] : ones[o]) + ' ';
    }
    return result.trim();
  }

  const rubles = Math.floor(num);
  const kopecks = Math.round((num - rubles) * 100);

  if (rubles === 0 && kopecks === 0) return 'ноль рублей 00 копеек';

  let result = '';

  // Миллионы
  const millions = Math.floor(rubles / 1_000_000);
  if (millions > 0) {
    result += convertHundreds(millions) + ' ';
    if (millions % 10 === 1 && millions % 100 !== 11) result += 'миллион ';
    else if ([2, 3, 4].includes(millions % 10) && ![12, 13, 14].includes(millions % 100)) result += 'миллиона ';
    else result += 'миллионов ';
  }

  // Тысячи
  const thousands = Math.floor((rubles % 1_000_000) / 1_000);
  if (thousands > 0) {
    result += convertHundreds(thousands, true) + ' ';
    if (thousands % 10 === 1 && thousands % 100 !== 11) result += 'тысяча ';
    else if ([2, 3, 4].includes(thousands % 10) && ![12, 13, 14].includes(thousands % 100)) result += 'тысячи ';
    else result += 'тысяч ';
  }

  // Рубли
  const rublesPart = rubles % 1_000;
  if (rublesPart > 0) {
    result += convertHundreds(rublesPart) + ' ';
  }

  // Склонение рублей
  const rublesLast = rublesPart % 100;
  if (rublesLast % 10 === 1 && rublesLast !== 11) result += 'рубль ';
  else if ([2, 3, 4].includes(rublesLast % 10) && ![12, 13, 14].includes(rublesLast)) result += 'рубля ';
  else result += 'рублей ';

  // Копейки
  if (kopecks > 0) {
    result += kopecks.toString().padStart(2, '0') + ' ';
    if (kopecks % 10 === 1 && kopecks !== 11) result += 'копейка';
    else if ([2, 3, 4].includes(kopecks % 10) && ![12, 13, 14].includes(kopecks)) result += 'копейки';
    else result += 'копеек';
  } else {
    result += '00 копеек';
  }

  return result.trim();
}
