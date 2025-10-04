-- =====================================================
-- COMBINED MIGRATION - RUN THIS IN SUPABASE
-- =====================================================
-- Multi-Tenant SaaS Platform Complete Setup
-- This combines all 3 migrations into one file
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PART 1: FOUNDATION
-- =====================================================

-- Table: organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  domain VARCHAR(255),

  -- Subscription info
  subscription_plan VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(20) DEFAULT 'trialing',

  -- Limits (will be deprecated after packages system)
  max_users INT DEFAULT 3,
  max_whatsapp_profiles INT DEFAULT 1,
  max_customers INT DEFAULT 100,
  max_messages_per_day INT DEFAULT 50,

  -- Features (JSONB for flexibility)
  features JSONB DEFAULT '{
    "crm": true,
    "ticketing": false,
    "bulk_sender": false,
    "analytics": false,
    "api_access": false,
    "white_label": false
  }'::jsonb,

  -- Metadata
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(subscription_status);

-- RLS Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
CREATE POLICY "Users can view own organization" ON organizations
  FOR SELECT
  USING (id = current_setting('app.current_organization_id', true)::UUID);

DROP POLICY IF EXISTS "Users can update own organization" ON organizations;
CREATE POLICY "Users can update own organization" ON organizations
  FOR UPDATE
  USING (id = current_setting('app.current_organization_id', true)::UUID);

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  -- Profile
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  phone VARCHAR(20),

  -- Role & Permissions
  role VARCHAR(50) DEFAULT 'member',
  permissions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,

  -- Invitation tracking
  invited_by UUID REFERENCES users(id),
  invitation_accepted_at TIMESTAMPTZ,

  -- Activity
  last_login_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org users" ON users;
CREATE POLICY "Users can view org users" ON users
  FOR SELECT
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage users" ON users;
CREATE POLICY "Admins can manage users" ON users
  FOR ALL
  USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Table: invitations
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  permissions JSONB DEFAULT '{}'::jsonb,

  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,

  invited_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invitations_org ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);

-- RLS Policies
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organization invitations" ON invitations;
CREATE POLICY "Organization invitations" ON invitations
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

-- Triggers: Updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PART 2: i18n SUPPORT
-- =====================================================

-- Add language preference to users table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='users' AND column_name='preferred_language') THEN
    ALTER TABLE users ADD COLUMN preferred_language VARCHAR(5) DEFAULT 'ar'
    CHECK (preferred_language IN ('ar', 'en'));
  END IF;
END $$;

-- Add default language to organizations table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='organizations' AND column_name='default_language') THEN
    ALTER TABLE organizations ADD COLUMN default_language VARCHAR(5) DEFAULT 'ar'
    CHECK (default_language IN ('ar', 'en'));
  END IF;
END $$;

-- =====================================================
-- PART 3: PACKAGES SYSTEM
-- =====================================================

-- Table: packages
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Info
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,

  -- Pricing
  price_monthly DECIMAL(10,2) DEFAULT 0,
  price_yearly DECIMAL(10,2) DEFAULT 0,

  -- Usage Limits
  max_users INT DEFAULT 3,
  max_whatsapp_profiles INT DEFAULT 1,
  max_customers INT DEFAULT 100,
  max_messages_per_day INT DEFAULT 50,

  -- Features (JSONB for flexibility)
  features JSONB DEFAULT '{
    "crm": true,
    "ticketing": false,
    "bulk_sender": false,
    "analytics": false,
    "api_access": false,
    "white_label": false,
    "priority_support": false,
    "custom_branding": false
  }'::jsonb,

  -- Display & Status
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  is_custom BOOLEAN DEFAULT false,

  -- Stripe Integration (for future billing module)
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_packages_slug ON packages(slug);
CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(is_active);
CREATE INDEX IF NOT EXISTS idx_packages_order ON packages(display_order);

-- RLS Policies
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Packages are viewable by everyone" ON packages;
CREATE POLICY "Packages are viewable by everyone" ON packages
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Only admins can manage packages" ON packages;
CREATE POLICY "Only admins can manage packages" ON packages
  FOR ALL
  USING (false);

-- Seed Initial Packages (only if empty)
INSERT INTO packages (name, slug, description, price_monthly, price_yearly, max_users, max_whatsapp_profiles, max_customers, max_messages_per_day, features, display_order)
SELECT * FROM (VALUES
  ('Free', 'free', 'Perfect for trying out the platform', 0, 0, 3, 1, 100, 50,
   '{"crm": true, "ticketing": false, "bulk_sender": false, "analytics": false, "api_access": false, "white_label": false, "priority_support": false, "custom_branding": false}'::jsonb, 1),

  ('Lite', 'lite', 'Great for small businesses', 29, 290, 10, 2, 500, 200,
   '{"crm": true, "ticketing": true, "bulk_sender": false, "analytics": false, "api_access": false, "white_label": false, "priority_support": false, "custom_branding": false}'::jsonb, 2),

  ('Professional', 'professional', 'Best for growing teams', 99, 990, 50, 5, 5000, 1000,
   '{"crm": true, "ticketing": true, "bulk_sender": true, "analytics": true, "api_access": false, "white_label": false, "priority_support": true, "custom_branding": false}'::jsonb, 3),

  ('Business', 'business', 'For large organizations', 299, 2990, 200, 20, 50000, 10000,
   '{"crm": true, "ticketing": true, "bulk_sender": true, "analytics": true, "api_access": true, "white_label": false, "priority_support": true, "custom_branding": true}'::jsonb, 4),

  ('Enterprise', 'enterprise', 'Custom solution for enterprise needs', NULL, NULL, NULL, NULL, NULL, NULL,
   '{"crm": true, "ticketing": true, "bulk_sender": true, "analytics": true, "api_access": true, "white_label": true, "priority_support": true, "custom_branding": true}'::jsonb, 5)
) AS v(name, slug, description, price_monthly, price_yearly, max_users, max_whatsapp_profiles, max_customers, max_messages_per_day, features, display_order)
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE slug = v.slug);

-- Update organizations table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='organizations' AND column_name='package_id') THEN
    ALTER TABLE organizations ADD COLUMN package_id UUID REFERENCES packages(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='organizations' AND column_name='custom_limits') THEN
    ALTER TABLE organizations ADD COLUMN custom_limits JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='organizations' AND column_name='trial_ends_at') THEN
    ALTER TABLE organizations ADD COLUMN trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days');
  END IF;
END $$;

-- Set default package to 'Free' for existing organizations
UPDATE organizations
SET package_id = (SELECT id FROM packages WHERE slug = 'free' LIMIT 1)
WHERE package_id IS NULL;

-- Make package_id required going forward (only if column exists and has data)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='organizations' AND column_name='package_id') THEN
    ALTER TABLE organizations ALTER COLUMN package_id SET NOT NULL;
  END IF;
END $$;

-- Helper Functions
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
    COALESCE((o.custom_limits->>'max_users')::INT, p.max_users) as max_users,
    COALESCE((o.custom_limits->>'max_whatsapp_profiles')::INT, p.max_whatsapp_profiles) as max_whatsapp_profiles,
    COALESCE((o.custom_limits->>'max_customers')::INT, p.max_customers) as max_customers,
    COALESCE((o.custom_limits->>'max_messages_per_day')::INT, p.max_messages_per_day) as max_messages_per_day
  FROM organizations o
  JOIN packages p ON o.package_id = p.id
  WHERE o.id = org_id;
END;
$$ LANGUAGE plpgsql;

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

-- Triggers
DROP TRIGGER IF EXISTS update_packages_updated_at ON packages;
CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================
-- You should now have:
-- - organizations table
-- - users table
-- - invitations table
-- - packages table (with 5 seeded plans)
-- - All RLS policies
-- - All helper functions
-- =====================================================
