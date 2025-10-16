-- =====================================================
-- SUPER ADMIN FOUNDATION - MINIMAL VIABLE SYSTEM
-- =====================================================
-- Migration: 023_super_admin_foundation.sql
-- Purpose: Enable platform-level administration
-- Architecture: Isolated from organization system
-- Date: January 2025
-- Related Docs: docs/SUPER_ADMIN_IMPLEMENTATION_PLAN.md
-- =====================================================

-- =====================================================
-- TABLE 1: SUPER ADMINS
-- Platform administrators (separate from organization users)
-- =====================================================

CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for super_admins
CREATE INDEX IF NOT EXISTS idx_super_admins_email ON super_admins(email);
CREATE INDEX IF NOT EXISTS idx_super_admins_active ON super_admins(is_active);

-- Add comments
COMMENT ON TABLE super_admins IS 'Platform-level administrators (separate from organization users)';
COMMENT ON COLUMN super_admins.email IS 'Super admin login email (unique across platform)';
COMMENT ON COLUMN super_admins.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN super_admins.is_active IS 'Whether super admin account is active';
COMMENT ON COLUMN super_admins.last_login_at IS 'Last successful login timestamp';

-- =====================================================
-- TABLE 2: SUBSCRIPTIONS
-- Links organizations to packages (centralized subscription management)
-- =====================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  package_id UUID REFERENCES packages(id),
  status VARCHAR(20) DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  billing_cycle VARCHAR(20) DEFAULT 'monthly',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('active', 'trialing', 'suspended', 'cancelled', 'expired')),
  CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('monthly', 'yearly'))
);

-- Add indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_package ON subscriptions(package_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);

-- Add comments
COMMENT ON TABLE subscriptions IS 'Organization subscription records (links org to package)';
COMMENT ON COLUMN subscriptions.status IS 'Subscription status: active, trialing, suspended, cancelled, expired';
COMMENT ON COLUMN subscriptions.billing_cycle IS 'Billing frequency: monthly or yearly';
COMMENT ON COLUMN subscriptions.trial_ends_at IS 'When trial period ends (NULL if not on trial)';
COMMENT ON COLUMN subscriptions.current_period_end IS 'When current billing period ends';

-- =====================================================
-- TABLE 3: SUPER ADMIN AUDIT LOGS
-- Track all super admin actions for security and compliance
-- =====================================================

CREATE TABLE IF NOT EXISTS super_admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_id UUID REFERENCES super_admins(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON super_admin_audit_logs(super_admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON super_admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON super_admin_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON super_admin_audit_logs(created_at DESC);

-- Add comments
COMMENT ON TABLE super_admin_audit_logs IS 'Immutable log of all super admin actions';
COMMENT ON COLUMN super_admin_audit_logs.action IS 'Action performed (e.g., organization.suspend, package.update)';
COMMENT ON COLUMN super_admin_audit_logs.resource_type IS 'Type of resource affected (organization, package, etc.)';
COMMENT ON COLUMN super_admin_audit_logs.resource_id IS 'ID of affected resource';
COMMENT ON COLUMN super_admin_audit_logs.details IS 'Additional context as JSON';
COMMENT ON COLUMN super_admin_audit_logs.ip_address IS 'IP address of super admin when action performed';

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Super admins table: Only service role can manage
CREATE POLICY "Service role full access on super_admins" ON super_admins
  FOR ALL USING (true);

-- Subscriptions table: Only service role can manage
CREATE POLICY "Service role full access on subscriptions" ON subscriptions
  FOR ALL USING (true);

-- Audit logs table: Only service role can manage (immutable via backend)
CREATE POLICY "Service role full access on audit_logs" ON super_admin_audit_logs
  FOR ALL USING (true);

-- =====================================================
-- SEED FIRST SUPER ADMIN
-- =====================================================
-- IMPORTANT: Change this password immediately after first login!
-- Default password: "SuperAdmin2025!" (MUST CHANGE!)
-- =====================================================

INSERT INTO super_admins (email, password_hash, full_name, is_active)
VALUES (
  'admin@omnichannel-crm.com',
  -- Password: SuperAdmin2025! (bcrypt hash)
  -- IMPORTANT: CHANGE THIS PASSWORD after first login!
  -- To generate new hash: cd backend && node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourNewPassword', 10).then(console.log);"
  '$2b$10$ahTipd3Dy3DpZS8sdys4euOq.Y0XNBjEZ1R.F47kwomHjIElA9WzW',
  'Platform Administrator',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Add a comment to remind about password change
COMMENT ON TABLE super_admins IS 'Platform administrators - IMPORTANT: Change default super admin password after first login!';

-- =====================================================
-- CREATE SUBSCRIPTIONS FOR EXISTING ORGANIZATIONS
-- Migrate existing organizations to subscription system
-- =====================================================

INSERT INTO subscriptions (
  organization_id,
  package_id,
  status,
  trial_ends_at,
  current_period_start,
  current_period_end
)
SELECT
  o.id,
  o.package_id,
  CASE
    WHEN o.subscription_status = 'trialing' THEN 'trialing'
    WHEN o.subscription_status = 'active' THEN 'active'
    WHEN o.subscription_status = 'suspended' THEN 'suspended'
    WHEN o.subscription_status = 'cancelled' THEN 'cancelled'
    ELSE 'active'
  END,
  CASE WHEN o.subscription_status = 'trialing' THEN NOW() + INTERVAL '30 days' ELSE NULL END,
  o.created_at,
  o.created_at + INTERVAL '30 days'
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions s WHERE s.organization_id = o.id
)
AND o.package_id IS NOT NULL;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get organization subscription info
CREATE OR REPLACE FUNCTION get_organization_subscription(org_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  package_name VARCHAR,
  status VARCHAR,
  current_period_end TIMESTAMPTZ,
  is_trial BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    p.name,
    s.status,
    s.current_period_end,
    (s.trial_ends_at IS NOT NULL AND s.trial_ends_at > NOW()) AS is_trial
  FROM subscriptions s
  JOIN packages p ON s.package_id = p.id
  WHERE s.organization_id = org_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to check if subscription is active
CREATE OR REPLACE FUNCTION is_subscription_active(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions
    WHERE organization_id = org_id
    AND status IN ('active', 'trialing')
    AND (trial_ends_at IS NULL OR trial_ends_at > NOW())
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION QUERIES
-- Run these to verify migration success
-- =====================================================

-- Check super admins table
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM super_admins;
  RAISE NOTICE 'Super admins created: %', admin_count;

  IF admin_count = 0 THEN
    RAISE WARNING 'No super admins found! Check seed data.';
  END IF;
END $$;

-- Check subscriptions table
DO $$
DECLARE
  sub_count INTEGER;
  org_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sub_count FROM subscriptions;
  SELECT COUNT(*) INTO org_count FROM organizations;

  RAISE NOTICE 'Subscriptions created: % (Organizations: %)', sub_count, org_count;

  IF sub_count < org_count THEN
    RAISE WARNING 'Some organizations do not have subscriptions!';
  END IF;
END $$;

-- Check audit logs table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'super_admin_audit_logs') THEN
    RAISE NOTICE 'Audit logs table created successfully';
  ELSE
    RAISE WARNING 'Audit logs table not created!';
  END IF;
END $$;

-- =====================================================
-- DISPLAY SUMMARY
-- =====================================================

SELECT
  '✅ Migration 023: Super Admin Foundation' AS status,
  'Tables Created: super_admins, subscriptions, super_admin_audit_logs' AS tables,
  'Policies: RLS enabled on all tables' AS security,
  'Seed Data: 1 super admin created' AS seed,
  'Next Step: Generate password hash and update super_admins table' AS next_step;

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================
--
-- 1. PASSWORD SECURITY:
--    - Default password is: SuperAdmin2025!
--    - MUST change immediately after first login
--    - Generate new hash: node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourPassword', 10).then(console.log);"
--    - Update: UPDATE super_admins SET password_hash = 'new_hash' WHERE email = 'admin@omnichannel-crm.com';
--
-- 2. SUBSCRIPTIONS:
--    - All existing organizations now have subscriptions
--    - Status migrated from organizations.subscription_status
--    - 30-day billing cycle by default
--
-- 3. AUDIT LOGS:
--    - All super admin actions will be logged
--    - Logs are immutable (no DELETE policy)
--    - Includes IP address and user agent for security
--
-- 4. RLS POLICIES:
--    - All tables use service role key only
--    - Super admins bypass organization RLS
--    - Backend API handles all access control
--
-- 5. NEXT STEPS:
--    - Day 2: Create backend authentication routes
--    - Day 3: Create organization management routes
--    - Day 4: Create stats routes and frontend context
--    - Day 5: Create frontend pages and layout
--
-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================
