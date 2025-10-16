-- =====================================================
-- BACKFILL SUBSCRIPTIONS FOR EXISTING ORGANIZATIONS
-- =====================================================
-- Migration: 023a_backfill_subscriptions.sql
-- Purpose: Create subscription records for all organizations
-- Date: January 2025
-- Reason: Organizations created before super admin system
--         don't have subscription records
-- =====================================================

-- Backfill subscriptions for all existing organizations
INSERT INTO subscriptions (
  organization_id,
  package_id,
  status,
  current_period_start,
  current_period_end,
  billing_cycle,
  trial_ends_at,
  created_at,
  updated_at
)
SELECT
  o.id,
  o.package_id,
  COALESCE(o.subscription_status, 'active') as status,
  NOW() as current_period_start,
  NOW() + INTERVAL '30 days' as current_period_end,
  'monthly' as billing_cycle,
  CASE
    WHEN o.subscription_status = 'trialing'
    THEN NOW() + INTERVAL '30 days'
    ELSE NULL
  END as trial_ends_at,
  o.created_at,
  NOW() as updated_at
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions s
  WHERE s.organization_id = o.id
)
AND o.package_id IS NOT NULL;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check how many subscriptions were created
SELECT COUNT(*) as subscriptions_created
FROM subscriptions;

-- Verify all organizations have subscriptions
SELECT
  COUNT(*) as total_orgs,
  COUNT(s.id) as orgs_with_subscriptions,
  COUNT(*) - COUNT(s.id) as missing_subscriptions
FROM organizations o
LEFT JOIN subscriptions s ON o.id = s.organization_id;

-- Expected Output:
--   missing_subscriptions should be 0
--   If not, check organizations without packages:
--     SELECT * FROM organizations WHERE package_id IS NULL;

-- Show sample of created subscriptions
SELECT
  o.name as organization,
  o.subscription_status as org_status,
  s.status as subscription_status,
  s.billing_cycle,
  s.current_period_end,
  s.trial_ends_at
FROM organizations o
INNER JOIN subscriptions s ON o.id = s.organization_id
ORDER BY o.created_at DESC
LIMIT 10;

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================
-- Next Steps:
-- 1. Restart backend server (if needed)
-- 2. Test super admin dashboard
-- 3. Verify stats show correct numbers
-- 4. Test organizations page
-- =====================================================
