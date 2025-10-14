-- =====================================================
-- ADD PERMISSION_MODULE COLUMN TO MENU_ITEMS
-- =====================================================
-- Migration: 022_add_permission_module_column.sql
-- Description: Eliminate hardcoded permission mappings
-- Impact: Enables 100% database-driven categorization
-- Dependencies: 015_dynamic_menu_system.sql
-- Version: 3.0
-- Date: January 14, 2025
-- =====================================================

-- Step 1: Add the column (nullable)
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS permission_module VARCHAR(100);

-- Step 2: Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_menu_items_permission_module
ON menu_items(permission_module);

-- Step 3: Populate existing data
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

-- Step 4: Add comment for documentation
COMMENT ON COLUMN menu_items.permission_module IS
  'Maps permission module (e.g., "contacts", "tickets") to menu item. '
  'Used for auto-categorizing permissions in permission matrix. '
  'NULL for parent/container items that have no direct permissions.';

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- This should show all menu items with their permission modules:
SELECT
  key,
  parent_key,
  name_en,
  permission_module,
  required_permission,
  display_order
FROM menu_items
ORDER BY display_order;

-- Expected: All menu items with permissions should have permission_module populated

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================
