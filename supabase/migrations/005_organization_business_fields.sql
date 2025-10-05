-- =====================================================
-- Migration 005: Organization Business Fields
-- Add business, legal, and contact information fields
-- =====================================================
-- Created: 2025-10-04
-- =====================================================

-- =====================================================
-- Add Business & Contact Fields to Organizations
-- =====================================================

-- Contact Information
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website VARCHAR(255);

-- Address Information
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

-- Business/Legal Information
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS commercial_id VARCHAR(100);

-- Branding
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- =====================================================
-- Add Comments
-- =====================================================

COMMENT ON COLUMN organizations.phone IS 'Organization contact phone number';
COMMENT ON COLUMN organizations.email IS 'Organization contact email address';
COMMENT ON COLUMN organizations.website IS 'Organization website URL';
COMMENT ON COLUMN organizations.address IS 'Street address';
COMMENT ON COLUMN organizations.city IS 'City';
COMMENT ON COLUMN organizations.state IS 'State/Province';
COMMENT ON COLUMN organizations.country IS 'Country';
COMMENT ON COLUMN organizations.postal_code IS 'Postal/ZIP code';
COMMENT ON COLUMN organizations.tax_id IS 'Tax registration number (e.g., VAT ID)';
COMMENT ON COLUMN organizations.commercial_id IS 'Commercial registration number';
COMMENT ON COLUMN organizations.logo_url IS 'URL to organization logo image';

-- =====================================================
-- Add Indexes for Better Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_organizations_email ON organizations(email);
CREATE INDEX IF NOT EXISTS idx_organizations_country ON organizations(country);
CREATE INDEX IF NOT EXISTS idx_organizations_tax_id ON organizations(tax_id);
CREATE INDEX IF NOT EXISTS idx_organizations_commercial_id ON organizations(commercial_id);

-- =====================================================
-- Verification
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Migration 005 Complete!';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Added fields to organizations table:';
  RAISE NOTICE '  Contact: phone, email, website';
  RAISE NOTICE '  Address: address, city, state, country, postal_code';
  RAISE NOTICE '  Business: tax_id, commercial_id';
  RAISE NOTICE '  Branding: logo_url';
  RAISE NOTICE '';
  RAISE NOTICE 'Organizations now have complete business profile support.';
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
END $$;

-- =====================================================
-- Organization Business Fields Migration Complete
-- =====================================================
