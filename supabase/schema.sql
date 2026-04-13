-- =============================================
-- International Real Estate Office - Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: employees (users)
-- =============================================
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  phone TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'appraiser', 'reviewer', 'data_entry', 'viewer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  avatar TEXT DEFAULT '',
  department TEXT DEFAULT '',
  join_date TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  last_logout TIMESTAMPTZ,
  is_active_session BOOLEAN DEFAULT FALSE,
  permissions TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE: login_logs
-- =============================================
CREATE TABLE login_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('login', 'logout')),
  ip_address TEXT DEFAULT '',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE: banks
-- =============================================
CREATE TABLE banks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_en TEXT DEFAULT '',
  logo TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  report_template TEXT DEFAULT '',
  contact_person TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE: beneficiaries
-- =============================================
CREATE TABLE beneficiaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  civil_id TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  relation TEXT NOT NULL DEFAULT 'owner' CHECK (relation IN ('owner', 'buyer', 'bank_client', 'legal_representative', 'other')),
  workplace TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  reports_count INTEGER DEFAULT 0,
  last_report_date TIMESTAMPTZ,
  bank_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE: reports
-- =============================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_number TEXT NOT NULL UNIQUE,
  bank_id UUID REFERENCES banks(id) ON DELETE SET NULL,
  bank_name TEXT DEFAULT '',
  beneficiary_id UUID REFERENCES beneficiaries(id) ON DELETE SET NULL,
  beneficiary_name TEXT DEFAULT '',
  beneficiary_civil_id TEXT DEFAULT '',
  beneficiary_phone TEXT DEFAULT '',
  beneficiary_email TEXT DEFAULT '',
  beneficiary_address TEXT DEFAULT '',
  beneficiary_relation TEXT DEFAULT 'owner',
  beneficiary_workplace TEXT DEFAULT '',
  applicant_name TEXT DEFAULT '',
  property_type TEXT NOT NULL DEFAULT 'land',
  property_usage TEXT NOT NULL DEFAULT 'residential',
  property_condition TEXT NOT NULL DEFAULT 'average',
  property_details JSONB DEFAULT '{}',
  documents JSONB DEFAULT '[]',
  extracted_data JSONB DEFAULT '{}',
  valuation JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  approval JSONB DEFAULT '{}',
  appraiser_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  appraiser_name TEXT DEFAULT '',
  fees NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  purpose_of_valuation TEXT DEFAULT '',
  apartment_details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE: notifications
-- =============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('approval', 'report', 'task', 'system', 'reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_read BOOLEAN DEFAULT FALSE,
  related_report_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE: tasks
-- =============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  due_date TIMESTAMPTZ NOT NULL,
  assigned_name TEXT DEFAULT '',
  related_report_id UUID,
  related_report_number TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE: app_settings (singleton)
-- =============================================
CREATE TABLE app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  office_name TEXT DEFAULT 'مكتب العقارات الدولية',
  office_name_en TEXT DEFAULT 'International Real Estate Office',
  logo TEXT DEFAULT '/logo.svg',
  report_prefix TEXT DEFAULT 'VER',
  report_next_number INTEGER DEFAULT 1,
  default_currency TEXT DEFAULT 'OMR',
  language TEXT DEFAULT 'ar',
  theme TEXT DEFAULT 'light',
  user_name TEXT DEFAULT '',
  user_role TEXT DEFAULT '',
  user_email TEXT DEFAULT '',
  user_phone TEXT DEFAULT '',
  default_fees NUMERIC DEFAULT 500,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE: drafts
-- =============================================
CREATE TABLE drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(key)
);

-- =============================================
-- TABLE: market_cache
-- =============================================
CREATE TABLE market_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT NOT NULL UNIQUE,
  wilayat TEXT DEFAULT '',
  property_type TEXT DEFAULT '',
  usage TEXT DEFAULT '',
  results JSONB DEFAULT '[]',
  avg_price_per_sqm NUMERIC DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_bank_id ON reports(bank_id);
CREATE INDEX idx_reports_appraiser_id ON reports(appraiser_id);
CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_beneficiaries_civil_id ON beneficiaries(civil_id);
CREATE INDEX idx_login_logs_employee_id ON login_logs(employee_id);
CREATE INDEX idx_market_cache_expires ON market_cache(expires_at);

-- =============================================
-- DEFAULT SETTINGS ROW
-- =============================================
INSERT INTO app_settings (office_name, office_name_en, logo, report_prefix, report_next_number, default_currency, default_fees)
VALUES ('مكتب العقارات الدولية', 'International Real Estate Office', '/logo.svg', 'VER', 1, 'OMR', 500)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- DEFAULT ADMIN EMPLOYEE
-- =============================================
INSERT INTO employees (id, full_name, username, email, role, status, department, permissions, notes)
VALUES (
  'e0000000-0000-0000-0000-000000000001',
  'مدير النظام',
  'admin',
  'admin@ireo.om',
  'admin',
  'active',
  'الإدارة العامة',
  ARRAY[
    'reports_create','reports_view','reports_edit','reports_delete','reports_export','reports_archive',
    'approvals_view','approvals_approve',
    'employees_view','employees_manage','employees_permissions',
    'banks_manage','beneficiaries_view',
    'settings_manage','archive_view','notifications_view'
  ],
  'حساب مدير النظام الافتراضي'
) ON CONFLICT (username) DO NOTHING;

-- =============================================
-- TRIGGER: updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_banks_updated BEFORE UPDATE ON banks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_beneficiaries_updated BEFORE UPDATE ON beneficiaries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_reports_updated BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_app_settings_updated BEFORE UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_drafts_updated BEFORE UPDATE ON drafts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
