-- =====================================================
-- FIX: Menu Schema & Ticket Module Setup
-- =====================================================
-- Purpose: Fix missing columns in menu_items table and complete ticket setup
-- Run this if you get error: "column m.required_permission does not exist"
-- =====================================================

-- =====================================================
-- STEP 1: Add Missing Columns to menu_items
-- =====================================================

-- Check if columns exist before adding
DO $$
BEGIN
  -- Add required_permission column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'required_permission'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN required_permission VARCHAR(100);
    RAISE NOTICE '✅ Added column: required_permission';
  ELSE
    RAISE NOTICE '✓ Column already exists: required_permission';
  END IF;

  -- Add required_feature column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'required_feature'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN required_feature VARCHAR(100);
    RAISE NOTICE '✅ Added column: required_feature';
  ELSE
    RAISE NOTICE '✓ Column already exists: required_feature';
  END IF;
END $$;

-- =====================================================
-- STEP 2: Recreate get_user_menu() Function
-- =====================================================

-- Drop existing function
DROP FUNCTION IF EXISTS get_user_menu(UUID, VARCHAR);

-- Recreate with correct schema
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
    -- Two-layer filtering: Package features → User permissions
    AND (
      m.required_feature IS NULL
      OR organization_has_feature(v_user_org_id, m.required_feature)
    )
  ORDER BY m.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_menu IS 'Returns menu items filtered by two-layer access control: (1) Package features → (2) User permissions. Supports bilingual output (en/ar). Fixed schema includes required_permission and required_feature columns.';

-- =====================================================
-- STEP 3: Insert Ticket Menu Item
-- =====================================================

INSERT INTO menu_items (key, parent_key, name_en, name_ar, icon, path, display_order, required_permission, required_feature, is_system)
SELECT 'support_tickets', NULL, 'Tickets', 'التذاكر', 'Ticket', '/tickets', 40, 'tickets.view', 'tickets', true
WHERE NOT EXISTS (
  SELECT 1 FROM menu_items WHERE key = 'support_tickets'
);

-- =====================================================
-- STEP 4: Add Permissions to Roles
-- =====================================================

-- Add ticket permissions to admin role
UPDATE roles
SET permissions = permissions || jsonb_build_array(
  'tickets.view',
  'tickets.create',
  'tickets.edit',
  'tickets.delete',
  'tickets.comment',
  'tickets.assign',
  'ticket_categories.manage'
)
WHERE slug = 'admin' AND is_system = true
AND NOT (permissions ? 'tickets.view');

-- Add ticket permissions to manager role
UPDATE roles
SET permissions = permissions || jsonb_build_array(
  'tickets.view',
  'tickets.create',
  'tickets.edit',
  'tickets.comment',
  'tickets.assign'
)
WHERE slug = 'manager' AND is_system = true
AND NOT (permissions ? 'tickets.view');

-- Add ticket permissions to agent role
UPDATE roles
SET permissions = permissions || jsonb_build_array(
  'tickets.view',
  'tickets.create',
  'tickets.edit',
  'tickets.comment'
)
WHERE slug = 'agent' AND is_system = true
AND NOT (permissions ? 'tickets.view');

-- Add ticket permissions to member role
UPDATE roles
SET permissions = permissions || jsonb_build_array(
  'tickets.view',
  'tickets.create',
  'tickets.comment'
)
WHERE slug = 'member' AND is_system = true
AND NOT (permissions ? 'tickets.view');

-- =====================================================
-- STEP 5: Enable Package Features
-- =====================================================

-- Enable tickets feature for Lite, Professional, Business, Enterprise
UPDATE packages
SET features = jsonb_set(features, '{tickets}', 'true'::jsonb)
WHERE slug IN ('lite', 'professional', 'business', 'enterprise')
AND (features->>'tickets')::boolean IS DISTINCT FROM true;

-- =====================================================
-- STEP 6: Verification Queries
-- =====================================================

-- Show all menu_items columns (should now include required_permission and required_feature)
SELECT
  '=== VERIFICATION: menu_items schema ===' AS section,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'menu_items'
ORDER BY ordinal_position;

-- Check if ticket menu was inserted
SELECT
  '=== VERIFICATION: Ticket menu item ===' AS section,
  key, name_en, name_ar, icon, path, required_permission, required_feature, is_system
FROM menu_items
WHERE key = 'support_tickets';

-- Check permissions in all system roles
SELECT
  '=== VERIFICATION: Role permissions ===' AS section,
  slug,
  name,
  CASE WHEN permissions ? 'tickets.view' THEN '✅ tickets.view' ELSE '❌ NO tickets.view' END as has_view,
  CASE WHEN permissions ? 'tickets.create' THEN '✅ tickets.create' ELSE '❌ NO tickets.create' END as has_create,
  CASE WHEN permissions ? 'tickets.edit' THEN '✅ tickets.edit' ELSE '❌ NO tickets.edit' END as has_edit,
  CASE WHEN permissions ? 'tickets.delete' THEN '✅ tickets.delete' ELSE '❌ NO tickets.delete' END as has_delete
FROM roles
WHERE is_system = true
ORDER BY
  CASE slug
    WHEN 'admin' THEN 1
    WHEN 'manager' THEN 2
    WHEN 'agent' THEN 3
    WHEN 'member' THEN 4
    ELSE 5
  END;

-- Check package features
SELECT
  '=== VERIFICATION: Package features ===' AS section,
  slug,
  name,
  CASE WHEN (features->>'tickets')::boolean = true THEN '✅ Has tickets' ELSE '❌ NO tickets' END as tickets_feature,
  CASE WHEN (features->>'crm')::boolean = true THEN '✅ Has CRM' ELSE '❌ NO CRM' END as crm_feature
FROM packages
ORDER BY
  CASE slug
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

DO $$
DECLARE
  v_has_columns BOOLEAN;
  v_has_menu BOOLEAN;
  v_admin_has_perm BOOLEAN;
  v_packages_have_feature BOOLEAN;
BEGIN
  -- Check columns
  SELECT
    COUNT(*) = 2 INTO v_has_columns
  FROM information_schema.columns
  WHERE table_name = 'menu_items'
  AND column_name IN ('required_permission', 'required_feature');

  -- Check menu item
  SELECT EXISTS (
    SELECT 1 FROM menu_items WHERE key = 'support_tickets'
  ) INTO v_has_menu;

  -- Check admin permissions
  SELECT EXISTS (
    SELECT 1 FROM roles
    WHERE slug = 'admin'
    AND is_system = true
    AND permissions ? 'tickets.view'
  ) INTO v_admin_has_perm;

  -- Check packages
  SELECT COUNT(*) >= 4 INTO v_packages_have_feature
  FROM packages
  WHERE slug IN ('lite', 'professional', 'business', 'enterprise')
  AND (features->>'tickets')::boolean = true;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FINAL CHECKLIST';
  RAISE NOTICE '========================================';
  RAISE NOTICE '1. Columns added: %', CASE WHEN v_has_columns THEN '✅ YES' ELSE '❌ NO' END;
  RAISE NOTICE '2. Menu item inserted: %', CASE WHEN v_has_menu THEN '✅ YES' ELSE '❌ NO' END;
  RAISE NOTICE '3. Admin has permissions: %', CASE WHEN v_admin_has_perm THEN '✅ YES' ELSE '❌ NO' END;
  RAISE NOTICE '4. Packages have tickets: %', CASE WHEN v_packages_have_feature THEN '✅ YES' ELSE '❌ NO' END;
  RAISE NOTICE '========================================';

  IF v_has_columns AND v_has_menu AND v_admin_has_perm AND v_packages_have_feature THEN
    RAISE NOTICE '✅ SUCCESS! All fixes applied correctly.';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. LOGOUT from your account';
    RAISE NOTICE '2. LOGIN again (to refresh JWT token with new permissions)';
    RAISE NOTICE '3. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)';
    RAISE NOTICE '4. Tickets menu should now appear in sidebar!';
  ELSE
    RAISE NOTICE '⚠️ WARNING: Some checks failed. Review output above.';
  END IF;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================

/*
✅ MIGRATION COMPLETE!

What was fixed:
1. Added required_permission column to menu_items
2. Added required_feature column to menu_items
3. Recreated get_user_menu() function with correct schema
4. Inserted ticket menu item with permissions
5. Added ticket permissions to all 4 system roles
6. Enabled tickets feature in Lite+ packages

How to verify menu is now working:

1. Check the verification output above
2. All checks should show ✅

3. Test menu function for your user:
   SELECT * FROM get_user_menu('YOUR_USER_ID'::uuid, 'en')
   WHERE key = 'support_tickets';

4. IMPORTANT - User must:
   - Logout from application
   - Login again (refreshes JWT token with new permissions)
   - Hard refresh browser (Ctrl+Shift+R)

5. Check sidebar - Tickets menu should appear!

If menu still doesn't show:
- Check browser console (F12) for errors
- Check backend logs for menu API errors
- Verify backend server running on port 5000
- Check /api/menu endpoint returns tickets item
- Run 019_VERIFY_tickets_menu.sql for detailed debug

Common causes:
❌ User didn't re-login (old JWT without permissions)
❌ Browser cache not cleared (old menu cached)
❌ User on 'free' package (tickets requires Lite+)
❌ Custom role without tickets.view permission
*/
