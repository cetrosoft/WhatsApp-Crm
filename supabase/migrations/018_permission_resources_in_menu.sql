/**
 * Migration 018: Add Permission Resources to Menu Items Table
 *
 * Purpose: Extend menu_items table to include non-page resources (tags, statuses, lead_sources)
 * for consistent bilingual permission labels.
 *
 * Changes:
 * 1. Add show_in_menu column to differentiate pages from resources
 * 2. Add resource entries for tags, contact_statuses, lead_sources
 * 3. Update get_user_menu() to filter by show_in_menu = true
 *
 * Safety: Backward compatible, no effect on existing permissions
 */

-- =====================================================
-- STEP 1: Add show_in_menu column
-- =====================================================

-- Add column with default true (all existing items are pages)
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS show_in_menu BOOLEAN DEFAULT true NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_menu_items_show_in_menu ON menu_items(show_in_menu);

-- Update all existing records to explicitly set show_in_menu = true
UPDATE menu_items SET show_in_menu = true WHERE show_in_menu IS NULL;

COMMENT ON COLUMN menu_items.show_in_menu IS 'If true, item appears in sidebar navigation. If false, used only for permission labels.';

-- =====================================================
-- STEP 2: Insert non-page resource entries
-- =====================================================

-- Insert tags resource (used in permission matrix only)
INSERT INTO menu_items (
  key,
  parent_key,
  name_en,
  name_ar,
  icon,
  path,
  display_order,
  required_permission,
  required_feature,
  is_system,
  is_active,
  show_in_menu
) VALUES (
  'tags',
  NULL,
  'Tags',
  'الوسوم',
  NULL,
  NULL,
  999, -- High order number (won't show in menu anyway)
  NULL,
  NULL,
  true,
  true,
  false -- Not shown in menu
) ON CONFLICT (key) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ar = EXCLUDED.name_ar,
  show_in_menu = EXCLUDED.show_in_menu;

-- Insert contact_statuses resource
INSERT INTO menu_items (
  key,
  parent_key,
  name_en,
  name_ar,
  icon,
  path,
  display_order,
  required_permission,
  required_feature,
  is_system,
  is_active,
  show_in_menu
) VALUES (
  'contact_statuses',
  NULL,
  'Contact Statuses',
  'حالات جهات الاتصال',
  NULL,
  NULL,
  999,
  NULL,
  NULL,
  true,
  true,
  false -- Not shown in menu
) ON CONFLICT (key) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ar = EXCLUDED.name_ar,
  show_in_menu = EXCLUDED.show_in_menu;

-- Insert lead_sources resource
INSERT INTO menu_items (
  key,
  parent_key,
  name_en,
  name_ar,
  icon,
  path,
  display_order,
  required_permission,
  required_feature,
  is_system,
  is_active,
  show_in_menu
) VALUES (
  'lead_sources',
  NULL,
  'Lead Sources',
  'مصادر العملاء',
  NULL,
  NULL,
  999,
  NULL,
  NULL,
  true,
  true,
  false -- Not shown in menu
) ON CONFLICT (key) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ar = EXCLUDED.name_ar,
  show_in_menu = EXCLUDED.show_in_menu;

-- =====================================================
-- STEP 3: Update get_user_menu() function
-- =====================================================

-- Drop and recreate function with show_in_menu filter
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
  has_permission BOOLEAN
) AS $$
DECLARE
  v_user_org_id UUID;
  v_user_id ALIAS FOR user_id;  -- Alias to avoid ambiguity
  v_lang ALIAS FOR lang;          -- Alias to avoid ambiguity
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
    END as has_permission
  FROM menu_items m
  WHERE m.is_active = true
    AND m.show_in_menu = true  -- ⭐ NEW: Only show menu items
    -- Two-layer filtering: Package features → User permissions
    AND (
      m.required_feature IS NULL
      OR organization_has_feature(v_user_org_id, m.required_feature)
    )
  ORDER BY m.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_menu IS 'Returns menu items filtered by show_in_menu=true and two-layer access control: (1) Package features → (2) User permissions. Supports bilingual output (en/ar)';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify column was added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items'
    AND column_name = 'show_in_menu'
  ) THEN
    RAISE EXCEPTION 'Column show_in_menu was not added successfully';
  END IF;

  RAISE NOTICE '✓ Column show_in_menu added successfully';
END $$;

-- Verify resource entries were added
DO $$
DECLARE
  tag_count INTEGER;
  status_count INTEGER;
  source_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tag_count FROM menu_items WHERE key = 'tags' AND show_in_menu = false;
  SELECT COUNT(*) INTO status_count FROM menu_items WHERE key = 'contact_statuses' AND show_in_menu = false;
  SELECT COUNT(*) INTO source_count FROM menu_items WHERE key = 'lead_sources' AND show_in_menu = false;

  IF tag_count = 0 THEN
    RAISE EXCEPTION 'Tags resource was not added';
  END IF;

  IF status_count = 0 THEN
    RAISE EXCEPTION 'Contact statuses resource was not added';
  END IF;

  IF source_count = 0 THEN
    RAISE EXCEPTION 'Lead sources resource was not added';
  END IF;

  RAISE NOTICE '✓ All resource entries added successfully';
  RAISE NOTICE '  - Tags: % (show_in_menu: false)', tag_count;
  RAISE NOTICE '  - Contact Statuses: % (show_in_menu: false)', status_count;
  RAISE NOTICE '  - Lead Sources: % (show_in_menu: false)', source_count;
END $$;

-- Display summary
SELECT
  'Menu Items (show_in_menu = true)' as category,
  COUNT(*) as count
FROM menu_items
WHERE show_in_menu = true
UNION ALL
SELECT
  'Resource Items (show_in_menu = false)' as category,
  COUNT(*) as count
FROM menu_items
WHERE show_in_menu = false
ORDER BY category;

-- Show the new resource entries
SELECT
  key,
  name_en,
  name_ar,
  show_in_menu,
  is_system
FROM menu_items
WHERE show_in_menu = false
ORDER BY key;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

/*
MIGRATION SUMMARY:
✅ Added show_in_menu column (default: true)
✅ Updated all existing records to show_in_menu = true
✅ Added 3 resource entries (tags, contact_statuses, lead_sources) with show_in_menu = false
✅ Updated get_user_menu() function to filter by show_in_menu = true
✅ Created index on show_in_menu column

NEXT STEPS:
1. Update backend/utils/permissionDiscovery.js mapping
2. Test permission matrix labels
3. Verify sidebar menu unchanged

ROLLBACK (if needed):
  UPDATE menu_items SET show_in_menu = true WHERE show_in_menu = false;
  -- Then revert permissionDiscovery.js changes
*/
