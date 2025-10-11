/**
 * Update ONLY the get_user_menu Function
 * Fixes parameter naming for Supabase RPC compatibility
 */

-- Drop and recreate the function with fixed parameters
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
    -- Two-layer filtering: Package features → User permissions
    AND (
      m.required_feature IS NULL
      OR organization_has_feature(v_user_org_id, m.required_feature)
    )
  ORDER BY m.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION get_user_menu IS 'Returns menu items filtered by two-layer access control: (1) Package features → (2) User permissions. Supports bilingual output (en/ar)';

-- Success message
SELECT 'Function get_user_menu() updated successfully!' as status;
