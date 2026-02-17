/**
 * Мок-хранилище — полная эмуляция бэкенда для разработки без сервера.
 *
 * Демо-логины:
 *   admin / admin123   → Администратор
 *   foreman / foreman123 → Прораб
 *
 * Данные хранятся в памяти и в localStorage (переживают F5).
 */
import type {
  User, Project, ProjectCreate, Crew, CrewCreate,
  WorkType, WorkTypeCreate, WorkLog, WorkLogCreate,
  CashIn, CashInCreate, Expense, ExpenseCreate,
  Payout, PayoutCreate, ProjectReport, CrewSummary,
  LoginResponse,
} from '../types';

/* ================================================================
   Вспомогательные утилиты
   ================================================================ */
const LS_KEY = 'toratau_mock_db';
let nextId = 100;
function genId(): number { return ++nextId; }

function delay(ms = 120): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/* ================================================================
   Начальные демо-данные
   ================================================================ */
const DEMO_USERS: User[] = [
  { id: 1, username: 'admin', full_name: 'Ахметов Рустам', role: 'admin', is_active: true },
  { id: 2, username: 'foreman', full_name: 'Сергеев Дмитрий', role: 'foreman', is_active: true },
];

const DEMO_PROJECTS: Project[] = [
  {
    id: 1, name: 'ЖК «Солнечный»', address: 'ул. Центральная, 45',
    client: 'ООО «Стройинвест»', start_date: '2025-09-01', end_date: '2026-06-30',
    status: 'in_progress', contract_amount: 5_000_000, planned_cost: 3_800_000,
    notes: 'Многоквартирный дом, 3 подъезда', created_at: '2025-09-01T10:00:00Z', updated_at: '2026-02-10T14:00:00Z',
  },
  {
    id: 2, name: 'Офис «Центральный»', address: 'пр. Ленина, 12',
    client: 'ИП Кузнецов', start_date: '2026-02-01', end_date: '2026-05-30',
    status: 'new', contract_amount: 1_200_000, planned_cost: 900_000,
    notes: '', created_at: '2026-02-01T09:00:00Z', updated_at: '2026-02-01T09:00:00Z',
  },
  {
    id: 3, name: 'Ремонт школы №5', address: 'ул. Пушкина, 8',
    client: 'Администрация района', start_date: '2025-06-01', end_date: '2025-12-20',
    status: 'completed', contract_amount: 2_500_000, planned_cost: 2_000_000,
    notes: 'Капитальный ремонт', created_at: '2025-06-01T08:00:00Z', updated_at: '2025-12-20T18:00:00Z',
  },
];

const DEMO_CREWS: Crew[] = [
  { id: 1, name: 'Бригада Иванова', contact: 'Иванов С.П., +7 900 111-22-33', notes: 'Общестроительные работы', is_active: true },
  { id: 2, name: 'Бригада Петрова', contact: 'Петров А.В., +7 900 444-55-66', notes: 'Отделочные работы', is_active: true },
  { id: 3, name: 'Электрики Сидорова', contact: 'Сидоров И.К., +7 900 777-88-99', notes: 'Электромонтаж', is_active: true },
];

const DEMO_WORK_TYPES: WorkType[] = [
  { id: 1, name: 'Штукатурка стен', unit: 'м²', rate: 350, category: 'Отделочные', is_active: true },
  { id: 2, name: 'Укладка плитки', unit: 'м²', rate: 500, category: 'Отделочные', is_active: true },
  { id: 3, name: 'Электромонтаж', unit: 'шт', rate: 800, category: 'Электромонтаж', is_active: true },
  { id: 4, name: 'Покраска стен', unit: 'м²', rate: 200, category: 'Отделочные', is_active: true },
  { id: 5, name: 'Стяжка пола', unit: 'м²', rate: 450, category: 'Общестроительные', is_active: true },
  { id: 6, name: 'Демонтаж', unit: 'м²', rate: 150, category: 'Общестроительные', is_active: true },
];

const DEMO_WORK_LOGS: WorkLog[] = [
  { id: 1, project_id: 1, crew_id: 1, work_type_id: 5, date: '2025-10-15', volume: 120, comment: 'Стяжка 1-й этаж', photos: [], created_by: 2, status: 'approved', accrued_amount: 54_000 },
  { id: 2, project_id: 1, crew_id: 2, work_type_id: 1, date: '2025-11-10', volume: 200, comment: 'Штукатурка подъезд 1', photos: [], created_by: 2, status: 'approved', accrued_amount: 70_000 },
  { id: 3, project_id: 1, crew_id: 2, work_type_id: 4, date: '2025-12-05', volume: 180, comment: 'Покраска 1-2 этаж', photos: [], created_by: 2, status: 'approved', accrued_amount: 36_000 },
  { id: 4, project_id: 1, crew_id: 3, work_type_id: 3, date: '2026-01-20', volume: 45, comment: 'Розетки + выключатели', photos: [], created_by: 2, status: 'approved', accrued_amount: 36_000 },
  { id: 5, project_id: 1, crew_id: 1, work_type_id: 5, date: '2026-02-01', volume: 80, comment: 'Стяжка 2-й этаж', photos: [], created_by: 2, status: 'pending', accrued_amount: 36_000 },
  { id: 6, project_id: 1, crew_id: 2, work_type_id: 2, date: '2026-02-10', volume: 50, comment: 'Плитка санузлы', photos: [], created_by: 2, status: 'pending', accrued_amount: 25_000 },
  { id: 7, project_id: 3, crew_id: 1, work_type_id: 6, date: '2025-07-01', volume: 300, comment: 'Демонтаж старой отделки', photos: [], created_by: 2, status: 'approved', accrued_amount: 45_000 },
  { id: 8, project_id: 3, crew_id: 2, work_type_id: 1, date: '2025-08-15', volume: 400, comment: 'Штукатурка всех помещений', photos: [], created_by: 2, status: 'approved', accrued_amount: 140_000 },
  { id: 9, project_id: 3, crew_id: 2, work_type_id: 4, date: '2025-10-01', volume: 350, comment: 'Покраска', photos: [], created_by: 2, status: 'approved', accrued_amount: 70_000 },
  { id: 10, project_id: 3, crew_id: 3, work_type_id: 3, date: '2025-09-15', volume: 80, comment: 'Электрика полностью', photos: [], created_by: 2, status: 'approved', accrued_amount: 64_000 },
];

const DEMO_CASH_INS: CashIn[] = [
  { id: 1, project_id: 1, date: '2025-09-05', amount: 1_500_000, comment: 'Аванс по договору', file_url: null, created_by: 1 },
  { id: 2, project_id: 1, date: '2025-12-01', amount: 1_000_000, comment: 'Второй транш', file_url: null, created_by: 1 },
  { id: 3, project_id: 1, date: '2026-02-01', amount: 800_000, comment: 'Третий транш', file_url: null, created_by: 1 },
  { id: 4, project_id: 3, date: '2025-06-10', amount: 1_000_000, comment: 'Аванс', file_url: null, created_by: 1 },
  { id: 5, project_id: 3, date: '2025-09-01', amount: 800_000, comment: 'Промежуточный платёж', file_url: null, created_by: 1 },
  { id: 6, project_id: 3, date: '2025-12-15', amount: 700_000, comment: 'Финальный платёж', file_url: null, created_by: 1 },
];

const DEMO_EXPENSES: Expense[] = [
  { id: 1, project_id: 1, date: '2025-09-10', amount: 450_000, category: 'materials', comment: 'Цемент, песок, щебень', file_url: null, created_by: 1 },
  { id: 2, project_id: 1, date: '2025-10-20', amount: 120_000, category: 'materials', comment: 'Краска, шпатлёвка', file_url: null, created_by: 1 },
  { id: 3, project_id: 1, date: '2025-11-15', amount: 35_000, category: 'tools', comment: 'Аренда лесов', file_url: null, created_by: 1 },
  { id: 4, project_id: 1, date: '2026-01-10', amount: 80_000, category: 'materials', comment: 'Плитка для санузлов', file_url: null, created_by: 1 },
  { id: 5, project_id: 1, date: '2026-01-25', amount: 15_000, category: 'transport', comment: 'Доставка материалов', file_url: null, created_by: 1 },
  { id: 6, project_id: 3, date: '2025-07-05', amount: 200_000, category: 'materials', comment: 'Материалы для ремонта', file_url: null, created_by: 1 },
  { id: 7, project_id: 3, date: '2025-08-01', amount: 50_000, category: 'tools', comment: 'Инструмент', file_url: null, created_by: 1 },
  { id: 8, project_id: 3, date: '2025-10-15', amount: 80_000, category: 'materials', comment: 'Краска, обои', file_url: null, created_by: 1 },
];

const DEMO_PAYOUTS: Payout[] = [
  { id: 1, project_id: 1, crew_id: 1, date: '2025-11-01', amount: 50_000, payment_method: 'transfer', comment: 'За стяжку 1 этаж', status: 'approved', created_by: 2, approved_by: 1 },
  { id: 2, project_id: 1, crew_id: 2, date: '2025-12-01', amount: 60_000, payment_method: 'cash', comment: 'За штукатурку', status: 'approved', created_by: 2, approved_by: 1 },
  { id: 3, project_id: 1, crew_id: 2, date: '2026-01-15', amount: 30_000, payment_method: 'transfer', comment: 'За покраску', status: 'approved', created_by: 2, approved_by: 1 },
  { id: 4, project_id: 1, crew_id: 3, date: '2026-02-05', amount: 30_000, payment_method: 'transfer', comment: 'Аванс за электрику', status: 'created', created_by: 2, approved_by: null },
  { id: 5, project_id: 3, crew_id: 1, date: '2025-08-01', amount: 40_000, payment_method: 'cash', comment: 'Демонтаж', status: 'approved', created_by: 2, approved_by: 1 },
  { id: 6, project_id: 3, crew_id: 2, date: '2025-10-01', amount: 100_000, payment_method: 'transfer', comment: 'Штукатурка', status: 'approved', created_by: 2, approved_by: 1 },
  { id: 7, project_id: 3, crew_id: 2, date: '2025-11-15', amount: 60_000, payment_method: 'transfer', comment: 'Покраска', status: 'approved', created_by: 2, approved_by: 1 },
  { id: 8, project_id: 3, crew_id: 3, date: '2025-10-20', amount: 55_000, payment_method: 'cash', comment: 'Электрика', status: 'approved', created_by: 2, approved_by: 1 },
];

/* ================================================================
   Класс хранилища
   ================================================================ */
interface DB {
  users: User[];
  projects: Project[];
  crews: Crew[];
  workTypes: WorkType[];
  workLogs: WorkLog[];
  cashIns: CashIn[];
  expenses: Expense[];
  payouts: Payout[];
  currentUserId: number | null;
}

function defaultDB(): DB {
  return {
    users: structuredClone(DEMO_USERS),
    projects: structuredClone(DEMO_PROJECTS),
    crews: structuredClone(DEMO_CREWS),
    workTypes: structuredClone(DEMO_WORK_TYPES),
    workLogs: structuredClone(DEMO_WORK_LOGS),
    cashIns: structuredClone(DEMO_CASH_INS),
    expenses: structuredClone(DEMO_EXPENSES),
    payouts: structuredClone(DEMO_PAYOUTS),
    currentUserId: null,
  };
}

class MockStore {
  private db: DB;

  constructor() {
    this.db = this.load();
  }

  /* --- Сохранение / загрузка из localStorage --- */
  private save(): void {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(this.db));
    } catch { /* квоты localStorage — игнорируем */ }
  }
  private load(): DB {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DB;
        if (parsed.projects && parsed.crews) {
          nextId = Math.max(
            nextId,
            ...[
              ...parsed.projects.map((p) => p.id),
              ...parsed.crews.map((c) => c.id),
              ...parsed.workTypes.map((w) => w.id),
              ...parsed.workLogs.map((w) => w.id),
              ...parsed.cashIns.map((c) => c.id),
              ...parsed.expenses.map((e) => e.id),
              ...parsed.payouts.map((p) => p.id),
            ]
          );
          return parsed;
        }
      }
    } catch { /* повреждённые данные — сбрасываем */ }
    return defaultDB();
  }

  /** Сброс демо-данных */
  reset(): void {
    this.db = defaultDB();
    this.save();
  }

  /* ================================================================
     AUTH
     ================================================================ */
  login(username: string, password: string): LoginResponse {
    const passwords: Record<string, string> = { admin: 'admin123', foreman: 'foreman123' };
    const user = this.db.users.find((u) => u.username === username);
    if (!user || passwords[username] !== password) {
      throw new Error('Неверный логин или пароль');
    }
    this.db.currentUserId = user.id;
    this.save();
    return {
      access_token: `mock-token-${user.id}-${Date.now()}`,
      token_type: 'bearer',
      user,
    };
  }

  getMe(): User {
    const user = this.db.users.find((u) => u.id === this.db.currentUserId);
    if (!user) throw new Error('Не авторизован');
    return user;
  }

  /* ================================================================
     PROJECTS
     ================================================================ */
  getProjects(): Project[] {
    return [...this.db.projects];
  }
  getProject(id: number): Project {
    const p = this.db.projects.find((x) => x.id === id);
    if (!p) throw new Error('Объект не найден');
    return { ...p };
  }
  createProject(data: ProjectCreate): Project {
    const now = new Date().toISOString();
    const p: Project = {
      id: genId(), name: data.name, address: data.address || '', client: data.client,
      start_date: data.start_date, end_date: data.end_date || null,
      status: data.status || 'new', contract_amount: data.contract_amount,
      planned_cost: data.planned_cost, notes: data.notes || '',
      created_at: now, updated_at: now,
    };
    this.db.projects.push(p);
    this.save();
    return { ...p };
  }
  updateProject(id: number, data: Partial<ProjectCreate>): Project {
    const idx = this.db.projects.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Объект не найден');
    Object.assign(this.db.projects[idx], data, { updated_at: new Date().toISOString() });
    this.save();
    return { ...this.db.projects[idx] };
  }
  deleteProject(id: number): void {
    this.db.projects = this.db.projects.filter((x) => x.id !== id);
    this.save();
  }

  /* ================================================================
     CREWS
     ================================================================ */
  getCrews(): Crew[] { return [...this.db.crews]; }
  getCrew(id: number): Crew {
    const c = this.db.crews.find((x) => x.id === id);
    if (!c) throw new Error('Бригада не найдена');
    return { ...c };
  }
  createCrew(data: CrewCreate): Crew {
    const c: Crew = {
      id: genId(), name: data.name, contact: data.contact || '',
      notes: data.notes || '', is_active: data.is_active !== false,
    };
    this.db.crews.push(c);
    this.save();
    return { ...c };
  }
  updateCrew(id: number, data: Partial<CrewCreate>): Crew {
    const idx = this.db.crews.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Бригада не найдена');
    Object.assign(this.db.crews[idx], data);
    this.save();
    return { ...this.db.crews[idx] };
  }
  deleteCrew(id: number): void {
    this.db.crews = this.db.crews.filter((x) => x.id !== id);
    this.save();
  }

  /* ================================================================
     WORK TYPES
     ================================================================ */
  getWorkTypes(): WorkType[] { return [...this.db.workTypes]; }
  getWorkType(id: number): WorkType {
    const w = this.db.workTypes.find((x) => x.id === id);
    if (!w) throw new Error('Вид работ не найден');
    return { ...w };
  }
  createWorkType(data: WorkTypeCreate): WorkType {
    const w: WorkType = {
      id: genId(), name: data.name, unit: data.unit, rate: data.rate,
      category: data.category || '', is_active: data.is_active !== false,
    };
    this.db.workTypes.push(w);
    this.save();
    return { ...w };
  }
  updateWorkType(id: number, data: Partial<WorkTypeCreate>): WorkType {
    const idx = this.db.workTypes.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Вид работ не найден');
    Object.assign(this.db.workTypes[idx], data);
    this.save();
    return { ...this.db.workTypes[idx] };
  }
  deleteWorkType(id: number): void {
    this.db.workTypes = this.db.workTypes.filter((x) => x.id !== id);
    this.save();
  }

  /* ================================================================
     WORK LOGS
     ================================================================ */
  getWorkLogs(projectId?: number): WorkLog[] {
    let list = [...this.db.workLogs];
    if (projectId) list = list.filter((x) => x.project_id === projectId);
    return list.map((wl) => this.enrichWorkLog(wl));
  }
  getWorkLog(id: number): WorkLog {
    const w = this.db.workLogs.find((x) => x.id === id);
    if (!w) throw new Error('Запись не найдена');
    return this.enrichWorkLog({ ...w });
  }
  createWorkLog(data: WorkLogCreate): WorkLog {
    const wt = this.db.workTypes.find((x) => x.id === data.work_type_id);
    const accrued = wt ? data.volume * wt.rate : 0;
    const wl: WorkLog = {
      id: genId(), project_id: data.project_id, crew_id: data.crew_id,
      work_type_id: data.work_type_id, date: data.date, volume: data.volume,
      comment: data.comment || '', photos: [], created_by: this.db.currentUserId || 1,
      status: 'pending', accrued_amount: accrued,
    };
    this.db.workLogs.push(wl);
    this.save();
    return this.enrichWorkLog({ ...wl });
  }
  updateWorkLog(id: number, data: Partial<WorkLogCreate>): WorkLog {
    const idx = this.db.workLogs.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Запись не найдена');
    Object.assign(this.db.workLogs[idx], data);
    if (data.volume || data.work_type_id) {
      const wl = this.db.workLogs[idx];
      const wt = this.db.workTypes.find((x) => x.id === wl.work_type_id);
      wl.accrued_amount = wt ? wl.volume * wt.rate : 0;
    }
    this.save();
    return this.enrichWorkLog({ ...this.db.workLogs[idx] });
  }
  deleteWorkLog(id: number): void {
    this.db.workLogs = this.db.workLogs.filter((x) => x.id !== id);
    this.save();
  }
  approveWorkLog(id: number): WorkLog {
    const idx = this.db.workLogs.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Запись не найдена');
    this.db.workLogs[idx].status = 'approved';
    this.save();
    return this.enrichWorkLog({ ...this.db.workLogs[idx] });
  }
  rejectWorkLog(id: number): WorkLog {
    const idx = this.db.workLogs.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Запись не найдена');
    this.db.workLogs[idx].status = 'rejected';
    this.save();
    return this.enrichWorkLog({ ...this.db.workLogs[idx] });
  }
  private enrichWorkLog(wl: WorkLog): WorkLog {
    return {
      ...wl,
      crew: this.db.crews.find((c) => c.id === wl.crew_id),
      work_type: this.db.workTypes.find((w) => w.id === wl.work_type_id),
      creator: this.db.users.find((u) => u.id === wl.created_by),
    };
  }

  /* ================================================================
     CASH IN
     ================================================================ */
  getCashIns(projectId?: number): CashIn[] {
    let list = [...this.db.cashIns];
    if (projectId) list = list.filter((x) => x.project_id === projectId);
    return list;
  }
  createCashIn(data: CashInCreate): CashIn {
    const ci: CashIn = {
      id: genId(), project_id: data.project_id, date: data.date,
      amount: data.amount, comment: data.comment || '', file_url: null,
      created_by: this.db.currentUserId || 1,
    };
    this.db.cashIns.push(ci);
    this.save();
    return { ...ci };
  }
  getCashIn(id: number): CashIn {
    const ci = this.db.cashIns.find((x) => x.id === id);
    if (!ci) throw new Error('Платёж не найден');
    return { ...ci };
  }
  updateCashIn(id: number, data: Partial<CashInCreate>): CashIn {
    const idx = this.db.cashIns.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Платёж не найден');
    Object.assign(this.db.cashIns[idx], data);
    this.save();
    return { ...this.db.cashIns[idx] };
  }
  deleteCashIn(id: number): void {
    this.db.cashIns = this.db.cashIns.filter((x) => x.id !== id);
    this.save();
  }

  /* ================================================================
     EXPENSES
     ================================================================ */
  getExpenses(projectId?: number): Expense[] {
    let list = [...this.db.expenses];
    if (projectId) list = list.filter((x) => x.project_id === projectId);
    return list;
  }
  createExpense(data: ExpenseCreate): Expense {
    const e: Expense = {
      id: genId(), project_id: data.project_id, date: data.date,
      amount: data.amount, category: data.category, comment: data.comment || '',
      file_url: null, created_by: this.db.currentUserId || 1,
    };
    this.db.expenses.push(e);
    this.save();
    return { ...e };
  }
  getExpense(id: number): Expense {
    const e = this.db.expenses.find((x) => x.id === id);
    if (!e) throw new Error('Расход не найден');
    return { ...e };
  }
  updateExpense(id: number, data: Partial<ExpenseCreate>): Expense {
    const idx = this.db.expenses.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Расход не найден');
    Object.assign(this.db.expenses[idx], data);
    this.save();
    return { ...this.db.expenses[idx] };
  }
  deleteExpense(id: number): void {
    this.db.expenses = this.db.expenses.filter((x) => x.id !== id);
    this.save();
  }

  /* ================================================================
     PAYOUTS
     ================================================================ */
  getPayouts(projectId?: number): Payout[] {
    let list = [...this.db.payouts];
    if (projectId) list = list.filter((x) => x.project_id === projectId);
    return list.map((p) => ({
      ...p,
      crew: this.db.crews.find((c) => c.id === p.crew_id),
    }));
  }
  createPayout(data: PayoutCreate): Payout {
    const p: Payout = {
      id: genId(), project_id: data.project_id, crew_id: data.crew_id,
      date: data.date, amount: data.amount, payment_method: data.payment_method,
      comment: data.comment || '', status: 'created',
      created_by: this.db.currentUserId || 1, approved_by: null,
      crew: this.db.crews.find((c) => c.id === data.crew_id),
    };
    this.db.payouts.push(p);
    this.save();
    return { ...p };
  }
  approvePayout(id: number): Payout {
    const idx = this.db.payouts.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Выплата не найдена');
    this.db.payouts[idx].status = 'approved';
    this.db.payouts[idx].approved_by = this.db.currentUserId || 1;
    this.save();
    return { ...this.db.payouts[idx], crew: this.db.crews.find((c) => c.id === this.db.payouts[idx].crew_id) };
  }
  cancelPayout(id: number): Payout {
    const idx = this.db.payouts.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Выплата не найдена');
    this.db.payouts[idx].status = 'cancelled';
    this.save();
    return { ...this.db.payouts[idx], crew: this.db.crews.find((c) => c.id === this.db.payouts[idx].crew_id) };
  }
  getPayout(id: number): Payout {
    const p = this.db.payouts.find((x) => x.id === id);
    if (!p) throw new Error('Выплата не найдена');
    return { ...p, crew: this.db.crews.find((c) => c.id === p.crew_id) };
  }
  updatePayout(id: number, data: Partial<PayoutCreate>): Payout {
    const idx = this.db.payouts.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Выплата не найдена');
    Object.assign(this.db.payouts[idx], data);
    this.save();
    return { ...this.db.payouts[idx], crew: this.db.crews.find((c) => c.id === this.db.payouts[idx].crew_id) };
  }
  deletePayout(id: number): void {
    this.db.payouts = this.db.payouts.filter((x) => x.id !== id);
    this.save();
  }

  /* ================================================================
     REPORTS
     ================================================================ */
  getProjectReport(projectId: number): ProjectReport {
    const project = this.getProject(projectId);

    const approvedLogs = this.db.workLogs.filter(
      (wl) => wl.project_id === projectId && wl.status === 'approved'
    );
    const totalCashIn = this.db.cashIns
      .filter((x) => x.project_id === projectId)
      .reduce((s, x) => s + x.amount, 0);
    const totalExpenses = this.db.expenses
      .filter((x) => x.project_id === projectId)
      .reduce((s, x) => s + x.amount, 0);
    const totalAccrued = approvedLogs.reduce((s, x) => s + x.accrued_amount, 0);
    const approvedPayouts = this.db.payouts.filter(
      (x) => x.project_id === projectId && x.status === 'approved'
    );
    const totalPaid = approvedPayouts.reduce((s, x) => s + x.amount, 0);
    const totalFactExpense = totalExpenses + totalPaid;
    const balance = totalCashIn - totalFactExpense;
    const forecastProfit = project.contract_amount - (totalExpenses + totalAccrued);
    const planDeviation = (totalExpenses + totalAccrued) - project.planned_cost;

    /* Сводка по бригадам */
    const crewMap = new Map<number, { accrued: number; paid: number }>();
    for (const wl of approvedLogs) {
      const entry = crewMap.get(wl.crew_id) || { accrued: 0, paid: 0 };
      entry.accrued += wl.accrued_amount;
      crewMap.set(wl.crew_id, entry);
    }
    for (const p of approvedPayouts) {
      const entry = crewMap.get(p.crew_id) || { accrued: 0, paid: 0 };
      entry.paid += p.amount;
      crewMap.set(p.crew_id, entry);
    }
    const crewsSummary: CrewSummary[] = [];
    for (const [crewId, data] of crewMap) {
      const crew = this.db.crews.find((c) => c.id === crewId);
      if (crew) {
        crewsSummary.push({
          crew,
          accrued: data.accrued,
          paid: data.paid,
          debt: data.accrued - data.paid,
        });
      }
    }

    return {
      project,
      total_cash_in: totalCashIn,
      total_expenses: totalExpenses,
      total_accrued: totalAccrued,
      total_paid: totalPaid,
      total_fact_expense: totalFactExpense,
      balance,
      forecast_profit: forecastProfit,
      plan_deviation: planDeviation,
      crews_summary: crewsSummary,
    };
  }
}

/* ================================================================
   Маршрутизатор запросов
   ================================================================ */
const store = new MockStore();

/** Глобальный доступ к store для кнопки «Сбросить демо» */
(window as unknown as Record<string, unknown>).__mockStore = store;

export async function handleMockRequest(
  method: string,
  path: string,
  body?: string | null
): Promise<unknown> {
  await delay();
  const m = method.toUpperCase();
  const data = body ? JSON.parse(body) : undefined;

  /* --- Разбор пути --- */
  const url = new URL(path, 'http://localhost');
  const p = url.pathname.replace(/\/$/, '');
  const searchParams = url.searchParams;

  const match = (pattern: string): RegExpMatchArray | null => {
    const re = new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>\\d+)') + '$');
    return p.match(re);
  };

  /* --- AUTH --- */
  if (m === 'POST' && p === '/auth/login') return store.login(data.username, data.password);
  if (m === 'GET' && p === '/auth/me') return store.getMe();

  /* --- PROJECTS --- */
  if (m === 'GET' && p === '/projects') return store.getProjects();
  let r = match('/projects/:id');
  if (r?.groups) {
    const id = Number(r.groups.id);
    if (m === 'GET') return store.getProject(id);
    if (m === 'PUT') return store.updateProject(id, data);
    if (m === 'DELETE') { store.deleteProject(id); return undefined; }
  }
  if (m === 'POST' && p === '/projects') return store.createProject(data);

  /* --- CREWS --- */
  if (m === 'GET' && p === '/crews') return store.getCrews();
  r = match('/crews/:id');
  if (r?.groups) {
    const id = Number(r.groups.id);
    if (m === 'GET') return store.getCrew(id);
    if (m === 'PUT') return store.updateCrew(id, data);
    if (m === 'DELETE') { store.deleteCrew(id); return undefined; }
  }
  if (m === 'POST' && p === '/crews') return store.createCrew(data);

  /* --- WORK TYPES --- */
  if (m === 'GET' && p === '/work-types') return store.getWorkTypes();
  r = match('/work-types/:id');
  if (r?.groups) {
    const id = Number(r.groups.id);
    if (m === 'GET') return store.getWorkType(id);
    if (m === 'PUT') return store.updateWorkType(id, data);
    if (m === 'DELETE') { store.deleteWorkType(id); return undefined; }
  }
  if (m === 'POST' && p === '/work-types') return store.createWorkType(data);

  /* --- WORK LOGS --- */
  if (m === 'GET' && p === '/work-logs') {
    const pid = searchParams.get('project_id');
    return store.getWorkLogs(pid ? Number(pid) : undefined);
  }
  r = match('/work-logs/:id/approve');
  if (r?.groups && m === 'POST') return store.approveWorkLog(Number(r.groups.id));
  r = match('/work-logs/:id/reject');
  if (r?.groups && m === 'POST') return store.rejectWorkLog(Number(r.groups.id));
  r = match('/work-logs/:id/photos');
  if (r?.groups && m === 'POST') return store.getWorkLog(Number(r.groups.id));
  r = match('/work-logs/:id');
  if (r?.groups) {
    const id = Number(r.groups.id);
    if (m === 'GET') return store.getWorkLog(id);
    if (m === 'PUT') return store.updateWorkLog(id, data);
    if (m === 'DELETE') { store.deleteWorkLog(id); return undefined; }
  }
  if (m === 'POST' && p === '/work-logs') return store.createWorkLog(data);

  /* --- CASHIN --- */
  if (m === 'GET' && p === '/cashin') {
    const pid = searchParams.get('project_id');
    return store.getCashIns(pid ? Number(pid) : undefined);
  }
  r = match('/cashin/:id');
  if (r?.groups) {
    const id = Number(r.groups.id);
    if (m === 'GET') return store.getCashIn(id);
    if (m === 'PUT') return store.updateCashIn(id, data);
    if (m === 'DELETE') { store.deleteCashIn(id); return undefined; }
  }
  if (m === 'POST' && p === '/cashin') return store.createCashIn(data);

  /* --- EXPENSES --- */
  if (m === 'GET' && p === '/expenses') {
    const pid = searchParams.get('project_id');
    return store.getExpenses(pid ? Number(pid) : undefined);
  }
  r = match('/expenses/:id');
  if (r?.groups) {
    const id = Number(r.groups.id);
    if (m === 'GET') return store.getExpense(id);
    if (m === 'PUT') return store.updateExpense(id, data);
    if (m === 'DELETE') { store.deleteExpense(id); return undefined; }
  }
  if (m === 'POST' && p === '/expenses') return store.createExpense(data);

  /* --- PAYOUTS --- */
  if (m === 'GET' && p === '/payouts') {
    const pid = searchParams.get('project_id');
    return store.getPayouts(pid ? Number(pid) : undefined);
  }
  r = match('/payouts/:id/approve');
  if (r?.groups && m === 'POST') return store.approvePayout(Number(r.groups.id));
  r = match('/payouts/:id/cancel');
  if (r?.groups && m === 'POST') return store.cancelPayout(Number(r.groups.id));
  r = match('/payouts/:id');
  if (r?.groups) {
    const id = Number(r.groups.id);
    if (m === 'GET') return store.getPayout(id);
    if (m === 'PUT') return store.updatePayout(id, data);
    if (m === 'DELETE') { store.deletePayout(id); return undefined; }
  }
  if (m === 'POST' && p === '/payouts') return store.createPayout(data);

  /* --- REPORTS --- */
  r = match('/reports/project/:id');
  if (r?.groups && m === 'GET') return store.getProjectReport(Number(r.groups.id));

  throw new Error(`[Mock] Маршрут не найден: ${m} ${p}`);
}
