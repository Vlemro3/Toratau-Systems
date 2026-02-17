/* ============================================================
   Типы данных приложения «Toratau Systems»
   ============================================================ */

/** Роли пользователей */
export type UserRole = 'admin' | 'foreman';

/** Статусы объекта */
export type ProjectStatus = 'new' | 'in_progress' | 'paused' | 'completed' | 'archived';

/** Статусы записи о выполненной работе */
export type WorkLogStatus = 'draft' | 'pending' | 'approved' | 'rejected';

/** Статусы выплаты бригаде */
export type PayoutStatus = 'created' | 'approved' | 'cancelled';

/** Категории расходов */
export type ExpenseCategory = 'materials' | 'tools' | 'transport' | 'other';

/** Способы оплаты */
export type PaymentMethod = 'cash' | 'transfer';

/* ---- Пользователь ---- */
export interface User {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

/* ---- Объект (проект) ---- */
export interface Project {
  id: number;
  name: string;
  address: string;
  client: string;
  start_date: string;
  end_date: string | null;
  status: ProjectStatus;
  contract_amount: number;
  planned_cost: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  address: string;
  client: string;
  start_date: string;
  end_date?: string | null;
  status?: ProjectStatus;
  contract_amount: number;
  planned_cost: number;
  notes?: string;
}

/* ---- Бригада ---- */
export interface Crew {
  id: number;
  name: string;
  contact: string;
  notes: string;
  is_active: boolean;
}

export interface CrewCreate {
  name: string;
  contact: string;
  notes?: string;
  is_active?: boolean;
}

/* ---- Справочник работ ---- */
export interface WorkType {
  id: number;
  name: string;
  unit: string;
  rate: number;
  category: string;
  is_active: boolean;
}

export interface WorkTypeCreate {
  name: string;
  unit: string;
  rate: number;
  category?: string;
  is_active?: boolean;
}

/* ---- Выполненная работа ---- */
export interface WorkLog {
  id: number;
  project_id: number;
  crew_id: number;
  work_type_id: number;
  date: string;
  volume: number;
  comment: string;
  photos: string[];
  created_by: number;
  status: WorkLogStatus;
  accrued_amount: number;
  project?: Project;
  crew?: Crew;
  work_type?: WorkType;
  creator?: User;
}

export interface WorkLogCreate {
  project_id: number;
  crew_id: number;
  work_type_id: number;
  date: string;
  volume: number;
  comment?: string;
}

/* ---- Платёж от заказчика ---- */
export interface CashIn {
  id: number;
  project_id: number;
  date: string;
  amount: number;
  comment: string;
  file_url: string | null;
  created_by: number;
  creator?: User;
}

export interface CashInCreate {
  project_id: number;
  date: string;
  amount: number;
  comment?: string;
}

/* ---- Расход по объекту ---- */
export interface Expense {
  id: number;
  project_id: number;
  date: string;
  amount: number;
  category: ExpenseCategory;
  comment: string;
  file_url: string | null;
  created_by: number;
  creator?: User;
}

export interface ExpenseCreate {
  project_id: number;
  date: string;
  amount: number;
  category: ExpenseCategory;
  comment?: string;
}

/* ---- Выплата бригаде ---- */
export interface Payout {
  id: number;
  project_id: number;
  crew_id: number;
  date: string;
  amount: number;
  payment_method: PaymentMethod;
  comment: string;
  status: PayoutStatus;
  created_by: number;
  approved_by: number | null;
  crew?: Crew;
  creator?: User;
}

export interface PayoutCreate {
  project_id: number;
  crew_id: number;
  date: string;
  amount: number;
  payment_method: PaymentMethod;
  comment?: string;
}

/* ---- Сводка по бригаде на объекте ---- */
export interface CrewSummary {
  crew: Crew;
  accrued: number;
  paid: number;
  debt: number;
}

/* ---- Отчёт по объекту ---- */
export interface ProjectReport {
  project: Project;
  total_cash_in: number;
  total_expenses: number;
  total_accrued: number;
  total_paid: number;
  total_fact_expense: number;
  balance: number;
  forecast_profit: number;
  plan_deviation: number;
  crews_summary: CrewSummary[];
}

/* ---- Авторизация ---- */
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

/* ---- Общие ---- */
export interface ApiError {
  detail: string;
}
