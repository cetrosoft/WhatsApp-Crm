-- =====================================================
-- Migration 014: Custom Roles System (SAFE VERSION)
-- =====================================================
-- Implements database-driven role management
-- Uses DUAL COLUMN approach for zero-downtime migration
-- Keeps users.role (VARCHAR) + adds users.role_id (UUID)
-- Both columns stay in sync via trigger
-- =====================================================

-- =====================================================
-- Table: roles
-- =====================================================
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  -- Role identity
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,

  -- Permissions (array of permission keys)
  permissions JSONB DEFAULT '[]'::jsonb,

  -- System flag (true for default roles: admin, manager, agent, member)
  is_system BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique slug per organization
  UNIQUE(organization_id, slug)
);

-- Indexes for performance
CREATE INDEX idx_roles_org ON roles(organization_id);
CREATE INDEX idx_roles_slug ON roles(slug);
CREATE INDEX idx_roles_system ON roles(is_system);

-- RLS Policies
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org roles" ON roles
  FOR SELECT
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

CREATE POLICY "Admins can insert roles" ON roles
  FOR INSERT
  WITH CHECK (
    organization_id = current_setting('app.current_organization_id', true)::UUID
    AND current_setting('app.current_user_role', true) = 'admin'
  );

CREATE POLICY "Admins can update custom roles" ON roles
  FOR UPDATE
  USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
    AND is_system = false
    AND current_setting('app.current_user_role', true) = 'admin'
  );

CREATE POLICY "Admins can delete custom roles" ON roles
  FOR DELETE
  USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
    AND is_system = false
    AND current_setting('app.current_user_role', true) = 'admin'
  );

-- =====================================================
-- Seed System Roles for All Organizations
-- =====================================================

-- Function to get default permissions for each role
CREATE OR REPLACE FUNCTION get_default_role_permissions(role_slug VARCHAR)
RETURNS JSONB AS $$
BEGIN
  CASE role_slug
    WHEN 'admin' THEN
      RETURN '["contacts.view", "contacts.create", "contacts.edit", "contacts.delete", "contacts.export",
               "companies.view", "companies.create", "companies.edit", "companies.delete", "companies.export",
               "segments.view", "segments.create", "segments.edit", "segments.delete",
               "tags.view", "tags.create", "tags.edit", "tags.delete",
               "statuses.view", "statuses.create", "statuses.edit", "statuses.delete",
               "lead_sources.view", "lead_sources.create", "lead_sources.edit", "lead_sources.delete",
               "users.view", "users.invite", "users.edit", "users.delete",
               "permissions.manage",
               "organization.view", "organization.edit", "organization.delete"]'::jsonb;

    WHEN 'manager' THEN
      RETURN '["contacts.view", "contacts.create", "contacts.edit", "contacts.delete", "contacts.export",
               "companies.view", "companies.create", "companies.edit", "companies.delete", "companies.export",
               "segments.view", "segments.create", "segments.edit", "segments.delete",
               "tags.view", "statuses.view", "lead_sources.view",
               "users.view", "users.invite",
               "organization.view"]'::jsonb;

    WHEN 'agent' THEN
      RETURN '["contacts.view", "contacts.create", "contacts.edit",
               "companies.view", "companies.create", "companies.edit",
               "segments.view",
               "tags.view", "statuses.view", "lead_sources.view",
               "users.view",
               "organization.view"]'::jsonb;

    WHEN 'member' THEN
      RETURN '["contacts.view", "companies.view", "segments.view",
               "tags.view", "statuses.view", "lead_sources.view",
               "users.view",
               "organization.view"]'::jsonb;

    ELSE
      RETURN '[]'::jsonb;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Insert system roles for all existing organizations
INSERT INTO roles (organization_id, name, slug, description, permissions, is_system)
SELECT
  o.id AS organization_id,
  'Admin' AS name,
  'admin' AS slug,
  'Full access to all features and settings' AS description,
  get_default_role_permissions('admin') AS permissions,
  true AS is_system
FROM organizations o;

INSERT INTO roles (organization_id, name, slug, description, permissions, is_system)
SELECT
  o.id AS organization_id,
  'Manager' AS name,
  'manager' AS slug,
  'Manage CRM, view settings, invite team members' AS description,
  get_default_role_permissions('manager') AS permissions,
  true AS is_system
FROM organizations o;

INSERT INTO roles (organization_id, name, slug, description, permissions, is_system)
SELECT
  o.id AS organization_id,
  'Agent' AS name,
  'agent' AS slug,
  'Create and edit CRM data, view settings' AS description,
  get_default_role_permissions('agent') AS permissions,
  true AS is_system
FROM organizations o;

INSERT INTO roles (organization_id, name, slug, description, permissions, is_system)
SELECT
  o.id AS organization_id,
  'Member' AS name,
  'member' AS slug,
  'View-only access to CRM data' AS description,
  get_default_role_permissions('member') AS permissions,
  true AS is_system
FROM organizations o;

-- =====================================================
-- Add role_id Column to Users (DUAL COLUMN APPROACH)
-- =====================================================

-- Add role_id column (nullable initially)
ALTER TABLE users ADD COLUMN role_id UUID REFERENCES roles(id);

-- Populate role_id by matching role slug
UPDATE users u
SET role_id = r.id
FROM roles r
WHERE r.organization_id = u.organization_id
  AND r.slug = u.role
  AND r.is_system = true;

-- Make role_id NOT NULL after population
ALTER TABLE users ALTER COLUMN role_id SET NOT NULL;

-- Create index
CREATE INDEX idx_users_role_id ON users(role_id);

-- =====================================================
-- Sync Trigger: Keep role and role_id in Sync
-- =====================================================

-- Function to sync role_id → role (slug)
CREATE OR REPLACE FUNCTION sync_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- When role_id changes, update role slug
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.role_id IS DISTINCT FROM OLD.role_id) THEN
    SELECT slug INTO NEW.role
    FROM roles
    WHERE id = NEW.role_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update role slug when role_id changes
CREATE TRIGGER trigger_sync_user_role
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION sync_user_role();

-- =====================================================
-- Helper Function: Get User's Role Slug
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_role_slug(user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  role_slug VARCHAR;
BEGIN
  SELECT r.slug INTO role_slug
  FROM users u
  JOIN roles r ON r.id = u.role_id
  WHERE u.id = user_id;

  RETURN COALESCE(role_slug, 'member');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Clean Up
-- =====================================================

-- Drop temporary function
DROP FUNCTION IF EXISTS get_default_role_permissions(VARCHAR);

-- =====================================================
-- Verification Queries (Run manually to verify)
-- =====================================================

-- Check that all organizations have 4 system roles
-- SELECT organization_id, COUNT(*) as role_count
-- FROM roles
-- WHERE is_system = true
-- GROUP BY organization_id
-- HAVING COUNT(*) = 4;

-- Check that all users have role_id assigned
-- SELECT COUNT(*) as users_without_role
-- FROM users
-- WHERE role_id IS NULL;

-- Check role/role_id sync
-- SELECT u.id, u.email, u.role, r.slug as role_id_slug
-- FROM users u
-- JOIN roles r ON r.id = u.role_id
-- WHERE u.role != r.slug;

-- =====================================================
-- MIGRATION NOTES
-- =====================================================
-- This migration uses a DUAL COLUMN approach:
-- 1. users.role (VARCHAR) - LEGACY, kept for backward compatibility
-- 2. users.role_id (UUID) - NEW, references roles table
-- 3. Both columns stay in sync via trigger
-- 4. Existing RLS policies continue to work (use users.role)
-- 5. New code uses users.role_id
--
-- Future migration can:
-- - Update RLS policies to use role_id or JOINs
-- - Drop users.role column once all dependencies updated
-- - Remove sync trigger
-- =====================================================
