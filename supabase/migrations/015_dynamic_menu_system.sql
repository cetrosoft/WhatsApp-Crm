/**
 * Dynamic Menu System Migration
 * Allows menu structure to be managed from database
 * Supports multi-tenant, multi-language, permission-based menus
 */

-- Menu items table (stores all menu entries)
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  key VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'crm', 'pipelines', 'deals'
  parent_key VARCHAR(100), -- NULL for root items

  -- Display
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  icon VARCHAR(50), -- Lucide icon name
  path VARCHAR(500), -- Route path

  -- Ordering
  display_order INTEGER NOT NULL DEFAULT 0,

  -- Access Control
  required_permission VARCHAR(100), -- e.g., 'pipelines.view'
  required_feature VARCHAR(100), -- e.g., 'crm', 'ticketing'

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false, -- Cannot be deleted if true

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_parent FOREIGN KEY (parent_key) REFERENCES menu_items(key) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_menu_items_parent ON menu_items(parent_key);
CREATE INDEX idx_menu_items_active ON menu_items(is_active);
CREATE INDEX idx_menu_items_order ON menu_items(display_order);

-- RLS Policies (all users can view active menus)
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active menu items"
  ON menu_items FOR SELECT
  USING (is_active = true);

-- Only admins can modify menus
CREATE POLICY "Only admins can insert menu items"
  ON menu_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update menu items"
  ON menu_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete non-system menu items"
  ON menu_items FOR DELETE
  USING (
    is_system = false
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Seed default menu structure
INSERT INTO menu_items (key, parent_key, name_en, name_ar, icon, path, display_order, required_permission, required_feature, is_system) VALUES
-- Root level menus
('dashboard', NULL, 'Dashboard', 'لوحة التحكم', 'LayoutDashboard', '/dashboard', 1, NULL, NULL, true),
('crm', NULL, 'CRM', 'إدارة العملاء', 'Users', NULL, 2, 'contacts.view', 'crm', true),
('campaigns', NULL, 'Campaigns', 'الحملات', 'Megaphone', NULL, 3, 'campaigns.view', 'bulk_sender', true),
('conversations', NULL, 'Conversations', 'المحادثات', 'MessagesSquare', NULL, 4, 'conversations.view', NULL, true),
('team', NULL, 'Team', 'الفريق', 'UsersRound', NULL, 5, 'users.view', NULL, true),
('settings', NULL, 'Settings', 'الإعدادات', 'Settings', NULL, 6, 'organization.edit', NULL, true),

-- CRM submenu
('crm_contacts', 'crm', 'Contacts', 'جهات الاتصال', 'Contact', '/crm/contacts', 1, 'contacts.view', NULL, true),
('crm_companies', 'crm', 'Companies', 'الشركات', 'Building', '/crm/companies', 2, 'companies.view', NULL, true),
('crm_segmentation', 'crm', 'Segmentation', 'التصنيف', 'Target', '/crm/segmentation', 3, 'segments.view', NULL, true),
('crm_deals', 'crm', 'Deals', 'الصفقات', 'TrendingUp', '/crm/deals', 4, 'deals.view', NULL, true),
('crm_pipelines', 'crm', 'Pipelines', 'خطوط المبيعات', 'GitBranch', '/crm/pipelines', 5, 'pipelines.view', NULL, true),
('crm_settings', 'crm', 'CRM Settings', 'إعدادات إدارة العملاء', 'Settings', '/crm/settings', 6, 'statuses.view', NULL, true),

-- Team submenu
('team_members', 'team', 'Members', 'الأعضاء', 'Users', '/team/members', 1, 'users.view', NULL, true),
('team_roles', 'team', 'Roles & Permissions', 'الأدوار والصلاحيات', 'Shield', '/team/roles', 2, 'permissions.manage', NULL, true),

-- Settings submenu
('settings_account', 'settings', 'Account Settings', 'إعدادات الحساب', 'UserCog', '/account-settings', 1, 'organization.edit', NULL, true);

-- Function to get menu for a user
CREATE OR REPLACE FUNCTION get_user_menu(user_id UUID, lang VARCHAR DEFAULT 'en')
RETURNS TABLE (
  id UUID,
  key VARCHAR,
  parent_key VARCHAR,
  name VARCHAR,
  icon VARCHAR,
  path VARCHAR,
  display_order INTEGER,
  has_permission BOOLEAN
) AS $$
DECLARE
  v_user_org_id UUID;
  v_user_id ALIAS FOR user_id;  -- Alias to avoid ambiguity
  v_lang ALIAS FOR lang;          -- Alias to avoid ambiguity
BEGIN
  -- Get user's organization ID for package feature checking
  SELECT u.organization_id INTO v_user_org_id
  FROM users u
  WHERE u.id = v_user_id;

  RETURN QUERY
  SELECT
    m.id,
    m.key,
    m.parent_key,
    CASE
      WHEN v_lang = 'ar' THEN m.name_ar
      ELSE m.name_en
    END as name,
    m.icon,
    m.path,
    m.display_order,
    -- Check if user has permission
    CASE
      WHEN m.required_permission IS NULL THEN true
      ELSE EXISTS (
        SELECT 1 FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = v_user_id
        AND (
          -- Check role permissions
          r.permissions ? m.required_permission
          -- Or check custom grants
          OR u.permissions->'grant' ? m.required_permission
        )
        -- Exclude custom revokes
        AND NOT (u.permissions->'revoke' ? m.required_permission)
      )
    END as has_permission
  FROM menu_items m
  WHERE m.is_active = true
    -- Two-layer filtering: Package features → User permissions
    AND (
      m.required_feature IS NULL
      OR organization_has_feature(v_user_org_id, m.required_feature)
    )
  ORDER BY m.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated trigger for updated_at
CREATE OR REPLACE FUNCTION update_menu_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_menu_items_updated_at();

COMMENT ON TABLE menu_items IS 'Dynamic menu structure for multi-tenant SaaS';
COMMENT ON FUNCTION get_user_menu IS 'Returns menu items filtered by two-layer access control: (1) Package features → (2) User permissions. Supports bilingual output (en/ar)';
