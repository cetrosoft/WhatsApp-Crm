# How to Add a New Module - DYNAMIC SYSTEM (Oct 2025+)

**Last Updated:** January 13, 2025
**Architecture:** Database-Driven Menu & Permissions (Dynamic System)

---

## Overview

Since **October 11, 2025**, this platform uses a **fully database-driven architecture**:
- ✅ Menu items stored in `menu_items` table
- ✅ Permissions stored in `roles` table
- ✅ Everything filtered by `get_user_menu(user_id, lang)` function
- ❌ NO hardcoded `menuConfig.jsx`
- ❌ NO hardcoded `constants/permissions.js`

**Single Source of Truth:** Database (Supabase)

---

## Step-by-Step Guide

### **Step 1: Create Database Migration** ⭐ REQUIRED

**File:** `supabase/migrations/XXX_your_module_name.sql`

```sql
-- =====================================================
-- YOUR MODULE MIGRATION
-- =====================================================

-- 1. CREATE TABLES (if needed)
CREATE TABLE IF NOT EXISTS your_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  -- your fields...
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view org data" ON your_table
  FOR SELECT
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

-- 2. ADD MENU ITEM
INSERT INTO menu_items (key, parent_key, name_en, name_ar, icon, path, display_order, required_permission, required_feature, is_system)
SELECT
  'your_module_key',        -- Unique key (e.g., 'invoices', 'support_tickets')
  NULL,                     -- Parent key (NULL for top-level, or 'crm' for submenu)
  'Your Module',            -- English name
  'الوحدة الخاصة بك',      -- Arabic name
  'YourIcon',               -- Lucide icon name (e.g., 'FileText', 'Ticket')
  '/your-module',           -- Route path
  50,                       -- Display order (higher = lower in menu)
  'your_module.view',       -- Required permission
  'your_feature',           -- Required package feature (optional, or NULL)
  true                      -- is_system (true = core menu, false = custom)
WHERE NOT EXISTS (
  SELECT 1 FROM menu_items WHERE key = 'your_module_key'
);

-- 3. ADD PERMISSIONS TO ROLES
-- Admin role (full permissions)
UPDATE roles
SET permissions = permissions || jsonb_build_array(
  'your_module.view',
  'your_module.create',
  'your_module.edit',
  'your_module.delete'
)
WHERE slug = 'admin' AND is_system = true
AND NOT (permissions ? 'your_module.view');

-- Manager role (no delete)
UPDATE roles
SET permissions = permissions || jsonb_build_array(
  'your_module.view',
  'your_module.create',
  'your_module.edit'
)
WHERE slug = 'manager' AND is_system = true
AND NOT (permissions ? 'your_module.view');

-- Agent role (view + create)
UPDATE roles
SET permissions = permissions || jsonb_build_array(
  'your_module.view',
  'your_module.create'
)
WHERE slug = 'agent' AND is_system = true
AND NOT (permissions ? 'your_module.view');

-- Member role (view only)
UPDATE roles
SET permissions = permissions || jsonb_build_array(
  'your_module.view'
)
WHERE slug = 'member' AND is_system = true
AND NOT (permissions ? 'your_module.view');

-- 4. ENABLE PACKAGE FEATURE (if needed)
UPDATE packages
SET features = jsonb_set(features, '{your_feature}', 'true'::jsonb)
WHERE slug IN ('lite', 'professional', 'business', 'enterprise')
AND (features->>'your_feature')::boolean IS DISTINCT FROM true;
```

**Run Migration:**
1. Open Supabase SQL Editor
2. Paste migration
3. Click "Run"
4. Verify: `SELECT * FROM menu_items WHERE key = 'your_module_key';`

---

### **Step 2: Create Backend Routes**

**File:** `backend/routes/yourModuleRoutes.js`

```javascript
import express from 'express';
import supabase from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';
import { setTenantContext } from '../middleware/tenant.js';

const router = express.Router();

// Apply middleware
router.use(authenticateToken);
router.use(setTenantContext);

/**
 * GET /api/your-module
 * List all items (auto-checks permission via RLS)
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('your_table')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

/**
 * POST /api/your-module
 * Create item
 */
router.post('/', async (req, res) => {
  try {
    const { title, description } = req.body;

    const { data, error } = await supabase
      .from('your_table')
      .insert({
        organization_id: req.organizationId,
        created_by: req.userId,
        title,
        description
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to create' });
  }
});

export default router;
```

**Register Routes:**

**File:** `backend/server.js`

```javascript
import yourModuleRoutes from './routes/yourModuleRoutes.js';

// Add after other routes
app.use('/api/your-module', yourModuleRoutes);
```

---

### **Step 3: Create Frontend API Service**

**File:** `Frontend/src/services/api.js`

```javascript
// Add to existing api.js file
export const yourModuleAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiCall(`/api/your-module${queryString ? `?${queryString}` : ''}`);
  },

  getById: async (id) => {
    return await apiCall(`/api/your-module/${id}`);
  },

  create: async (data) => {
    return await apiCall('/api/your-module', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id, data) => {
    return await apiCall(`/api/your-module/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id) => {
    return await apiCall(`/api/your-module/${id}`, {
      method: 'DELETE',
    });
  },
};

// Update default export
export default {
  // ... other APIs
  yourModuleAPI,
};
```

---

### **Step 4: Create Frontend Page**

**File:** `Frontend/src/pages/YourModule.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissionUtils';
import { yourModuleAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

const YourModule = () => {
  const { t } = useTranslation(['common']);
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Permission checks
  const canView = hasPermission(user, 'your_module.view');
  const canCreate = hasPermission(user, 'your_module.create');
  const canEdit = hasPermission(user, 'your_module.edit');
  const canDelete = hasPermission(user, 'your_module.delete');

  useEffect(() => {
    if (canView) {
      loadData();
    }
  }, [canView]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await yourModuleAPI.getAll();
      setData(response.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(t('failedToLoad', { resource: t('yourModule') }));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!canDelete) {
      toast.error(t('insufficientPermissions'));
      return;
    }

    if (!confirm(t('confirmDelete'))) return;

    try {
      await yourModuleAPI.delete(id);
      toast.success(t('successDeleted'));
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(t('failedToDelete'));
    }
  };

  // Permission guard
  if (!canView) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('insufficientPermissions')}</h2>
          <p className="text-gray-600">{t('contactAdmin')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('yourModule')}</h1>
        {canCreate && (
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {t('create')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          {/* Your content here */}
        </div>
      )}
    </div>
  );
};

export default YourModule;
```

---

### **Step 5: Add Route in App.jsx**

**File:** `Frontend/src/App.jsx`

```javascript
import YourModule from "./pages/YourModule";

// Inside MainLayout component:
<Route
  path="/your-module"
  element={
    <PermissionRoute permission="your_module.view">
      <YourModule />
    </PermissionRoute>
  }
/>
```

---

### **Step 6: Add Translations**

**File:** `Frontend/public/locales/en/common.json`

```json
{
  "yourModule": "Your Module",
  "yourModuleCreated": "Item created successfully",
  "yourModuleUpdated": "Item updated successfully",
  "yourModuleDeleted": "Item deleted successfully"
}
```

**File:** `Frontend/public/locales/ar/common.json`

```json
{
  "yourModule": "وحدتك",
  "yourModuleCreated": "تم إنشاء العنصر بنجاح",
  "yourModuleUpdated": "تم تحديث العنصر بنجاح",
  "yourModuleDeleted": "تم حذف العنصر بنجاح"
}
```

---

## Menu Will Appear Automatically! ✨

Once migration is run:
1. **`get_user_menu(user_id, lang)`** function automatically fetches menu
2. **Two-layer filtering:**
   - ✅ Package has feature? (`features->>'your_feature' = true`)
   - ✅ User has permission? (`role.permissions ? 'your_module.view'`)
3. **Sidebar renders menu** with pre-translated names (name_en / name_ar)
4. **No code changes needed** - it's all database-driven!

---

## Verification Steps

```sql
-- 1. Check menu item exists
SELECT * FROM menu_items WHERE key = 'your_module_key';

-- 2. Check admin role has permission
SELECT permissions FROM roles WHERE slug = 'admin' AND is_system = true;

-- 3. Check package has feature
SELECT slug, features->>'your_feature' FROM packages;

-- 4. Test menu function for your user
SELECT * FROM get_user_menu('YOUR_USER_ID'::uuid, 'en')
WHERE key = 'your_module_key';
```

---

## Troubleshooting

**Menu not showing?**

1. **Run debug script:** `supabase/migrations/019_VERIFY_tickets_menu.sql`
2. **Replace** `'YOUR_EMAIL_HERE'` with your email
3. **Review results** - script will show exactly what's missing
4. **Logout + Login** after any database changes (to refresh JWT token)
5. **Hard refresh browser** (Ctrl+Shift+R)

**Common Issues:**

| Issue | Solution |
|-------|----------|
| Migration didn't run | Run SQL in Supabase SQL Editor |
| User still has old token | Logout + Login + Hard Refresh |
| Package missing feature | Run UPDATE packages SQL |
| Role missing permission | Run UPDATE roles SQL |

---

## Key Differences from OLD System

| OLD System (Before Oct 11) | NEW System (Oct 11+) |
|----------------------------|----------------------|
| `menuConfig.jsx` (hardcoded) | `menu_items` table (database) |
| `constants/permissions.js` | `roles.permissions` (database) |
| Manual menu filtering | `get_user_menu()` function |
| i18n translation keys | Pre-translated name_en/name_ar |
| 4 files to update | 1 SQL migration |

---

## Examples

See production-ready examples:
- **CRM Contacts** - Full CRUD module
- **CRM Deals** - Kanban + List views
- **Tickets** - Latest implementation (Jan 2025)

Files to reference:
- `supabase/migrations/019_tickets_module.sql` - Complete migration
- `backend/routes/ticketRoutes.js` - Backend API
- `Frontend/src/pages/Tickets.jsx` - Frontend page
- `Frontend/src/services/api.js` - API service (ticketAPI)

---

## Need Help?

1. Run `019_VERIFY_tickets_menu.sql` to debug
2. Check CLAUDE.md section "Dynamic Menu & Permission Systems"
3. Review existing CRM modules for patterns
