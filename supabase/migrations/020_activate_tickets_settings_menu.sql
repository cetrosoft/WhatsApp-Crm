-- =====================================================
-- ACTIVATE TICKETS HIERARCHICAL MENU
-- =====================================================
-- Migration: 020_activate_tickets_settings_menu.sql
-- Description: Add hierarchical submenu under Tickets (All Tickets + Settings)
-- Dependencies: 019_tickets_module.sql (support_tickets menu must exist)
-- Architecture: Database-driven menu (fully dynamic approach)
-- =====================================================

-- Add "All Tickets" submenu item (main tickets list page)
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
  show_in_menu
)
SELECT
  'all_tickets',                   -- Unique key
  'support_tickets',               -- Parent: Tickets menu
  'All Tickets',                   -- English name
  'كل التذاكر',                    -- Arabic name
  'ListChecks',                    -- Lucide icon name
  '/tickets',                      -- Route path (main tickets page)
  40,                              -- Display order (first submenu)
  'tickets.view',                  -- Required permission
  'tickets',                       -- Required package feature
  true,                            -- System menu (cannot delete)
  true                             -- Show in menu
WHERE NOT EXISTS (
  SELECT 1 FROM menu_items WHERE key = 'all_tickets'
);

-- Add Tickets Settings submenu item (category management)
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
  show_in_menu
)
SELECT
  'ticket_settings',              -- Unique key
  'support_tickets',               -- Parent: Tickets menu
  'Settings',                      -- English name
  'الإعدادات',                     -- Arabic name
  'Settings',                      -- Lucide icon name
  '/tickets/settings',             -- Route path
  41,                              -- Display order (after all_tickets)
  'ticket_categories.manage',      -- Required permission
  'tickets',                       -- Required package feature
  true,                            -- System menu (cannot delete)
  true                             -- Show in menu
WHERE NOT EXISTS (
  SELECT 1 FROM menu_items WHERE key = 'ticket_settings'
);

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================
-- You now have:
-- ✅ Tickets menu with hierarchical submenu structure:
--    - Tickets (parent, expands to show children)
--      - All Tickets (child, navigates to /tickets)
--      - Settings (child, navigates to /tickets/settings)
-- ✅ Permission-based visibility:
--    - All Tickets: requires 'tickets.view'
--    - Settings: requires 'ticket_categories.manage'
-- ✅ Automatically filtered by package feature ('tickets')
-- ✅ Bilingual support (EN/AR)
--
-- Result in sidebar:
-- 📋 Tickets (parent)
--    ├─ 📝 All Tickets → /tickets
--    └─ ⚙️ Settings → /tickets/settings
--
-- Permission Matrix:
-- ✅ Automatically creates "Tickets" tab (100% dynamic!)
-- ✅ Groups tickets.* and ticket_categories.* permissions
-- ✅ Uses menu hierarchy to determine categorization
-- =====================================================
