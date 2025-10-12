/**
 * Migration 018b: DEBUG - Menu Visibility Issue
 *
 * Purpose: Diagnose why menu is disappearing
 * Issue: API returns empty array because has_permission is false for all items
 *
 * This file contains diagnostic queries to understand the problem
 */

-- =====================================================
-- DIAGNOSTIC QUERIES
-- =====================================================

-- 1. Check current state of menu_items
SELECT
  'Menu Items State' as check_type,
  key,
  name_en,
  show_in_menu,
  required_permission,
  is_active
FROM menu_items
ORDER BY show_in_menu DESC, display_order;

-- 2. Check if show_in_menu was properly set
SELECT
  '

Show in Menu Count' as check_type,
  show_in_menu,
  COUNT(*) as count
FROM menu_items
GROUP BY show_in_menu;

-- 3. Test get_user_menu for a specific user (replace with your user ID)
-- First, let's see what user IDs exist
SELECT
  'Available Users' as check_type,
  id,
  email,
  role,
  organization_id
FROM users
LIMIT 5;

-- =====================================================
-- MANUAL TEST - Replace USER_ID with actual user ID
-- =====================================================

/*
-- Run this separately with your actual user ID:

SELECT * FROM get_user_menu('YOUR-USER-ID-HERE', 'en');

-- Check what the function returns:
-- - If empty: permission check is too strict
-- - If has items with has_permission=false: frontend filters them out
-- - If has items with has_permission=true: frontend issue
*/

-- =====================================================
-- CHECK PERMISSION LOGIC
-- =====================================================

-- Show items that should ALWAYS be visible (no required_permission)
SELECT
  'Always Visible Items' as check_type,
  key,
  name_en,
  required_permission,
  show_in_menu
FROM menu_items
WHERE required_permission IS NULL
AND show_in_menu = true;

-- =====================================================
-- SUSPECTED ISSUE: Dashboard might have a permission
-- =====================================================

-- Check dashboard specifically
SELECT
  'Dashboard Check' as check_type,
  key,
  name_en,
  required_permission,
  required_feature,
  show_in_menu,
  is_active
FROM menu_items
WHERE key = 'dashboard';

-- =====================================================
-- FIX: Ensure dashboard has no required_permission
-- =====================================================

-- Dashboard should be visible to everyone
UPDATE menu_items
SET required_permission = NULL
WHERE key = 'dashboard';

-- Settings should be visible to everyone (users manage their own account)
UPDATE menu_items
SET required_permission = NULL
WHERE key = 'settings';

-- Team root menu should be visible to everyone (submenu permissions handle access)
UPDATE menu_items
SET required_permission = NULL
WHERE key = 'team';

-- Campaigns root menu should be visible to everyone
UPDATE menu_items
SET required_permission = NULL
WHERE key = 'campaigns';

-- Conversations root menu should be visible to everyone
UPDATE menu_items
SET required_permission = NULL
WHERE key = 'conversations';

RAISE NOTICE '✓ Updated root menu items to have no required_permission';

-- =====================================================
-- VERIFICATION AFTER FIX
-- =====================================================

-- Show all root menu items (should all be visible now)
SELECT
  'Root Menu Items (After Fix)' as check_type,
  key,
  name_en,
  required_permission,
  show_in_menu,
  is_active
FROM menu_items
WHERE parent_key IS NULL
AND show_in_menu = true
ORDER BY display_order;

-- =====================================================
-- EXPLANATION
-- =====================================================

/*
THE PROBLEM:
------------
When we added show_in_menu column, we also updated the get_user_menu() function
to filter by show_in_menu = true. However, the function ALSO checks permissions.

If a root menu item like "dashboard" has a required_permission, and the user
doesn't have that permission, the entire menu disappears.

THE FIX:
--------
Root menu items (dashboard, settings, team, campaigns, conversations) should
have required_permission = NULL so they're ALWAYS visible.

The SUBMENU items should have required_permission set, so users only see
what they have access to.

For example:
- "team" (root) → required_permission = NULL (always visible)
- "team_members" (submenu) → required_permission = 'users.view' (filtered)
- "team_roles" (submenu) → required_permission = 'permissions.manage' (filtered)

This way, the menu structure is always visible, but users only see the
submenus they have permission for.

NEXT STEPS:
-----------
1. Run this migration
2. Restart backend server
3. Hard refresh frontend (Ctrl+Shift+R)
4. Menu should now be visible

If still not working, run this in Supabase:
  SELECT * FROM get_user_menu('YOUR-USER-ID', 'en');

And check the output to see what's being returned.
*/
