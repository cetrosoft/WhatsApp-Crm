-- =============================================
-- Tags System Migration
-- Shared tags across all modules (contacts, companies, deals, etc.)
-- =============================================

-- Drop existing tags columns from contacts (we'll migrate data later)
-- ALTER TABLE contacts DROP COLUMN IF EXISTS tags;

-- 1. Create Tags Lookup Table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name_en VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  color VARCHAR(7) DEFAULT '#6366f1', -- Hex color for tag display
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Ensure unique tag names per organization
  UNIQUE(organization_id, name_en)
);

-- 2. Create Contact-Tags Junction Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS contact_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate tag assignments
  UNIQUE(contact_id, tag_id)
);

-- 3. Create Company-Tags Junction Table (for future use)
CREATE TABLE IF NOT EXISTS company_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(company_id, tag_id)
);

-- 4. Add Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_tags_organization ON tags(organization_id);
CREATE INDEX IF NOT EXISTS idx_contact_tags_contact ON contact_tags(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_tags_tag ON contact_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_company_tags_company ON company_tags(company_id);
CREATE INDEX IF NOT EXISTS idx_company_tags_tag ON company_tags(tag_id);

-- 5. Enable RLS on Tags Tables
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_tags ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for Tags
DROP POLICY IF EXISTS tags_org_isolation ON tags;
CREATE POLICY tags_org_isolation ON tags
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', TRUE)::UUID);

DROP POLICY IF EXISTS contact_tags_org_isolation ON contact_tags;
CREATE POLICY contact_tags_org_isolation ON contact_tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_tags.contact_id
      AND contacts.organization_id = current_setting('app.current_organization_id', TRUE)::UUID
    )
  );

DROP POLICY IF EXISTS company_tags_org_isolation ON company_tags;
CREATE POLICY company_tags_org_isolation ON company_tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_tags.company_id
      AND companies.organization_id = current_setting('app.current_organization_id', TRUE)::UUID
    )
  );

-- 7. Migration Script: Convert existing contact tags to new structure
-- This will create tag records from existing contact.tags arrays
DO $$
DECLARE
  contact_record RECORD;
  tag_text TEXT;
  tag_record RECORD;
  new_tag_id UUID;
BEGIN
  -- Loop through all contacts that have tags
  FOR contact_record IN
    SELECT id, organization_id, tags
    FROM contacts
    WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
  LOOP
    -- Loop through each tag in the array
    FOREACH tag_text IN ARRAY contact_record.tags
    LOOP
      -- Check if tag already exists for this organization
      SELECT id INTO tag_record
      FROM tags
      WHERE organization_id = contact_record.organization_id
      AND name_en = tag_text;

      -- If tag doesn't exist, create it
      IF tag_record IS NULL THEN
        INSERT INTO tags (organization_id, name_en, name_ar, color)
        VALUES (
          contact_record.organization_id,
          tag_text,
          tag_text, -- Same for both languages initially
          '#6366f1' -- Default indigo color
        )
        RETURNING id INTO new_tag_id;
      ELSE
        new_tag_id := tag_record.id;
      END IF;

      -- Create contact-tag relationship (ignore if already exists)
      INSERT INTO contact_tags (contact_id, tag_id)
      VALUES (contact_record.id, new_tag_id)
      ON CONFLICT (contact_id, tag_id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- 8. Add helpful comments
COMMENT ON TABLE tags IS 'Shared tags system for all modules (contacts, companies, deals, etc.)';
COMMENT ON TABLE contact_tags IS 'Junction table linking contacts to tags (many-to-many)';
COMMENT ON TABLE company_tags IS 'Junction table linking companies to tags (many-to-many)';

-- Note: Keep the tags column in contacts for now as backup
-- We can drop it later after verifying migration: ALTER TABLE contacts DROP COLUMN tags;
