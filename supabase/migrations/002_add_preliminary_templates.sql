-- =============================================
-- Migration: Add preliminary_templates table
-- Date: 2026-04-23
-- Description: Add table for shared Word templates
--              so all authorized users can access them.
-- =============================================

-- =============================================
-- Step 1: Create table
-- =============================================
CREATE TABLE IF NOT EXISTS preliminary_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  file_name TEXT NOT NULL,
  content_type TEXT DEFAULT 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  size INTEGER DEFAULT 0,
  content TEXT NOT NULL DEFAULT '',
  fields JSONB DEFAULT '[]',
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_by_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_preliminary_templates_created_at ON preliminary_templates(created_at);

-- =============================================
-- Step 2: Enable RLS
-- =============================================
ALTER TABLE preliminary_templates ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Step 3: Create permissive policy for anon role
-- =============================================
CREATE POLICY "anon_all_access" ON preliminary_templates FOR ALL USING (true) WITH CHECK (true);
