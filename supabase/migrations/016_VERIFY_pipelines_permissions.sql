-- =====================================================
-- Verification Script: Pipelines Permissions
-- =====================================================
-- Run these queries AFTER executing 016_add_pipelines_permissions.sql
-- to verify that pipelines permissions were successfully added
-- =====================================================

-- =====================================================
-- 1. Check Permissions by Role
-- =====================================================
-- Shows which pipelines permissions each system role has

SELECT
  slug as role_name,
  permissions ? 'pipelines.view' as has_view,
  permissions ? 'pipelines.create' as has_create,
  permissions ? 'pipelines.edit' as has_edit,
  permissions ? 'pipelines.delete' as has_delete,
  jsonb_array_length(permissions) as total_permissions
FROM roles
WHERE is_system = true
ORDER BY
  CASE slug
    WHEN 'admin' THEN 1
    WHEN 'manager' THEN 2
    WHEN 'agent' THEN 3
    WHEN 'member' THEN 4
  END;

-- Expected Output:
-- role_name | has_view | has_create | has_edit | has_delete | total_permissions
-- ----------|----------|------------|----------|------------|------------------
-- admin     | true     | true       | true     | true       | 50+
-- manager   | true     | true       | true     | true       | 40+
-- agent     | true     | true       | true     | false      | 20+
-- member    | true     | false      | false    | false      | 12

-- =====================================================
-- 2. Check All Organizations Have Pipelines Permissions
-- =====================================================
-- Ensures ALL organizations' roles were updated

SELECT
  o.name as organization_name,
  r.slug as role,
  r.permissions ? 'pipelines.view' as has_view,
  r.permissions ? 'pipelines.create' as has_create
FROM organizations o
JOIN roles r ON r.organization_id = o.id
WHERE r.is_system = true
ORDER BY o.name, r.slug;

-- All rows should show has_view = true (except member for create)

-- =====================================================
-- 3. List All Pipelines Permissions for Admin
-- =====================================================
-- Shows all permissions that contain 'pipelines'

SELECT
  slug,
  jsonb_array_elements_text(permissions) as permission
FROM roles
WHERE slug = 'admin'
  AND is_system = true
  AND permissions::text LIKE '%pipelines%'
LIMIT 1;

-- Should return 4 rows:
-- pipelines.view
-- pipelines.create
-- pipelines.edit
-- pipelines.delete

-- =====================================================
-- 4. Test Dynamic Menu Query (Replace USER_ID)
-- =====================================================
-- Replace 'YOUR_USER_ID' with actual user UUID
-- Tests if 'crm_pipelines' menu item is accessible

SELECT
  key,
  name,
  path,
  required_permission,
  has_permission
FROM get_user_menu('YOUR_USER_ID'::uuid, 'en')
WHERE key = 'crm_pipelines';

-- Expected Output:
-- key            | name      | path           | required_permission | has_permission
-- ---------------|-----------|----------------|---------------------|---------------
-- crm_pipelines  | Pipelines | /crm/pipelines | pipelines.view      | true

-- If has_permission = false, user doesn't have pipelines.view

-- =====================================================
-- 5. Get Your User ID (if you don't know it)
-- =====================================================
-- Replace YOUR_EMAIL with your actual email

SELECT
  id as user_id,
  email,
  full_name,
  role
FROM users
WHERE email = 'YOUR_EMAIL@example.com';

-- Copy the user_id and use it in query #4 above

-- =====================================================
-- 6. Test Full Menu Tree with Pipelines (Replace USER_ID)
-- =====================================================
-- Shows the complete CRM menu structure

SELECT
  m.key,
  m.parent_key,
  m.name,
  m.path,
  m.required_permission,
  m.has_permission
FROM get_user_menu('YOUR_USER_ID'::uuid, 'en') m
WHERE m.key LIKE 'crm%'
ORDER BY m.display_order;

-- Should show all CRM menu items including crm_pipelines

-- =====================================================
-- 7. Count Permissions Before and After (Historical)
-- =====================================================
-- Shows how many permissions were added

SELECT
  slug,
  jsonb_array_length(permissions) as permission_count
FROM roles
WHERE is_system = true
ORDER BY slug;

-- Compare with previous counts:
-- admin: ~40 → ~44 (+4 pipelines permissions)
-- manager: ~35 → ~39 (+4 pipelines permissions)
-- agent: ~17 → ~20 (+3 pipelines permissions)
-- member: ~11 → ~12 (+1 pipelines permission)

-- =====================================================
-- 8. Check Specific User's Effective Permissions
-- =====================================================
-- See ALL permissions a specific user has (including custom grants/revokes)
-- Replace YOUR_USER_ID with actual UUID

SELECT
  u.email,
  u.full_name,
  r.slug as role,
  r.permissions as role_permissions,
  u.permissions->'grant' as custom_grants,
  u.permissions->'revoke' as custom_revokes
FROM users u
JOIN roles r ON r.id = u.role_id
WHERE u.id = 'YOUR_USER_ID'::uuid;

-- =====================================================
-- Troubleshooting
-- =====================================================

-- If pipelines permissions are NOT showing:
-- 1. Verify migration 016 was executed successfully
-- 2. Check for errors in Supabase SQL Editor
-- 3. Verify roles table exists and has system roles
-- 4. Run query #1 above to see current permissions

-- If menu item not appearing:
-- 1. Verify menu_items table has 'crm_pipelines' entry
-- 2. Check required_permission = 'pipelines.view'
-- 3. Run query #4 with your user_id
-- 4. Clear browser cache and reload frontend

-- If permission checks failing on frontend:
-- 1. Check Frontend/src/pages/Pipelines.jsx uses correct permission keys
-- 2. Verify hasPermission() function in permissionUtils.js
-- 3. Check browser console for permission errors
-- 4. Verify JWT token includes user role

-- =====================================================
-- Quick Fix: Manually Add Pipelines Permissions to One Role
-- =====================================================
-- If migration didn't work, manually add for testing:

-- UPDATE roles
-- SET permissions = permissions || jsonb_build_array(
--   'pipelines.view',
--   'pipelines.create',
--   'pipelines.edit',
--   'pipelines.delete'
-- )
-- WHERE slug = 'admin'
--   AND is_system = true
--   AND organization_id = 'YOUR_ORG_ID'::uuid;

-- =====================================================
-- Done! Next Steps:
-- =====================================================
-- 1. Login to your application (http://localhost:5173)
-- 2. Check sidebar - "Pipelines" should appear under CRM menu
-- 3. Click Pipelines - page should load without permission error
-- 4. Verify create/edit/delete buttons appear (if you have those permissions)
-- =====================================================
