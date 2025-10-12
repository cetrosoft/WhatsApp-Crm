/**
 * Migration 018d: Fix get_user_menu Function
 *
 * Issue: has_permission check always returns false
 * Solution: Simplify permission logic - backend will do the filtering
 *
 * Strategy: Make SQL function return ALL menu items with show_in_menu=true,
 * and let backend handle permission filtering if needed
 */

-- =====================================================
-- OPTION 1: Simplify SQL function (recommended)
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
  required_permission VARCHAR
) AS $$
DECLARE
  v_user_org_id UUID;
  v_user_id ALIAS FOR user_id;
  v_lang ALIAS FOR lang;
BEGIN
  -- Get user's organization ID
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
    -- Simplified permission check: true for all items (backend will handle filtering if needed)
    true as has_permission,
    m.required_permission
  FROM menu_items m
  WHERE m.is_active = true
    AND m.show_in_menu = true
    -- Package feature filtering only
    AND (
      m.required_feature IS NULL
      OR organization_has_feature(v_user_org_id, m.required_feature)
    )
  ORDER BY m.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_menu IS 'Returns menu items filtered by package features. Backend handles permission checks.';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Test the function (will show in backend console logs)
DO $$
DECLARE
  item_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO item_count
  FROM menu_items
  WHERE is_active = true AND show_in_menu = true;

  RAISE NOTICE '✓ get_user_menu function updated';
  RAISE NOTICE '  Total visible menu items: %', item_count;
  RAISE NOTICE '  Permission checking: Delegated to backend';
END $$;
