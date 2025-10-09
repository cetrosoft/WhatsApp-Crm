-- =====================================================
-- Migration 015: Add New Module Permissions
-- =====================================================
-- Adds permissions for: Deals, Campaigns, Conversations, Tickets, Analytics
-- Updates all system roles with appropriate permissions
-- =====================================================

-- Update Admin role (full access to all new modules)
UPDATE roles
SET permissions = permissions || jsonb_build_array(
  -- Deals
  'deals.view', 'deals.create', 'deals.edit', 'deals.delete', 'deals.export',
  -- Campaigns
  'campaigns.view', 'campaigns.create', 'campaigns.edit', 'campaigns.delete', 'campaigns.send',
  -- Conversations
  'conversations.view', 'conversations.reply', 'conversations.assign', 'conversations.manage',
  -- Tickets
  'tickets.view', 'tickets.create', 'tickets.edit', 'tickets.delete', 'tickets.assign',
  -- Analytics
  'analytics.view', 'analytics.export'
)
WHERE slug = 'admin' AND is_system = true;

-- Update Manager role (full access except some delete permissions)
UPDATE roles
SET permissions = permissions || jsonb_build_array(
  -- Deals - Full access
  'deals.view', 'deals.create', 'deals.edit', 'deals.delete', 'deals.export',
  -- Campaigns - Full access
  'campaigns.view', 'campaigns.create', 'campaigns.edit', 'campaigns.delete', 'campaigns.send',
  -- Conversations - Full access
  'conversations.view', 'conversations.reply', 'conversations.assign', 'conversations.manage',
  -- Tickets - Full access except delete
  'tickets.view', 'tickets.create', 'tickets.edit', 'tickets.assign',
  -- Analytics - View and export
  'analytics.view', 'analytics.export'
)
WHERE slug = 'manager' AND is_system = true;

-- Update Agent role (create and edit, limited delete)
UPDATE roles
SET permissions = permissions || jsonb_build_array(
  -- Deals - View, create, edit only
  'deals.view', 'deals.create', 'deals.edit',
  -- Conversations - View and reply only
  'conversations.view', 'conversations.reply',
  -- Tickets - View, create, edit
  'tickets.view', 'tickets.create', 'tickets.edit'
)
WHERE slug = 'agent' AND is_system = true;

-- Update Member role (view-only access)
UPDATE roles
SET permissions = permissions || jsonb_build_array(
  -- View-only access to new modules
  'deals.view',
  'conversations.view',
  'tickets.view'
)
WHERE slug = 'member' AND is_system = true;

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to verify the migration worked:
--
-- SELECT slug, permissions
-- FROM roles
-- WHERE is_system = true
-- ORDER BY slug;
--
-- Should show:
-- - admin: 50+ permissions (all modules)
-- - manager: 40+ permissions (most modules)
-- - agent: 20+ permissions (limited)
-- - member: 11 permissions (view-only)
