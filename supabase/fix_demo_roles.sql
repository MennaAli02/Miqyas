-- ============================================================
-- fix_demo_roles.sql
-- Give all current users 'officer' role so they can see all
-- demo records regardless of which anonymous session is active.
-- Run in Supabase SQL Editor.
-- ============================================================

-- Upgrade all profiles to officer (for demo only)
update public.profiles set role = 'officer';

-- Verify
select id, full_name, role from public.profiles;
