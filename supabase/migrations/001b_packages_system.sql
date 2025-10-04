-- =====================================================
-- Packages/Subscription Plans System
-- Refactor subscription model for better scalability
-- =====================================================
-- Created: 2025-10-02
-- =====================================================

-- =====================================================
-- Table: packages (subscription plans)
-- =====================================================
CREATE TABLE packages (
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
CREATE INDEX idx_packages_slug ON packages(slug);
CREATE INDEX idx_packages_active ON packages(is_active);
CREATE INDEX idx_packages_order ON packages(display_order);

-- RLS Policies (packages are public for pricing page)
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Packages are viewable by everyone" ON packages
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only admins can manage packages" ON packages
  FOR ALL
  USING (false); -- Will be updated when we add super admin

-- =====================================================
-- Seed Initial Packages
-- =====================================================

INSERT INTO packages (name, slug, description, price_monthly, price_yearly, max_users, max_whatsapp_profiles, max_customers, max_messages_per_day, features, display_order) VALUES

-- Free Plan
('Free', 'free', 'Perfect for trying out the platform', 0, 0, 3, 1, 100, 50,
'{
  "crm": true,
  "ticketing": false,
  "bulk_sender": false,
  "analytics": false,
  "api_access": false,
  "white_label": false,
  "priority_support": false,
  "custom_branding": false
}'::jsonb, 1),

-- Lite Plan
('Lite', 'lite', 'Great for small businesses', 29, 290, 10, 2, 500, 200,
'{
  "crm": true,
  "ticketing": true,
  "bulk_sender": false,
  "analytics": false,
  "api_access": false,
  "white_label": false,
  "priority_support": false,
  "custom_branding": false
}'::jsonb, 2),

-- Professional Plan
('Professional', 'professional', 'Best for growing teams', 99, 990, 50, 5, 5000, 1000,
'{
  "crm": true,
  "ticketing": true,
  "bulk_sender": true,
  "analytics": true,
  "api_access": false,
  "white_label": false,
  "priority_support": true,
  "custom_branding": false
}'::jsonb, 3),

-- Business Plan
('Business', 'business', 'For large organizations', 299, 2990, 200, 20, 50000, 10000,
'{
  "crm": true,
  "ticketing": true,
  "bulk_sender": true,
  "analytics": true,
  "api_access": true,
  "white_label": false,
  "priority_support": true,
  "custom_branding": true
}'::jsonb, 4),

-- Enterprise Plan (custom pricing)
('Enterprise', 'enterprise', 'Custom solution for enterprise needs', NULL, NULL, NULL, NULL, NULL, NULL,
'{
  "crm": true,
  "ticketing": true,
  "bulk_sender": true,
  "analytics": true,
  "api_access": true,
  "white_label": true,
  "priority_support": true,
  "custom_branding": true
}'::jsonb, 5);

-- =====================================================
-- Update organizations table
-- =====================================================

-- Add package_id foreign key
ALTER TABLE organizations
ADD COLUMN package_id UUID REFERENCES packages(id);

-- Add custom limits for enterprise (overrides package limits)
ALTER TABLE organizations
ADD COLUMN custom_limits JSONB DEFAULT '{}'::jsonb;

-- Add trial tracking
ALTER TABLE organizations
ADD COLUMN trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days');

-- Set default package to 'Free' for existing organizations
UPDATE organizations
SET package_id = (SELECT id FROM packages WHERE slug = 'free' LIMIT 1)
WHERE package_id IS NULL;

-- Make package_id required going forward
ALTER TABLE organizations
ALTER COLUMN package_id SET NOT NULL;

-- Remove old individual limit columns (keep them for now, will deprecate later)
-- We'll keep them temporarily for backward compatibility
-- ALTER TABLE organizations DROP COLUMN max_users;
-- ALTER TABLE organizations DROP COLUMN max_whatsapp_profiles;
-- ALTER TABLE organizations DROP COLUMN max_customers;
-- ALTER TABLE organizations DROP COLUMN max_messages_per_day;

-- Add comment
COMMENT ON COLUMN organizations.package_id IS 'Current subscription package/plan';
COMMENT ON COLUMN organizations.custom_limits IS 'Enterprise custom limit overrides (JSONB)';

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to get effective limits for an organization
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

-- Function to check if organization has a feature
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

-- =====================================================
-- Triggers
-- =====================================================

CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Packages System Migration Complete
-- =====================================================
