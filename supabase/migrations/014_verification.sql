-- =====================================================
-- Migration 014 Verification Queries
-- =====================================================
-- Run these queries AFTER executing 014_custom_roles.sql
-- to verify the migration completed successfully
-- =====================================================

-- =====================================================
-- 1. Check roles table structure
-- =====================================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'roles'
ORDER BY ordinal_position;

-- =====================================================
-- 2. Check that all organizations have 4 system roles
-- =====================================================
SELECT
  o.name as organization_name,
  COUNT(r.id) as role_count,
  STRING_AGG(r.slug, ', ' ORDER BY r.slug) as roles
FROM organizations o
LEFT JOIN roles r ON r.organization_id = o.id AND r.is_system = true
GROUP BY o.id, o.name
ORDER BY o.name;

-- Expected: Each organization should have 4 roles (admin, agent, manager, member)

-- =====================================================
-- 3. Check that all users have role_id assigned
-- =====================================================
SELECT
  COUNT(*) as total_users,
  COUNT(role_id) as users_with_role_id,
  COUNT(*) - COUNT(role_id) as users_without_role_id
FROM users;

-- Expected: users_without_role_id should be 0

-- =====================================================
-- 4. Check role/role_id sync (both columns match)
-- =====================================================
SELECT
  u.id,
  u.email,
  u.role as legacy_role_slug,
  r.slug as role_id_slug,
  r.name as role_name,
  CASE
    WHEN u.role = r.slug THEN '✓ Synced'
    ELSE '✗ MISMATCH'
  END as sync_status
FROM users u
JOIN roles r ON r.id = u.role_id
ORDER BY u.email;

-- Expected: All rows should show "✓ Synced"

-- =====================================================
-- 5. Check trigger function exists
-- =====================================================
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_sync_user_role';

-- Expected: One row showing the trigger on users table

-- =====================================================
-- 6. Check helper function exists
-- =====================================================
SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_name = 'get_user_role_slug';

-- Expected: One function returning VARCHAR

-- =====================================================
-- 7. View all roles with permission counts
-- =====================================================
SELECT
  o.name as organization_name,
  r.name as role_name,
  r.slug,
  r.is_system,
  jsonb_array_length(r.permissions) as permission_count,
  r.created_at
FROM roles r
JOIN organizations o ON o.id = r.organization_id
ORDER BY o.name, r.is_system DESC, r.name;

-- =====================================================
-- 8. Check RLS policies on roles table
-- =====================================================
SELECT
  policyname as policy_name,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'roles'
ORDER BY policyname;

-- Expected: 4 policies (SELECT, INSERT, UPDATE, DELETE)

-- =====================================================
-- 9. Test trigger by viewing a sample user
-- =====================================================
-- This just shows the current state - you can manually test
-- by updating a user's role_id and checking if role slug updates
SELECT
  u.email,
  u.role as role_slug,
  u.role_id,
  r.slug as role_slug_from_join,
  r.name as role_name,
  r.permissions
FROM users u
JOIN roles r ON r.id = u.role_id
LIMIT 3;

-- =====================================================
-- Summary Check
-- =====================================================
SELECT
  'Migration Status' as check_type,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles')
    THEN '✓ roles table exists'
    ELSE '✗ roles table missing'
  END as status
UNION ALL
SELECT
  'System Roles',
  CASE
    WHEN (SELECT COUNT(DISTINCT slug) FROM roles WHERE is_system = true) = 4
    THEN '✓ All 4 system roles created'
    ELSE '✗ Missing system roles'
  END
UNION ALL
SELECT
  'User Migration',
  CASE
    WHEN (SELECT COUNT(*) FROM users WHERE role_id IS NULL) = 0
    THEN '✓ All users have role_id'
    ELSE '✗ Some users missing role_id'
  END
UNION ALL
SELECT
  'Sync Trigger',
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_sync_user_role')
    THEN '✓ Sync trigger created'
    ELSE '✗ Sync trigger missing'
  END;

-- =====================================================
-- END OF VERIFICATION
-- =====================================================
