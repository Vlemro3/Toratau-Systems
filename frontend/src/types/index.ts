/* ============================================================
   Типы данных приложения «Toratau Systems»
   ============================================================ */

/** Роли пользователей */
export type UserRole = 'admin' | 'foreman' | 'superAdmin';

/** Статусы объекта */
export type ProjectStatus = 'new' | 'in_progress' | 'paused' | 'completed' | 'archived';

/** Статусы записи о выполненной работе */
export type WorkLogStatus = 'draft' | 'pending' | 'approved' | 'rejected';

/** Статусы выплаты бригаде */
export type PayoutStatus = 'created' | 'approved' | 'cancelled';

/** Встроенные категории расходов; допускаются и пользовательские (строка — название) */
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
  /** Идентификатор портала (для мультитенантности; при регистрации создаётся свой портал) */
  portal_id?: string;
  /** ID объектов, к которым имеет доступ (актуально для foreman) */
  project_ids?: number[];
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
  /** Идентификатор портала (данные изолированы по порталу) */
  portal_id?: string;
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

/* ---- Бригада / подрядчик ---- */
export interface Crew {
  id: number;
  name: string;
  contact: string;
  phone?: string;
  notes: string;
  is_active: boolean;
}

export interface CrewCreate {
  name: string;
  contact: string;
  phone?: string;
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
  updated_by?: number | null;
  status: WorkLogStatus;
  accrued_amount: number;
  project?: Project;
  crew?: Crew;
  work_type?: WorkType;
  creator?: User;
  updated_by_user?: User;
}

export interface WorkLogCreate {
  project_id: number;
  crew_id: number;
  work_type_id: number;
  date: string;
  volume: number;
  /** Сумма начисления — заполняется вручную */
  accrued_amount: number;
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
  updated_by?: number | null;
  creator?: User;
  updated_by_user?: User;
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
  /** Встроенный ключ (materials/tools/transport/other) или пользовательское название */
  category: string;
  comment: string;
  file_url: string | null;
  created_by: number;
  updated_by?: number | null;
  creator?: User;
  updated_by_user?: User;
}

export interface ExpenseCreate {
  project_id: number;
  date: string;
  amount: number;
  category: string;
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
  updated_by?: number | null;
  approved_by: number | null;
  crew?: Crew;
  creator?: User;
  updated_by_user?: User;
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

/* ---- Сотрудник (привязан к порталу) ---- */
export interface Employee {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  portal_id: string;
  created_at: string;
  /** ID назначенных объектов (для foreman) */
  project_ids?: number[];
}

export interface EmployeeCreate {
  username: string;
  password: string;
  full_name: string;
  role: UserRole;
  /** ID назначенных объектов (обязательно для foreman) */
  project_ids?: number[];
}

/* ---- Тип организации ---- */
export type OrgType = 'ip' | 'legal' | 'self_employed' | 'individual';

/* ---- Организация ---- */
export interface Organization {
  id: number;
  org_type: OrgType;
  name: string;
  comment: string;
  inn: string;
  kpp: string;
  address: string;
  ogrn: string;
  ogrn_date: string;
  director_title: string;
  director_name: string;
  chief_accountant: string;
  phone: string;
  email: string;
  telegram: string;
  website: string;
  edo_operator: string;
  bank_account: string;
  personal_account: string;
  bik: string;
  bank_name: string;
  corr_account: string;
  bank_address: string;
  sender_type: string;
  permit_title: string;
  permit_name: string;
  release_title: string;
  release_name: string;
  responsible_title: string;
  responsible_name: string;
  economic_entity: string;
  invoice_message: string;
  add_stamp_to_invoice: boolean;
  add_logo_to_invoice: boolean;
  add_qr_to_invoice: boolean;
  add_contacts_to_invoice: boolean;
  act_conditions: string;
  order_conditions: string;
  created_at: string;
}

export interface OrganizationCreate {
  org_type: OrgType;
  name: string;
  comment?: string;
  inn?: string;
  kpp?: string;
  address?: string;
  ogrn?: string;
  ogrn_date?: string;
  director_title?: string;
  director_name?: string;
  chief_accountant?: string;
  phone?: string;
  email?: string;
  telegram?: string;
  website?: string;
  edo_operator?: string;
  bank_account?: string;
  personal_account?: string;
  bik?: string;
  bank_name?: string;
  corr_account?: string;
  bank_address?: string;
  sender_type?: string;
  permit_title?: string;
  permit_name?: string;
  release_title?: string;
  release_name?: string;
  responsible_title?: string;
  responsible_name?: string;
  economic_entity?: string;
  invoice_message?: string;
  add_stamp_to_invoice?: boolean;
  add_logo_to_invoice?: boolean;
  add_qr_to_invoice?: boolean;
  add_contacts_to_invoice?: boolean;
  act_conditions?: string;
  order_conditions?: string;
}

/* ---- Контрагент ---- */
export interface Counterparty {
  id: number;
  org_type: OrgType;
  name: string;
  comment: string;
  inn: string;
  kpp: string;
  address: string;
  ogrn: string;
  ogrn_date: string;
  director_title: string;
  director_name: string;
  chief_accountant: string;
  phone: string;
  email: string;
  website: string;
  edo_operator: string;
  bank_account: string;
  personal_account: string;
  bik: string;
  bank_name: string;
  corr_account: string;
  bank_address: string;
  receiver_type: string;
  receiver_title: string;
  receiver_name: string;
  responsible_title: string;
  responsible_name: string;
  economic_entity: string;
  created_at: string;
}

export interface CounterpartyCreate {
  org_type: OrgType;
  name: string;
  comment?: string;
  inn?: string;
  kpp?: string;
  address?: string;
  ogrn?: string;
  ogrn_date?: string;
  director_title?: string;
  director_name?: string;
  chief_accountant?: string;
  phone?: string;
  email?: string;
  website?: string;
  edo_operator?: string;
  bank_account?: string;
  personal_account?: string;
  bik?: string;
  bank_name?: string;
  corr_account?: string;
  bank_address?: string;
  receiver_type?: string;
  receiver_title?: string;
  receiver_name?: string;
  responsible_title?: string;
  responsible_name?: string;
  economic_entity?: string;
}

/* ---- Документ контрагента ---- */
export interface DocLineItem {
  name: string;
  unit: string;
  qty: number;
  price: number;
  // Дополнительные поля для счета-фактуры
  code?: string;
  product_type_code?: string;
  okei_code?: string;
  country_code?: string;
  country_name?: string;
  customs_declaration?: string;
  // Дополнительные поля для ТОРГ-12
  packaging_type?: string;
  packaging_qty?: string;
  places_count?: string;
  mass_kg?: string;
  // Дополнительные поля для КС-3
  cost_from_start?: number;
  cost_from_year_start?: number;
  cost_for_period?: number;
}

export interface CpDocument {
  id: number;
  counterparty_id: number;
  organization_id: number | null;
  doc_type: string;
  number: string;
  date: string;
  basis: string;
  items: DocLineItem[];
  notes: string;
  taxation?: string;
  // Дополнительные поля для акта КС-2
  investor_id?: number | null;
  construction_name?: string;
  construction_address?: string;
  object_name?: string;
  okdp?: string;
  contract_number?: string;
  contract_date?: string;
  operation_type?: string;
  estimated_cost?: number;
  period_from?: string;
  period_to?: string;
  print_vat_amounts?: boolean;
  // Дополнительные поля для акта приема-передачи помещения
  contract_creation_date?: string;
  contract_location?: string;
  premises_area?: number;
  premises_address?: string;
  transfer_date_from?: string;
  premises_condition?: string;
  // Дополнительные поля для доверенности на получение ТМЦ
  valid_until?: string;
  goods_source?: string;
  person_name_dative?: string;
  passport_series?: string;
  passport_number?: string;
  passport_issued_by?: string;
  passport_issue_date?: string;
  consumer_type?: string;
  payer_type?: string;
  // Дополнительные поля для коммерческого предложения
  text_above?: string;
  text_below?: string;
  // Дополнительные поля для счёта-договора и счёта-оферты
  payment_purpose?: string;
  delivery_address?: string;
  contract_text?: string;
  add_buyer_signature?: boolean;
  // Дополнительные поля для счета-фактуры
  correction_number?: string;
  correction_date?: string;
  advance_invoice?: string;
  payment_doc_number?: string;
  payment_doc_date?: string;
  shipment_doc_name?: string;
  shipment_doc_number?: string;
  shipment_doc_date?: string;
  had_advance_invoices?: boolean;
  state_contract_id?: string;
  currency?: string;
  form_version?: string;
  shipper_type?: string;
  consignee_type?: string;
  // Дополнительные поля для ТОРГ-12
  torg12_form_version?: string;
  torg12_supplier_type?: string;
  torg12_consignee_type?: string;
  basis_number?: string;
  basis_date?: string;
  basis_number2?: string;
  basis_date2?: string;
  transport_waybill_name?: string;
  transport_waybill_number?: string;
  transport_waybill_date?: string;
  attachment_sheets?: number;
  shipment_date_matches_doc?: boolean;
  shipment_date?: string;
  add_discount_markup?: boolean;
  // Дополнительные поля для КС-3
  ks3_reporting_period_from?: string;
  ks3_reporting_period_to?: string;
  total: number;
  created_at: string;
}

export interface CpDocumentCreate {
  counterparty_id: number;
  organization_id?: number | null;
  doc_type: string;
  number?: string;
  date?: string;
  basis?: string;
  items?: DocLineItem[];
  notes?: string;
  taxation?: string;
  // Дополнительные поля для акта КС-2
  investor_id?: number | null;
  construction_name?: string;
  construction_address?: string;
  object_name?: string;
  okdp?: string;
  contract_number?: string;
  contract_date?: string;
  operation_type?: string;
  estimated_cost?: number;
  period_from?: string;
  period_to?: string;
  print_vat_amounts?: boolean;
  // Дополнительные поля для акта приема-передачи помещения
  contract_creation_date?: string;
  contract_location?: string;
  premises_area?: number;
  premises_address?: string;
  transfer_date_from?: string;
  premises_condition?: string;
  // Дополнительные поля для доверенности на получение ТМЦ
  valid_until?: string;
  goods_source?: string;
  person_name_dative?: string;
  passport_series?: string;
  passport_number?: string;
  passport_issued_by?: string;
  passport_issue_date?: string;
  consumer_type?: string;
  payer_type?: string;
  // Дополнительные поля для коммерческого предложения
  text_above?: string;
  text_below?: string;
  // Дополнительные поля для счёта-договора и счёта-оферты
  payment_purpose?: string;
  delivery_address?: string;
  contract_text?: string;
  add_buyer_signature?: boolean;
  // Дополнительные поля для счета-фактуры
  correction_number?: string;
  correction_date?: string;
  advance_invoice?: string;
  payment_doc_number?: string;
  payment_doc_date?: string;
  shipment_doc_name?: string;
  shipment_doc_number?: string;
  shipment_doc_date?: string;
  had_advance_invoices?: boolean;
  state_contract_id?: string;
  currency?: string;
  form_version?: string;
  shipper_type?: string;
  consignee_type?: string;
  // Дополнительные поля для ТОРГ-12
  torg12_form_version?: string;
  torg12_supplier_type?: string;
  torg12_consignee_type?: string;
  basis_number?: string;
  basis_date?: string;
  basis_number2?: string;
  basis_date2?: string;
  transport_waybill_name?: string;
  transport_waybill_number?: string;
  transport_waybill_date?: string;
  attachment_sheets?: number;
  shipment_date_matches_doc?: boolean;
  shipment_date?: string;
  add_discount_markup?: boolean;
  // Дополнительные поля для КС-3
  ks3_reporting_period_from?: string;
  ks3_reporting_period_to?: string;
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

/* ---- Порталы (Super Admin) ---- */
export type PortalPlan = 'free' | 'basic' | 'pro' | 'enterprise';
export type PortalStatus = 'active' | 'blocked';

export interface Portal {
  id: string;
  name: string;
  ownerEmail: string;
  createdAt: string;
  usersCount: number;
  subscription: {
    plan: PortalPlan;
    isPaid: boolean;
    paidUntil: string | null;
  };
  status: PortalStatus;
  limits: {
    maxUsers: number;
    maxStorageMb: number;
  };
}

export interface PortalCreate {
  name: string;
  ownerEmail: string;
  subscription?: {
    plan?: PortalPlan;
    isPaid?: boolean;
    paidUntil?: string | null;
  };
  status?: PortalStatus;
  limits?: {
    maxUsers?: number;
    maxStorageMb?: number;
  };
}

export interface PortalUpdate {
  name?: string;
  subscription?: {
    plan?: PortalPlan;
    isPaid?: boolean;
    paidUntil?: string | null;
  };
  status?: PortalStatus;
  limits?: {
    maxUsers?: number;
    maxStorageMb?: number;
  };
  usersCount?: number;
}

/* ---- Общие ---- */
export interface ApiError {
  detail: string;
}
