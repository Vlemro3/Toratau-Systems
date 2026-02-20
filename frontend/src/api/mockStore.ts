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
  LoginResponse, Employee, EmployeeCreate, Organization, OrganizationCreate,
  Counterparty, CounterpartyCreate, CpDocument, CpDocumentCreate,
  Portal, PortalCreate, PortalUpdate,
} from '../types';
import type { Subscription, Invoice, PaymentLog, BillingPlan, PlanTier } from '../billing/billingTypes';
import { createTrialSubscription, checkAndTransition, transition } from '../billing/subscriptionMachine';
import { PaymentService } from '../billing/paymentService';

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
const DEFAULT_PORTAL_ID = 'default';

const DEMO_USERS: User[] = [
  { id: 1, username: 'admin', full_name: 'Ахметов Рустам', role: 'admin', is_active: true, portal_id: DEFAULT_PORTAL_ID },
  { id: 2, username: 'foreman', full_name: 'Сергеев Дмитрий', role: 'foreman', is_active: true, portal_id: DEFAULT_PORTAL_ID, project_ids: [1] },
  { id: 3, username: 'superadmin', full_name: 'Super Admin', role: 'superAdmin', is_active: true },
];

const DEMO_PROJECTS: Project[] = [
  {
    id: 1, name: 'ЖК «Солнечный»', address: 'ул. Центральная, 45',
    client: 'ООО «Стройинвест»', start_date: '2025-09-01', end_date: '2026-06-30',
    status: 'in_progress', contract_amount: 5_000_000, planned_cost: 3_800_000,
    notes: 'Многоквартирный дом, 3 подъезда', created_at: '2025-09-01T10:00:00Z', updated_at: '2026-02-10T14:00:00Z', portal_id: DEFAULT_PORTAL_ID,
  },
  {
    id: 2, name: 'Офис «Центральный»', address: 'пр. Ленина, 12',
    client: 'ИП Кузнецов', start_date: '2026-02-01', end_date: '2026-05-30',
    status: 'new', contract_amount: 1_200_000, planned_cost: 900_000,
    notes: '', created_at: '2026-02-01T09:00:00Z', updated_at: '2026-02-01T09:00:00Z', portal_id: DEFAULT_PORTAL_ID,
  },
  {
    id: 3, name: 'Ремонт школы №5', address: 'ул. Пушкина, 8',
    client: 'Администрация района', start_date: '2025-06-01', end_date: '2025-12-20',
    status: 'completed', contract_amount: 2_500_000, planned_cost: 2_000_000,
    notes: 'Капитальный ремонт', created_at: '2025-06-01T08:00:00Z', updated_at: '2025-12-20T18:00:00Z', portal_id: DEFAULT_PORTAL_ID,
  },
];

const DEMO_CREWS: Crew[] = [
  { id: 1, name: 'Бригада Иванова', contact: 'Иванов С.П.', phone: '+7 900 111-22-33', notes: 'Общестроительные работы', is_active: true },
  { id: 2, name: 'Бригада Петрова', contact: 'Петров А.В.', phone: '+7 900 444-55-66', notes: 'Отделочные работы', is_active: true },
  { id: 3, name: 'Электрики Сидорова', contact: 'Сидоров И.К.', phone: '+7 900 777-88-99', notes: 'Электромонтаж', is_active: true },
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

const DEMO_EMPLOYEES: Employee[] = [
  { id: 1, username: 'admin', full_name: 'Ахметов Рустам', role: 'admin', is_active: true, portal_id: 'main', created_at: '2025-01-01T00:00:00Z' },
  { id: 2, username: 'foreman', full_name: 'Сергеев Дмитрий', role: 'foreman', is_active: true, portal_id: 'main', created_at: '2025-03-15T00:00:00Z', project_ids: [1] },
];

/** Связь user ↔ object (many-to-many) */
interface UserObject {
  id: number;
  user_id: number;
  object_id: number;
}

const DEMO_USER_OBJECTS: UserObject[] = [
  { id: 1, user_id: 2, object_id: 1 },
];

const DEMO_PASSWORDS: Record<string, string> = {
  admin: 'admin123',
  foreman: 'foreman123',
  superadmin: 'superadmin123',
};

const DEMO_ORGANIZATIONS: Organization[] = [];

const DEMO_PORTALS: Portal[] = [
  {
    id: 'portal-1',
    name: 'СтройИнвест Плюс',
    ownerEmail: 'admin@stroinvest.ru',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    usersCount: 15,
    subscription: {
      plan: 'pro',
      isPaid: true,
      paidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    status: 'active',
    limits: {
      maxUsers: 50,
      maxStorageMb: 5000,
    },
  },
  {
    id: 'portal-2',
    name: 'Тестовый портал',
    ownerEmail: 'test@example.com',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    usersCount: 3,
    subscription: {
      plan: 'basic',
      isPaid: false,
      paidUntil: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Просрочен
    },
    status: 'active',
    limits: {
      maxUsers: 10,
      maxStorageMb: 1000,
    },
  },
  {
    id: 'portal-3',
    name: 'Заблокированный портал',
    ownerEmail: 'blocked@example.com',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    usersCount: 0,
    subscription: {
      plan: 'free',
      isPaid: false,
      paidUntil: null,
    },
    status: 'blocked',
    limits: {
      maxUsers: 5,
      maxStorageMb: 500,
    },
  },
];

const DEMO_COUNTERPARTIES: Counterparty[] = [
  {
    id: 50, org_type: 'legal', name: 'ООО «Стройинвест»', comment: '', inn: '7701234567', kpp: '770101001',
    address: 'г. Москва, ул. Строителей, 10', ogrn: '1027700000001', ogrn_date: '15.03.2010',
    director_title: 'Генеральный директор', director_name: 'Козлов А.И.',
    chief_accountant: 'Смирнова Е.В.', phone: '+7 495 123-45-67', email: 'info@stroyinvest.ru',
    website: 'stroyinvest.ru', edo_operator: 'diadoc',
    bank_account: '40702810000000012345', personal_account: '', bik: '044525225',
    bank_name: 'ПАО Сбербанк', corr_account: '30101810400000000225', bank_address: 'г. Москва',
    receiver_type: 'buyer', receiver_title: '', receiver_name: '',
    responsible_title: '', responsible_name: '', economic_entity: '',
    created_at: '2025-08-01T00:00:00Z',
  },
  {
    id: 51, org_type: 'ip', name: 'ИП Кузнецов', comment: '', inn: '502312345678', kpp: '',
    address: 'г. Уфа, пр. Ленина, 12', ogrn: '312024500000001', ogrn_date: '01.06.2020',
    director_title: 'ИП', director_name: 'Кузнецов П.А.',
    chief_accountant: '', phone: '+7 347 222-33-44', email: 'kuznetsov@mail.ru',
    website: '', edo_operator: 'none',
    bank_account: '40802810600000054321', personal_account: '', bik: '048073601',
    bank_name: 'Башкирское ОСБ 8598', corr_account: '30101810300000000601', bank_address: 'г. Уфа',
    receiver_type: 'buyer', receiver_title: '', receiver_name: '',
    responsible_title: '', responsible_name: '', economic_entity: '',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 52, org_type: 'legal', name: 'Администрация района', comment: 'Бюджетная организация', inn: '0200001234', kpp: '020001001',
    address: 'г. Уфа, ул. Пушкина, 1', ogrn: '1020200000001', ogrn_date: '10.01.2005',
    director_title: 'Глава администрации', director_name: 'Петров С.В.',
    chief_accountant: 'Иванова Н.А.', phone: '+7 347 111-22-33', email: 'admin@rayon.ru',
    website: 'rayon.ru', edo_operator: 'sbis',
    bank_account: '40601810000000000001', personal_account: '03221643190000000100', bik: '018073401',
    bank_name: 'Отделение — НБ Республики Башкортостан', corr_account: '', bank_address: 'г. Уфа',
    receiver_type: 'buyer', receiver_title: '', receiver_name: '',
    responsible_title: '', responsible_name: '', economic_entity: '',
    created_at: '2025-05-20T00:00:00Z',
  },
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
  employees: Employee[];
  passwords: Record<string, string>;
  organizations: Organization[];
  counterparties: Counterparty[];
  documents: CpDocument[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  paymentLogs: PaymentLog[];
  portals: Portal[];
  /** Связь user ↔ object (RBAC many-to-many) */
  userObjects: UserObject[];
  currentUserId: number | null;
  /** Портал текущей сессии (для изоляции данных по порталу) */
  currentPortalId: string;
  /** Пользовательские категории расходов по порталам: portalId -> названия */
  customExpenseCategories: Record<string, string[]>;
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
    employees: structuredClone(DEMO_EMPLOYEES),
    passwords: structuredClone(DEMO_PASSWORDS),
    organizations: structuredClone(DEMO_ORGANIZATIONS),
    counterparties: structuredClone(DEMO_COUNTERPARTIES),
    documents: [],
    subscriptions: [],
    invoices: [],
    paymentLogs: [],
    portals: structuredClone(DEMO_PORTALS),
    userObjects: structuredClone(DEMO_USER_OBJECTS),
    currentUserId: null,
    currentPortalId: DEFAULT_PORTAL_ID,
    customExpenseCategories: {},
  };
}

class MockStore {
  private db: DB;

  constructor() {
    this.db = this.load();
    this.paymentService.loadState(this.db.invoices, this.db.paymentLogs);
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
          // Обновляем users и passwords если отсутствует superadmin
          if (!parsed.users || !parsed.users.some((u) => u.username === 'superadmin')) {
            parsed.users = structuredClone(DEMO_USERS);
          }
          if (!parsed.passwords || !parsed.passwords.superadmin) {
            parsed.passwords = structuredClone(DEMO_PASSWORDS);
          }
          if (!parsed.employees) parsed.employees = structuredClone(DEMO_EMPLOYEES);
          if (!parsed.organizations) parsed.organizations = structuredClone(DEMO_ORGANIZATIONS);
          if (!parsed.counterparties) parsed.counterparties = structuredClone(DEMO_COUNTERPARTIES);
          if (!parsed.documents) parsed.documents = [];
          if (!parsed.subscriptions) parsed.subscriptions = [];
          if (!parsed.invoices) parsed.invoices = [];
          if (!parsed.paymentLogs) parsed.paymentLogs = [];
          if (!parsed.portals) parsed.portals = structuredClone(DEMO_PORTALS);
          if (!parsed.userObjects) parsed.userObjects = structuredClone(DEMO_USER_OBJECTS);
          if (parsed.currentPortalId == null) parsed.currentPortalId = DEFAULT_PORTAL_ID;
          if (typeof parsed.customExpenseCategories !== 'object') parsed.customExpenseCategories = {};
          parsed.users?.forEach((u: User) => { if (u.portal_id == null && u.role !== 'superAdmin') u.portal_id = DEFAULT_PORTAL_ID; });
          parsed.projects?.forEach((p: Project) => { if (p.portal_id == null) p.portal_id = DEFAULT_PORTAL_ID; });
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
              ...parsed.employees.map((e) => e.id),
              ...parsed.organizations.map((o) => o.id),
              ...parsed.counterparties.map((c) => c.id),
              ...parsed.documents.map((d) => d.id),
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
  private getUserProjectIds(userId: number): number[] {
    return this.db.userObjects
      .filter((uo) => uo.user_id === userId)
      .map((uo) => uo.object_id);
  }

  private enrichUser(user: User): User {
    if (user.role === 'foreman') {
      return { ...user, project_ids: this.getUserProjectIds(user.id) };
    }
    return { ...user };
  }

  login(username: string, password: string): LoginResponse {
    const user = this.db.users.find((u) => u.username === username);
    if (!user || this.db.passwords[username] !== password) {
      throw new Error('Неверный логин или пароль');
    }
    this.db.currentUserId = user.id;
    this.db.currentPortalId = user.portal_id ?? DEFAULT_PORTAL_ID;
    this.save();
    return {
      access_token: `mock-token-${user.id}-${Date.now()}`,
      token_type: 'bearer',
      user: this.enrichUser(user),
    };
  }

  register(data: { username: string; password: string; full_name: string; email: string }): LoginResponse {
    if (this.db.users.some((u) => u.username === data.username)) {
      throw new Error('Пользователь с таким логином уже существует');
    }
    const now = new Date().toISOString();
    const userId = genId();
    const portalId = `portal-${userId}`;

    const portal: Portal = {
      id: portalId,
      name: `Портал: ${data.full_name}`,
      ownerEmail: data.email,
      createdAt: now,
      usersCount: 1,
      subscription: { plan: 'free', isPaid: false, paidUntil: null },
      status: 'active',
      limits: { maxUsers: 10, maxStorageMb: 500 },
    };
    this.db.portals.push(portal);

    const user: User = {
      id: userId,
      username: data.username,
      full_name: data.full_name,
      role: 'admin',
      is_active: true,
      portal_id: portalId,
    };
    this.db.users.push(user);
    this.db.passwords[data.username] = data.password;

    const demoProject: Project = {
      id: genId(),
      name: 'Демонстрационный объект',
      address: 'Адрес можно изменить в карточке объекта',
      client: 'Заказчик (демо)',
      start_date: now.slice(0, 10),
      end_date: null,
      status: 'new',
      contract_amount: 1_000_000,
      planned_cost: 800_000,
      notes: 'Этот объект создан для ознакомления с возможностями портала. Добавляйте работы, расходы и выплаты.',
      created_at: now,
      updated_at: now,
      portal_id: portalId,
    };
    this.db.projects.push(demoProject);

    const sub = createTrialSubscription(userId, genId());
    this.db.subscriptions.push(sub);

    this.db.currentUserId = userId;
    this.db.currentPortalId = portalId;
    this.save();

    return {
      access_token: `mock-token-${userId}-${Date.now()}`,
      token_type: 'bearer',
      user: { ...user },
    };
  }

  getMe(): User {
    const user = this.db.users.find((u) => u.id === this.db.currentUserId);
    if (!user) throw new Error('Не авторизован');
    return this.enrichUser(user);
  }

  updateProfile(data: { full_name: string }): User {
    const user = this.db.users.find((u) => u.id === this.db.currentUserId);
    if (!user) throw new Error('Не авторизован');
    user.full_name = data.full_name;
    const emp = this.db.employees.find((e) => e.username === user.username);
    if (emp) emp.full_name = data.full_name;
    this.save();
    return { ...user };
  }

  changePassword(data: { current_password: string; new_password: string }): void {
    const user = this.db.users.find((u) => u.id === this.db.currentUserId);
    if (!user) throw new Error('Не авторизован');
    if (this.db.passwords[user.username] !== data.current_password) {
      throw new Error('Текущий пароль неверен');
    }
    this.db.passwords[user.username] = data.new_password;
    this.save();
  }

  /* ================================================================
     PROJECTS
     ================================================================ */
  getProjects(): Project[] {
    const portalId = this.db.currentPortalId ?? DEFAULT_PORTAL_ID;
    const user = this.db.users.find((u) => u.id === this.db.currentUserId);
    let projects = this.db.projects
      .filter((x) => (x.portal_id ?? DEFAULT_PORTAL_ID) === portalId);

    if (user?.role === 'foreman') {
      const allowedIds = this.getUserProjectIds(user.id);
      projects = projects.filter((p) => allowedIds.includes(p.id));
    }
    return projects.map((x) => ({ ...x }));
  }

  getProject(id: number): Project {
    const portalId = this.db.currentPortalId ?? DEFAULT_PORTAL_ID;
    const p = this.db.projects.find((x) => x.id === id && (x.portal_id ?? DEFAULT_PORTAL_ID) === portalId);
    if (!p) throw new Error('Объект не найден');

    const user = this.db.users.find((u) => u.id === this.db.currentUserId);
    if (user?.role === 'foreman') {
      const allowedIds = this.getUserProjectIds(user.id);
      if (!allowedIds.includes(id)) throw new Error('Нет доступа к этому объекту');
    }
    return { ...p };
  }
  createProject(data: ProjectCreate): Project {
    const now = new Date().toISOString();
    const portalId = this.db.currentPortalId ?? DEFAULT_PORTAL_ID;
    const p: Project = {
      id: genId(), name: data.name, address: data.address || '', client: data.client,
      start_date: data.start_date, end_date: data.end_date || null,
      status: data.status || 'new', contract_amount: data.contract_amount,
      planned_cost: data.planned_cost, notes: data.notes || '',
      created_at: now, updated_at: now,
      portal_id: portalId,
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
      phone: data.phone || undefined, notes: data.notes || '',
      is_active: data.is_active !== false,
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
  adjustAllRates(percentage: number): WorkType[] {
    // Процент может быть положительным (повышение) или отрицательным (понижение)
    // Например: 10 = +10%, -5 = -5%
    const multiplier = 1 + (percentage / 100);
    this.db.workTypes.forEach((wt) => {
      wt.rate = Math.round(wt.rate * multiplier * 100) / 100; // Округляем до 2 знаков после запятой
    });
    this.save();
    return [...this.db.workTypes];
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
    const accrued = typeof data.accrued_amount === 'number' ? data.accrued_amount : 0;
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
    const wl = this.db.workLogs[idx];
    Object.assign(wl, data);
    if (typeof data.accrued_amount === 'number') wl.accrued_amount = data.accrued_amount;
    wl.updated_by = this.db.currentUserId || 1;
    this.save();
    return this.enrichWorkLog({ ...wl });
  }
  deleteWorkLog(id: number): void {
    this.db.workLogs = this.db.workLogs.filter((x) => x.id !== id);
    this.save();
  }
  approveWorkLog(id: number): WorkLog {
    const idx = this.db.workLogs.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Запись не найдена');
    this.db.workLogs[idx].status = 'approved';
    this.db.workLogs[idx].updated_by = this.db.currentUserId || 1;
    this.save();
    return this.enrichWorkLog({ ...this.db.workLogs[idx] });
  }
  rejectWorkLog(id: number): WorkLog {
    const idx = this.db.workLogs.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Запись не найдена');
    this.db.workLogs[idx].status = 'rejected';
    this.db.workLogs[idx].updated_by = this.db.currentUserId || 1;
    this.save();
    return this.enrichWorkLog({ ...this.db.workLogs[idx] });
  }
  private enrichWorkLog(wl: WorkLog): WorkLog {
    return {
      ...wl,
      crew: this.db.crews.find((c) => c.id === wl.crew_id),
      work_type: this.db.workTypes.find((w) => w.id === wl.work_type_id),
      creator: this.db.users.find((u) => u.id === wl.created_by),
      updated_by_user: wl.updated_by ? this.db.users.find((u) => u.id === wl.updated_by) : undefined,
    };
  }

  private getUser(id: number): User | undefined {
    return this.db.users.find((u) => u.id === id);
  }

  /* ================================================================
     CASH IN
     ================================================================ */
  getCashIns(projectId?: number): CashIn[] {
    let list = [...this.db.cashIns];
    if (projectId) list = list.filter((x) => x.project_id === projectId);
    return list.map((ci) => ({
      ...ci,
      creator: this.getUser(ci.created_by),
      updated_by_user: ci.updated_by ? this.getUser(ci.updated_by) : undefined,
    }));
  }
  createCashIn(data: CashInCreate): CashIn {
    const ci: CashIn = {
      id: genId(), project_id: data.project_id, date: data.date,
      amount: data.amount, comment: data.comment || '', file_url: null,
      created_by: this.db.currentUserId || 1,
    };
    this.db.cashIns.push(ci);
    this.save();
    return { ...ci, creator: this.getUser(ci.created_by) };
  }
  getCashIn(id: number): CashIn {
    const ci = this.db.cashIns.find((x) => x.id === id);
    if (!ci) throw new Error('Платёж не найден');
    return {
      ...ci,
      creator: this.getUser(ci.created_by),
      updated_by_user: ci.updated_by ? this.getUser(ci.updated_by) : undefined,
    };
  }
  updateCashIn(id: number, data: Partial<CashInCreate>): CashIn {
    const idx = this.db.cashIns.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Платёж не найден');
    Object.assign(this.db.cashIns[idx], data);
    this.db.cashIns[idx].updated_by = this.db.currentUserId || 1;
    this.save();
    return {
      ...this.db.cashIns[idx],
      creator: this.getUser(this.db.cashIns[idx].created_by),
      updated_by_user: this.getUser(this.db.cashIns[idx].updated_by!),
    };
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
    return list.map((e) => ({
      ...e,
      creator: this.getUser(e.created_by),
      updated_by_user: e.updated_by ? this.getUser(e.updated_by) : undefined,
    }));
  }
  createExpense(data: ExpenseCreate): Expense {
    const e: Expense = {
      id: genId(), project_id: data.project_id, date: data.date,
      amount: data.amount, category: data.category, comment: data.comment || '',
      file_url: null, created_by: this.db.currentUserId || 1,
    };
    this.db.expenses.push(e);
    this.save();
    return { ...e, creator: this.getUser(e.created_by) };
  }
  getExpense(id: number): Expense {
    const e = this.db.expenses.find((x) => x.id === id);
    if (!e) throw new Error('Расход не найден');
    return {
      ...e,
      creator: this.getUser(e.created_by),
      updated_by_user: e.updated_by ? this.getUser(e.updated_by) : undefined,
    };
  }
  updateExpense(id: number, data: Partial<ExpenseCreate>): Expense {
    const idx = this.db.expenses.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Расход не найден');
    Object.assign(this.db.expenses[idx], data);
    this.db.expenses[idx].updated_by = this.db.currentUserId || 1;
    this.save();
    return {
      ...this.db.expenses[idx],
      creator: this.getUser(this.db.expenses[idx].created_by),
      updated_by_user: this.getUser(this.db.expenses[idx].updated_by!),
    };
  }
  deleteExpense(id: number): void {
    this.db.expenses = this.db.expenses.filter((x) => x.id !== id);
    this.save();
  }

  getCustomExpenseCategories(): string[] {
    const pid = this.db.currentPortalId || DEFAULT_PORTAL_ID;
    return [...(this.db.customExpenseCategories[pid] || [])];
  }

  addCustomExpenseCategory(name: string): void {
    const trimmed = (name || '').trim();
    if (!trimmed) return;
    const pid = this.db.currentPortalId || DEFAULT_PORTAL_ID;
    const list = this.db.customExpenseCategories[pid] || [];
    if (list.includes(trimmed)) return;
    this.db.customExpenseCategories[pid] = [...list, trimmed];
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
      creator: this.getUser(p.created_by),
      updated_by_user: p.updated_by ? this.getUser(p.updated_by) : undefined,
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
    return { ...p, creator: this.getUser(p.created_by) };
  }
  approvePayout(id: number): Payout {
    const idx = this.db.payouts.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Выплата не найдена');
    this.db.payouts[idx].status = 'approved';
    this.db.payouts[idx].approved_by = this.db.currentUserId || 1;
    this.db.payouts[idx].updated_by = this.db.currentUserId || 1;
    this.save();
    const p = this.db.payouts[idx];
    return {
      ...p,
      crew: this.db.crews.find((c) => c.id === p.crew_id),
      creator: this.getUser(p.created_by),
      updated_by_user: this.getUser(p.updated_by!),
    };
  }
  cancelPayout(id: number): Payout {
    const idx = this.db.payouts.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Выплата не найдена');
    this.db.payouts[idx].status = 'cancelled';
    this.db.payouts[idx].updated_by = this.db.currentUserId || 1;
    this.save();
    const p = this.db.payouts[idx];
    return {
      ...p,
      crew: this.db.crews.find((c) => c.id === p.crew_id),
      creator: this.getUser(p.created_by),
      updated_by_user: this.getUser(p.updated_by!),
    };
  }
  getPayout(id: number): Payout {
    const p = this.db.payouts.find((x) => x.id === id);
    if (!p) throw new Error('Выплата не найдена');
    return {
      ...p,
      crew: this.db.crews.find((c) => c.id === p.crew_id),
      creator: this.getUser(p.created_by),
      updated_by_user: p.updated_by ? this.getUser(p.updated_by) : undefined,
    };
  }
  updatePayout(id: number, data: Partial<PayoutCreate>): Payout {
    const idx = this.db.payouts.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Выплата не найдена');
    Object.assign(this.db.payouts[idx], data);
    this.db.payouts[idx].updated_by = this.db.currentUserId || 1;
    this.save();
    return {
      ...this.db.payouts[idx],
      crew: this.db.crews.find((c) => c.id === this.db.payouts[idx].crew_id),
      creator: this.getUser(this.db.payouts[idx].created_by),
      updated_by_user: this.getUser(this.db.payouts[idx].updated_by!),
    };
  }
  deletePayout(id: number): void {
    this.db.payouts = this.db.payouts.filter((x) => x.id !== id);
    this.save();
  }

  /* ================================================================
     EMPLOYEES
     ================================================================ */
  private enrichEmployee(emp: Employee): Employee {
    const ids = this.getUserProjectIds(emp.id);
    return { ...emp, project_ids: ids };
  }

  private setUserObjects(userId: number, objectIds: number[]): void {
    this.db.userObjects = this.db.userObjects.filter((uo) => uo.user_id !== userId);
    for (const oid of objectIds) {
      this.db.userObjects.push({ id: genId(), user_id: userId, object_id: oid });
    }
  }

  getEmployees(): Employee[] {
    return this.db.employees.map((e) => this.enrichEmployee(e));
  }

  getEmployee(id: number): Employee {
    const e = this.db.employees.find((x) => x.id === id);
    if (!e) throw new Error('Сотрудник не найден');
    return this.enrichEmployee(e);
  }

  createEmployee(data: EmployeeCreate): Employee {
    if (this.db.employees.some((e) => e.username === data.username) ||
        this.db.users.some((u) => u.username === data.username)) {
      throw new Error('Логин уже занят');
    }
    const portalId = this.db.currentPortalId ?? DEFAULT_PORTAL_ID;
    const emp: Employee = {
      id: genId(), username: data.username, full_name: data.full_name,
      role: data.role, is_active: true, portal_id: portalId,
      created_at: new Date().toISOString(),
    };
    this.db.employees.push(emp);
    this.db.users.push({
      id: emp.id, username: emp.username, full_name: emp.full_name,
      role: emp.role, is_active: true, portal_id: portalId,
    });
    this.db.passwords[emp.username] = data.password;

    if (data.role === 'foreman' && data.project_ids) {
      this.setUserObjects(emp.id, data.project_ids);
    }
    this.save();
    return this.enrichEmployee(emp);
  }

  updateEmployee(id: number, data: Partial<EmployeeCreate> & { is_active?: boolean }): Employee {
    const idx = this.db.employees.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Сотрудник не найден');
    const emp = this.db.employees[idx];

    const targetRole = data.role ?? emp.role;

    if (data.username && data.username !== emp.username) {
      if (this.db.employees.some((e) => e.id !== id && e.username === data.username)) {
        throw new Error('Логин уже занят');
      }
      delete this.db.passwords[emp.username];
      this.db.passwords[data.username] = data.password || 'temp123';
    }
    if (data.password && !data.username) {
      this.db.passwords[emp.username] = data.password;
    }

    if (data.is_active !== undefined) emp.is_active = data.is_active;
    const { password: _pw, project_ids, is_active: _ia, ...rest } = data as EmployeeCreate & { password?: string; is_active?: boolean };
    Object.assign(emp, rest);

    if (project_ids !== undefined) {
      this.setUserObjects(id, targetRole === 'foreman' ? project_ids : []);
    } else if (data.role !== undefined && data.role !== 'foreman') {
      this.setUserObjects(id, []);
    }

    const user = this.db.users.find((u) => u.id === id);
    if (user) {
      Object.assign(user, rest);
      if (data.is_active !== undefined) user.is_active = data.is_active;
    }

    this.save();
    return this.enrichEmployee(emp);
  }

  deleteEmployee(id: number): void {
    const emp = this.db.employees.find((e) => e.id === id);
    if (emp) delete this.db.passwords[emp.username];
    this.db.employees = this.db.employees.filter((x) => x.id !== id);
    this.db.users = this.db.users.filter((u) => u.id !== id);
    this.db.userObjects = this.db.userObjects.filter((uo) => uo.user_id !== id);
    this.save();
  }

  /* ================================================================
     ORGANIZATIONS
     ================================================================ */
  getOrganizations(): Organization[] { return [...this.db.organizations]; }
  getOrganization(id: number): Organization {
    const o = this.db.organizations.find((x) => x.id === id);
    if (!o) throw new Error('Организация не найдена');
    return { ...o };
  }
  createOrganization(data: OrganizationCreate): Organization {
    const org: Organization = {
      id: genId(),
      org_type: data.org_type,
      name: data.name,
      comment: data.comment || '',
      inn: data.inn || '',
      kpp: data.kpp || '',
      address: data.address || '',
      ogrn: data.ogrn || '',
      ogrn_date: data.ogrn_date || '',
      director_title: data.director_title || '',
      director_name: data.director_name || '',
      chief_accountant: data.chief_accountant || '',
      phone: data.phone || '',
      email: data.email || '',
      telegram: data.telegram || '',
      website: data.website || '',
      edo_operator: data.edo_operator || 'diadoc',
      bank_account: data.bank_account || '',
      personal_account: data.personal_account || '',
      bik: data.bik || '',
      bank_name: data.bank_name || '',
      corr_account: data.corr_account || '',
      bank_address: data.bank_address || '',
      sender_type: data.sender_type || 'seller',
      permit_title: data.permit_title || '',
      permit_name: data.permit_name || '',
      release_title: data.release_title || '',
      release_name: data.release_name || '',
      responsible_title: data.responsible_title || '',
      responsible_name: data.responsible_name || '',
      economic_entity: data.economic_entity || '',
      invoice_message: data.invoice_message || '',
      add_stamp_to_invoice: data.add_stamp_to_invoice ?? true,
      add_logo_to_invoice: data.add_logo_to_invoice ?? true,
      add_qr_to_invoice: data.add_qr_to_invoice ?? true,
      add_contacts_to_invoice: data.add_contacts_to_invoice ?? false,
      act_conditions: data.act_conditions || '',
      order_conditions: data.order_conditions || '',
      created_at: new Date().toISOString(),
    };
    this.db.organizations.push(org);
    this.save();
    return { ...org };
  }
  updateOrganization(id: number, data: Partial<OrganizationCreate>): Organization {
    const idx = this.db.organizations.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Организация не найдена');
    Object.assign(this.db.organizations[idx], data);
    this.save();
    return { ...this.db.organizations[idx] };
  }
  deleteOrganization(id: number): void {
    this.db.organizations = this.db.organizations.filter((x) => x.id !== id);
    this.save();
  }

  /* ================================================================
     COUNTERPARTIES
     ================================================================ */
  getCounterparties(): Counterparty[] { return [...this.db.counterparties]; }
  getCounterparty(id: number): Counterparty {
    const c = this.db.counterparties.find((x) => x.id === id);
    if (!c) throw new Error('Контрагент не найден');
    return { ...c };
  }
  createCounterparty(data: CounterpartyCreate): Counterparty {
    const c: Counterparty = {
      id: genId(), org_type: data.org_type, name: data.name,
      comment: data.comment || '', inn: data.inn || '', kpp: data.kpp || '',
      address: data.address || '', ogrn: data.ogrn || '', ogrn_date: data.ogrn_date || '',
      director_title: data.director_title || '', director_name: data.director_name || '',
      chief_accountant: data.chief_accountant || '',
      phone: data.phone || '', email: data.email || '', website: data.website || '',
      edo_operator: data.edo_operator || 'none',
      bank_account: data.bank_account || '', personal_account: data.personal_account || '',
      bik: data.bik || '', bank_name: data.bank_name || '',
      corr_account: data.corr_account || '', bank_address: data.bank_address || '',
      receiver_type: data.receiver_type || 'buyer',
      receiver_title: data.receiver_title || '', receiver_name: data.receiver_name || '',
      responsible_title: data.responsible_title || '', responsible_name: data.responsible_name || '',
      economic_entity: data.economic_entity || '',
      created_at: new Date().toISOString(),
    };
    this.db.counterparties.push(c);
    this.save();
    return { ...c };
  }
  updateCounterparty(id: number, data: Partial<CounterpartyCreate>): Counterparty {
    const idx = this.db.counterparties.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Контрагент не найден');
    Object.assign(this.db.counterparties[idx], data);
    this.save();
    return { ...this.db.counterparties[idx] };
  }
  deleteCounterparty(id: number): void {
    this.db.counterparties = this.db.counterparties.filter((x) => x.id !== id);
    this.save();
  }

  /* ================================================================
     DOCUMENTS
     ================================================================ */
  getDocuments(counterpartyId?: number): CpDocument[] {
    let list = [...this.db.documents];
    if (counterpartyId) list = list.filter((d) => d.counterparty_id === counterpartyId);
    return list;
  }
  getDocument(id: number): CpDocument {
    const d = this.db.documents.find((x) => x.id === id);
    if (!d) throw new Error('Документ не найден');
    return { ...d };
  }
  createDocument(data: CpDocumentCreate): CpDocument {
    const items = data.items || [];
    const total = items.reduce((s, i) => s + i.qty * i.price, 0);
    const doc: CpDocument = {
      id: genId(), counterparty_id: data.counterparty_id,
      organization_id: data.organization_id ?? null,
      doc_type: data.doc_type, number: data.number || '',
      date: data.date || new Date().toISOString().slice(0, 10),
      basis: data.basis || '', items, notes: data.notes || '',
      taxation: data.taxation || undefined,
      investor_id: data.investor_id ?? undefined,
      construction_name: data.construction_name || undefined,
      construction_address: data.construction_address || undefined,
      object_name: data.object_name || undefined,
      okdp: data.okdp || undefined,
      contract_number: data.contract_number || undefined,
      contract_date: data.contract_date || undefined,
      operation_type: data.operation_type || undefined,
      estimated_cost: data.estimated_cost,
      period_from: data.period_from || undefined,
      period_to: data.period_to || undefined,
      print_vat_amounts: data.print_vat_amounts || undefined,
      contract_creation_date: data.contract_creation_date || undefined,
      contract_location: data.contract_location || undefined,
      premises_area: data.premises_area,
      premises_address: data.premises_address || undefined,
      transfer_date_from: data.transfer_date_from || undefined,
      premises_condition: data.premises_condition || undefined,
      valid_until: data.valid_until || undefined,
      goods_source: data.goods_source || undefined,
      person_name_dative: data.person_name_dative || undefined,
      passport_series: data.passport_series || undefined,
      passport_number: data.passport_number || undefined,
      passport_issued_by: data.passport_issued_by || undefined,
      passport_issue_date: data.passport_issue_date || undefined,
      consumer_type: data.consumer_type || undefined,
      payer_type: data.payer_type || undefined,
      text_above: data.text_above || undefined,
      text_below: data.text_below || undefined,
      payment_purpose: data.payment_purpose || undefined,
      delivery_address: data.delivery_address || undefined,
      contract_text: data.contract_text || undefined,
      add_buyer_signature: data.add_buyer_signature || undefined,
      correction_number: data.correction_number || undefined,
      correction_date: data.correction_date || undefined,
      advance_invoice: data.advance_invoice || undefined,
      payment_doc_number: data.payment_doc_number || undefined,
      payment_doc_date: data.payment_doc_date || undefined,
      shipment_doc_name: data.shipment_doc_name || undefined,
      shipment_doc_number: data.shipment_doc_number || undefined,
      shipment_doc_date: data.shipment_doc_date || undefined,
      had_advance_invoices: data.had_advance_invoices || undefined,
      state_contract_id: data.state_contract_id || undefined,
      currency: data.currency || undefined,
      form_version: data.form_version || undefined,
      shipper_type: data.shipper_type || undefined,
      consignee_type: data.consignee_type || undefined,
      torg12_form_version: data.torg12_form_version || undefined,
      torg12_supplier_type: data.torg12_supplier_type || undefined,
      torg12_consignee_type: data.torg12_consignee_type || undefined,
      basis_number: data.basis_number || undefined,
      basis_date: data.basis_date || undefined,
      basis_number2: data.basis_number2 || undefined,
      basis_date2: data.basis_date2 || undefined,
      transport_waybill_name: data.transport_waybill_name || undefined,
      transport_waybill_number: data.transport_waybill_number || undefined,
      transport_waybill_date: data.transport_waybill_date || undefined,
      attachment_sheets: data.attachment_sheets,
      shipment_date_matches_doc: data.shipment_date_matches_doc || undefined,
      shipment_date: data.shipment_date || undefined,
      add_discount_markup: data.add_discount_markup || undefined,
      ks3_reporting_period_from: data.ks3_reporting_period_from || undefined,
      ks3_reporting_period_to: data.ks3_reporting_period_to || undefined,
      total,
      created_at: new Date().toISOString(),
    };
    this.db.documents.push(doc);
    this.save();
    return { ...doc };
  }
  updateDocument(id: number, data: Partial<CpDocumentCreate>): CpDocument {
    const idx = this.db.documents.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Документ не найден');
    const doc = this.db.documents[idx];
    Object.assign(doc, data);
    if (data.items) doc.total = data.items.reduce((s, i) => s + i.qty * i.price, 0);
    this.save();
    return { ...doc };
  }
  deleteDocument(id: number): void {
    this.db.documents = this.db.documents.filter((x) => x.id !== id);
    this.save();
  }

  /* ================================================================
     BILLING / SUBSCRIPTIONS
     ================================================================ */
  private paymentService = new PaymentService();

  private ensureSubscription(userId: number): Subscription {
    let sub = this.db.subscriptions.find((s) => s.userId === userId);
    if (!sub) {
      sub = createTrialSubscription(userId, genId());
      this.db.subscriptions.push(sub);
      this.save();
    }
    return sub;
  }

  private normalizeSubscription(sub: Subscription): Subscription {
    return {
      ...sub,
      planTier: sub.planTier ?? null,
      planInterval: sub.planInterval ?? sub.plan ?? null,
    };
  }

  getSubscription(): Subscription {
    const userId = this.db.currentUserId;
    if (!userId) throw new Error('Не авторизован');

    const admin = this.db.users.find((u) => u.id === userId);
    if (!admin || admin.role !== 'admin') {
      throw new Error('Доступ только для администратора');
    }

    let sub = this.ensureSubscription(userId);
    sub = this.normalizeSubscription(sub);
    const updated = checkAndTransition(sub);
    if (updated.status !== sub.status) {
      const idx = this.db.subscriptions.findIndex((s) => s.id === sub!.id);
      if (idx !== -1) this.db.subscriptions[idx] = updated;
      this.save();
      sub = updated;
    }

    return { ...sub };
  }

  /**
   * Получение подписки для проверки доступа (любой пользователь портала).
   * Берёт подписку текущего пользователя или админа по умолчанию (userId=1).
   */
  getPortalSubscription(): Subscription {
    const uid = this.db.currentUserId ?? 1;
    let sub = this.db.subscriptions.find((s) => s.userId === uid);
    if (!sub) {
      sub = createTrialSubscription(uid, genId());
      this.db.subscriptions.push(sub);
      this.save();
    }
    sub = this.normalizeSubscription(sub);
    const updated = checkAndTransition(sub);
    if (updated.status !== sub.status) {
      const idx = this.db.subscriptions.findIndex((s) => s.id === sub!.id);
      if (idx !== -1) this.db.subscriptions[idx] = updated;
      this.save();
      sub = updated;
    }

    return { ...sub };
  }

  subscribe(planTier: PlanTier, planInterval: BillingPlan): { subscription: Subscription; invoice: Invoice } {
    const userId = this.db.currentUserId;
    if (!userId) throw new Error('Не авторизован');

    const sub = this.ensureSubscription(userId);

    const invoice = this.paymentService.createInvoice(sub.id, planTier, planInterval);
    const initiated = transition(sub, { type: 'PAYMENT_INITIATED', planTier, planInterval });
    if (initiated) {
      const idx = this.db.subscriptions.findIndex((s) => s.id === sub.id);
      if (idx !== -1) this.db.subscriptions[idx] = initiated;
    }

    this.syncPaymentState();
    this.save();

    return {
      subscription: { ...(initiated || sub) },
      invoice: { ...invoice },
    };
  }

  simulatePaymentSuccess(invoiceId: number): { subscription: Subscription; invoice: Invoice } {
    const invoice = this.paymentService.getInvoices().find((i) => i.id === invoiceId);
    if (!invoice) throw new Error('Счёт не найден');

    const sub = this.db.subscriptions.find((s) => s.id === invoice.subscriptionId);
    if (!sub) throw new Error('Подписка не найдена');

    const planTier = invoice.planTier ?? 'business';
    const planInterval = invoice.plan ?? 'monthly';
    const paidInvoice = this.paymentService.simulatePaymentSuccess(sub.id, planTier, planInterval);
    const activated = transition(sub, { type: 'PAYMENT_SUCCESS', planTier, planInterval });
    if (activated) {
      const idx = this.db.subscriptions.findIndex((s) => s.id === sub.id);
      if (idx !== -1) this.db.subscriptions[idx] = activated;
    }

    this.syncPaymentState();
    this.save();

    return {
      subscription: { ...(activated || sub) },
      invoice: { ...paidInvoice },
    };
  }

  simulatePaymentFail(invoiceId: number): { subscription: Subscription; invoice: Invoice } {
    const invoice = this.paymentService.getInvoices().find((i) => i.id === invoiceId);
    if (!invoice) throw new Error('Счёт не найден');

    const sub = this.db.subscriptions.find((s) => s.id === invoice.subscriptionId);
    if (!sub) throw new Error('Подписка не найдена');

    const failedInvoice = this.paymentService.simulatePaymentFail(sub.id, invoice.planTier ?? 'business', invoice.plan ?? 'monthly');
    const restored = transition(sub, { type: 'PAYMENT_FAILED' });
    if (restored) {
      const idx = this.db.subscriptions.findIndex((s) => s.id === sub.id);
      if (idx !== -1) this.db.subscriptions[idx] = restored;
    }

    this.syncPaymentState();
    this.save();

    return {
      subscription: { ...(restored || sub) },
      invoice: { ...failedInvoice },
    };
  }

  adminBlockSubscription(userId: number, reason: string): Subscription {
    const sub = this.db.subscriptions.find((s) => s.userId === userId);
    if (!sub) throw new Error('Подписка не найдена');

    const blocked = transition(sub, { type: 'ADMIN_BLOCK', reason });
    if (blocked) {
      const idx = this.db.subscriptions.findIndex((s) => s.id === sub.id);
      if (idx !== -1) this.db.subscriptions[idx] = blocked;
      this.save();
      return { ...blocked };
    }
    return { ...sub };
  }

  getBillingInvoices(): Invoice[] {
    const userId = this.db.currentUserId;
    if (!userId) throw new Error('Не авторизован');
    const sub = this.db.subscriptions.find((s) => s.userId === userId);
    if (!sub) return [];
    return this.paymentService.getInvoicesBySubscription(sub.id);
  }

  getBillingLogs(): PaymentLog[] {
    return this.paymentService.getLogs();
  }

  private syncPaymentState(): void {
    const state = this.paymentService.getState();
    this.db.invoices = state.invoices;
    this.db.paymentLogs = state.logs;
  }

  /* ================================================================
     PORTALS (Super Admin)
     ================================================================ */
  getAllPortals(): Portal[] {
    return [...this.db.portals];
  }

  getPortal(id: string): Portal {
    const portal = this.db.portals.find((p) => p.id === id);
    if (!portal) throw new Error('Портал не найден');
    return { ...portal };
  }

  createPortal(data: PortalCreate): Portal {
    const now = new Date().toISOString();
    const portal: Portal = {
      id: `portal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      ownerEmail: data.ownerEmail,
      createdAt: now,
      usersCount: 0,
      subscription: {
        plan: data.subscription?.plan || 'free',
        isPaid: data.subscription?.isPaid ?? false,
        paidUntil: data.subscription?.paidUntil || null,
      },
      status: data.status || 'active',
      limits: {
        maxUsers: data.limits?.maxUsers || 10,
        maxStorageMb: data.limits?.maxStorageMb || 1000,
      },
    };

    // Проверка просроченной подписки
    if (portal.subscription.paidUntil && new Date(portal.subscription.paidUntil) < new Date()) {
      portal.subscription.isPaid = false;
    }

    this.db.portals.push(portal);
    this.save();
    return { ...portal };
  }

  updatePortal(id: string, data: PortalUpdate): Portal {
    const idx = this.db.portals.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Портал не найден');

    const portal = this.db.portals[idx];

    if (data.name !== undefined) portal.name = data.name;
    if (data.status !== undefined) portal.status = data.status;
    if (data.usersCount !== undefined) portal.usersCount = data.usersCount;

    if (data.subscription) {
      if (data.subscription.plan !== undefined) portal.subscription.plan = data.subscription.plan;
      if (data.subscription.isPaid !== undefined) portal.subscription.isPaid = data.subscription.isPaid;
      if (data.subscription.paidUntil !== undefined) {
        portal.subscription.paidUntil = data.subscription.paidUntil;
        // Автоматическая проверка просрочки
        if (portal.subscription.paidUntil && new Date(portal.subscription.paidUntil) < new Date()) {
          portal.subscription.isPaid = false;
        } else if (portal.subscription.paidUntil && new Date(portal.subscription.paidUntil) >= new Date()) {
          portal.subscription.isPaid = true;
        }
      }
    }

    if (data.limits) {
      if (data.limits.maxUsers !== undefined) portal.limits.maxUsers = data.limits.maxUsers;
      if (data.limits.maxStorageMb !== undefined) portal.limits.maxStorageMb = data.limits.maxStorageMb;
    }

    this.save();
    return { ...portal };
  }

  deletePortal(id: string): void {
    const idx = this.db.portals.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Портал не найден');
    // Hard delete - полностью удаляем портал из массива
    this.db.portals.splice(idx, 1);
    this.save();
  }

  blockPortal(id: string): Portal {
    const portal = this.updatePortal(id, { status: 'blocked' });
    return portal;
  }

  unblockPortal(id: string): Portal {
    const portal = this.updatePortal(id, { status: 'active' });
    return portal;
  }

  /* ================================================================
     REPORTS
     ================================================================ */
  getProjectReport(projectId: number): ProjectReport {
    const project = this.getProject(projectId);

    const workLogs = this.db.workLogs.filter((wl) => wl.project_id === projectId);
    const payouts = this.db.payouts.filter((x) => x.project_id === projectId);

    const totalCashIn = this.db.cashIns
      .filter((x) => x.project_id === projectId)
      .reduce((s, x) => s + x.amount, 0);
    const totalExpenses = this.db.expenses
      .filter((x) => x.project_id === projectId)
      .reduce((s, x) => s + x.amount, 0);
    const totalAccrued = workLogs.reduce((s, x) => s + x.accrued_amount, 0);
    const totalPaid = payouts.reduce((s, x) => s + x.amount, 0);

    /* Итого факт расход = прочие расходы + выплачено бригадам */
    const totalFactExpense = totalExpenses + totalPaid;
    /* Баланс (касса) = пришло денег − итого факт расход */
    const balance = totalCashIn - totalFactExpense;
    /* Прогноз прибыли = контракт − (прочие расходы + начислено бригадам) */
    const forecastProfit = project.contract_amount - (totalExpenses + totalAccrued);
    /* Отклонение от плана = факт. себестоимость − плановая (отриц. = уложились в план) */
    const planDeviation = (totalExpenses + totalAccrued) - project.planned_cost;

    /* Сводка по бригадам */
    const crewMap = new Map<number, { accrued: number; paid: number }>();
    for (const wl of workLogs) {
      const entry = crewMap.get(wl.crew_id) || { accrued: 0, paid: 0 };
      entry.accrued += wl.accrued_amount;
      crewMap.set(wl.crew_id, entry);
    }
    for (const p of payouts) {
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

/** Глобальный доступ к store для кнопки «Сбросить демо» (только в режиме разработки) */
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__mockStore = store;
}

/** Экспорт для тестов */
export { MockStore };

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

  // Функция для строковых ID (например, для порталов)
  const matchString = (pattern: string): RegExpMatchArray | null => {
    const re = new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$');
    return p.match(re);
  };

  /* --- AUTH --- */
  if (m === 'POST' && p === '/auth/login') return store.login(data.username, data.password);
  if (m === 'POST' && p === '/auth/register') return store.register(data);
  if (m === 'GET' && p === '/auth/me') return store.getMe();
  if (m === 'PUT' && p === '/auth/profile') return store.updateProfile(data);
  if (m === 'POST' && p === '/auth/change-password') return store.changePassword(data);

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
  if (m === 'POST' && p === '/work-types/adjust-rates') {
    const percentage = (data as { percentage: number }).percentage;
    return store.adjustAllRates(percentage);
  }

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
  if (m === 'GET' && p === '/expense-categories') return store.getCustomExpenseCategories();
  if (m === 'POST' && p === '/expense-categories') {
    const name = typeof (data as { name?: string })?.name === 'string' ? (data as { name: string }).name.trim() : '';
    if (name) store.addCustomExpenseCategory(name);
    return store.getCustomExpenseCategories();
  }

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

  /* --- EMPLOYEES --- */
  if (m === 'GET' && p === '/employees') return store.getEmployees();
  r = match('/employees/:id');
  if (r?.groups) {
    const id = Number(r.groups.id);
    if (m === 'GET') return store.getEmployee(id);
    if (m === 'PUT') return store.updateEmployee(id, data);
    if (m === 'DELETE') { store.deleteEmployee(id); return undefined; }
  }
  if (m === 'POST' && p === '/employees') return store.createEmployee(data);

  /* --- ORGANIZATIONS --- */
  if (m === 'GET' && p === '/organizations') return store.getOrganizations();
  r = match('/organizations/:id');
  if (r?.groups) {
    const id = Number(r.groups.id);
    if (m === 'GET') return store.getOrganization(id);
    if (m === 'PUT') return store.updateOrganization(id, data);
    if (m === 'DELETE') { store.deleteOrganization(id); return undefined; }
  }
  if (m === 'POST' && p === '/organizations') return store.createOrganization(data);

  /* --- DOCUMENTS --- */
  if (m === 'GET' && p === '/documents') {
    const cid = searchParams.get('counterparty_id');
    return store.getDocuments(cid ? Number(cid) : undefined);
  }
  r = match('/documents/:id');
  if (r?.groups) {
    const id = Number(r.groups.id);
    if (m === 'GET') return store.getDocument(id);
    if (m === 'PUT') return store.updateDocument(id, data);
    if (m === 'DELETE') { store.deleteDocument(id); return undefined; }
  }
  if (m === 'POST' && p === '/documents') return store.createDocument(data);

  /* --- COUNTERPARTIES --- */
  if (m === 'GET' && p === '/counterparties') return store.getCounterparties();
  r = match('/counterparties/:id');
  if (r?.groups) {
    const id = Number(r.groups.id);
    if (m === 'GET') return store.getCounterparty(id);
    if (m === 'PUT') return store.updateCounterparty(id, data);
    if (m === 'DELETE') { store.deleteCounterparty(id); return undefined; }
  }
  if (m === 'POST' && p === '/counterparties') return store.createCounterparty(data);

  /* --- BILLING --- */
  if (m === 'GET' && p === '/billing/subscription') return store.getSubscription();
  if (m === 'GET' && p === '/billing/portal-subscription') return store.getPortalSubscription();
  if (m === 'POST' && p === '/billing/subscribe') return store.subscribe(data.planTier, data.planInterval);
  if (m === 'POST' && p === '/billing/simulate-payment-success') return store.simulatePaymentSuccess(data.invoiceId);
  if (m === 'POST' && p === '/billing/simulate-payment-fail') return store.simulatePaymentFail(data.invoiceId);
  if (m === 'POST' && p === '/billing/block') return store.adminBlockSubscription(data.userId, data.reason);
  if (m === 'GET' && p === '/billing/invoices') return store.getBillingInvoices();
  if (m === 'GET' && p === '/billing/logs') return store.getBillingLogs();

  /* --- PORTALS (Super Admin) --- */
  if (m === 'GET' && p === '/super-admin/portals') return store.getAllPortals();
  if (m === 'POST' && p === '/super-admin/portals') return store.createPortal(data);
  
  // Порталы используют строковые ID, поэтому используем matchString
  r = matchString('/super-admin/portals/:id');
  if (r?.groups) {
    const id = r.groups.id;
    if (m === 'GET') return store.getPortal(id);
    if (m === 'PUT') return store.updatePortal(id, data);
    if (m === 'DELETE') { store.deletePortal(id); return undefined; }
  }
  
  r = matchString('/super-admin/portals/:id/block');
  if (r?.groups && m === 'POST') return store.blockPortal(r.groups.id);
  r = matchString('/super-admin/portals/:id/unblock');
  if (r?.groups && m === 'POST') return store.unblockPortal(r.groups.id);

  /* --- REPORTS --- */
  r = match('/reports/project/:id');
  if (r?.groups && m === 'GET') return store.getProjectReport(Number(r.groups.id));

  throw new Error(`[Mock] Маршрут не найден: ${m} ${p}`);
}
