-- =====================================================
-- Migration 017: Adjust Agent Permissions (OPTIONAL)
-- =====================================================
-- This migration is OPTIONAL - only run if you want to change
-- what agent role can see in the menu.
--
-- Choose ONE option below based on your requirements:
-- =====================================================

-- =====================================================
-- OPTION 1: Restrictive Agent Access (RECOMMENDED)
-- =====================================================
-- Removes companies and users access from agent role
-- Agent will ONLY see: Dashboard, Contacts, Segments, Deals, Conversations, Tickets
-- Agent will NOT see: Companies, Team, Settings, Roles
--
-- Uncomment the block below to apply:

/*
UPDATE roles
SET permissions = jsonb_build_array(
  -- CRM - Contacts only (view, create, edit)
  'contacts.view',
  'contacts.create',
  'contacts.edit',

  -- CRM - Segments (view only)
  'segments.view',

  -- CRM - Deals (view, create, edit)
  'deals.view',
  'deals.create',
  'deals.edit',

  -- Conversations (view and reply)
  'conversations.view',
  'conversations.reply',

  -- Tickets (view, create, edit)
  'tickets.view',
  'tickets.create',
  'tickets.edit',

  -- Settings - View lookup data only
  'tags.view',
  'statuses.view',
  'lead_sources.view'

  -- NOTE: Removed companies.view, users.view, organization.view
)
WHERE slug = 'agent' AND is_system = true;
*/

-- =====================================================
-- OPTION 2: Standard Agent Access (Current Design)
-- =====================================================
-- Keeps current permissions - agent can see companies and team members
-- Agent will see: Dashboard, Contacts, Companies, Segments, Deals, Conversations, Tickets, Team (view only)
-- Agent will NOT see: Team > Roles, Settings
--
-- This is the CURRENT state - no need to run anything for this option
-- Just for reference, here's what agent currently has:

/*
Current Agent Permissions (20 total):
- contacts.view, contacts.create, contacts.edit
- companies.view, companies.create, companies.edit  ← Can see Companies page
- segments.view
- deals.view, deals.create, deals.edit
- conversations.view, conversations.reply
- tickets.view, tickets.create, tickets.edit
- tags.view, statuses.view, lead_sources.view
- users.view           ← Can see Team > Members page
- organization.view    ← Can view org info (not edit)
*/

-- =====================================================
-- OPTION 3: Custom Agent Access
-- =====================================================
-- Create your own custom permission set
-- Modify the list below as needed:

/*
UPDATE roles
SET permissions = jsonb_build_array(
  -- Add your custom permissions here
  'contacts.view',
  'contacts.create',
  'contacts.edit'
  -- ... add more as needed
)
WHERE slug = 'agent' AND is_system = true;
*/

-- =====================================================
-- After Running This Migration:
-- =====================================================
-- 1. All users with agent role must LOGOUT and LOGIN again
--    to refresh their JWT token with new permissions
-- 2. Test by logging in as agent user
-- 3. Verify menu only shows allowed pages
-- =====================================================

-- Verification Query:
-- Run this to see current agent permissions:
/*
SELECT
  organization_id,
  name,
  slug,
  permissions,
  jsonb_array_length(permissions) as permission_count
FROM roles
WHERE slug = 'agent' AND is_system = true;
*/
