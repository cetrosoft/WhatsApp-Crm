-- Verify menu_items table exists and has data
-- Run this in Supabase SQL Editor

-- 1. Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'menu_items'
) as table_exists;

-- 2. Count total menu items
SELECT COUNT(*) as total_items FROM menu_items;

-- 3. Show all menu items with English and Arabic names
SELECT
  key,
  parent_key,
  name_en,
  name_ar,
  icon,
  path,
  required_permission,
  required_feature,
  is_active,
  display_order
FROM menu_items
ORDER BY display_order, parent_key NULLS FIRST;

-- 4. Check Pipelines specifically
SELECT
  key,
  name_en,
  name_ar,
  icon,
  path
FROM menu_items
WHERE key = 'crm_pipelines';

-- 5. Test the get_user_menu function (replace YOUR_USER_ID with actual UUID)
-- SELECT * FROM get_user_menu('YOUR_USER_ID'::uuid, 'ar');
