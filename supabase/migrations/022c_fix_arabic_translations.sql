-- =====================================================
-- FIX MISSING ARABIC TRANSLATIONS IN MENU_ITEMS
-- =====================================================
-- Migration: 022c_fix_arabic_translations.sql
-- Description: Add missing Arabic translations (name_ar)
-- Issue: Some menu items showing English in Arabic interface
-- =====================================================

-- First, let's see which items are missing Arabic translations
-- Run this query to check:
-- SELECT key, name_en, name_ar FROM menu_items WHERE name_ar IS NULL OR name_ar = '';

-- =====================================================
-- UPDATE MISSING ARABIC TRANSLATIONS
-- =====================================================

-- Support/Tickets Module
UPDATE menu_items SET name_ar = 'التذاكر' WHERE key = 'support_tickets' AND (name_ar IS NULL OR name_ar = '');
UPDATE menu_items SET name_ar = 'جميع التذاكر' WHERE key = 'all_tickets' AND (name_ar IS NULL OR name_ar = '');
UPDATE menu_items SET name_ar = 'إعدادات التذاكر' WHERE key = 'ticket_settings' AND (name_ar IS NULL OR name_ar = '');

-- Campaigns Module
UPDATE menu_items SET name_ar = 'الحملات' WHERE key = 'campaigns' AND (name_ar IS NULL OR name_ar = '');

-- Conversations Module
UPDATE menu_items SET name_ar = 'المحادثات' WHERE key = 'conversations' AND (name_ar IS NULL OR name_ar = '');

-- Analytics Module
UPDATE menu_items SET name_ar = 'التحليلات' WHERE key = 'analytics' AND (name_ar IS NULL OR name_ar = '');

-- CRM Module (double-check these exist)
UPDATE menu_items SET name_ar = 'إدارة العملاء' WHERE key = 'crm' AND (name_ar IS NULL OR name_ar = '');
UPDATE menu_items SET name_ar = 'جهات الاتصال' WHERE key = 'crm_contacts' AND (name_ar IS NULL OR name_ar = '');
UPDATE menu_items SET name_ar = 'الشركات' WHERE key = 'crm_companies' AND (name_ar IS NULL OR name_ar = '');
UPDATE menu_items SET name_ar = 'الصفقات' WHERE key = 'crm_deals' AND (name_ar IS NULL OR name_ar = '');
UPDATE menu_items SET name_ar = 'مسار المبيعات' WHERE key = 'crm_pipelines' AND (name_ar IS NULL OR name_ar = '');
UPDATE menu_items SET name_ar = 'التصنيفات' WHERE key = 'crm_segmentation' AND (name_ar IS NULL OR name_ar = '');
UPDATE menu_items SET name_ar = 'إعدادات إدارة العملاء' WHERE key = 'crm_settings' AND (name_ar IS NULL OR name_ar = '');

-- CRM Settings Sub-items
UPDATE menu_items SET name_ar = 'الوسوم' WHERE key = 'tags' AND (name_ar IS NULL OR name_ar = '');
UPDATE menu_items SET name_ar = 'حالات جهات الاتصال' WHERE key = 'contact_statuses' AND (name_ar IS NULL OR name_ar = '');
UPDATE menu_items SET name_ar = 'مصادر العملاء المحتملين' WHERE key = 'lead_sources' AND (name_ar IS NULL OR name_ar = '');

-- Team Module
UPDATE menu_items SET name_ar = 'الفريق' WHERE key = 'team' AND (name_ar IS NULL OR name_ar = '');
UPDATE menu_items SET name_ar = 'الأعضاء' WHERE key = 'team_members' AND (name_ar IS NULL OR name_ar = '');
UPDATE menu_items SET name_ar = 'الأدوار والصلاحيات' WHERE key = 'team_roles' AND (name_ar IS NULL OR name_ar = '');

-- Settings Module
UPDATE menu_items SET name_ar = 'الإعدادات' WHERE key = 'settings' AND (name_ar IS NULL OR name_ar = '');
UPDATE menu_items SET name_ar = 'حساب المؤسسة' WHERE key = 'settings_account' AND (name_ar IS NULL OR name_ar = '');

-- Dashboard
UPDATE menu_items SET name_ar = 'لوحة التحكم' WHERE key = 'dashboard' AND (name_ar IS NULL OR name_ar = '');

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify all items have Arabic translations:
SELECT
  key,
  name_en,
  name_ar,
  CASE
    WHEN name_ar IS NULL OR name_ar = '' THEN '❌ Missing'
    ELSE '✅ OK'
  END as status
FROM menu_items
ORDER BY display_order;

-- Expected: All items should show '✅ OK'

-- =====================================================
-- COUNT CHECK
-- =====================================================
SELECT
  COUNT(*) as total_items,
  COUNT(CASE WHEN name_ar IS NOT NULL AND name_ar != '' THEN 1 END) as items_with_arabic,
  COUNT(CASE WHEN name_ar IS NULL OR name_ar = '' THEN 1 END) as items_missing_arabic
FROM menu_items;

-- Expected: items_missing_arabic should be 0

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================
-- After running this:
-- 1. Restart backend (if needed - probably not)
-- 2. Refresh frontend
-- 3. Switch to Arabic interface
-- 4. Verify permission matrix shows Arabic labels
-- =====================================================
