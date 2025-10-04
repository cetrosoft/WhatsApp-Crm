/**
 * CRM Module Migration - SAFE VERSION (Can run multiple times)
 *
 * This version safely drops existing tables and policies before creating new ones
 * Safe to run multiple times without errors
 *
 * Creates comprehensive CRM system with:
 * - Contacts & Companies management
 * - Segmentation (dynamic filtering)
 * - Deals & Pipeline (sales funnel)
 * - Interactions & Activities tracking
 *
 * All tables include multi-tenant isolation with RLS policies
 */

-- ============================================
-- STEP 1: DROP EXISTING POLICIES (if they exist)
-- ============================================

-- Drop Activities Policies
DROP POLICY IF EXISTS "Users can view activities in their organization" ON activities;
DROP POLICY IF EXISTS "Users can create activities" ON activities;
DROP POLICY IF EXISTS "Users can update assigned activities" ON activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON activities;

-- Drop Interactions Policies
DROP POLICY IF EXISTS "Users can view interactions in their organization" ON interactions;
DROP POLICY IF EXISTS "Users can create interactions" ON interactions;
DROP POLICY IF EXISTS "Users can update their own interactions" ON interactions;
DROP POLICY IF EXISTS "Users can delete their own interactions" ON interactions;

-- Drop Deal Stage History Policies
DROP POLICY IF EXISTS "Users can view deal history in their organization" ON deal_stage_history;
DROP POLICY IF EXISTS "Users can insert deal history" ON deal_stage_history;

-- Drop Deals Policies
DROP POLICY IF EXISTS "Users can view deals in their organization" ON deals;
DROP POLICY IF EXISTS "Users can create deals in their organization" ON deals;
DROP POLICY IF EXISTS "Users can update deals in their organization" ON deals;
DROP POLICY IF EXISTS "Admins can delete deals in their organization" ON deals;

-- Drop Segment Members Policies
DROP POLICY IF EXISTS "Users can view segment members in their organization" ON segment_members;
DROP POLICY IF EXISTS "Users can manage segment members" ON segment_members;

-- Drop Segments Policies
DROP POLICY IF EXISTS "Users can view segments in their organization" ON segments;
DROP POLICY IF EXISTS "Users can create segments in their organization" ON segments;
DROP POLICY IF EXISTS "Users can update their own segments" ON segments;
DROP POLICY IF EXISTS "Users can delete their own segments" ON segments;

-- Drop Pipeline Stages Policies
DROP POLICY IF EXISTS "Users can view pipeline stages in their organization" ON pipeline_stages;
DROP POLICY IF EXISTS "Admins can manage pipeline stages" ON pipeline_stages;

-- Drop Pipelines Policies
DROP POLICY IF EXISTS "Users can view pipelines in their organization" ON pipelines;
DROP POLICY IF EXISTS "Admins can manage pipelines" ON pipelines;

-- Drop Contacts Policies
DROP POLICY IF EXISTS "Users can view contacts in their organization" ON contacts;
DROP POLICY IF EXISTS "Users can insert contacts in their organization" ON contacts;
DROP POLICY IF EXISTS "Users can update contacts in their organization" ON contacts;
DROP POLICY IF EXISTS "Admins can delete contacts in their organization" ON contacts;

-- Drop Companies Policies
DROP POLICY IF EXISTS "Users can view companies in their organization" ON companies;
DROP POLICY IF EXISTS "Users can insert companies in their organization" ON companies;
DROP POLICY IF EXISTS "Users can update companies in their organization" ON companies;
DROP POLICY IF EXISTS "Admins can delete companies in their organization" ON companies;

-- ============================================
-- STEP 2: DROP EXISTING TABLES (in reverse dependency order)
-- ============================================

DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS interactions CASCADE;
DROP TABLE IF EXISTS deal_stage_history CASCADE;
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS segment_members CASCADE;
DROP TABLE IF EXISTS segments CASCADE;
DROP TABLE IF EXISTS pipeline_stages CASCADE;
DROP TABLE IF EXISTS pipelines CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Drop helper functions if they exist
DROP FUNCTION IF EXISTS get_contact_stats(UUID);
DROP FUNCTION IF EXISTS get_pipeline_stats(UUID);

-- ============================================
-- STEP 3: CREATE TABLES (in correct dependency order)
-- ============================================

-- 1. COMPANIES TABLE (No CRM dependencies)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Basic Information
  name TEXT NOT NULL,
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '500+')),
  website TEXT,
  phone TEXT,
  email TEXT,

  -- Location
  address TEXT,
  city TEXT,
  country TEXT,

  -- Classification
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect')),
  tags TEXT[] DEFAULT '{}',

  -- Additional Info
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',

  -- Assignment
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_org ON companies(organization_id);
CREATE INDEX idx_companies_assigned ON companies(assigned_to);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_tags ON companies USING GIN(tags);

-- 2. CONTACTS TABLE (Depends on companies)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,

  -- Basic Information
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  whatsapp_id TEXT,
  avatar_url TEXT,
  position TEXT,

  -- Classification
  status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'prospect', 'customer', 'inactive')),
  lead_source TEXT CHECK (lead_source IN ('website', 'referral', 'campaign', 'import', 'whatsapp', 'manual', 'other')),
  tags TEXT[] DEFAULT '{}',

  -- Location
  address TEXT,
  city TEXT,
  country TEXT,

  -- Additional Info
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',

  -- Assignment & Tracking
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  last_contact_date TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_phone_per_org UNIQUE (organization_id, phone)
);

CREATE INDEX idx_contacts_org ON contacts(organization_id);
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_assigned ON contacts(assigned_to);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_tags ON contacts USING GIN(tags);
CREATE INDEX idx_contacts_last_contact ON contacts(last_contact_date DESC);

-- 3. PIPELINES TABLE (No dependencies)
CREATE TABLE pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_pipeline_name_per_org UNIQUE (organization_id, name)
);

CREATE INDEX idx_pipelines_org ON pipelines(organization_id);
CREATE INDEX idx_pipelines_default ON pipelines(is_default) WHERE is_default = true;

-- 4. PIPELINE STAGES TABLE (Depends on pipelines)
CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  display_order INTEGER NOT NULL,

  is_closed_won BOOLEAN DEFAULT false,
  is_closed_lost BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_stage_name_per_pipeline UNIQUE (pipeline_id, name),
  CONSTRAINT unique_stage_order_per_pipeline UNIQUE (pipeline_id, display_order)
);

CREATE INDEX idx_pipeline_stages_pipeline ON pipeline_stages(pipeline_id);
CREATE INDEX idx_pipeline_stages_order ON pipeline_stages(display_order);

-- 5. SEGMENTS TABLE (No dependencies)
CREATE TABLE segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact', 'company')),
  filter_criteria JSONB NOT NULL DEFAULT '{"rules": [], "logic": "AND"}',
  is_dynamic BOOLEAN DEFAULT true,

  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_segments_org ON segments(organization_id);
CREATE INDEX idx_segments_entity_type ON segments(entity_type);

-- 6. SEGMENT MEMBERS TABLE (Depends on segments)
CREATE TABLE segment_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_segment_member UNIQUE (segment_id, entity_id)
);

CREATE INDEX idx_segment_members_segment ON segment_members(segment_id);
CREATE INDEX idx_segment_members_entity ON segment_members(entity_id);

-- 7. DEALS TABLE (Depends on contacts, companies, pipelines, pipeline_stages)
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE RESTRICT,
  stage_id UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,

  title TEXT NOT NULL,
  value DECIMAL(15, 2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),

  expected_close_date DATE,
  actual_close_date DATE,

  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
  lost_reason TEXT,

  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',

  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  stage_order INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deals_org ON deals(organization_id);
CREATE INDEX idx_deals_contact ON deals(contact_id);
CREATE INDEX idx_deals_company ON deals(company_id);
CREATE INDEX idx_deals_pipeline ON deals(pipeline_id);
CREATE INDEX idx_deals_stage ON deals(stage_id);
CREATE INDEX idx_deals_assigned ON deals(assigned_to);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_close_date ON deals(expected_close_date);
CREATE INDEX idx_deals_tags ON deals USING GIN(tags);

-- 8. DEAL STAGE HISTORY TABLE (Depends on deals, pipeline_stages)
CREATE TABLE deal_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  from_stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
  to_stage_id UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,

  duration_in_previous_stage INTERVAL,
  notes TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deal_history_deal ON deal_stage_history(deal_id);
CREATE INDEX idx_deal_history_changed_at ON deal_stage_history(changed_at DESC);

-- 9. INTERACTIONS TABLE (Depends on contacts, companies, deals)
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,

  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'whatsapp', 'task')),
  subject TEXT,
  description TEXT,
  outcome TEXT CHECK (outcome IN ('positive', 'neutral', 'negative')),

  interaction_date TIMESTAMPTZ DEFAULT NOW(),
  duration_minutes INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interactions_org ON interactions(organization_id);
CREATE INDEX idx_interactions_contact ON interactions(contact_id);
CREATE INDEX idx_interactions_company ON interactions(company_id);
CREATE INDEX idx_interactions_deal ON interactions(deal_id);
CREATE INDEX idx_interactions_user ON interactions(user_id);
CREATE INDEX idx_interactions_type ON interactions(type);
CREATE INDEX idx_interactions_date ON interactions(interaction_date DESC);

-- 10. ACTIVITIES TABLE (Depends on contacts, companies, deals)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,

  assigned_to UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  type TEXT NOT NULL CHECK (type IN ('task', 'call', 'email', 'meeting')),
  subject TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_org ON activities(organization_id);
CREATE INDEX idx_activities_contact ON activities(contact_id);
CREATE INDEX idx_activities_company ON activities(company_id);
CREATE INDEX idx_activities_deal ON activities(deal_id);
CREATE INDEX idx_activities_assigned ON activities(assigned_to);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_activities_due_date ON activities(due_date);
CREATE INDEX idx_activities_priority ON activities(priority);

-- ============================================
-- STEP 4: CREATE TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON pipelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_stages_updated_at BEFORE UPDATE ON pipeline_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_segments_updated_at BEFORE UPDATE ON segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interactions_updated_at BEFORE UPDATE ON interactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 5: ENABLE RLS
-- ============================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: CREATE RLS POLICIES
-- ============================================

-- Companies Policies
CREATE POLICY "Users can view companies in their organization"
  ON companies FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert companies in their organization"
  ON companies FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update companies in their organization"
  ON companies FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete companies in their organization"
  ON companies FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- Contacts Policies
CREATE POLICY "Users can view contacts in their organization"
  ON contacts FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert contacts in their organization"
  ON contacts FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update contacts in their organization"
  ON contacts FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete contacts in their organization"
  ON contacts FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- Pipelines Policies
CREATE POLICY "Users can view pipelines in their organization"
  ON pipelines FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage pipelines"
  ON pipelines FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- Pipeline Stages Policies
CREATE POLICY "Users can view pipeline stages in their organization"
  ON pipeline_stages FOR SELECT
  USING (pipeline_id IN (
    SELECT id FROM pipelines WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Admins can manage pipeline stages"
  ON pipeline_stages FOR ALL
  USING (pipeline_id IN (
    SELECT id FROM pipelines WHERE organization_id IN (
      SELECT organization_id FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  ));

-- Segments Policies
CREATE POLICY "Users can view segments in their organization"
  ON segments FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create segments in their organization"
  ON segments FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own segments"
  ON segments FOR UPDATE
  USING (created_by = auth.uid() OR organization_id IN (
    SELECT organization_id FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ));

CREATE POLICY "Users can delete their own segments"
  ON segments FOR DELETE
  USING (created_by = auth.uid() OR organization_id IN (
    SELECT organization_id FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- Segment Members Policies
CREATE POLICY "Users can view segment members in their organization"
  ON segment_members FOR SELECT
  USING (segment_id IN (
    SELECT id FROM segments WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage segment members"
  ON segment_members FOR ALL
  USING (segment_id IN (
    SELECT id FROM segments WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

-- Deals Policies
CREATE POLICY "Users can view deals in their organization"
  ON deals FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create deals in their organization"
  ON deals FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update deals in their organization"
  ON deals FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete deals in their organization"
  ON deals FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- Deal Stage History Policies
CREATE POLICY "Users can view deal history in their organization"
  ON deal_stage_history FOR SELECT
  USING (deal_id IN (
    SELECT id FROM deals WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can insert deal history"
  ON deal_stage_history FOR INSERT
  WITH CHECK (deal_id IN (
    SELECT id FROM deals WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

-- Interactions Policies
CREATE POLICY "Users can view interactions in their organization"
  ON interactions FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create interactions"
  ON interactions FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own interactions"
  ON interactions FOR UPDATE
  USING (user_id = auth.uid() OR organization_id IN (
    SELECT organization_id FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ));

CREATE POLICY "Users can delete their own interactions"
  ON interactions FOR DELETE
  USING (user_id = auth.uid() OR organization_id IN (
    SELECT organization_id FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- Activities Policies
CREATE POLICY "Users can view activities in their organization"
  ON activities FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create activities"
  ON activities FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update assigned activities"
  ON activities FOR UPDATE
  USING (assigned_to = auth.uid() OR created_by = auth.uid() OR organization_id IN (
    SELECT organization_id FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ));

CREATE POLICY "Users can delete their own activities"
  ON activities FOR DELETE
  USING (created_by = auth.uid() OR organization_id IN (
    SELECT organization_id FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- ============================================
-- STEP 7: CREATE HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION get_contact_stats(org_id UUID)
RETURNS TABLE (
  total_contacts BIGINT,
  leads BIGINT,
  prospects BIGINT,
  customers BIGINT,
  inactive BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_contacts,
    COUNT(*) FILTER (WHERE status = 'lead')::BIGINT as leads,
    COUNT(*) FILTER (WHERE status = 'prospect')::BIGINT as prospects,
    COUNT(*) FILTER (WHERE status = 'customer')::BIGINT as customers,
    COUNT(*) FILTER (WHERE status = 'inactive')::BIGINT as inactive
  FROM contacts
  WHERE organization_id = org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_pipeline_stats(pipe_id UUID)
RETURNS TABLE (
  stage_id UUID,
  stage_name TEXT,
  deal_count BIGINT,
  total_value DECIMAL,
  avg_value DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ps.id,
    ps.name,
    COUNT(d.id)::BIGINT,
    COALESCE(SUM(d.value), 0)::DECIMAL,
    COALESCE(AVG(d.value), 0)::DECIMAL
  FROM pipeline_stages ps
  LEFT JOIN deals d ON d.stage_id = ps.id AND d.status = 'open'
  WHERE ps.pipeline_id = pipe_id
  GROUP BY ps.id, ps.name, ps.display_order
  ORDER BY ps.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

COMMENT ON TABLE companies IS 'CRM companies - created first to avoid circular dependencies';
COMMENT ON TABLE contacts IS 'CRM contacts linked to companies with multi-tenant isolation';
COMMENT ON TABLE segments IS 'Dynamic and static segments for filtering contacts/companies';
COMMENT ON TABLE deals IS 'Sales opportunities tracked through pipeline stages';
COMMENT ON TABLE pipelines IS 'Sales process pipelines with customizable stages';
COMMENT ON TABLE interactions IS 'Communication history (calls, emails, meetings, notes)';
COMMENT ON TABLE activities IS 'Tasks and reminders linked to contacts, companies, or deals';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ CRM Module Migration Completed Successfully!';
  RAISE NOTICE '📊 Created 10 tables with full multi-tenant isolation';
  RAISE NOTICE '🔐 All RLS policies enabled';
  RAISE NOTICE '📈 Helper functions created';
END $$;
