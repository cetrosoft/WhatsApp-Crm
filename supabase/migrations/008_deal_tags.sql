-- =============================================
-- Deal Tags Migration
-- Migrate deals to use shared tags lookup table
-- =============================================

-- 1. Create Deal-Tags Junction Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS deal_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate tag assignments
  UNIQUE(deal_id, tag_id)
);

-- 2. Add Index for Performance
CREATE INDEX IF NOT EXISTS idx_deal_tags_deal ON deal_tags(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_tags_tag ON deal_tags(tag_id);

-- 3. Enable RLS on Deal Tags Table
ALTER TABLE deal_tags ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy for Deal Tags
DROP POLICY IF EXISTS deal_tags_org_isolation ON deal_tags;
CREATE POLICY deal_tags_org_isolation ON deal_tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_tags.deal_id
      AND deals.organization_id = current_setting('app.current_organization_id', TRUE)::UUID
    )
  );

-- 5. Migration Script: Convert existing deal TEXT[] tags to new structure
DO $$
DECLARE
  deal_record RECORD;
  tag_text TEXT;
  tag_record RECORD;
  new_tag_id UUID;
BEGIN
  -- Loop through all deals that have tags
  FOR deal_record IN
    SELECT id, organization_id, tags
    FROM deals
    WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
  LOOP
    -- Loop through each tag in the TEXT array
    FOREACH tag_text IN ARRAY deal_record.tags
    LOOP
      -- Check if tag already exists for this organization
      SELECT id INTO tag_record
      FROM tags
      WHERE organization_id = deal_record.organization_id
      AND name_en = tag_text;

      -- If tag doesn't exist, create it
      IF tag_record IS NULL THEN
        INSERT INTO tags (organization_id, name_en, name_ar, color)
        VALUES (
          deal_record.organization_id,
          tag_text,
          tag_text, -- Same for both languages initially
          '#6366f1' -- Default indigo color
        )
        RETURNING id INTO new_tag_id;
      ELSE
        new_tag_id := tag_record.id;
      END IF;

      -- Create deal-tag relationship (ignore if already exists)
      INSERT INTO deal_tags (deal_id, tag_id)
      VALUES (deal_record.id, new_tag_id)
      ON CONFLICT (deal_id, tag_id) DO NOTHING;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Deal tags migration completed successfully';
END $$;

-- 6. Drop the old tags column from deals (after verifying migration)
-- Note: Keeping it for now as backup, can drop later after verification
-- ALTER TABLE deals DROP COLUMN tags;

-- 7. Add helpful comment
COMMENT ON TABLE deal_tags IS 'Junction table linking deals to shared tags (many-to-many)';
