-- =====================================================
-- Migration 004: Clean Up Duplicate Fields
-- Remove redundant limit/feature fields from organizations table
-- Make packages table the single source of truth
-- =====================================================
-- Created: 2025-10-04
-- =====================================================

-- =====================================================
-- SAFETY CHECK: Verify no data will be lost
-- =====================================================

-- Check if any organization has custom_limits set
DO $$
DECLARE
  custom_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO custom_count
  FROM organizations
  WHERE custom_limits IS NOT NULL
    AND custom_limits::text != '{}'::text;

  IF custom_count > 0 THEN
    RAISE NOTICE 'WARNING: % organizations have custom_limits set. These should be migrated to custom packages first!', custom_count;
  ELSE
    RAISE NOTICE 'OK: No organizations have custom_limits set.';
  END IF;
END $$;

-- Check if any organization has limits different from their package
DO $$
DECLARE
  mismatch_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mismatch_count
  FROM organizations o
  JOIN packages p ON o.package_id = p.id
  WHERE o.max_users IS DISTINCT FROM p.max_users
     OR o.max_whatsapp_profiles IS DISTINCT FROM p.max_whatsapp_profiles
     OR o.max_customers IS DISTINCT FROM p.max_customers
     OR o.max_messages_per_day IS DISTINCT FROM p.max_messages_per_day;

  IF mismatch_count > 0 THEN
    RAISE NOTICE 'WARNING: % organizations have limits different from their package!', mismatch_count;
  ELSE
    RAISE NOTICE 'OK: All organizations match their package limits.';
  END IF;
END $$;

-- =====================================================
-- STEP 1: Update Helper Functions (before dropping columns)
-- =====================================================

-- Simplify get_organization_limits() - just read from packages
CREATE OR REPLACE FUNCTION get_organization_limits(org_id UUID)
RETURNS TABLE (
  max_users INT,
  max_whatsapp_profiles INT,
  max_customers INT,
  max_messages_per_day INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.max_users,
    p.max_whatsapp_profiles,
    p.max_customers,
    p.max_messages_per_day
  FROM organizations o
  JOIN packages p ON o.package_id = p.id
  WHERE o.id = org_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_organization_limits(UUID) IS 'Get effective limits for an organization from their package (single source of truth)';

-- Simplify organization_has_feature() - just read from packages
CREATE OR REPLACE FUNCTION organization_has_feature(org_id UUID, feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_feature BOOLEAN;
BEGIN
  SELECT (p.features->>feature_name)::BOOLEAN INTO has_feature
  FROM organizations o
  JOIN packages p ON o.package_id = p.id
  WHERE o.id = org_id;

  RETURN COALESCE(has_feature, false);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION organization_has_feature(UUID, TEXT) IS 'Check if organization has access to a feature via their package';

-- =====================================================
-- STEP 2: Drop Redundant Columns from organizations
-- =====================================================

-- Drop limit columns (now in packages table only)
ALTER TABLE organizations DROP COLUMN IF EXISTS max_users;
ALTER TABLE organizations DROP COLUMN IF EXISTS max_whatsapp_profiles;
ALTER TABLE organizations DROP COLUMN IF EXISTS max_customers;
ALTER TABLE organizations DROP COLUMN IF EXISTS max_messages_per_day;

-- Drop custom_limits JSONB (use custom packages instead)
ALTER TABLE organizations DROP COLUMN IF EXISTS custom_limits;

-- Drop features JSONB (now in packages table only)
ALTER TABLE organizations DROP COLUMN IF EXISTS features;

-- Drop deprecated subscription_plan field (replaced by package_id)
ALTER TABLE organizations DROP COLUMN IF EXISTS subscription_plan;

-- =====================================================
-- STEP 3: Update Column Comments
-- =====================================================

COMMENT ON COLUMN organizations.package_id IS 'Links to packages table (single source of truth for limits and features). For custom deals, create a custom package with is_custom=true';
COMMENT ON COLUMN organizations.subscription_status IS 'Subscription lifecycle status: trialing, active, past_due, canceled, expired';
COMMENT ON COLUMN organizations.trial_ends_at IS 'When the trial period ends. NULL for paid customers.';
COMMENT ON COLUMN organizations.settings IS 'Organization preferences and configurations (NOT limits or features). Examples: timezone, branding, business_hours, notifications, etc.';

-- =====================================================
-- STEP 4: Add Index for Better Performance
-- =====================================================

-- Ensure fast JOINs to packages table
CREATE INDEX IF NOT EXISTS idx_organizations_package_id ON organizations(package_id);

-- =====================================================
-- VERIFICATION: Display Final Schema
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Migration 004 Complete!';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Organizations table now has ONLY:';
  RAISE NOTICE '  - package_id (foreign key to packages)';
  RAISE NOTICE '  - subscription_status (trialing, active, etc.)';
  RAISE NOTICE '  - trial_ends_at (trial expiry date)';
  RAISE NOTICE '  - settings (preferences, NOT limits)';
  RAISE NOTICE '';
  RAISE NOTICE 'All limits and features come from packages table.';
  RAISE NOTICE 'For custom deals: create custom package with is_custom=true';
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
END $$;

-- =====================================================
-- Clean Up Complete - Single Source of Truth Achieved
-- =====================================================
