-- =====================================================
-- ADD TICKET CATEGORIES PERMISSION TO ROLES
-- =====================================================
-- Migration: 021_add_ticket_categories_permission.sql
-- Description: Add ticket_categories.manage permission to admin and manager roles
-- Issue: Permission was missing, causing it not to appear in permission matrix
-- Dependencies: 020_activate_tickets_settings_menu.sql (menu items must exist)
-- =====================================================

-- Add ticket_categories.manage permission to admin role
UPDATE roles
SET permissions = permissions || '["ticket_categories.manage"]'::jsonb
WHERE slug = 'admin'
  AND NOT (permissions @> '["ticket_categories.manage"]'::jsonb);

-- Add ticket_categories.manage permission to manager role
UPDATE roles
SET permissions = permissions || '["ticket_categories.manage"]'::jsonb
WHERE slug = 'manager'
  AND NOT (permissions @> '["ticket_categories.manage"]'::jsonb);

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify permissions were added:
-- SELECT name, slug, permissions
-- FROM roles
-- WHERE slug IN ('admin', 'manager')
-- ORDER BY name;
-- =====================================================

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================
-- You should now see:
-- ✅ "Manage Ticket Categories" permission in matrix
-- ✅ Permission appears under "Tickets" tab
-- ✅ Admin and Manager roles have the permission
-- ✅ Settings menu permission checks work correctly
-- =====================================================
