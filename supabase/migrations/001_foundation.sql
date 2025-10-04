-- =====================================================
-- Module 0: Foundation - Organizations, Users, Invitations
-- =====================================================
-- Multi-Tenant SaaS Platform Database Schema
-- Created: 2025-10-02
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: organizations
-- =====================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  domain VARCHAR(255),

  -- Subscription info
  subscription_plan VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(20) DEFAULT 'trialing',

  -- Limits
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
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(subscription_status);

-- RLS Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own organization" ON organizations
  FOR SELECT
  USING (id = current_setting('app.current_organization_id', true)::UUID);

CREATE POLICY "Users can update own organization" ON organizations
  FOR UPDATE
  USING (id = current_setting('app.current_organization_id', true)::UUID);

-- =====================================================
-- Table: users
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  -- Profile
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  phone VARCHAR(20),

  -- Role & Permissions
  role VARCHAR(50) DEFAULT 'member',  -- admin, manager, agent, member
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
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org users" ON users
  FOR SELECT
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can manage users" ON users
  FOR ALL
  USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- Table: invitations
-- =====================================================
CREATE TABLE invitations (
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
CREATE INDEX idx_invitations_org ON invitations(organization_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);

-- RLS Policies
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization invitations" ON invitations
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

-- =====================================================
-- Triggers: Updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Foundation Migration Complete
-- =====================================================
