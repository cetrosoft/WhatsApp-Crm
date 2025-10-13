# Database-Driven Architecture Guide

**Version:** 2.1
**Last Updated:** January 13, 2025
**Status:** Production-Ready ✅ **Fully Database-Driven**

---

## 📋 Table of Contents

1. [Architecture Philosophy](#architecture-philosophy)
2. [How It Works](#how-it-works)
3. [Database Schema](#database-schema)
4. [Adding a New Module - Complete Workflow](#adding-a-new-module---complete-workflow)
5. [Code Examples](#code-examples)
6. [Migration Templates](#migration-templates)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Architecture Philosophy

### ✅ **Zero Hardcoding Principle**

This platform is built on a **100% database-driven architecture**. This means:

- ❌ **NO hardcoded menu items** in JavaScript files
- ❌ **NO hardcoded permissions** in constants
- ❌ **NO hardcoded categorization** arrays
- ❌ **NO code changes** needed for new modules

Instead:
- ✅ **Menu items** stored in `menu_items` table
- ✅ **Permissions** stored in `roles` table
- ✅ **Categorization** auto-derived from menu hierarchy
- ✅ **Everything automatic** from database structure

### **Benefits**

1. **Zero Maintenance:** Add modules without touching code
2. **Consistency:** Menu and permissions always synchronized
3. **Bilingual Native:** Arabic/English at database level
4. **Scalability:** Unlimited modules supported
5. **Developer Experience:** Single source of truth

---

## How It Works

### 1️⃣ **Database-Driven Menu System**

```
Database (menu_items table)
  ↓
Backend: GET /api/menu?lang={en|ar}
  ↓
Database function: get_user_menu(user_id, lang)
  ↓
Filters by: package features + user permissions
  ↓
Frontend: useMenu() hook
  ↓
Sidebar: Renders dynamic menu
```

**Key Features:**
- **Hierarchical Structure:** Parent/child relationships via `parent_key`
- **Two-Layer Filtering:**
  1. Package features (subscription tier)
  2. User permissions (individual access)
- **Bilingual Native:** Pre-translated `name_en` and `name_ar`
- **Real-time:** Language switching updates immediately

### 2️⃣ **Dynamic Permission Discovery System**

```
Database (roles table with permissions arrays)
  ↓
Backend: GET /api/users/permissions/available
  ↓
Fetches: roles + menu_items
  ↓
Algorithm: discoverPermissionsFromRoles(roles, menuItems)
  ↓
Process:
  1. Collect all unique permissions from all roles
  2. Build parent map (menu hierarchy traversal)
  3. For each permission:
     - Extract module name (e.g., "tickets" from "tickets.view")
     - Map to menu key (e.g., "tickets" → "support_tickets")
     - Find top-level parent via hierarchy
     - Auto-categorize under parent tab
  4. Group permissions by top-level parent
  ↓
Frontend: Permission Matrix
  ↓
Display: Tabs = Top-level menu parents
```

**Key Algorithm:**

```javascript
// Step 1: Build parent map from menu hierarchy
function buildParentMap(menuItems) {
  const parentMap = {};
  const itemsByKey = {};

  // Index items by key
  menuItems.forEach(item => {
    itemsByKey[item.key] = item;
  });

  // Walk up tree to find root parent for each item
  menuItems.forEach(item => {
    let current = item;
    while (current.parent_key && itemsByKey[current.parent_key]) {
      current = itemsByKey[current.parent_key];
    }
    parentMap[item.key] = current.key; // Store root parent
  });

  return parentMap;
}

// Step 2: Auto-categorize permissions by hierarchy
allPermissions.forEach(permKey => {
  const [module, action] = permKey.split('.');
  const menuKey = mapModuleToMenuKey(module);      // tickets → support_tickets
  const topParentKey = parentMap[menuKey];         // support_tickets → support_tickets
  const topParent = itemsByKey[topParentKey];

  // Create category tab if doesn't exist
  if (!categories[topParentKey]) {
    categories[topParentKey] = {
      key: topParentKey,
      label_en: topParent.name_en,  // "Tickets"
      label_ar: topParent.name_ar,  // "التذاكر"
      permissions: []
    };
  }

  // Add permission to category
  categories[topParentKey].permissions.push({
    key: permKey,
    label_en: `${action} ${topParent.name_en}`,
    label_ar: `${actionAr} ${topParent.name_ar}`
  });
});
```

### 3️⃣ **Menu Hierarchy Drives Categorization**

**Example: Tickets Module**

```
Database Structure:
┌─────────────────────────────────────────┐
│ menu_items table                        │
├─────────────────────────────────────────┤
│ key: "support_tickets"                  │
│ parent_key: NULL (top-level)            │
│ name_en: "Tickets"                      │
│ name_ar: "التذاكر"                      │
│ path: NULL (parent - no navigation)     │
└─────────────────────────────────────────┘
           ↓ (children)
┌─────────────────────────────────────────┐
│ key: "all_tickets"                      │
│ parent_key: "support_tickets"           │
│ name_en: "All Tickets"                  │
│ path: "/tickets"                        │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ key: "ticket_settings"                  │
│ parent_key: "support_tickets"           │
│ name_en: "Settings"                     │
│ path: "/tickets/settings"               │
└─────────────────────────────────────────┘

Permissions in roles table:
- tickets.view
- tickets.create
- tickets.edit
- tickets.delete
- ticket_categories.manage

Algorithm Processing:
1. Permission: "tickets.view"
   → module: "tickets"
   → menuKey: mapModuleToMenuKey("tickets") = "support_tickets"
   → topParent: parentMap["support_tickets"] = "support_tickets"
   → Category: "Tickets" tab

2. Permission: "ticket_categories.manage"
   → module: "ticket_categories"
   → menuKey: mapModuleToMenuKey("ticket_categories") = "support_tickets"
   → topParent: parentMap["support_tickets"] = "support_tickets"
   → Category: "Tickets" tab (same as above!)

Result:
📋 Tickets Tab
   ├─ View Tickets
   ├─ Create Tickets
   ├─ Edit Tickets
   ├─ Delete Tickets
   └─ Manage Ticket Categories
```

**Key Insight:** Both `tickets.*` and `ticket_categories.*` permissions automatically group under the "Tickets" tab because they both map to `support_tickets` menu parent!

### 4️⃣ **The Dual Mapping Pattern** ⭐ **CRITICAL CONCEPT**

**Why We Need TWO Mapping Functions:**

The permission system serves two different purposes that require separate mappings:

1. **GROUPING** - Which tab should the permission appear under?
2. **LABELING** - What name should be displayed for the permission?

#### **The Problem Without Dual Mapping:**

```javascript
// ❌ WRONG: Using same mapping for both purposes
'tags': 'crm_settings',  // Maps to parent

// When looking up label:
const menuKey = mapModuleToMenuKey('tags');  // Returns 'crm_settings'
const label = menuItems.find(item => item.key === menuKey);  // Finds parent!
// Result: "View CRM Settings" (WRONG - not specific!)

// When grouping:
const parentKey = findParent(menuKey);  // Correctly groups under CRM Settings tab ✓
```

Result: Three different modules (tags, statuses, lead_sources) all show as "View CRM Settings" in the permission matrix!

#### **The Solution: Dual Mapping**

```javascript
// Function 1: For GROUPING (finds parent for tab categorization)
function mapModuleToMenuKey(module) {
  return {
    'tags': 'crm_settings',              // Group under CRM Settings tab
    'statuses': 'crm_settings',          // Group under CRM Settings tab
    'lead_sources': 'crm_settings',      // Group under CRM Settings tab
    'tickets': 'support_tickets',
    'ticket_categories': 'support_tickets',
  }[module] || module;
}

// Function 2: For LABELS (finds individual item for display names)
function mapModuleToLabelMenuKey(module) {
  return {
    'tags': 'tags',                      // Look up "Tags" name
    'statuses': 'contact_statuses',      // Look up "Contact Statuses" name
    'lead_sources': 'lead_sources',      // Look up "Lead Sources" name
    'tickets': 'support_tickets',
    'ticket_categories': 'ticket_settings',  // Look up "Settings" name
  }[module] || module;
}
```

#### **Usage in Code:**

```javascript
// In discoverPermissionsFromRoles() - for GROUPING:
const menuKey = mapModuleToMenuKey(module);
const topParent = parentMap[menuKey];
categories[topParent].permissions.push(...);  // Groups by parent

// In formatPermissionLabel() - for LABELS:
const labelKey = mapModuleToLabelMenuKey(module);  // ← Different function!
const menuItem = menuItems.find(item => item.key === labelKey);
return `${action} ${menuItem.name_en}`;  // "View Tags" (specific!)
```

#### **Real-World Examples:**

**Example 1: CRM Settings Items**

```javascript
// Module: 'tags'
// Grouping: mapModuleToMenuKey('tags') → 'crm_settings' → Groups under "CRM Settings" tab
// Label:    mapModuleToLabelMenuKey('tags') → 'tags' → Displays "View Tags"

// Module: 'statuses'
// Grouping: mapModuleToMenuKey('statuses') → 'crm_settings' → Groups under "CRM Settings" tab
// Label:    mapModuleToLabelMenuKey('statuses') → 'contact_statuses' → Displays "View Contact Statuses"

// Module: 'lead_sources'
// Grouping: mapModuleToMenuKey('lead_sources') → 'crm_settings' → Groups under "CRM Settings" tab
// Label:    mapModuleToLabelMenuKey('lead_sources') → 'lead_sources' → Displays "View Lead Sources"
```

**Result:**
- ✅ All THREE grouped under same "CRM Settings" tab
- ✅ Each shows DISTINCT label from its own menu item
- ✅ Fully database-driven (names from menu_items table)

**Example 2: Tickets Module**

```javascript
// Module: 'tickets'
// Grouping: mapModuleToMenuKey('tickets') → 'support_tickets' → Groups under "Tickets" tab
// Label:    mapModuleToLabelMenuKey('tickets') → 'support_tickets' → Displays "View Tickets"

// Module: 'ticket_categories'
// Grouping: mapModuleToMenuKey('ticket_categories') → 'support_tickets' → Groups under "Tickets" tab
// Label:    mapModuleToLabelMenuKey('ticket_categories') → 'ticket_settings' → Displays "Manage Settings"
```

**Result:**
- ✅ Both grouped under same "Tickets" tab
- ✅ Distinct labels: "View Tickets" vs "Manage Settings"
- ✅ Labels pulled from individual menu items in database

#### **When to Use Which Mapping:**

| Function | Used For | Returns | Used In |
|----------|----------|---------|---------|
| `mapModuleToMenuKey()` | **Grouping** | Parent menu key | `discoverPermissionsFromRoles()` |
| `mapModuleToLabelMenuKey()` | **Labels** | Individual menu key | `formatPermissionLabel()` |

#### **Rules for Adding New Modules:**

1. **If module should group with others:**
   - `mapModuleToMenuKey()`: Point to parent
   - `mapModuleToLabelMenuKey()`: Point to own menu item

2. **If module is standalone:**
   - Both functions: Point to same menu item

**Example: Adding a new "Reports" module (standalone)**
```javascript
// Standalone module - same mapping in both functions
mapModuleToMenuKey('reports') → 'reports'
mapModuleToLabelMenuKey('reports') → 'reports'
```

**Example: Adding "report_templates" under Reports**
```javascript
// Groups with Reports but has own label
mapModuleToMenuKey('report_templates') → 'reports'  // Parent for grouping
mapModuleToLabelMenuKey('report_templates') → 'report_templates'  // Own item for label
```

#### **Why This Matters:**

- ✅ **Prevents duplicate labels** in permission matrix
- ✅ **Maintains proper grouping** of related permissions
- ✅ **100% database-driven** - All names from menu_items table
- ✅ **Bilingual support** - Each item has its own translations
- ✅ **Scalable** - Works for unlimited modules and hierarchies

---

## Database Schema

### **menu_items Table**

```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,           -- 'support_tickets', 'all_tickets'
  parent_key VARCHAR(100) REFERENCES menu_items(key), -- Hierarchy relationship
  name_en VARCHAR(255) NOT NULL,              -- 'Tickets'
  name_ar VARCHAR(255) NOT NULL,              -- 'التذاكر'
  icon VARCHAR(50),                           -- Lucide icon name
  path VARCHAR(500),                          -- '/tickets', NULL for parents
  display_order INTEGER DEFAULT 0,            -- Sort order in menu
  required_permission VARCHAR(100),           -- 'tickets.view'
  required_feature VARCHAR(100),              -- 'tickets' (package feature)
  is_system BOOLEAN DEFAULT true,             -- System item (cannot delete)
  is_active BOOLEAN DEFAULT true,             -- Show/hide toggle
  show_in_menu BOOLEAN DEFAULT true,          -- Display in sidebar
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **roles Table** (Permission Storage)

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(100) NOT NULL,                 -- 'Support Agent'
  slug VARCHAR(50) NOT NULL,                  -- 'agent'
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,      -- ["tickets.view", "tickets.create"]
  is_system BOOLEAN DEFAULT false,            -- System role (cannot delete)
  is_default BOOLEAN DEFAULT false,           -- Auto-assign to new users
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Database Function:** `get_user_menu(user_id, lang)`

```sql
CREATE OR REPLACE FUNCTION get_user_menu(user_id UUID, lang VARCHAR DEFAULT 'en')
RETURNS TABLE (
  key VARCHAR,
  parent_key VARCHAR,
  name VARCHAR,
  icon VARCHAR,
  path VARCHAR,
  display_order INTEGER,
  has_permission BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.key,
    m.parent_key,
    CASE WHEN lang = 'ar' THEN m.name_ar ELSE m.name_en END AS name,
    m.icon,
    m.path,
    m.display_order,
    -- Check if user has required permission (if specified)
    CASE
      WHEN m.required_permission IS NULL THEN true
      ELSE check_user_permission(user_id, m.required_permission)
    END AS has_permission
  FROM menu_items m
  WHERE
    m.is_active = true
    AND m.show_in_menu = true
    -- Filter by package features
    AND (m.required_feature IS NULL OR organization_has_feature(
      (SELECT organization_id FROM users WHERE id = user_id),
      m.required_feature
    ))
  ORDER BY m.display_order;
END;
$$ LANGUAGE plpgsql;
```

---

## Adding a New Module - Complete Workflow

### **Step-by-Step Guide**

Let's add a **Reports** module as an example.

#### **Step 1: Create Database Migration**

Create file: `supabase/migrations/XXX_reports_module.sql`

```sql
-- =====================================================
-- REPORTS MODULE - DATABASE-DRIVEN IMPLEMENTATION
-- =====================================================
-- Description: Add Reports module with hierarchical menu
-- Dependencies: None (fully self-contained)
-- Architecture: 100% database-driven (zero code changes)
-- =====================================================

-- Step 1: Add parent menu item (Reports)
INSERT INTO menu_items (
  key,
  parent_key,
  name_en,
  name_ar,
  icon,
  path,
  display_order,
  required_permission,
  required_feature,
  is_system,
  show_in_menu
)
SELECT
  'reports',                      -- Unique key
  NULL,                           -- Top-level parent (no parent)
  'Reports',                      -- English name
  'التقارير',                     -- Arabic name
  'BarChart3',                    -- Lucide icon name
  NULL,                           -- No direct path (parent item)
  60,                             -- Display order (after Tickets)
  NULL,                           -- No permission needed for parent
  'reports',                      -- Required package feature
  true,                           -- System menu (cannot delete)
  true                            -- Show in menu
WHERE NOT EXISTS (
  SELECT 1 FROM menu_items WHERE key = 'reports'
);

-- Step 2: Add "All Reports" submenu item
INSERT INTO menu_items (
  key,
  parent_key,
  name_en,
  name_ar,
  icon,
  path,
  display_order,
  required_permission,
  required_feature,
  is_system,
  show_in_menu
)
SELECT
  'all_reports',                  -- Unique key
  'reports',                      -- Parent: Reports menu
  'All Reports',                  -- English name
  'كل التقارير',                 -- Arabic name
  'FileText',                     -- Lucide icon name
  '/reports',                     -- Route path
  61,                             -- Display order
  'reports.view',                 -- Required permission
  'reports',                      -- Required package feature
  true,                           -- System menu
  true                            -- Show in menu
WHERE NOT EXISTS (
  SELECT 1 FROM menu_items WHERE key = 'all_reports'
);

-- Step 3: Add "Create Report" submenu item
INSERT INTO menu_items (
  key,
  parent_key,
  name_en,
  name_ar,
  icon,
  path,
  display_order,
  required_permission,
  required_feature,
  is_system,
  show_in_menu
)
SELECT
  'create_report',                -- Unique key
  'reports',                      -- Parent: Reports menu
  'Create Report',                -- English name
  'إنشاء تقرير',                  -- Arabic name
  'Plus',                         -- Lucide icon name
  '/reports/create',              -- Route path
  62,                             -- Display order
  'reports.create',               -- Required permission
  'reports',                      -- Required package feature
  true,                           -- System menu
  true                            -- Show in menu
WHERE NOT EXISTS (
  SELECT 1 FROM menu_items WHERE key = 'create_report'
);

-- Step 4: Update module-to-menu mapping (backend/utils/permissionDiscovery.js)
-- Add to mapModuleToMenuKey() function:
-- 'reports': 'reports',

-- Step 5: Add permissions to system roles
UPDATE roles
SET permissions = permissions || '["reports.view"]'::jsonb
WHERE slug IN ('admin', 'manager', 'agent')
  AND NOT (permissions @> '["reports.view"]'::jsonb);

UPDATE roles
SET permissions = permissions || '["reports.create", "reports.edit", "reports.delete"]'::jsonb
WHERE slug IN ('admin', 'manager')
  AND NOT (permissions @> '["reports.create"]'::jsonb);

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================
-- ✅ Reports menu visible in sidebar (with submenu)
-- ✅ Permission matrix shows "Reports" tab automatically
-- ✅ Bilingual support (EN/AR)
-- ✅ Package feature gated
-- ✅ Zero code changes needed!
-- =====================================================
```

#### **Step 2: Update Backend Module Mapping** ⚠️ **IMPORTANT: Update BOTH functions**

Edit: `backend/utils/permissionDiscovery.js`

**Update Function 1 - For Grouping:**
```javascript
function mapModuleToMenuKey(module) {
  const moduleToMenu = {
    'contacts': 'crm_contacts',
    'companies': 'crm_companies',
    'segments': 'crm_segmentation',
    'deals': 'crm_deals',
    'pipelines': 'crm_pipelines',
    'campaigns': 'campaigns',
    'conversations': 'conversations',
    'tickets': 'support_tickets',
    'ticket_categories': 'support_tickets',
    'reports': 'reports',                     // ← ADD THIS LINE (standalone module)
    'analytics': 'analytics',
    'tags': 'crm_settings',
    'statuses': 'crm_settings',
    'lead_sources': 'crm_settings',
    'users': 'team_members',
    'permissions': 'team_roles',
    'organization': 'settings_account'
  };

  return moduleToMenu[module] || module;
}
```

**Update Function 2 - For Labels:**
```javascript
function mapModuleToLabelMenuKey(module) {
  const moduleToLabelMenu = {
    'contacts': 'crm_contacts',
    'companies': 'crm_companies',
    'segments': 'crm_segmentation',
    'deals': 'crm_deals',
    'pipelines': 'crm_pipelines',
    'campaigns': 'campaigns',
    'conversations': 'conversations',
    'tickets': 'support_tickets',
    'ticket_categories': 'ticket_settings',  // Individual item for label
    'reports': 'reports',                     // ← ADD THIS LINE (same as grouping)
    'analytics': 'analytics',
    'tags': 'tags',                      // Individual items
    'statuses': 'contact_statuses',      // Individual items
    'lead_sources': 'lead_sources',      // Individual items
    'users': 'team_members',
    'permissions': 'team_roles',
    'organization': 'settings_account'
  };

  return moduleToLabelMenu[module] || module;
}
```

**Key Point:** For standalone modules like Reports, both functions map to the same key. For sub-modules like `ticket_categories`, the grouping function maps to parent while the label function maps to individual item.

**That's it!** No other backend changes needed.

#### **Step 3: Add Frontend Route**

Edit: `Frontend/src/App.jsx`

```javascript
import Reports from './pages/Reports';

// Inside <Routes>
<Route path="/reports" element={
  <ProtectedRoute>
    <Reports />
  </ProtectedRoute>
} />
```

#### **Step 4: Create Frontend Page**

Create: `Frontend/src/pages/Reports.jsx`

```javascript
import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissionUtils';

const Reports = () => {
  const { t } = useTranslation('common');
  const { user } = useAuth();

  // Permission checks
  const canView = hasPermission(user, 'reports.view');
  const canCreate = hasPermission(user, 'reports.create');

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('insufficientPermissions')}
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t('reports')}</h1>
      </div>

      {/* Your reports content here */}
    </div>
  );
};

export default Reports;
```

#### **Step 5: Add Translation Keys**

Edit: `Frontend/public/locales/en/common.json`

```json
{
  "reports": "Reports",
  "allReports": "All Reports",
  "createReport": "Create Report"
}
```

Edit: `Frontend/public/locales/ar/common.json`

```json
{
  "reports": "التقارير",
  "allReports": "كل التقارير",
  "createReport": "إنشاء تقرير"
}
```

#### **Step 6: Run Migration & Test**

```bash
# Run migration in Supabase SQL Editor
# Then refresh frontend

# Test:
# 1. Check sidebar - "Reports" menu should appear with submenu
# 2. Go to Team → Roles & Permissions
# 3. Permission matrix should show "Reports" tab automatically
# 4. All reports.* permissions should be under Reports tab
```

---

## Code Examples

### **Example 1: Hierarchical Menu Structure**

```
📊 CRM (parent: 'crm', path: NULL)
   ├─ 👤 Contacts (child: 'crm_contacts', parent_key: 'crm', path: '/contacts')
   ├─ 🏢 Companies (child: 'crm_companies', parent_key: 'crm', path: '/companies')
   └─ 💰 Deals (child: 'crm_deals', parent_key: 'crm', path: '/deals')

📋 Tickets (parent: 'support_tickets', path: NULL)
   ├─ 📝 All Tickets (child: 'all_tickets', parent_key: 'support_tickets', path: '/tickets')
   └─ ⚙️ Settings (child: 'ticket_settings', parent_key: 'support_tickets', path: '/tickets/settings')
```

### **Example 2: Permission Mapping**

```javascript
// Permission: "tickets.view"
const module = "tickets";                           // Extract module
const menuKey = mapModuleToMenuKey(module);         // "tickets" → "support_tickets"
const topParent = parentMap[menuKey];               // "support_tickets" → "support_tickets"
const category = itemsByKey[topParent];             // { name_en: "Tickets", name_ar: "التذاكر" }

// Result: Permission appears under "Tickets" tab in matrix
```

### **Example 3: Multiple Modules → Same Tab**

```javascript
// Both map to same parent!
mapModuleToMenuKey("tickets")           → "support_tickets"
mapModuleToMenuKey("ticket_categories") → "support_tickets"

// Result: Both permission types under same "Tickets" tab
tickets.view
tickets.create
ticket_categories.manage  // ← All in "Tickets" tab!
```

---

## Migration Templates

### **Template 1: Simple Top-Level Menu Item**

```sql
INSERT INTO menu_items (
  key, parent_key, name_en, name_ar, icon, path,
  display_order, required_permission, required_feature,
  is_system, show_in_menu
)
SELECT
  'module_key',                   -- Change this
  NULL,                           -- Top-level (no parent)
  'Module Name',                  -- Change this
  'اسم الوحدة',                   -- Change this
  'IconName',                     -- Change this (Lucide icon)
  '/module-path',                 -- Change this
  100,                            -- Change this (display order)
  'module.view',                  -- Change this
  'module_feature',               -- Change this (package feature)
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM menu_items WHERE key = 'module_key'
);
```

### **Template 2: Parent with Children**

```sql
-- Parent (no direct navigation)
INSERT INTO menu_items (
  key, parent_key, name_en, name_ar, icon, path,
  display_order, required_permission, required_feature,
  is_system, show_in_menu
)
SELECT
  'parent_key', NULL, 'Parent Name', 'اسم الأب', 'IconName', NULL,
  100, NULL, 'feature', true, true
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE key = 'parent_key');

-- Child 1
INSERT INTO menu_items (
  key, parent_key, name_en, name_ar, icon, path,
  display_order, required_permission, required_feature,
  is_system, show_in_menu
)
SELECT
  'child1_key', 'parent_key', 'Child 1', 'الطفل 1', 'Icon1', '/path1',
  101, 'module.view', 'feature', true, true
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE key = 'child1_key');

-- Child 2
INSERT INTO menu_items (
  key, parent_key, name_en, name_ar, icon, path,
  display_order, required_permission, required_feature,
  is_system, show_in_menu
)
SELECT
  'child2_key', 'parent_key', 'Child 2', 'الطفل 2', 'Icon2', '/path2',
  102, 'module.manage', 'feature', true, true
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE key = 'child2_key');
```

### **Template 3: Add Permissions to Roles**

```sql
-- Add view permission to all roles
UPDATE roles
SET permissions = permissions || '["module.view"]'::jsonb
WHERE slug IN ('admin', 'manager', 'agent', 'member')
  AND NOT (permissions @> '["module.view"]'::jsonb);

-- Add full permissions to admin/manager only
UPDATE roles
SET permissions = permissions || '["module.create", "module.edit", "module.delete"]'::jsonb
WHERE slug IN ('admin', 'manager')
  AND NOT (permissions @> '["module.create"]'::jsonb);
```

---

## Troubleshooting

### **Problem 1: Menu item not appearing**

**Symptoms:** Added migration, but menu item doesn't show in sidebar

**Checklist:**
1. ✅ Migration ran successfully? Check Supabase logs
2. ✅ `is_active = true` and `show_in_menu = true`?
3. ✅ User's package has `required_feature`? Check `packages` table
4. ✅ User has `required_permission`? Check role permissions
5. ✅ Correct `parent_key`? Must match existing parent's `key`
6. ✅ Frontend refreshed? Try hard refresh (Ctrl+Shift+R)

**Debug Query:**
```sql
SELECT * FROM menu_items WHERE key = 'your_key';
SELECT * FROM get_user_menu('user-uuid', 'en');
```

### **Problem 2: Permission not appearing in matrix** ⚠️ **MOST COMMON ISSUE**

**Symptoms:** Menu item shows correctly, but permission doesn't appear in permission matrix tab

**Root Cause:** The dynamic discovery algorithm **ONLY finds permissions that exist in roles**. If NO role has the permission, it won't appear!

**Checklist:**
1. ✅ **Permission added to at least one role's `permissions` array?** ← **CHECK THIS FIRST!**
2. ✅ Module mapped in `mapModuleToMenuKey()`? Check `permissionDiscovery.js`
3. ✅ Menu item exists for that module? Check `menu_items` table
4. ✅ Browser console logs show permission discovery? Check console output
5. ✅ Correct format? Must be `module.action` (e.g., `tickets.view`)

**Quick Check Query:**
```sql
-- Check if permission exists in ANY role
SELECT name, slug, permissions
FROM roles
WHERE permissions @> '["your_permission.action"]'::jsonb;

-- Example: Check for ticket_categories.manage
SELECT name, slug, permissions
FROM roles
WHERE permissions @> '["ticket_categories.manage"]'::jsonb;

-- If this returns ZERO rows, that's your problem!
```

**Solution:**
```sql
-- Add the missing permission to appropriate roles
UPDATE roles
SET permissions = permissions || '["your_permission.action"]'::jsonb
WHERE slug IN ('admin', 'manager')
  AND NOT (permissions @> '["your_permission.action"]'::jsonb);

-- Example: Add ticket_categories.manage
UPDATE roles
SET permissions = permissions || '["ticket_categories.manage"]'::jsonb
WHERE slug IN ('admin', 'manager')
  AND NOT (permissions @> '["ticket_categories.manage"]'::jsonb);
```

**Debug Steps:**
```javascript
// Check browser console for these logs:
console.log('🔍 [Permission Discovery] Total unique permissions:', count);
console.log('📍 Permission module.action: module="X" → menu="Y" → parent="Z"');
console.log('📦 [Permission Discovery] Final categories:', categories);
```

### **Problem 3: Permissions grouping incorrectly**

**Symptoms:** Permissions appearing under wrong tab

**Root Cause:** Incorrect mapping in `mapModuleToMenuKey()`

**Solution:**
```javascript
// Example: If "ticket_categories.manage" should be under "Tickets" tab
// Ensure both map to same parent:
'tickets': 'support_tickets',           // ← Same value
'ticket_categories': 'support_tickets', // ← Same value

// Result: Both will group under "Tickets" tab
```

### **Problem 4: Menu shows but permission tab doesn't**

**Symptoms:** Sidebar shows menu correctly, but permission matrix tab missing

**Root Cause:** `mapModuleToMenuKey()` missing or incorrect

**Solution:**
1. Check backend logs for permission discovery output
2. Verify `mapModuleToMenuKey()` includes your module
3. Ensure permission format matches: `module.action`
4. Verify at least one role has that permission

**Example Fix:**
```javascript
// Add to permissionDiscovery.js
function mapModuleToMenuKey(module) {
  const moduleToMenu = {
    // ... existing mappings ...
    'your_module': 'your_menu_key',  // ← ADD THIS
  };
  return moduleToMenu[module] || module;
}
```

### **Problem 5: Too many tabs (16+ separate tabs)** ⚠️ **CRITICAL BUG**

**Symptoms:** Permission matrix showing 16+ individual tabs instead of 4-5 grouped tabs (one tab per permission module instead of grouped by parent)

**Root Cause:** Backend query missing `parent_key` field - hierarchy traversal fails without it!

**Quick Check:**
```javascript
// In backend/routes/userRoutes.js line ~577
// WRONG (missing parent_key):
.select('key, name_en, name_ar, icon, required_permission')

// CORRECT (with parent_key):
.select('key, parent_key, name_en, name_ar, icon, required_permission')
```

**Why This Happens:**
1. Menu items fetched WITHOUT `parent_key`
2. `buildParentMap()` receives items where `item.parent_key` is always `undefined`
3. Cannot traverse hierarchy to find top-level parents
4. Fallback creates separate category for each menuKey
5. Result: 16+ tabs instead of 4-5 grouped tabs

**Solution:**
```javascript
// backend/routes/userRoutes.js - /api/users/permissions/available endpoint
const { data: menuItems, error: menuError } = await supabase
  .from('menu_items')
  .select('key, parent_key, name_en, name_ar, icon, required_permission')  // ← MUST include parent_key!
  .eq('is_active', true);
```

**After Fix:**
- ✅ CRM tab: contacts, companies, deals, pipelines, segments
- ✅ Tickets tab: tickets.*, ticket_categories.*
- ✅ Team tab: users.*, permissions.*
- ✅ Settings tab: tags, statuses, lead_sources
- ✅ ~4-5 tabs total (properly grouped)

### **Problem 6: Duplicate or identical permission labels** ⚠️ **COMMON ISSUE**

**Symptoms:** Multiple permissions showing the same label in permission matrix

Example:
- "View CRM Settings" (for tags.view)
- "View CRM Settings" (for statuses.view)  ← Duplicate!
- "View CRM Settings" (for lead_sources.view)  ← Duplicate!

**Root Cause:** Using parent menu key for label lookup instead of individual menu item key

**The Issue:**
```javascript
// In formatPermissionLabel() - WRONG:
const menuKey = mapModuleToMenuKey('tags');  // Returns 'crm_settings' (parent!)
const menuItem = menuItems.find(item => item.key === menuKey);  // Finds parent
// Result: All three modules get parent's name "CRM Settings"
```

**Solution:** Implement dual mapping pattern (see section 4️⃣ above)

1. **Add `mapModuleToLabelMenuKey()` function** that maps to individual menu items:
   ```javascript
   function mapModuleToLabelMenuKey(module) {
     return {
       'tags': 'tags',                    // Individual item
       'statuses': 'contact_statuses',    // Individual item
       'lead_sources': 'lead_sources',    // Individual item
       'ticket_categories': 'ticket_settings',  // Individual item
     }[module] || module;
   }
   ```

2. **Update `formatPermissionLabel()` to use label function:**
   ```javascript
   // OLD:
   const menuKey = mapModuleToMenuKey(module);

   // NEW:
   const menuKey = mapModuleToLabelMenuKey(module);
   ```

3. **Keep `mapModuleToMenuKey()` for grouping unchanged**

**After Fix:**
- ✅ "View Tags" (specific!)
- ✅ "View Contact Statuses" (specific!)
- ✅ "View Lead Sources" (specific!)
- ✅ All still grouped under "CRM Settings" tab
- ✅ Each label pulled from its own menu item in database

---

## Best Practices

### **✅ DO:**

1. **Always use bilingual names** (`name_en`, `name_ar`) in migrations
2. **Use descriptive keys** (e.g., `support_tickets` not `tickets1`)
3. **Set proper display_order** (leave gaps: 10, 20, 30 for future inserts)
4. **Test with multiple roles** (admin, manager, agent, member)
5. **Add WHERE NOT EXISTS** to prevent duplicate inserts
6. **Document migrations** with clear comments and descriptions
7. **Use Lucide icon names** (check https://lucide.dev)
8. **Map module in `permissionDiscovery.js`** immediately after migration
9. **Add permissions to system roles** in same migration
10. **Test both menu and permission matrix** before considering complete

### **❌ DON'T:**

1. **Don't hardcode menu items** in `menuConfig.jsx` (deprecated file)
2. **Don't hardcode permissions** in constants or arrays
3. **Don't skip `required_feature`** (breaks package gating)
4. **Don't use parent items for navigation** (use child items instead)
5. **Don't forget to refresh frontend** after migration
6. **Don't mix singular/plural** in naming (`tickets` not `ticket`)
7. **Don't forget parent-child relationship** (set correct `parent_key`)
8. **Don't skip translation keys** in frontend locales
9. **Don't forget `mapModuleToMenuKey()`** mapping
10. **Don't assume it works** - always test thoroughly!

### **Naming Conventions:**

```javascript
// Menu keys
'module_name'           // Top-level parent
'all_modules'           // List view child
'module_settings'       // Settings child
'create_module'         // Creation child

// Permissions
'module.view'           // Read access
'module.create'         // Create access
'module.edit'           // Update access
'module.delete'         // Delete access
'module.export'         // Export access
'module.manage'         // Full management access
'module_subtype.action' // Sub-module permissions

// Examples:
'tickets.view'
'ticket_categories.manage'
'reports.export'
```

---

## Real-World Example: Tickets Module

This is the exact workflow used to implement the Tickets module:

### **Migration:** `020_activate_tickets_settings_menu.sql`

```sql
-- Parent already exists from 019_tickets_module.sql
-- Key: 'support_tickets', parent_key: NULL

-- Child 1: All Tickets
INSERT INTO menu_items (
  key, parent_key, name_en, name_ar, icon, path,
  display_order, required_permission, required_feature,
  is_system, show_in_menu
)
SELECT
  'all_tickets', 'support_tickets', 'All Tickets', 'كل التذاكر',
  'ListChecks', '/tickets', 40, 'tickets.view', 'tickets', true, true
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE key = 'all_tickets');

-- Child 2: Settings
INSERT INTO menu_items (
  key, parent_key, name_en, name_ar, icon, path,
  display_order, required_permission, required_feature,
  is_system, show_in_menu
)
SELECT
  'ticket_settings', 'support_tickets', 'Settings', 'الإعدادات',
  'Settings', '/tickets/settings', 41, 'ticket_categories.manage', 'tickets', true, true
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE key = 'ticket_settings');
```

### **Backend Mapping:** `backend/utils/permissionDiscovery.js`

```javascript
function mapModuleToMenuKey(module) {
  const moduleToMenu = {
    // ... other mappings ...
    'tickets': 'support_tickets',           // Main permissions
    'ticket_categories': 'support_tickets', // Settings permissions
  };
  return moduleToMenu[module] || module;
}
```

### **Result:**

```
Sidebar:
📋 Tickets
   ├─ 📝 All Tickets → /tickets
   └─ ⚙️ Settings → /tickets/settings

Permission Matrix:
┌─────────────────────────────────────┐
│ 📋 Tickets Tab                      │
├─────────────────────────────────────┤
│ ☑️ View Tickets (tickets.view)      │
│ ☑️ Create Tickets (tickets.create)  │
│ ☑️ Edit Tickets (tickets.edit)      │
│ ☑️ Delete Tickets (tickets.delete)  │
│ ☑️ Manage Categories                │
│    (ticket_categories.manage)       │
└─────────────────────────────────────┘
```

**Why it works:**
- Both `tickets.*` and `ticket_categories.*` map to `support_tickets`
- `support_tickets` is top-level parent (no parent_key)
- Algorithm auto-groups both under same "Tickets" tab
- Zero hardcoding - fully database-driven!

---

## Summary

### **The Complete Flow:**

1. **Create migration** → Add to `menu_items` table (parent + children)
2. **Update mapping** → Add to **BOTH** `mapModuleToMenuKey()` AND `mapModuleToLabelMenuKey()` in `permissionDiscovery.js`
3. **Add permissions** → Update `roles` table with new permissions
4. **Create frontend** → Add route + page component
5. **Add translations** → Update locale files (en/ar)
6. **Test** → Verify menu + permission matrix (check grouping AND labels)

### **Zero Code Changes After Setup:**

Once the architecture is in place:
- ✅ Menu items → Database only
- ✅ Permissions → Database only
- ✅ Categorization → Automatic from hierarchy
- ✅ Bilingual → Database native
- ✅ New modules → Just run migration!

### **Files You'll Touch:**

**For Every New Module:**
1. `supabase/migrations/XXX_module_name.sql` (NEW)
2. `backend/utils/permissionDiscovery.js` (2 lines - update BOTH mapping functions!)
3. `Frontend/src/App.jsx` (1 route)
4. `Frontend/src/pages/ModuleName.jsx` (NEW)
5. `Frontend/public/locales/en/common.json` (3-5 keys)
6. `Frontend/public/locales/ar/common.json` (3-5 keys)

**That's it!** No menu config files, no permission constants, no hardcoded arrays!

**Critical:** Don't forget to update BOTH mapping functions in `permissionDiscovery.js`:
- `mapModuleToMenuKey()` - For grouping (which tab?)
- `mapModuleToLabelMenuKey()` - For labels (what name?)

---

## Questions?

If you encounter issues not covered in this guide:

1. Check browser console for permission discovery logs
2. Query database directly: `SELECT * FROM get_user_menu('user-id', 'en');`
3. Verify role permissions: `SELECT permissions FROM roles WHERE slug = 'admin';`
4. Check mapping: Review `mapModuleToMenuKey()` function
5. Review this guide's troubleshooting section

---

**Last Updated:** January 13, 2025
**Architecture Version:** 2.1 (Fully Database-Driven with Dual Mapping)
**Status:** ✅ Production-Ready

**Key Features:**
- ✅ 100% Database-Driven (menu + permissions)
- ✅ Dual Mapping Pattern (grouping + labels)
- ✅ Zero Hardcoding
- ✅ Bilingual Native Support
- ✅ Automatic Categorization from Menu Hierarchy
