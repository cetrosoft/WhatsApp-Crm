/**
 * Segments Migration
 *
 * Creates dynamic segmentation system for contacts
 * Allows users to create smart contact groups based on filter rules
 *
 * Features:
 * - JSONB filter rules for dynamic conditions
 * - Cached contact counts for performance
 * - Multi-tenant isolation with RLS
 * - Bilingual support (name_en, name_ar)
 */

-- ============================================
-- SEGMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Basic Information
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description_en TEXT,
  description_ar TEXT,

  -- Filter Rules (JSONB for dynamic queries)
  -- Example structure:
  -- {
  --   "operator": "AND",
  --   "conditions": [
  --     { "field": "status_id", "operator": "equals", "value": "uuid" },
  --     { "field": "tags", "operator": "contains_any", "value": ["tag-id-1"] },
  --     { "field": "country_id", "operator": "equals", "value": "uuid" }
  --   ]
  -- }
  filter_rules JSONB NOT NULL DEFAULT '{"operator": "AND", "conditions": []}'::jsonb,

  -- Cached Metrics (updated on save or manual refresh)
  contact_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,

  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT name_en_required CHECK (name_en IS NOT NULL AND name_en != '')
);

-- Indexes for performance
CREATE INDEX idx_segments_org ON segments(organization_id);
CREATE INDEX idx_segments_created_by ON segments(created_by);
CREATE INDEX idx_segments_filter_rules ON segments USING GIN(filter_rules);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE segments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view segments in their organization
CREATE POLICY segments_select_policy ON segments
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Users can create segments in their organization
CREATE POLICY segments_insert_policy ON segments
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Users can update segments in their organization
CREATE POLICY segments_update_policy ON segments
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Users can delete segments in their organization
CREATE POLICY segments_delete_policy ON segments
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- ============================================
-- HELPER FUNCTION: Update Updated_At Timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_segments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER segments_updated_at_trigger
  BEFORE UPDATE ON segments
  FOR EACH ROW
  EXECUTE FUNCTION update_segments_updated_at();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE segments IS 'Dynamic contact segmentation with filter rules';
COMMENT ON COLUMN segments.filter_rules IS 'JSONB structure defining segment filter conditions';
COMMENT ON COLUMN segments.contact_count IS 'Cached count of contacts matching this segment (updated on save)';
COMMENT ON COLUMN segments.last_calculated_at IS 'Timestamp when contact count was last calculated';
