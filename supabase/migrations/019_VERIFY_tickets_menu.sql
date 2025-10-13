-- =====================================================
-- VERIFY TICKETS MENU & PERMISSIONS
-- =====================================================
-- Run this in Supabase SQL Editor to debug why tickets menu not showing
-- Replace 'YOUR_EMAIL_HERE' with your actual email address
-- =====================================================

-- =====================================================
-- STEP 1: Check if Migration Ran
-- =====================================================

SELECT '=== STEP 1: Verify Migration ===' AS section;

-- Check if tickets menu item exists
SELECT
  'Menu Item Check' AS test,
  CASE
    WHEN EXISTS (SELECT 1 FROM menu_items WHERE key = 'support_tickets')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING - Run migration 019_tickets_module.sql'
  END AS status,
  (SELECT row_to_json(mi.*)
   FROM menu_items mi
   WHERE key = 'support_tickets') AS details;

-- Check if ticket tables exist
SELECT
  'Tickets Table Check' AS test,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'tickets'
    )
    THEN '✅ EXISTS'
    ELSE '❌ MISSING - Run migration 019_tickets_module.sql'
  END AS status;

SELECT
  'Categories Table Check' AS test,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'ticket_categories'
    )
    THEN '✅ EXISTS'
    ELSE '❌ MISSING - Run migration 019_tickets_module.sql'
  END AS status;

-- =====================================================
-- STEP 2: Check Package Features
-- =====================================================

SELECT '=== STEP 2: Verify Package Features ===' AS section;

-- Check if your organization's package has tickets enabled
-- REPLACE 'YOUR_EMAIL_HERE' with your actual email
SELECT
  'Package Tickets Feature' AS test,
  o.name AS organization_name,
  p.slug AS package_slug,
  p.features->>'tickets' AS has_tickets_feature,
  CASE
    WHEN (p.features->>'tickets')::boolean = true
    THEN '✅ ENABLED'
    ELSE '❌ DISABLED - Run fix below'
  END AS status
FROM organizations o
JOIN packages p ON o.package_id = p.id
WHERE o.id = (
  SELECT organization_id FROM users WHERE email = 'YOUR_EMAIL_HERE'
);

-- If above shows DISABLED, run this fix:
-- UPDATE packages
-- SET features = jsonb_set(features, '{tickets}', 'true'::jsonb)
-- WHERE slug IN ('lite', 'professional', 'business', 'enterprise');

-- =====================================================
-- STEP 3: Check User Permissions
-- =====================================================

SELECT '=== STEP 3: Verify User Permissions ===' AS section;

-- Check if your role has tickets.view permission
-- REPLACE 'YOUR_EMAIL_HERE' with your actual email
SELECT
  'User Tickets Permission' AS test,
  u.email,
  u.role AS legacy_role_slug,
  r.name AS role_name,
  r.slug AS role_slug,
  r.is_system,
  CASE
    WHEN r.permissions ? 'tickets.view'
    THEN '✅ HAS PERMISSION'
    ELSE '❌ MISSING PERMISSION - Run fix below'
  END AS status,
  r.permissions
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.email = 'YOUR_EMAIL_HERE';

-- If above shows MISSING PERMISSION, run one of these fixes based on your role:

-- For admin role:
-- UPDATE roles
-- SET permissions = permissions || jsonb_build_array(
--   'tickets.view',
--   'tickets.create',
--   'tickets.edit',
--   'tickets.delete',
--   'tickets.comment',
--   'tickets.assign',
--   'ticket_categories.manage'
-- )
-- WHERE slug = 'admin' AND is_system = true
-- AND NOT (permissions ? 'tickets.view');

-- For manager role:
-- UPDATE roles
-- SET permissions = permissions || jsonb_build_array(
--   'tickets.view',
--   'tickets.create',
--   'tickets.edit',
--   'tickets.comment',
--   'tickets.assign'
-- )
-- WHERE slug = 'manager' AND is_system = true
-- AND NOT (permissions ? 'tickets.view');

-- For agent role:
-- UPDATE roles
-- SET permissions = permissions || jsonb_build_array(
--   'tickets.view',
--   'tickets.create',
--   'tickets.edit',
--   'tickets.comment'
-- )
-- WHERE slug = 'agent' AND is_system = true
-- AND NOT (permissions ? 'tickets.view');

-- For member role:
-- UPDATE roles
-- SET permissions = permissions || jsonb_build_array(
--   'tickets.view',
--   'tickets.create',
--   'tickets.comment'
-- )
-- WHERE slug = 'member' AND is_system = true
-- AND NOT (permissions ? 'tickets.view');

-- =====================================================
-- STEP 4: Test Menu Function
-- =====================================================

SELECT '=== STEP 4: Test Menu Function ===' AS section;

-- Test get_user_menu function for your user
-- REPLACE 'YOUR_EMAIL_HERE' with your actual email
SELECT
  'Menu Function Test' AS test,
  m.key,
  m.name AS menu_name,
  m.path,
  m.required_permission,
  m.required_feature,
  m.has_permission,
  m.has_feature
FROM get_user_menu(
  (SELECT id FROM users WHERE email = 'YOUR_EMAIL_HERE'),
  'en'
) m
WHERE m.key = 'support_tickets';

-- If above returns 0 rows, tickets menu is filtered out

-- =====================================================
-- STEP 5: Check All System Roles
-- =====================================================

SELECT '=== STEP 5: All System Roles Permissions ===' AS section;

-- Check which system roles have tickets permissions
SELECT
  r.slug,
  r.name,
  r.is_system,
  CASE
    WHEN r.permissions ? 'tickets.view' THEN '✅'
    ELSE '❌'
  END AS has_view,
  CASE
    WHEN r.permissions ? 'tickets.create' THEN '✅'
    ELSE '❌'
  END AS has_create,
  CASE
    WHEN r.permissions ? 'tickets.edit' THEN '✅'
    ELSE '❌'
  END AS has_edit,
  CASE
    WHEN r.permissions ? 'tickets.delete' THEN '✅'
    ELSE '❌'
  END AS has_delete,
  r.permissions
FROM roles r
WHERE r.is_system = true
ORDER BY
  CASE r.slug
    WHEN 'admin' THEN 1
    WHEN 'manager' THEN 2
    WHEN 'agent' THEN 3
    WHEN 'member' THEN 4
    ELSE 5
  END;

-- =====================================================
-- STEP 6: Check All Packages
-- =====================================================

SELECT '=== STEP 6: All Package Features ===' AS section;

-- Check which packages have tickets enabled
SELECT
  p.slug,
  p.name_en,
  CASE
    WHEN (p.features->>'tickets')::boolean = true THEN '✅'
    ELSE '❌'
  END AS has_tickets,
  CASE
    WHEN (p.features->>'crm')::boolean = true THEN '✅'
    ELSE '❌'
  END AS has_crm,
  p.features
FROM packages p
ORDER BY
  CASE p.slug
    WHEN 'free' THEN 1
    WHEN 'lite' THEN 2
    WHEN 'professional' THEN 3
    WHEN 'business' THEN 4
    WHEN 'enterprise' THEN 5
    ELSE 6
  END;

-- =====================================================
-- FINAL SUMMARY
-- =====================================================

SELECT '=== FINAL CHECKLIST ===' AS section;

SELECT
  '1. Migration ran?' AS check_item,
  CASE
    WHEN EXISTS (SELECT 1 FROM menu_items WHERE key = 'support_tickets')
    THEN '✅ YES'
    ELSE '❌ NO - Run 019_tickets_module.sql'
  END AS status;

SELECT
  '2. Package has tickets?' AS check_item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM packages
      WHERE slug IN ('lite', 'professional', 'business', 'enterprise')
      AND (features->>'tickets')::boolean = true
    )
    THEN '✅ YES'
    ELSE '❌ NO - Run package fix'
  END AS status;

SELECT
  '3. Admin role has tickets.view?' AS check_item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM roles
      WHERE slug = 'admin'
      AND is_system = true
      AND permissions ? 'tickets.view'
    )
    THEN '✅ YES'
    ELSE '❌ NO - Run role fix'
  END AS status;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================

/*
AFTER RUNNING THIS SCRIPT:

1. Review all test results above
2. Run any fixes shown for failed tests
3. User MUST logout and login again (to refresh JWT token)
4. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
5. Check if tickets menu appears

If menu still doesn't show:
- Check browser console for errors (F12)
- Check backend logs for menu API errors
- Verify backend server is running on port 5000
- Check if /api/menu endpoint returns tickets item

Common Issues:
❌ Migration not run → Run 019_tickets_module.sql
❌ User not re-logged in → Logout + Login required
❌ Package is 'free' tier → Upgrade to Lite+ for tickets
❌ Custom role without permission → Add tickets.view to role
*/
