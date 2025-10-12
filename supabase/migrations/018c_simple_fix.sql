/**
 * Migration 018c: SIMPLE FIX - Restore Menu Visibility
 *
 * Problem: Menu disappeared after adding show_in_menu column
 * Root Cause: Existing rows might have NULL or incorrect values
 * Solution: Simply set show_in_menu = true for all existing menu pages
 */

-- =====================================================
-- STEP 1: Ensure all existing pages are visible
-- =====================================================

-- Set show_in_menu = true for ALL items except our 3 new resources
UPDATE menu_items
SET show_in_menu = true
WHERE key NOT IN ('tags', 'contact_statuses', 'lead_sources');

-- Set show_in_menu = false ONLY for the 3 resource entries
UPDATE menu_items
SET show_in_menu = false
WHERE key IN ('tags', 'contact_statuses', 'lead_sources');

-- =====================================================
-- STEP 2: Verify the fix
-- =====================================================

-- Check counts
DO $$
DECLARE
  visible_count INTEGER;
  hidden_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO visible_count FROM menu_items WHERE show_in_menu = true;
  SELECT COUNT(*) INTO hidden_count FROM menu_items WHERE show_in_menu = false;

  RAISE NOTICE 'Menu items visible: %', visible_count;
  RAISE NOTICE 'Resource items hidden: %', hidden_count;

  IF visible_count = 0 THEN
    RAISE EXCEPTION 'ERROR: No visible menu items!';
  END IF;
END $$;

-- =====================================================
-- STEP 3: Show current state
-- =====================================================

-- Display all items and their visibility
SELECT
  key,
  name_en,
  show_in_menu,
  CASE
    WHEN show_in_menu THEN '✅ Shown in menu'
    ELSE '🔒 Permission label only'
  END as status
FROM menu_items
ORDER BY show_in_menu DESC, display_order;
