-- Test if deal_tags table exists and check its structure
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'deal_tags'
) AS deal_tags_exists;

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'deal_tags'
ORDER BY ordinal_position;

-- Count rows in deal_tags
SELECT COUNT(*) as total_deal_tags FROM deal_tags;

-- Show sample data
SELECT * FROM deal_tags LIMIT 5;

-- Check if deals have tags column (old system)
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'deals' AND column_name = 'tags';
