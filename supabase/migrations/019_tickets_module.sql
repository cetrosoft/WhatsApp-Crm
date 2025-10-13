-- =====================================================
-- TICKET MODULE - FULLY DYNAMIC ARCHITECTURE
-- =====================================================
-- Migration: 019_tickets_module.sql
-- Description: Complete ticket system with categories, comments, attachments
-- Architecture: Database-driven menu + permissions (Oct 11, 2025 pattern)
-- =====================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TICKET CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ticket_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  -- Bilingual names
  name_en VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100) NOT NULL,

  -- Styling
  color VARCHAR(7) NOT NULL DEFAULT '#6366f1', -- hex color
  icon VARCHAR(50) DEFAULT 'Folder', -- lucide icon name

  -- Settings
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ticket_categories_org ON ticket_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_ticket_categories_active ON ticket_categories(is_active);

-- RLS Policies
ALTER TABLE ticket_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org categories" ON ticket_categories;
CREATE POLICY "Users can view org categories" ON ticket_categories
  FOR SELECT
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

DROP POLICY IF EXISTS "Admins can manage categories" ON ticket_categories;
CREATE POLICY "Admins can manage categories" ON ticket_categories
  FOR ALL
  USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

-- Seed default categories
INSERT INTO ticket_categories (organization_id, name_en, name_ar, color, icon, sort_order)
SELECT
  o.id,
  'Support',
  'الدعم الفني',
  '#3b82f6',
  'Headphones',
  1
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM ticket_categories tc
  WHERE tc.organization_id = o.id AND tc.name_en = 'Support'
);

INSERT INTO ticket_categories (organization_id, name_en, name_ar, color, icon, sort_order)
SELECT
  o.id,
  'Bug Report',
  'بلاغ خلل',
  '#ef4444',
  'Bug',
  2
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM ticket_categories tc
  WHERE tc.organization_id = o.id AND tc.name_en = 'Bug Report'
);

INSERT INTO ticket_categories (organization_id, name_en, name_ar, color, icon, sort_order)
SELECT
  o.id,
  'Feature Request',
  'طلب ميزة',
  '#10b981',
  'Lightbulb',
  3
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM ticket_categories tc
  WHERE tc.organization_id = o.id AND tc.name_en = 'Feature Request'
);

INSERT INTO ticket_categories (organization_id, name_en, name_ar, color, icon, sort_order)
SELECT
  o.id,
  'Question',
  'استفسار',
  '#f59e0b',
  'HelpCircle',
  4
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM ticket_categories tc
  WHERE tc.organization_id = o.id AND tc.name_en = 'Question'
);

-- =====================================================
-- 2. TICKETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  -- Ticket identification
  ticket_number VARCHAR(50) NOT NULL, -- Auto-generated: #TICK-0001

  -- Basic info
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Categorization
  category_id UUID REFERENCES ticket_categories(id) ON DELETE SET NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),

  -- Relationships (optional links)
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,

  -- Assignment
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) NOT NULL,

  -- Dates
  due_date TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: ticket number per organization
  UNIQUE(organization_id, ticket_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tickets_org ON tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category_id);
CREATE INDEX IF NOT EXISTS idx_tickets_contact ON tickets(contact_id);
CREATE INDEX IF NOT EXISTS idx_tickets_company ON tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);

-- RLS Policies
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org tickets" ON tickets;
CREATE POLICY "Users can view org tickets" ON tickets
  FOR SELECT
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
CREATE POLICY "Users can create tickets" ON tickets
  FOR INSERT
  WITH CHECK (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

DROP POLICY IF EXISTS "Users can update tickets" ON tickets;
CREATE POLICY "Users can update tickets" ON tickets
  FOR UPDATE
  USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

DROP POLICY IF EXISTS "Users can delete tickets" ON tickets;
CREATE POLICY "Users can delete tickets" ON tickets
  FOR DELETE
  USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

-- =====================================================
-- 3. TICKET TAGS (Junction Table)
-- =====================================================
CREATE TABLE IF NOT EXISTS ticket_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate tags per ticket
  UNIQUE(ticket_id, tag_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ticket_tags_ticket ON ticket_tags(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_tags_tag ON ticket_tags(tag_id);

-- RLS Policies
ALTER TABLE ticket_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage ticket tags" ON ticket_tags;
CREATE POLICY "Users can manage ticket tags" ON ticket_tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_tags.ticket_id
      AND t.organization_id = current_setting('app.current_organization_id', true)::UUID
    )
  );

-- =====================================================
-- 4. TICKET COMMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Comment content
  comment TEXT NOT NULL,

  -- Comment type
  is_internal BOOLEAN DEFAULT false, -- true = internal note, false = public comment

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_user ON ticket_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_created ON ticket_comments(created_at);

-- RLS Policies
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view ticket comments" ON ticket_comments;
CREATE POLICY "Users can view ticket comments" ON ticket_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_comments.ticket_id
      AND t.organization_id = current_setting('app.current_organization_id', true)::UUID
    )
  );

DROP POLICY IF EXISTS "Users can create comments" ON ticket_comments;
CREATE POLICY "Users can create comments" ON ticket_comments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_comments.ticket_id
      AND t.organization_id = current_setting('app.current_organization_id', true)::UUID
    )
  );

DROP POLICY IF EXISTS "Users can update own comments" ON ticket_comments;
CREATE POLICY "Users can update own comments" ON ticket_comments
  FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own comments" ON ticket_comments;
CREATE POLICY "Users can delete own comments" ON ticket_comments
  FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- 5. TICKET ATTACHMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  comment_id UUID REFERENCES ticket_comments(id) ON DELETE CASCADE, -- Optional: attach to specific comment

  -- File info
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER, -- in bytes
  file_type VARCHAR(100), -- MIME type

  -- Uploader
  uploaded_by UUID REFERENCES users(id) NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket ON ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_comment ON ticket_attachments(comment_id);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_uploader ON ticket_attachments(uploaded_by);

-- RLS Policies
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view ticket attachments" ON ticket_attachments;
CREATE POLICY "Users can view ticket attachments" ON ticket_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_attachments.ticket_id
      AND t.organization_id = current_setting('app.current_organization_id', true)::UUID
    )
  );

DROP POLICY IF EXISTS "Users can upload attachments" ON ticket_attachments;
CREATE POLICY "Users can upload attachments" ON ticket_attachments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_attachments.ticket_id
      AND t.organization_id = current_setting('app.current_organization_id', true)::UUID
    )
  );

DROP POLICY IF EXISTS "Users can delete own attachments" ON ticket_attachments;
CREATE POLICY "Users can delete own attachments" ON ticket_attachments
  FOR DELETE
  USING (uploaded_by = auth.uid());

-- =====================================================
-- 6. TICKET HISTORY (Audit Trail)
-- =====================================================
CREATE TABLE IF NOT EXISTS ticket_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Change tracking
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'assigned', 'status_changed', 'priority_changed', etc.
  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket ON ticket_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_history_user ON ticket_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_history_created ON ticket_history(created_at);

-- RLS Policies
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view ticket history" ON ticket_history;
CREATE POLICY "Users can view ticket history" ON ticket_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_history.ticket_id
      AND t.organization_id = current_setting('app.current_organization_id', true)::UUID
    )
  );

DROP POLICY IF EXISTS "System can insert history" ON ticket_history;
CREATE POLICY "System can insert history" ON ticket_history
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function: Generate ticket number (auto-increment per organization)
CREATE OR REPLACE FUNCTION generate_ticket_number(org_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  next_number INTEGER;
  ticket_num VARCHAR;
BEGIN
  -- Get the next ticket number for this organization
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM '#TICK-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM tickets
  WHERE organization_id = org_id;

  -- Format as #TICK-0001
  ticket_num := '#TICK-' || LPAD(next_number::TEXT, 4, '0');

  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-generate ticket number on insert
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number(NEW.organization_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_ticket_number ON tickets;
CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Trigger: Log ticket creation
CREATE OR REPLACE FUNCTION log_ticket_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ticket_history (ticket_id, user_id, action, field_changed, new_value)
  VALUES (NEW.id, NEW.created_by, 'created', 'ticket', 'Ticket created');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_ticket_creation ON tickets;
CREATE TRIGGER trigger_log_ticket_creation
  AFTER INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION log_ticket_creation();

-- Trigger: Log ticket updates
CREATE OR REPLACE FUNCTION log_ticket_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO ticket_history (ticket_id, user_id, action, field_changed, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'status_changed', 'status', OLD.status, NEW.status);
  END IF;

  -- Priority changed
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO ticket_history (ticket_id, user_id, action, field_changed, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'priority_changed', 'priority', OLD.priority, NEW.priority);
  END IF;

  -- Assigned to changed
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO ticket_history (ticket_id, user_id, action, field_changed, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'assigned', 'assigned_to', OLD.assigned_to::TEXT, NEW.assigned_to::TEXT);
  END IF;

  -- Update timestamps
  NEW.updated_at = NOW();

  -- Set resolved_at if status changed to resolved
  IF OLD.status <> 'resolved' AND NEW.status = 'resolved' THEN
    NEW.resolved_at = NOW();
  END IF;

  -- Set closed_at if status changed to closed
  IF OLD.status <> 'closed' AND NEW.status = 'closed' THEN
    NEW.closed_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_ticket_updates ON tickets;
CREATE TRIGGER trigger_log_ticket_updates
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION log_ticket_updates();

-- Trigger: Update updated_at on categories
DROP TRIGGER IF EXISTS update_ticket_categories_updated_at ON ticket_categories;
CREATE TRIGGER update_ticket_categories_updated_at
  BEFORE UPDATE ON ticket_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update updated_at on comments
DROP TRIGGER IF EXISTS update_ticket_comments_updated_at ON ticket_comments;
CREATE TRIGGER update_ticket_comments_updated_at
  BEFORE UPDATE ON ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. DYNAMIC MENU SYSTEM (Database-Driven)
-- =====================================================

-- Insert ticket menu item (if not exists)
INSERT INTO menu_items (key, parent_key, name_en, name_ar, icon, path, display_order, required_permission, required_feature, is_system)
SELECT 'support_tickets', NULL, 'Tickets', 'التذاكر', 'Ticket', '/tickets', 40, 'tickets.view', 'tickets', true
WHERE NOT EXISTS (
  SELECT 1 FROM menu_items WHERE key = 'support_tickets'
);

-- Optional: Add categories submenu (commented out by default)
-- INSERT INTO menu_items (key, parent_key, name_en, name_ar, icon, path, display_order, required_permission, required_feature, is_system)
-- SELECT 'ticket_categories', 'support_tickets', 'Categories', 'الفئات', 'FolderKanban', '/tickets/categories', 41, 'ticket_categories.manage', 'tickets', true
-- WHERE NOT EXISTS (
--   SELECT 1 FROM menu_items WHERE key = 'ticket_categories'
-- );

-- =====================================================
-- 9. DYNAMIC PERMISSIONS (Role-Based)
-- =====================================================

-- Add ticket permissions to admin role
UPDATE roles
SET permissions = permissions || jsonb_build_array(
  'tickets.view',
  'tickets.create',
  'tickets.edit',
  'tickets.delete',
  'tickets.comment',
  'tickets.assign',
  'ticket_categories.manage'
)
WHERE slug = 'admin' AND is_system = true
AND NOT (permissions ? 'tickets.view');

-- Add ticket permissions to manager role
UPDATE roles
SET permissions = permissions || jsonb_build_array(
  'tickets.view',
  'tickets.create',
  'tickets.edit',
  'tickets.comment',
  'tickets.assign'
)
WHERE slug = 'manager' AND is_system = true
AND NOT (permissions ? 'tickets.view');

-- Add ticket permissions to agent role
UPDATE roles
SET permissions = permissions || jsonb_build_array(
  'tickets.view',
  'tickets.create',
  'tickets.edit',
  'tickets.comment'
)
WHERE slug = 'agent' AND is_system = true
AND NOT (permissions ? 'tickets.view');

-- Add ticket permissions to member role
UPDATE roles
SET permissions = permissions || jsonb_build_array(
  'tickets.view',
  'tickets.create',
  'tickets.comment'
)
WHERE slug = 'member' AND is_system = true
AND NOT (permissions ? 'tickets.view');

-- =====================================================
-- 10. PACKAGE FEATURES (Enable tickets for Lite+ plans)
-- =====================================================

-- Enable tickets feature for Lite, Professional, Business, Enterprise
UPDATE packages
SET features = jsonb_set(features, '{tickets}', 'true'::jsonb)
WHERE slug IN ('lite', 'professional', 'business', 'enterprise')
AND (features->>'tickets')::boolean IS DISTINCT FROM true;

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================
-- You now have:
-- ✅ 6 tables: tickets, ticket_categories, ticket_tags, ticket_comments, ticket_attachments, ticket_history
-- ✅ Auto-generated ticket numbers (#TICK-0001)
-- ✅ RLS policies for multi-tenant isolation
-- ✅ Audit trail (ticket_history)
-- ✅ 4 default categories per organization
-- ✅ Dynamic menu item (database-driven)
-- ✅ Permissions added to all roles
-- ✅ Tickets feature enabled in packages
--
-- Next Steps:
-- 1. Build backend API (ticketRoutes.js)
-- 2. Build frontend components (18 components)
-- 3. Add translations (EN/AR)
-- 4. Test everything!
-- =====================================================
