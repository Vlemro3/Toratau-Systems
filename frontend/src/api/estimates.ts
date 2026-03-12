/**
 * API модуля «Смета».
 * Чтение файлов/проверка/ЛСР/сравнение через бэкенд.
 * Локальное хранение смет — localStorage (бэкенд не хранит сущности смет).
 */

import { api } from './client';

/* ---- Типы ---- */

export type EstimateBaseType = 'FER' | 'TER' | 'GESN';
export type EstimateStatus = 'draft' | 'parsed' | 'checked' | 'lsr_ready' | 'compared';
export type ErrorSeverity = 'arithmetic' | 'wrong_norm' | 'wrong_unit' | 'overpriced' | 'suspicious_coeff';
export type RiskLevel = 'low' | 'medium' | 'high';
export type CalcStrategy = 'standard' | 'aggressive' | 'conservative' | 'custom';

export interface EstimatePosition {
  id: number;
  num: string;
  normCode: string;
  name: string;
  unit: string;
  volume: number;
  price: number;
  total: number;
  overhead: number;
  profit: number;
  /** Поправочные коэффициенты */
  adjustmentCoeff?: string;
  /** Коэффициенты пересчёта, номер */
  recalcCoeffNumber?: string;
  /** ЗТР, всего чел-ч */
  laborPersonHours?: number;
  /** Стоим. ед. с нач., руб. */
  costPerUnitFromStart?: number;
}

export interface EstimateError {
  positionNum: string;
  type: ErrorSeverity;
  description: string;
  recommendation: string;
}

export interface CheckResult {
  totalSum: number;
  marketEstimate: number;
  potentialOverprice: number;
  potentialOverpricePct: number;
  errorsCount: number;
  riskLevel: RiskLevel;
  errors: EstimateError[];
}

export interface LSRPosition {
  id: number;
  num: string;
  name: string;
  unit: string;
  volume: number;
  materials: number;
  labor: number;
  machines: number;
  directCost: number;
  overhead: number;
  profit: number;
  total: number;
}

export interface LSRResult {
  positions: LSRPosition[];
  totalDirect: number;
  totalMaterials: number;
  totalLabor: number;
  totalMachines: number;
  totalOverhead: number;
  totalProfit: number;
  grandTotal: number;
}

export interface CompareRow {
  num: string;
  name: string;
  customerSum: number;
  ourSum: number;
  diffRub: number;
  diffPct: number;
}

export interface CompareResult {
  rows: CompareRow[];
  totalCustomer: number;
  totalOur: number;
  totalDiff: number;
  marginality: number;
  possibleProfit: number;
  /** Процент разницы по итогу (для строки ИТОГО), пересчитывается из сумм */
  totalDiffPct?: number;
}

/** Пересчитать итоги и возможную прибыль из строк, чтобы избежать ошибок расчёта с бэкенда */
export function normalizeCompareResult(c: CompareResult): CompareResult {
  const totalCustomer = c.rows.reduce((s, r) => s + r.customerSum, 0);
  const totalOur = c.rows.reduce((s, r) => s + r.ourSum, 0);
  const totalDiff = totalCustomer - totalOur;
  const possibleProfit = totalDiff;
  const marginality = totalCustomer > 0 ? Math.round((totalDiff / totalCustomer) * 100) : 0;
  const totalDiffPct = totalCustomer > 0 ? Math.round((totalDiff / totalCustomer) * 100) : 0;
  const rows = c.rows.map((r) => ({
    ...r,
    diffRub: r.customerSum - r.ourSum,
    diffPct: r.customerSum > 0 ? Math.round(((r.customerSum - r.ourSum) / r.customerSum) * 100) : 0,
  }));
  return { ...c, rows, totalCustomer, totalOur, totalDiff, possibleProfit, marginality, totalDiffPct };
}

export interface Estimate {
  id: number;
  name: string;
  region: string;
  baseType: EstimateBaseType;
  fileName: string;
  status: EstimateStatus;
  createdAt: string;
  positions: EstimatePosition[];
  checkResult: CheckResult | null;
  lsr: LSRResult | null;
  compare: CompareResult | null;
  strategy: CalcStrategy;
  /** Исходный загруженный файл (base64) для кнопки «Скачать смету» */
  fileContentBase64?: string;
}

export interface EstimateCreate {
  name: string;
  region: string;
  baseType: EstimateBaseType;
  fileName: string;
}

export interface EstimateSettings {
  regionCoefficients: Record<string, number>;
  overheadPct: number;
  profitPct: number;
  strategy: CalcStrategy;
  customMarginPct: number;
}

/* ---- Демо-данные ---- */

const DEMO_POSITIONS: EstimatePosition[] = [
  { id: 1, num: '1', normCode: 'ФЕР 07-01-001-01', name: 'Устройство бетонных фундаментов', unit: 'м³', volume: 120, price: 4500, total: 540000, overhead: 54000, profit: 43200 },
  { id: 2, num: '2', normCode: 'ФЕР 08-02-001-01', name: 'Кладка стен из кирпича', unit: 'м³', volume: 85, price: 6200, total: 527000, overhead: 52700, profit: 42160 },
  { id: 3, num: '3', normCode: 'ФЕР 11-01-001-01', name: 'Устройство полов из бетона', unit: 'м²', volume: 450, price: 1800, total: 810000, overhead: 81000, profit: 64800 },
  { id: 4, num: '4', normCode: 'ФЕР 12-01-002-03', name: 'Устройство кровли из металлочерепицы', unit: 'м²', volume: 380, price: 2400, total: 912000, overhead: 91200, profit: 72960 },
  { id: 5, num: '5', normCode: 'ФЕР 15-02-001-01', name: 'Штукатурка стен', unit: 'м²', volume: 1200, price: 850, total: 1020000, overhead: 102000, profit: 81600 },
  { id: 6, num: '6', normCode: 'ФЕР 15-04-001-03', name: 'Окраска поверхностей', unit: 'м²', volume: 1200, price: 420, total: 504000, overhead: 50400, profit: 40320 },
  { id: 7, num: '7', normCode: 'ФЕР 10-01-003-01', name: 'Монтаж металлоконструкций', unit: 'т', volume: 12, price: 28000, total: 336000, overhead: 33600, profit: 26880 },
  { id: 8, num: '8', normCode: 'ФЕР 16-01-001-01', name: 'Устройство электропроводки', unit: 'м', volume: 2500, price: 320, total: 800000, overhead: 80000, profit: 64000 },
];

const DEMO_ERRORS: EstimateError[] = [
  { positionNum: '1', type: 'overpriced', description: 'Расценка на 18% выше рыночной (3 810 ₽/м³)', recommendation: 'Уточнить у заказчика или скорректировать до рыночного уровня' },
  { positionNum: '3', type: 'arithmetic', description: 'Итого не совпадает: 450 × 1800 = 810 000, указано 810 000 — ОК. Ошибка в НР: 10% от 810 000 = 81 000, указано 81 000 — ОК. СП: 8% = 64 800, указано 64 800 — ОК', recommendation: 'Перепроверить вручную' },
  { positionNum: '4', type: 'suspicious_coeff', description: 'Применён коэффициент 1.15 — нетипичен для данного региона', recommendation: 'Проверить обоснование коэффициента в пояснительной записке' },
  { positionNum: '6', type: 'wrong_unit', description: 'Единица «м²» — допустимо, но в ГЭСН для данной нормы используется «100 м²»', recommendation: 'Привести к стандартной единице измерения по базе' },
  { positionNum: '7', type: 'overpriced', description: 'Монтаж — 28 000 ₽/т, рыночный уровень 22 000–24 000 ₽/т', recommendation: 'Завышение ~20%, рекомендуется пересмотр' },
];

const LS_KEY_PREFIX = 'toratau_estimates';
let nextEstId = 10;

function _getPortalId(): string {
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u.portal_id) return String(u.portal_id);
    }
  } catch { /* ignore */ }
  return 'default';
}

function _lsKey(): string {
  return `${LS_KEY_PREFIX}_${_getPortalId()}`;
}

function loadEstimates(): Estimate[] {
  try {
    const raw = localStorage.getItem(_lsKey());
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return createDemoEstimates();
}

function saveEstimates(data: Estimate[]) {
  localStorage.setItem(_lsKey(), JSON.stringify(data));
}

function createDemoEstimates(): Estimate[] {
  const totalSum = DEMO_POSITIONS.reduce((s, p) => s + p.total + p.overhead + p.profit, 0);
  const demo: Estimate[] = [
    {
      id: 1,
      name: 'ЖК «Солнечный» — Общестрой',
      region: 'Республика Башкортостан',
      baseType: 'FER',
      fileName: 'smeta_solnechniy.xlsx',
      status: 'checked',
      createdAt: '2026-02-15T10:00:00Z',
      positions: DEMO_POSITIONS,
      checkResult: {
        totalSum,
        marketEstimate: totalSum * 0.88,
        potentialOverprice: totalSum * 0.12,
        potentialOverpricePct: 12,
        errorsCount: DEMO_ERRORS.length,
        riskLevel: 'medium',
        errors: DEMO_ERRORS,
      },
      lsr: null,
      compare: null,
      strategy: 'standard',
    },
  ];
  saveEstimates(demo);
  return demo;
}

function delay(ms = 150) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/* ---- API-функции ---- */

export async function getEstimates(): Promise<Estimate[]> {
  await delay();
  return loadEstimates();
}

export async function getEstimate(id: number): Promise<Estimate> {
  await delay();
  const all = loadEstimates();
  const est = all.find((e) => e.id === id);
  if (!est) throw new Error('Смета не найдена');
  return est;
}

export async function createEstimate(data: EstimateCreate, file?: File, fileContentBase64?: string, initialPositions?: EstimatePosition[]): Promise<Estimate> {
  let positions: EstimatePosition[];
  if (initialPositions && initialPositions.length > 0) {
    positions = initialPositions;
  } else if (file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('base_type', data.baseType);
    const res = await api.upload<{ positions: EstimatePosition[] }>('/estimates/parse', formData);
    positions = (res.positions || []).map((p, i) => ({
      id: i + 1,
      num: String(p.num ?? i + 1),
      normCode: String(p.normCode ?? ''),
      name: String(p.name ?? ''),
      unit: String(p.unit ?? ''),
      volume: Number(p.volume) || 0,
      price: Number(p.price) || 0,
      total: Number(p.total) || 0,
      overhead: Number(p.overhead) || 0,
      profit: Number(p.profit) || 0,
      adjustmentCoeff: p.adjustmentCoeff != null ? String(p.adjustmentCoeff) : '',
      recalcCoeffNumber: p.recalcCoeffNumber != null ? String(p.recalcCoeffNumber) : '',
      laborPersonHours: Number(p.laborPersonHours) || 0,
      costPerUnitFromStart: Number(p.costPerUnitFromStart) || 0,
    }));
  } else {
    positions = [];
  }
  const all = loadEstimates();
  const nextId = all.length ? Math.max(...all.map((e) => e.id)) + 1 : 1;
  nextEstId = nextId;
  const est: Estimate = {
    id: nextId,
    name: data.name,
    region: data.region,
    baseType: data.baseType,
    fileName: data.fileName,
    status: 'parsed',
    createdAt: new Date().toISOString(),
    positions,
    checkResult: null,
    lsr: null,
    compare: null,
    strategy: 'standard',
    ...(fileContentBase64 ? { fileContentBase64 } : {}),
  };
  all.push(est);
  saveEstimates(all);
  return est;
}

export async function deleteEstimate(id: number): Promise<void> {
  await delay();
  const all = loadEstimates().filter((e) => e.id !== id);
  saveEstimates(all);
}

export async function runCheck(id: number): Promise<CheckResult> {
  const all = loadEstimates();
  const est = all.find((e) => e.id === id);
  if (!est) throw new Error('Смета не найдена');

  const result = await api.post<CheckResult>('/estimates/check', {
    positions: est.positions,
    region: est.region,
  });
  est.checkResult = result;
  est.status = 'checked';
  saveEstimates(all);
  return result;
}

export async function generateLSR(id: number): Promise<LSRResult> {
  const all = loadEstimates();
  const est = all.find((e) => e.id === id);
  if (!est) throw new Error('Смета не найдена');

  const result = await api.post<LSRResult>('/estimates/lsr', {
    positions: est.positions,
    strategy: est.strategy,
  });
  result.positions = (result.positions || []).map((p, i) => ({ ...p, id: i + 1 }));
  est.lsr = result;
  est.status = 'lsr_ready';
  saveEstimates(all);
  return result;
}

export async function runCompare(id: number): Promise<CompareResult> {
  const all = loadEstimates();
  const est = all.find((e) => e.id === id);
  if (!est || !est.lsr) throw new Error('Сначала сформируйте ЛСР');

  const result = await api.post<CompareResult>('/estimates/compare', {
    positions: est.positions,
    lsr: est.lsr,
  });
  const normalized = normalizeCompareResult(result);
  est.compare = normalized;
  est.status = 'compared';
  saveEstimates(all);
  return normalized;
}

export async function setStrategy(id: number, strategy: CalcStrategy): Promise<void> {
  await delay();
  const all = loadEstimates();
  const est = all.find((e) => e.id === id);
  if (!est) throw new Error('Смета не найдена');
  est.strategy = strategy;
  est.lsr = null;
  est.compare = null;
  if (est.status === 'lsr_ready' || est.status === 'compared') est.status = 'checked';
  saveEstimates(all);
}

/** Сохранить изменения ЛСР (позиции и итоги) в смету */
export async function updateEstimateLSR(id: number, lsr: LSRResult): Promise<void> {
  await delay();
  const all = loadEstimates();
  const est = all.find((e) => e.id === id);
  if (!est) throw new Error('Смета не найдена');
  est.lsr = lsr;
  saveEstimates(all);
}

/** Сохранить изменения позиций сметы */
export async function updateEstimatePositions(id: number, positions: EstimatePosition[]): Promise<void> {
  await delay();
  const all = loadEstimates();
  const est = all.find((e) => e.id === id);
  if (!est) throw new Error('Смета не найдена');
  est.positions = positions;
  est.checkResult = null;
  est.lsr = null;
  est.compare = null;
  if (est.status !== 'parsed' && est.status !== 'draft') est.status = 'parsed';
  saveEstimates(all);
}

/** Сохранить изменения сравнения (итоги пересчитываются из строк) */
export async function updateEstimateCompare(id: number, compare: CompareResult): Promise<void> {
  await delay();
  const all = loadEstimates();
  const est = all.find((e) => e.id === id);
  if (!est) throw new Error('Смета не найдена');
  est.compare = normalizeCompareResult(compare);
  saveEstimates(all);
}

export async function getEstimateSettings(): Promise<EstimateSettings> {
  await delay();
  try {
    const raw = localStorage.getItem(`toratau_estimate_settings_${_getPortalId()}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { regionCoefficients: { 'Республика Башкортостан': 1.0, 'Москва': 1.35, 'Санкт-Петербург': 1.2, 'Краснодарский край': 1.05 }, overheadPct: 10, profitPct: 8, strategy: 'standard', customMarginPct: 15 };
}

export async function saveEstimateSettings(s: EstimateSettings): Promise<void> {
  await delay();
  localStorage.setItem(`toratau_estimate_settings_${_getPortalId()}`, JSON.stringify(s));
}

/* ---- Утилиты ---- */

function generatePositions(): EstimatePosition[] {
  return DEMO_POSITIONS.map((p) => ({
    ...p,
    price: Math.round(p.price * (0.9 + Math.random() * 0.2)),
    total: 0, overhead: 0, profit: 0,
  })).map((p) => ({
    ...p,
    total: p.price * p.volume,
    overhead: Math.round(p.price * p.volume * 0.1),
    profit: Math.round(p.price * p.volume * 0.08),
  }));
}

/** Все регионы России (субъекты РФ) */
export const REGIONS = [
  'Республика Адыгея', 'Республика Алтай', 'Республика Башкортостан', 'Республика Бурятия',
  'Республика Дагестан', 'Республика Ингушетия', 'Кабардино-Балкарская Республика', 'Республика Калмыкия',
  'Карачаево-Черкесская Республика', 'Республика Карелия', 'Республика Коми', 'Республика Крым',
  'Республика Марий Эл', 'Республика Мордовия', 'Республика Саха (Якутия)', 'Республика Северная Осетия — Алания',
  'Республика Татарстан', 'Республика Тыва', 'Удмуртская Республика', 'Республика Хакасия',
  'Чеченская Республика', 'Чувашская Республика', 'Алтайский край', 'Забайкальский край',
  'Камчатский край', 'Краснодарский край', 'Красноярский край', 'Пермский край', 'Приморский край',
  'Ставропольский край', 'Хабаровский край', 'Амурская область', 'Архангельская область',
  'Астраханская область', 'Белгородская область', 'Брянская область', 'Владимирская область',
  'Волгоградская область', 'Вологодская область', 'Воронежская область', 'Ивановская область',
  'Иркутская область', 'Калининградская область', 'Калужская область', 'Кемеровская область — Кузбасс',
  'Кировская область', 'Костромская область', 'Курганская область', 'Курская область',
  'Ленинградская область', 'Липецкая область', 'Магаданская область', 'Московская область',
  'Мурманская область', 'Нижегородская область', 'Новгородская область', 'Новосибирская область',
  'Омская область', 'Оренбургская область', 'Орловская область', 'Пензенская область',
  'Псковская область', 'Ростовская область', 'Рязанская область', 'Самарская область',
  'Саратовская область', 'Сахалинская область', 'Свердловская область', 'Смоленская область',
  'Тамбовская область', 'Тверская область', 'Томская область', 'Тульская область',
  'Тюменская область', 'Ульяновская область', 'Челябинская область', 'Ярославская область',
  'Москва', 'Санкт-Петербург', 'Севастополь', 'Еврейская автономная область',
  'Ненецкий автономный округ', 'Ханты-Мансийский автономный округ — Югра', 'Чукотский автономный округ', 'Ямало-Ненецкий автономный округ',
];

/** Регионы в алфавитном порядке для отображения в формах */
export const REGIONS_SORTED = [...REGIONS].sort((a, b) => a.localeCompare(b, 'ru'));

export const RISK_LABELS: Record<RiskLevel, string> = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };
export const RISK_COLORS: Record<RiskLevel, string> = { low: '#16a34a', medium: '#eab308', high: '#dc2626' };
export const ERROR_TYPE_LABELS: Record<ErrorSeverity, string> = {
  arithmetic: 'Арифметическая', wrong_norm: 'Неверная норма', wrong_unit: 'Некорректная единица',
  overpriced: 'Завышенная расценка', suspicious_coeff: 'Подозрительный коэф.',
};
export const STATUS_LABELS: Record<EstimateStatus, string> = {
  draft: 'Черновик', parsed: 'Загружена', checked: 'Проверена', lsr_ready: 'ЛСР готов', compared: 'Сравнение готово',
};
export const STATUS_COLORS: Record<EstimateStatus, string> = {
  draft: '#6b7280', parsed: '#3b82f6', checked: '#f59e0b', lsr_ready: '#8b5cf6', compared: '#16a34a',
};
export const STRATEGY_LABELS: Record<CalcStrategy, string> = {
  standard: 'Стандарт', aggressive: 'Агрессивная маржа', conservative: 'Консервативная', custom: 'Свой шаблон',
};

/* ---- Скачивание файлов ---- */

function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob(['\uFEFF' + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Скачать исходный загруженный файл сметы или, если его нет, CSV с позициями */
export function downloadEstimatePositions(est: Estimate): void {
  if (est.fileContentBase64) {
    const binary = atob(est.fileContentBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const ext = (est.fileName || '').split('.').pop()?.toLowerCase();
    const mime = ext === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : ext === 'xls' ? 'application/vnd.ms-excel' : ext === 'xml' ? 'application/xml' : 'application/octet-stream';
    const blob = new Blob([bytes], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = est.fileName || 'smeta';
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const rows = [
    ['№пп', 'Шифр, номера нормативов и коды ресурсов', 'Наименование работ и затрат', 'Ед. изм.', 'Кол-во единиц', 'Цена на ед., руб.', 'Поправочные коэф.', 'Коэф. пересчета, номер', 'ВСЕГО затрат, руб.', 'ЗТР, чел-ч', 'Стоим. ед. с нач., руб.', 'НР', 'СП'].join(';'),
    ...est.positions.map((p) =>
      [p.num, p.normCode, p.name, p.unit, p.volume, p.price, p.adjustmentCoeff ?? '', p.recalcCoeffNumber ?? '', p.total, p.laborPersonHours ?? '', p.costPerUnitFromStart ?? '', p.overhead, p.profit].join(';')
    ),
  ];
  const name = (est.fileName || 'smeta').replace(/\.[^.]+$/, '') || 'smeta';
  triggerDownload(rows.join('\r\n'), `${name}_позиции.csv`, 'text/csv;charset=utf-8');
}

export function downloadLSR(est: Estimate): void {
  if (!est.lsr) return;
  downloadLSRWithResult(est, est.lsr);
}

/** Скачать ЛСР по переданным данным (в т.ч. с отредактированными в таблице значениями) */
export function downloadLSRWithResult(est: Estimate, lsrResult: LSRResult): void {
  const l = lsrResult;
  const rows = [
    ['№', 'Наименование', 'Ед. изм', 'Объём', 'Материалы', 'Труд', 'Машины', 'Прямые', 'НР', 'СП', 'Итого'].join(';'),
    ...l.positions.map((p) =>
      [p.num, p.name, p.unit, p.volume, p.materials, p.labor, p.machines, p.directCost, p.overhead, p.profit, p.total].join(';')
    ),
    ['', '', '', 'ИТОГО', l.totalMaterials, l.totalLabor, l.totalMachines, l.totalDirect, l.totalOverhead, l.totalProfit, l.grandTotal].join(';'),
  ];
  const name = (est.fileName || 'lsr').replace(/\.[^.]+$/, '') || 'lsr';
  triggerDownload(rows.join('\r\n'), `${name}_ЛСР.csv`, 'text/csv;charset=utf-8');
}

export function downloadCompare(est: Estimate): void {
  if (!est.compare) return;
  const c = est.compare;
  const rows = [
    ['№', 'Позиция', 'Смета заказчика', 'Наш ЛСР', 'Разница ₽', 'Разница %'].join(';'),
    ...c.rows.map((r) => [r.num, r.name, r.customerSum, r.ourSum, r.diffRub, r.diffPct].join(';')),
    ['', 'ИТОГО', c.totalCustomer, c.totalOur, c.totalDiff, c.marginality].join(';'),
  ];
  const name = (est.fileName || 'sravnenie').replace(/\.[^.]+$/, '') || 'sravnenie';
  triggerDownload(rows.join('\r\n'), `${name}_сравнение.csv`, 'text/csv;charset=utf-8');
}
