-- =====================================================
-- Add show_in_menu Filter to get_user_menu()
-- =====================================================
-- Purpose: Update get_user_menu() to respect show_in_menu column
-- Items with show_in_menu = false won't appear in sidebar
-- =====================================================

-- =====================================================
-- STEP 1: Update get_user_menu() Function
-- =====================================================

DROP FUNCTION IF EXISTS get_user_menu(UUID, VARCHAR);

CREATE OR REPLACE FUNCTION get_user_menu(user_id UUID, lang VARCHAR DEFAULT 'en')
RETURNS TABLE (
  id UUID,
  key VARCHAR,
  parent_key VARCHAR,
  name VARCHAR,
  icon VARCHAR,
  path VARCHAR,
  display_order INTEGER,
  has_permission BOOLEAN,
  has_feature BOOLEAN
) AS $$
DECLARE
  v_user_org_id UUID;
  v_user_id ALIAS FOR user_id;
  v_lang ALIAS FOR lang;
BEGIN
  -- Get user's organization ID for package feature checking
  SELECT u.organization_id INTO v_user_org_id
  FROM users u
  WHERE u.id = v_user_id;

  RETURN QUERY
  SELECT
    m.id,
    m.key,
    m.parent_key,
    CASE
      WHEN v_lang = 'ar' THEN m.name_ar
      ELSE m.name_en
    END as name,
    m.icon,
    m.path,
    m.display_order,
    -- Check if user has permission
    CASE
      WHEN m.required_permission IS NULL THEN true
      ELSE EXISTS (
        SELECT 1 FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = v_user_id
        AND (
          -- Check role permissions
          r.permissions ? m.required_permission
          -- Or check custom grants
          OR u.permissions->'grant' ? m.required_permission
        )
        -- Exclude custom revokes
        AND NOT (u.permissions->'revoke' ? m.required_permission)
      )
    END as has_permission,
    -- Check if package has feature
    CASE
      WHEN m.required_feature IS NULL THEN true
      ELSE organization_has_feature(v_user_org_id, m.required_feature)
    END as has_feature
  FROM menu_items m
  WHERE m.is_active = true
    -- ✅ NEW: Filter by show_in_menu column
    AND (m.show_in_menu = true OR m.show_in_menu IS NULL)
    -- Two-layer filtering: Package features → User permissions
    AND (
      m.required_feature IS NULL
      OR organization_has_feature(v_user_org_id, m.required_feature)
    )
  ORDER BY m.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_menu IS 'Returns menu items filtered by: (1) is_active, (2) show_in_menu, (3) Package features, (4) User permissions. Supports bilingual output (en/ar).';

-- =====================================================
-- STEP 2: Verification Queries
-- =====================================================

-- Show items that will be hidden (show_in_menu = false)
SELECT
  '=== VERIFICATION: Hidden menu items ===' AS section,
  key,
  name_en,
  name_ar,
  show_in_menu
FROM menu_items
WHERE show_in_menu = false
ORDER BY key;

-- Expected: tags, contact_statuses, lead_sources

-- Show items that will be visible (show_in_menu = true or NULL)
SELECT
  '=== VERIFICATION: Visible menu items ===' AS section,
  key,
  name_en,
  parent_key,
  path,
  CASE WHEN show_in_menu IS NULL THEN 'NULL (default true)' ELSE show_in_menu::text END as show_in_menu
FROM menu_items
WHERE is_active = true
  AND (show_in_menu = true OR show_in_menu IS NULL)
ORDER BY display_order;

-- =====================================================
-- STEP 3: Final Summary
-- =====================================================

DO $$
DECLARE
  v_hidden_count INTEGER;
  v_visible_count INTEGER;
BEGIN
  -- Count hidden items
  SELECT COUNT(*) INTO v_hidden_count
  FROM menu_items
  WHERE show_in_menu = false;

  -- Count visible items
  SELECT COUNT(*) INTO v_visible_count
  FROM menu_items
  WHERE is_active = true
    AND (show_in_menu = true OR show_in_menu IS NULL);

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'UPDATE SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'get_user_menu() function: ✅ UPDATED';
  RAISE NOTICE 'show_in_menu filter: ✅ ADDED';
  RAISE NOTICE '';
  RAISE NOTICE 'Menu Statistics:';
  RAISE NOTICE '- Hidden items (show_in_menu=false): %', v_hidden_count;
  RAISE NOTICE '- Visible items (show_in_menu=true/NULL): %', v_visible_count;
  RAISE NOTICE '========================================';

  IF v_hidden_count >= 3 THEN
    RAISE NOTICE '✅ SUCCESS! Sidebar will hide settings items.';
    RAISE NOTICE '';
    RAISE NOTICE 'Items hidden from sidebar:';
    RAISE NOTICE '- tags (only in /crm/settings → Tags tab)';
    RAISE NOTICE '- contact_statuses (only in /crm/settings → Statuses tab)';
    RAISE NOTICE '- lead_sources (only in /crm/settings → Sources tab)';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Hard refresh browser (Ctrl+Shift+R)';
    RAISE NOTICE '2. Check sidebar - tags/statuses/sources should be gone';
    RAISE NOTICE '3. Navigate to /crm/settings - tabs should still work';
    RAISE NOTICE '4. Tickets menu should still show (show_in_menu=true)';
  ELSE
    RAISE NOTICE '⚠️ WARNING: Expected 3+ hidden items, found %', v_hidden_count;
  END IF;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- NOTES
-- =====================================================

/*
✅ MIGRATION COMPLETE!

What changed:
- get_user_menu() now checks show_in_menu column
- Items with show_in_menu = false won't appear in sidebar
- Backward compatible (NULL treated as true)

Database state:
- tags: show_in_menu = false (hidden from sidebar)
- contact_statuses: show_in_menu = false (hidden from sidebar)
- lead_sources: show_in_menu = false (hidden from sidebar)
- All other items: show_in_menu = true (visible in sidebar)

Why keep hidden items in database?
- Used for permission mapping in permission discovery
- Still needed for CRM Settings page tabs
- Can be referenced by other features

Future use:
- To hide any menu item from sidebar: UPDATE menu_items SET show_in_menu = false WHERE key = 'item_key'
- Item stays in database, just not visible in sidebar
- Useful for admin-only pages, settings tabs, or conditional features
*/
