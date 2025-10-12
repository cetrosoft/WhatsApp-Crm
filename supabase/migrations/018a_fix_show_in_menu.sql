/**
 * Migration 018a: HOTFIX - Restore Sidebar Menu
 *
 * Issue: Sidebar menu disappeared after adding show_in_menu column
 * Cause: Existing menu items didn't get show_in_menu = true properly set
 * Solution: Explicitly update all existing menu pages to show_in_menu = true
 *
 * This is a quick hotfix for migration 018
 */

-- =====================================================
-- FIX: Set show_in_menu = true for all menu pages
-- =====================================================

-- Update all menu items EXCEPT the 3 resource entries
UPDATE menu_items
SET show_in_menu = true
WHERE key NOT IN ('tags', 'contact_statuses', 'lead_sources');

-- Verify the fix
DO $$
DECLARE
  menu_count INTEGER;
  resource_count INTEGER;
BEGIN
  -- Count menu items (should be shown)
  SELECT COUNT(*) INTO menu_count
  FROM menu_items
  WHERE show_in_menu = true;

  -- Count resource items (should NOT be shown)
  SELECT COUNT(*) INTO resource_count
  FROM menu_items
  WHERE show_in_menu = false;

  RAISE NOTICE '✓ Hotfix applied successfully';
  RAISE NOTICE '  - Menu items (show_in_menu = true): %', menu_count;
  RAISE NOTICE '  - Resource items (show_in_menu = false): %', resource_count;

  IF menu_count = 0 THEN
    RAISE EXCEPTION 'ERROR: No menu items found with show_in_menu = true!';
  END IF;

  IF resource_count != 3 THEN
    RAISE WARNING 'Expected 3 resource items, found %', resource_count;
  END IF;
END $$;

-- Display current state
SELECT
  key,
  name_en,
  show_in_menu,
  is_active,
  CASE
    WHEN show_in_menu THEN 'Shown in sidebar'
    ELSE 'Permission label only'
  END as usage
FROM menu_items
ORDER BY show_in_menu DESC, display_order;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- List all menu pages that should appear in sidebar
SELECT
  '✅ MENU PAGES' as type,
  key,
  name_en,
  path,
  parent_key
FROM menu_items
WHERE show_in_menu = true
ORDER BY display_order;

-- List all resource entries (should NOT appear in sidebar)
SELECT
  '🔒 RESOURCE LABELS' as type,
  key,
  name_en,
  '(not shown in menu)' as note,
  NULL as parent_key
FROM menu_items
WHERE show_in_menu = false
ORDER BY key;

/*
EXPECTED RESULTS:
✅ Menu pages (show_in_menu = true): ~13 items
   - dashboard
   - crm (with submenu: contacts, companies, segmentation, deals, pipelines, crm_settings)
   - campaigns
   - conversations
   - team (with submenu: members, roles)
   - settings (with submenu: account_settings)

🔒 Resource labels (show_in_menu = false): 3 items
   - tags
   - contact_statuses
   - lead_sources

SIDEBAR SHOULD NOW BE VISIBLE!
*/
