-- =====================================================
-- Migration 016: Add Pipelines Permissions to System Roles
-- =====================================================
-- Adds pipeline management permissions to all system roles
-- Required for /crm/pipelines page and dynamic menu access
-- =====================================================

-- =====================================================
-- Add Pipelines Permissions to Existing Roles
-- =====================================================

-- Update Admin role (full access to pipelines)
UPDATE roles
SET permissions = permissions || jsonb_build_array(
  'pipelines.view',
  'pipelines.create',
  'pipelines.edit',
  'pipelines.delete'
)
WHERE slug = 'admin' AND is_system = true;

-- Update Manager role (full access to pipelines)
UPDATE roles
SET permissions = permissions || jsonb_build_array(
  'pipelines.view',
  'pipelines.create',
  'pipelines.edit',
  'pipelines.delete'
)
WHERE slug = 'manager' AND is_system = true;

-- Update Agent role (view, create, edit - no delete)
UPDATE roles
SET permissions = permissions || jsonb_build_array(
  'pipelines.view',
  'pipelines.create',
  'pipelines.edit'
)
WHERE slug = 'agent' AND is_system = true;

-- Update Member role (view-only)
UPDATE roles
SET permissions = permissions || jsonb_build_array(
  'pipelines.view'
)
WHERE slug = 'member' AND is_system = true;

-- =====================================================
-- Update Default Role Permissions Function (Future Organizations)
-- =====================================================

-- Recreate the function to include pipelines permissions
CREATE OR REPLACE FUNCTION get_default_role_permissions(role_slug VARCHAR)
RETURNS JSONB AS $$
BEGIN
  CASE role_slug
    WHEN 'admin' THEN
      RETURN '[
        "contacts.view", "contacts.create", "contacts.edit", "contacts.delete", "contacts.export",
        "companies.view", "companies.create", "companies.edit", "companies.delete", "companies.export",
        "segments.view", "segments.create", "segments.edit", "segments.delete",
        "tags.view", "tags.create", "tags.edit", "tags.delete",
        "statuses.view", "statuses.create", "statuses.edit", "statuses.delete",
        "lead_sources.view", "lead_sources.create", "lead_sources.edit", "lead_sources.delete",
        "deals.view", "deals.create", "deals.edit", "deals.delete", "deals.export",
        "pipelines.view", "pipelines.create", "pipelines.edit", "pipelines.delete",
        "campaigns.view", "campaigns.create", "campaigns.edit", "campaigns.delete", "campaigns.send",
        "conversations.view", "conversations.reply", "conversations.assign", "conversations.manage",
        "tickets.view", "tickets.create", "tickets.edit", "tickets.delete", "tickets.assign",
        "analytics.view", "analytics.export",
        "users.view", "users.invite", "users.edit", "users.delete",
        "permissions.manage",
        "organization.view", "organization.edit", "organization.delete"
      ]'::jsonb;

    WHEN 'manager' THEN
      RETURN '[
        "contacts.view", "contacts.create", "contacts.edit", "contacts.delete", "contacts.export",
        "companies.view", "companies.create", "companies.edit", "companies.delete", "companies.export",
        "segments.view", "segments.create", "segments.edit", "segments.delete",
        "tags.view", "statuses.view", "lead_sources.view",
        "deals.view", "deals.create", "deals.edit", "deals.delete", "deals.export",
        "pipelines.view", "pipelines.create", "pipelines.edit", "pipelines.delete",
        "campaigns.view", "campaigns.create", "campaigns.edit", "campaigns.delete", "campaigns.send",
        "conversations.view", "conversations.reply", "conversations.assign", "conversations.manage",
        "tickets.view", "tickets.create", "tickets.edit", "tickets.assign",
        "analytics.view", "analytics.export",
        "users.view", "users.invite",
        "organization.view"
      ]'::jsonb;

    WHEN 'agent' THEN
      RETURN '[
        "contacts.view", "contacts.create", "contacts.edit",
        "companies.view", "companies.create", "companies.edit",
        "segments.view",
        "tags.view", "statuses.view", "lead_sources.view",
        "deals.view", "deals.create", "deals.edit",
        "pipelines.view", "pipelines.create", "pipelines.edit",
        "conversations.view", "conversations.reply",
        "tickets.view", "tickets.create", "tickets.edit",
        "users.view",
        "organization.view"
      ]'::jsonb;

    WHEN 'member' THEN
      RETURN '[
        "contacts.view",
        "companies.view",
        "segments.view",
        "tags.view", "statuses.view", "lead_sources.view",
        "deals.view",
        "pipelines.view",
        "conversations.view",
        "tickets.view",
        "users.view",
        "organization.view"
      ]'::jsonb;

    ELSE
      RETURN '[]'::jsonb;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Verification Queries
-- =====================================================
-- Run these queries to verify the migration worked

-- 1. Check pipelines permissions were added to all roles
-- SELECT
--   slug,
--   permissions ? 'pipelines.view' as has_view,
--   permissions ? 'pipelines.create' as has_create,
--   permissions ? 'pipelines.edit' as has_edit,
--   permissions ? 'pipelines.delete' as has_delete,
--   jsonb_array_length(permissions) as total_permissions
-- FROM roles
-- WHERE is_system = true
-- ORDER BY slug;

-- Expected results:
-- admin    | t | t | t | t | 50+
-- manager  | t | t | t | t | 40+
-- agent    | t | t | t | f | 20+
-- member   | t | f | f | f | 12

-- 2. Check that all organizations have updated roles
-- SELECT
--   o.name as organization,
--   r.slug,
--   r.permissions ? 'pipelines.view' as has_pipelines_view
-- FROM organizations o
-- JOIN roles r ON r.organization_id = o.id
-- WHERE r.is_system = true
-- ORDER BY o.name, r.slug;

-- 3. Test dynamic menu query for a specific user
-- SELECT key, name, required_permission, has_permission
-- FROM get_user_menu('YOUR_USER_ID'::uuid, 'en')
-- WHERE key = 'crm_pipelines';
-- Should return: has_permission = true (if user has pipelines.view)

-- =====================================================
-- Migration Complete
-- =====================================================
-- Next steps:
-- 1. Login to your application
-- 2. Check that "Pipelines" menu item now appears under CRM
-- 3. Navigate to /crm/pipelines and verify access
-- 4. Test permission checks (create, edit, delete buttons)
-- =====================================================

COMMENT ON FUNCTION get_default_role_permissions IS 'Returns default permissions for system roles. Updated to include pipelines permissions for future organizations.';
