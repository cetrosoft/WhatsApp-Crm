-- =====================================================
-- POPULATE PERMISSION_MODULE COLUMN DATA
-- =====================================================
-- Migration: 022b_populate_permission_module_data.sql
-- Description: Populate permission_module data (fix for empty column)
-- Run this if column exists but has no data
-- =====================================================

-- CRM Module
UPDATE menu_items SET permission_module = 'contacts' WHERE key = 'crm_contacts';
UPDATE menu_items SET permission_module = 'companies' WHERE key = 'crm_companies';
UPDATE menu_items SET permission_module = 'segments' WHERE key = 'crm_segmentation';
UPDATE menu_items SET permission_module = 'deals' WHERE key = 'crm_deals';
UPDATE menu_items SET permission_module = 'pipelines' WHERE key = 'crm_pipelines';

-- CRM Settings (sub-items)
UPDATE menu_items SET permission_module = 'tags' WHERE key = 'tags';
UPDATE menu_items SET permission_module = 'statuses' WHERE key = 'contact_statuses';
UPDATE menu_items SET permission_module = 'lead_sources' WHERE key = 'lead_sources';

-- Tickets Module
UPDATE menu_items SET permission_module = 'tickets' WHERE key = 'support_tickets';
UPDATE menu_items SET permission_module = 'tickets' WHERE key = 'all_tickets';
UPDATE menu_items SET permission_module = 'ticket_categories' WHERE key = 'ticket_settings';

-- Campaigns Module
UPDATE menu_items SET permission_module = 'campaigns' WHERE key = 'campaigns';

-- Conversations Module
UPDATE menu_items SET permission_module = 'conversations' WHERE key = 'conversations';

-- Analytics Module
UPDATE menu_items SET permission_module = 'analytics' WHERE key = 'analytics';

-- Team Module
UPDATE menu_items SET permission_module = 'users' WHERE key = 'team_members';
UPDATE menu_items SET permission_module = 'permissions' WHERE key = 'team_roles';

-- Settings Module
UPDATE menu_items SET permission_module = 'organization' WHERE key = 'settings_account';

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify all mappings are populated:
SELECT
  key,
  parent_key,
  name_en,
  permission_module,
  required_permission,
  display_order
FROM menu_items
WHERE permission_module IS NOT NULL
ORDER BY display_order;

-- Expected: 17-20 rows with permission_module populated

-- =====================================================
-- COUNT CHECK
-- =====================================================
SELECT
  COUNT(*) as total_menu_items,
  COUNT(permission_module) as items_with_permission_module
FROM menu_items;

-- Expected: items_with_permission_module should be 17-20

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================
