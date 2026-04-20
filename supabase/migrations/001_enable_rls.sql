-- =============================================
-- Migration: Enable Row Level Security (RLS)
-- Date: 2026-04-18
-- Description: Enable RLS on all public tables and create
--              permissive policies for the anon role.
--              The app manages its own auth via session cookies,
--              so anon role gets full access. Unauthenticated
--              requests (no API key) are blocked by Supabase Kong.
--              Service role always bypasses RLS.
-- =============================================

-- =============================================
-- Step 1: Enable RLS on all tables
-- =============================================
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Step 2: Create permissive policies for anon role
-- =============================================
-- The app uses a shared anon key for client-side DB operations
-- and manages authentication internally via session cookies.
-- The anon role is allowed full CRUD on all tables.
-- Requests without a valid API key are rejected at the API gateway (Kong).

CREATE POLICY "anon_all_access" ON employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_access" ON reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_access" ON banks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_access" ON beneficiaries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_access" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_access" ON login_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_access" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_access" ON app_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_access" ON market_cache FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_access" ON drafts FOR ALL USING (true) WITH CHECK (true);
