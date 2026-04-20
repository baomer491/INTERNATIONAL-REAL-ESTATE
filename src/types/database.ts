// ============================================================
// Auto-generated Supabase database types
// Generated from OpenAPI spec at http://192.168.31.90:54321/rest/v1/
// Tables: employees, reports, banks, beneficiaries, tasks,
//         login_logs, notifications, app_settings, market_cache, drafts
// ============================================================

// ---------- employees ----------
export interface EmployeeRow {
  id: string;                          // uuid, PK, default: uuid_generate_v4()
  full_name: string;                   // text, required
  username: string;                    // text, required
  email: string | null;                // text
  phone: string;                       // text, default: ''
  role: string;                        // text, default: 'viewer'
  status: string;                      // text, default: 'active'
  avatar: string;                      // text, default: ''
  department: string;                  // text, default: ''
  join_date: string;                   // timestamptz, default: now()
  last_login: string | null;           // timestamptz
  last_logout: string | null;          // timestamptz
  is_active_session: boolean;          // boolean, default: false
  permissions: string[] | null;        // text[]
  notes: string;                       // text, default: ''
  created_at: string;                  // timestamptz, default: now()
  updated_at: string;                  // timestamptz, default: now()
  password_hash: string | null;        // text
}

export interface EmployeeInsert {
  id?: string;
  full_name: string;
  username: string;
  email?: string | null;
  phone?: string;
  role?: string;
  status?: string;
  avatar?: string;
  department?: string;
  join_date?: string;
  last_login?: string | null;
  last_logout?: string | null;
  is_active_session?: boolean;
  permissions?: string[] | null;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  password_hash?: string | null;
}

export interface EmployeeUpdate {
  id?: string;
  full_name?: string;
  username?: string;
  email?: string | null;
  phone?: string;
  role?: string;
  status?: string;
  avatar?: string;
  department?: string;
  join_date?: string;
  last_login?: string | null;
  last_logout?: string | null;
  is_active_session?: boolean;
  permissions?: string[] | null;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  password_hash?: string | null;
}

// ---------- reports ----------
export interface ReportRow {
  id: string;                          // uuid, PK
  report_number: string;               // text, required
  bank_id: string | null;              // uuid, FK -> banks.id
  bank_name: string;                   // text, default: ''
  beneficiary_id: string | null;       // uuid, FK -> beneficiaries.id
  beneficiary_name: string;            // text, default: ''
  beneficiary_civil_id: string;        // text, default: ''
  beneficiary_phone: string;           // text, default: ''
  beneficiary_email: string;           // text, default: ''
  beneficiary_address: string;         // text, default: ''
  beneficiary_relation: string;        // text, default: 'owner'
  beneficiary_workplace: string;       // text, default: ''
  applicant_name: string;              // text, default: ''
  property_type: string;               // text, required, default: 'land'
  property_usage: string;              // text, required, default: 'residential'
  property_condition: string;          // text, required, default: 'average'
  property_details: Record<string, unknown> | null;     // jsonb
  documents: unknown[] | null;                          // jsonb
  extracted_data: Record<string, unknown> | null;       // jsonb
  valuation: Record<string, unknown> | null;            // jsonb
  status: string;                      // text, required, default: 'draft'
  approval: Record<string, unknown> | null;             // jsonb
  appraiser_id: string | null;         // uuid, FK -> employees.id
  appraiser_name: string;              // text, default: ''
  fees: number;                        // numeric, default: 0
  notes: string;                       // text, default: ''
  purpose_of_valuation: string;        // text, default: ''
  apartment_details: Record<string, unknown> | null;    // jsonb
  created_at: string;                  // timestamptz, default: now()
  updated_at: string;                  // timestamptz, default: now()
}

export interface ReportInsert {
  id?: string;
  report_number: string;
  bank_id?: string | null;
  bank_name?: string;
  beneficiary_id?: string | null;
  beneficiary_name?: string;
  beneficiary_civil_id?: string;
  beneficiary_phone?: string;
  beneficiary_email?: string;
  beneficiary_address?: string;
  beneficiary_relation?: string;
  beneficiary_workplace?: string;
  applicant_name?: string;
  property_type?: string;
  property_usage?: string;
  property_condition?: string;
  property_details?: Record<string, unknown> | null;
  documents?: unknown[] | null;
  extracted_data?: Record<string, unknown> | null;
  valuation?: Record<string, unknown> | null;
  status?: string;
  approval?: Record<string, unknown> | null;
  appraiser_id?: string | null;
  appraiser_name?: string;
  fees?: number;
  notes?: string;
  purpose_of_valuation?: string;
  apartment_details?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export interface ReportUpdate {
  id?: string;
  report_number?: string;
  bank_id?: string | null;
  bank_name?: string;
  beneficiary_id?: string | null;
  beneficiary_name?: string;
  beneficiary_civil_id?: string;
  beneficiary_phone?: string;
  beneficiary_email?: string;
  beneficiary_address?: string;
  beneficiary_relation?: string;
  beneficiary_workplace?: string;
  applicant_name?: string;
  property_type?: string;
  property_usage?: string;
  property_condition?: string;
  property_details?: Record<string, unknown> | null;
  documents?: unknown[] | null;
  extracted_data?: Record<string, unknown> | null;
  valuation?: Record<string, unknown> | null;
  status?: string;
  approval?: Record<string, unknown> | null;
  appraiser_id?: string | null;
  appraiser_name?: string;
  fees?: number;
  notes?: string;
  purpose_of_valuation?: string;
  apartment_details?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

// ---------- banks ----------
export interface BankRow {
  id: string;                          // uuid, PK
  name: string;                        // text, required
  name_en: string;                     // text, default: ''
  logo: string;                        // text, default: ''
  is_active: boolean;                  // boolean, default: true
  report_template: string;             // text, default: ''
  contact_person: string;              // text, default: ''
  phone: string;                       // text, default: ''
  email: string;                       // text, default: ''
  address: string;                     // text, default: ''
  created_at: string;                  // timestamptz, default: now()
  updated_at: string;                  // timestamptz, default: now()
}

export interface BankInsert {
  id?: string;
  name: string;
  name_en?: string;
  logo?: string;
  is_active?: boolean;
  report_template?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BankUpdate {
  id?: string;
  name?: string;
  name_en?: string;
  logo?: string;
  is_active?: boolean;
  report_template?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

// ---------- beneficiaries ----------
export interface BeneficiaryRow {
  id: string;                          // uuid, PK
  full_name: string;                   // text, required
  civil_id: string;                    // text, default: ''
  phone: string;                       // text, default: ''
  email: string;                       // text, default: ''
  address: string;                     // text, default: ''
  relation: string;                    // text, required, default: 'owner'
  workplace: string;                   // text, default: ''
  notes: string;                       // text, default: ''
  reports_count: number;               // integer, default: 0
  last_report_date: string | null;     // timestamptz
  bank_ids: string[] | null;           // uuid[]
  created_at: string;                  // timestamptz, default: now()
  updated_at: string;                  // timestamptz, default: now()
}

export interface BeneficiaryInsert {
  id?: string;
  full_name: string;
  civil_id?: string;
  phone?: string;
  email?: string;
  address?: string;
  relation?: string;
  workplace?: string;
  notes?: string;
  reports_count?: number;
  last_report_date?: string | null;
  bank_ids?: string[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface BeneficiaryUpdate {
  id?: string;
  full_name?: string;
  civil_id?: string;
  phone?: string;
  email?: string;
  address?: string;
  relation?: string;
  workplace?: string;
  notes?: string;
  reports_count?: number;
  last_report_date?: string | null;
  bank_ids?: string[] | null;
  created_at?: string;
  updated_at?: string;
}

// ---------- tasks ----------
export interface TaskRow {
  id: string;                          // uuid, PK
  title: string;                       // text, required
  description: string;                 // text, default: ''
  priority: string;                    // text, required, default: 'medium'
  status: string;                      // text, required, default: 'pending'
  due_date: string;                    // timestamptz, required
  assigned_name: string;               // text, default: ''
  related_report_id: string | null;    // uuid
  related_report_number: string;       // text, default: ''
  created_at: string;                  // timestamptz, default: now()
  assigned_to: string | null;          // uuid, FK -> employees.id
  created_by: string | null;           // uuid, FK -> employees.id
  completed_at: string | null;         // timestamptz
  recurrence: string;                  // text, default: 'none'
  category: string;                    // text, default: 'general'
  created_by_name: string;             // text, default: ''
}

export interface TaskInsert {
  id?: string;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  due_date: string;
  assigned_name?: string;
  related_report_id?: string | null;
  related_report_number?: string;
  created_at?: string;
  assigned_to?: string | null;
  created_by?: string | null;
  completed_at?: string | null;
  recurrence?: string;
  category?: string;
  created_by_name?: string;
}

export interface TaskUpdate {
  id?: string;
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  due_date?: string;
  assigned_name?: string;
  related_report_id?: string | null;
  related_report_number?: string;
  created_at?: string;
  assigned_to?: string | null;
  created_by?: string | null;
  completed_at?: string | null;
  recurrence?: string;
  category?: string;
  created_by_name?: string;
}

// ---------- login_logs ----------
export interface LoginLogRow {
  id: string;                          // uuid, PK
  employee_id: string | null;          // uuid, FK -> employees.id
  employee_name: string;               // text, required
  action: string;                      // text, required
  ip_address: string;                  // text, default: ''
  timestamp: string;                   // timestamptz, default: now()
}

export interface LoginLogInsert {
  id?: string;
  employee_id?: string | null;
  employee_name: string;
  action: string;
  ip_address?: string;
  timestamp?: string;
}

export interface LoginLogUpdate {
  id?: string;
  employee_id?: string | null;
  employee_name?: string;
  action?: string;
  ip_address?: string;
  timestamp?: string;
}

// ---------- notifications ----------
export interface NotificationRow {
  id: string;                          // uuid, PK
  type: string;                        // text, required, default: 'system'
  title: string;                       // text, required
  message: string;                     // text, required
  priority: string;                    // text, required, default: 'medium'
  is_read: boolean;                    // boolean, default: false
  related_report_id: string | null;    // uuid
  created_at: string;                  // timestamptz, default: now()
  target_employee_id: string | null;   // uuid, FK -> employees.id
}

export interface NotificationInsert {
  id?: string;
  type?: string;
  title: string;
  message: string;
  priority?: string;
  is_read?: boolean;
  related_report_id?: string | null;
  created_at?: string;
  target_employee_id?: string | null;
}

export interface NotificationUpdate {
  id?: string;
  type?: string;
  title?: string;
  message?: string;
  priority?: string;
  is_read?: boolean;
  related_report_id?: string | null;
  created_at?: string;
  target_employee_id?: string | null;
}

// ---------- app_settings ----------
export interface AppSettingsRow {
  id: number;                          // integer, PK, default: 1
  office_name: string;                 // text, default: 'مكتب العقارات الدولية'
  office_name_en: string;              // text, default: 'International Real Estate Office'
  logo: string;                        // text, default: '/logo.svg'
  report_prefix: string;               // text, default: 'VER'
  report_next_number: number;          // integer, default: 1
  default_currency: string;            // text, default: 'OMR'
  language: string;                    // text, default: 'ar'
  theme: string;                       // text, default: 'light'
  user_name: string;                   // text, default: ''
  user_role: string;                   // text, default: ''
  user_email: string;                  // text, default: ''
  user_phone: string;                  // text, default: ''
  default_fees: number;                // numeric, default: 500
  fees_ranges: Record<string, { min: number; max: number }> | null;  // jsonb
  updated_at: string;                  // timestamptz, default: now()
}

export interface AppSettingsInsert {
  id?: number;
  office_name?: string;
  office_name_en?: string;
  logo?: string;
  report_prefix?: string;
  report_next_number?: number;
  default_currency?: string;
  language?: string;
  theme?: string;
  user_name?: string;
  user_role?: string;
  user_email?: string;
  user_phone?: string;
  default_fees?: number;
  fees_ranges?: Record<string, { min: number; max: number }> | null;
  updated_at?: string;
}

export interface AppSettingsUpdate {
  id?: number;
  office_name?: string;
  office_name_en?: string;
  logo?: string;
  report_prefix?: string;
  report_next_number?: number;
  default_currency?: string;
  language?: string;
  theme?: string;
  user_name?: string;
  user_role?: string;
  user_email?: string;
  user_phone?: string;
  default_fees?: number;
  fees_ranges?: Record<string, { min: number; max: number }> | null;
  updated_at?: string;
}

// ---------- market_cache ----------
export interface MarketCacheRow {
  id: string;                          // uuid, PK
  cache_key: string;                   // text, required
  wilayat: string;                     // text, default: ''
  property_type: string;               // text, default: ''
  usage: string;                       // text, default: ''
  results: Record<string, unknown> | null;  // jsonb
  avg_price_per_sqm: number;           // numeric, default: 0
  fetched_at: string;                  // timestamptz, default: now()
  expires_at: string;                  // timestamptz, default: now()
}

export interface MarketCacheInsert {
  id?: string;
  cache_key: string;
  wilayat?: string;
  property_type?: string;
  usage?: string;
  results?: Record<string, unknown> | null;
  avg_price_per_sqm?: number;
  fetched_at?: string;
  expires_at?: string;
}

export interface MarketCacheUpdate {
  id?: string;
  cache_key?: string;
  wilayat?: string;
  property_type?: string;
  usage?: string;
  results?: Record<string, unknown> | null;
  avg_price_per_sqm?: number;
  fetched_at?: string;
  expires_at?: string;
}

// ---------- drafts ----------
export interface DraftRow {
  id: string;                          // uuid, PK
  key: string;                         // text, required
  data: Record<string, unknown>;       // jsonb, required
  updated_at: string;                  // timestamptz, default: now()
}

export interface DraftInsert {
  id?: string;
  key: string;
  data: Record<string, unknown>;
  updated_at?: string;
}

export interface DraftUpdate {
  id?: string;
  key?: string;
  data?: Record<string, unknown>;
  updated_at?: string;
}

// ============================================================
// Database schema type map (useful for generic utilities)
// ============================================================
export interface DatabaseSchema {
  employees: {
    Row: EmployeeRow;
    Insert: EmployeeInsert;
    Update: EmployeeUpdate;
  };
  reports: {
    Row: ReportRow;
    Insert: ReportInsert;
    Update: ReportUpdate;
  };
  banks: {
    Row: BankRow;
    Insert: BankInsert;
    Update: BankUpdate;
  };
  beneficiaries: {
    Row: BeneficiaryRow;
    Insert: BeneficiaryInsert;
    Update: BeneficiaryUpdate;
  };
  tasks: {
    Row: TaskRow;
    Insert: TaskInsert;
    Update: TaskUpdate;
  };
  login_logs: {
    Row: LoginLogRow;
    Insert: LoginLogInsert;
    Update: LoginLogUpdate;
  };
  notifications: {
    Row: NotificationRow;
    Insert: NotificationInsert;
    Update: NotificationUpdate;
  };
  app_settings: {
    Row: AppSettingsRow;
    Insert: AppSettingsInsert;
    Update: AppSettingsUpdate;
  };
  market_cache: {
    Row: MarketCacheRow;
    Insert: MarketCacheInsert;
    Update: MarketCacheUpdate;
  };
  drafts: {
    Row: DraftRow;
    Insert: DraftInsert;
    Update: DraftUpdate;
  };
}

export type TableName = keyof DatabaseSchema;
