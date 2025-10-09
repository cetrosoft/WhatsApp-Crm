# How to Add a New Module to the Platform

This guide explains the step-by-step process for adding a new feature module (e.g., Invoices, Projects, etc.) to the Omnichannel CRM SaaS platform.

## Overview

Our platform uses a **permission-based architecture** where:
- Menu visibility is controlled by database permissions (not hardcoded roles)
- All access control is managed through the `roles` table
- Permissions follow the pattern: `resource.action` (e.g., `invoices.view`, `invoices.create`)

---

## Step-by-Step Guide

### **Step 1: Define Permissions** (Backend)

**File:** `backend/constants/permissions.js`

Add your new permissions to the `PERMISSIONS` object:

```javascript
export const PERMISSIONS = {
  // ... existing permissions ...

  // Invoices (NEW MODULE)
  INVOICES_VIEW: 'invoices.view',
  INVOICES_CREATE: 'invoices.create',
  INVOICES_EDIT: 'invoices.edit',
  INVOICES_DELETE: 'invoices.delete',
  INVOICES_EXPORT: 'invoices.export',
  INVOICES_SEND: 'invoices.send',
};
```

---

### **Step 2: Assign Permissions to Roles** (Backend)

**File:** `backend/constants/permissions.js`

Update the `ROLE_PERMISSIONS` object:

```javascript
export const ROLE_PERMISSIONS = {
  admin: [
    // ... existing permissions ...
    PERMISSIONS.INVOICES_VIEW,
    PERMISSIONS.INVOICES_CREATE,
    PERMISSIONS.INVOICES_EDIT,
    PERMISSIONS.INVOICES_DELETE,
    PERMISSIONS.INVOICES_EXPORT,
    PERMISSIONS.INVOICES_SEND,
  ],

  manager: [
    // ... existing permissions ...
    PERMISSIONS.INVOICES_VIEW,
    PERMISSIONS.INVOICES_CREATE,
    PERMISSIONS.INVOICES_EDIT,
    PERMISSIONS.INVOICES_EXPORT,
    PERMISSIONS.INVOICES_SEND,
    // Note: No delete permission for managers
  ],

  agent: [
    // ... existing permissions ...
    PERMISSIONS.INVOICES_VIEW,
    PERMISSIONS.INVOICES_CREATE,
    // Note: Agents can only view and create
  ],

  member: [
    // ... existing permissions ...
    PERMISSIONS.INVOICES_VIEW,
    // Note: Members have view-only access
  ],
};
```

---

### **Step 3: Add to Permission Groups** (Backend - Optional)

**File:** `backend/constants/permissions.js`

Update `PERMISSION_GROUPS` for the permission management UI:

```javascript
export const PERMISSION_GROUPS = {
  // ... existing groups ...

  invoices: {
    label: 'Invoices',
    permissions: [
      { key: PERMISSIONS.INVOICES_VIEW, label: 'View Invoices' },
      { key: PERMISSIONS.INVOICES_CREATE, label: 'Create Invoices' },
      { key: PERMISSIONS.INVOICES_EDIT, label: 'Edit Invoices' },
      { key: PERMISSIONS.INVOICES_DELETE, label: 'Delete Invoices' },
      { key: PERMISSIONS.INVOICES_EXPORT, label: 'Export Invoices' },
      { key: PERMISSIONS.INVOICES_SEND, label: 'Send Invoices' },
    ],
  },
};
```

---

### **Step 4: Create Database Migration** (Database)

**File:** `supabase/migrations/016_add_invoices_permissions.sql`

Create a migration to update existing roles:

```sql
-- Update Admin role
UPDATE roles
SET permissions = permissions || jsonb_build_array(
  'invoices.view',
  'invoices.create',
  'invoices.edit',
  'invoices.delete',
  'invoices.export',
  'invoices.send'
)
WHERE slug = 'admin' AND is_system = true;

-- Update Manager role
UPDATE roles
SET permissions = permissions || jsonb_build_array(
  'invoices.view',
  'invoices.create',
  'invoices.edit',
  'invoices.export',
  'invoices.send'
)
WHERE slug = 'manager' AND is_system = true;

-- Update Agent role
UPDATE roles
SET permissions = permissions || jsonb_build_array(
  'invoices.view',
  'invoices.create'
)
WHERE slug = 'agent' AND is_system = true;

-- Update Member role
UPDATE roles
SET permissions = permissions || jsonb_build_array(
  'invoices.view'
)
WHERE slug = 'member' AND is_system = true;
```

**Run the migration:**
```bash
# Via Supabase dashboard: SQL Editor → Paste migration → Run
# OR via Supabase CLI:
supabase db push
```

---

### **Step 5: Create Backend Routes** (Backend API)

**File:** `backend/routes/invoiceRoutes.js` (NEW FILE)

```javascript
import express from 'express';
import supabase from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { setTenantContext } from '../middleware/tenant.js';
import { PERMISSIONS } from '../constants/permissions.js';

const router = express.Router();

// Apply middleware
router.use(authenticateToken);
router.use(setTenantContext);

/**
 * GET /api/invoices
 * Get all invoices for organization
 */
router.get('/', requirePermission(PERMISSIONS.INVOICES_VIEW), async (req, res) => {
  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('organization_id', req.organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

/**
 * POST /api/invoices
 * Create new invoice
 */
router.post('/', requirePermission(PERMISSIONS.INVOICES_CREATE), async (req, res) => {
  try {
    const { amount, client_name, due_date } = req.body;

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        organization_id: req.organizationId,
        created_by: req.userId,
        amount,
        client_name,
        due_date,
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Add more routes (PUT, DELETE, etc.)

export default router;
```

---

### **Step 6: Register Routes** (Backend)

**File:** `backend/server.js`

Import and register your new routes:

```javascript
import invoiceRoutes from './routes/invoiceRoutes.js';

// ... existing code ...

// Register routes
app.use('/api/invoices', invoiceRoutes);
```

---

### **Step 7: Add to Menu** (Frontend)

**File:** `Frontend/src/menuConfig.jsx`

Add your module to the menu configuration:

```javascript
const menuConfig = [
  // ... existing menu items ...

  {
    id: 'invoices',
    labelKey: 'invoices',
    label: 'Invoices',
    icon: 'FileText',
    requiredPermission: 'invoices.view', // ✅ Permission-based
    isActive: true,
    requiresFeature: 'billing', // Optional: package feature check
    children: [
      {
        id: 'all-invoices',
        labelKey: 'allInvoices',
        label: 'All Invoices',
        icon: 'List',
        path: '/invoices',
        requiredPermission: 'invoices.view'
      },
      {
        id: 'create-invoice',
        labelKey: 'createInvoice',
        label: 'Create Invoice',
        icon: 'Plus',
        path: '/invoices/create',
        requiredPermission: 'invoices.create'
      },
      {
        id: 'invoice-settings',
        labelKey: 'invoiceSettings',
        label: 'Settings',
        icon: 'Settings',
        path: '/invoices/settings',
        requiredPermission: 'invoices.edit'
      }
    ]
  }
];
```

**Note:** The Sidebar component automatically filters menu items based on user permissions from the database!

---

### **Step 8: Create React Pages** (Frontend)

**File:** `Frontend/src/pages/Invoices.jsx` (NEW FILE)

```javascript
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissionUtils';
import { Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Invoices = () => {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Permission checks
  const canCreate = hasPermission(user, 'invoices.create');
  const canEdit = hasPermission(user, 'invoices.edit');
  const canDelete = hasPermission(user, 'invoices.delete');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await fetch('/api/invoices', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setInvoices(data.invoices);
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Invoices</h1>
        {canCreate && (
          <button className="btn-primary">
            <Plus className="w-5 h-5" />
            Create Invoice
          </button>
        )}
      </div>

      {/* Invoice list */}
      {/* ... */}
    </div>
  );
};

export default Invoices;
```

---

### **Step 9: Add Routes** (Frontend)

**File:** `Frontend/src/App.jsx`

```javascript
import Invoices from './pages/Invoices';

// Inside MainLayout component:
<Routes>
  {/* ... existing routes ... */}

  <Route path="/invoices" element={<Invoices />} />
</Routes>
```

---

### **Step 10: Add Translations** (Frontend)

**Files:**
- `Frontend/public/locales/en/common.json`
- `Frontend/public/locales/ar/common.json`

**English:**
```json
{
  "invoices": "Invoices",
  "allInvoices": "All Invoices",
  "createInvoice": "Create Invoice",
  "invoiceSettings": "Invoice Settings",
  "invoiceNumber": "Invoice Number",
  "dueDate": "Due Date",
  "totalAmount": "Total Amount",
  "invoiceCreated": "Invoice created successfully",
  "invoiceDeleted": "Invoice deleted successfully"
}
```

**Arabic:**
```json
{
  "invoices": "الفواتير",
  "allInvoices": "كل الفواتير",
  "createInvoice": "إنشاء فاتورة",
  "invoiceSettings": "إعدادات الفواتير",
  "invoiceNumber": "رقم الفاتورة",
  "dueDate": "تاريخ الاستحقاق",
  "totalAmount": "المبلغ الإجمالي",
  "invoiceCreated": "تم إنشاء الفاتورة بنجاح",
  "invoiceDeleted": "تم حذف الفاتورة بنجاح"
}
```

---

## Quick Reference Checklist

When adding a new module, complete these tasks in order:

- [ ] **Backend:** Add permissions to `constants/permissions.js`
- [ ] **Backend:** Update `ROLE_PERMISSIONS` in `constants/permissions.js`
- [ ] **Backend:** Add to `PERMISSION_GROUPS` (optional)
- [ ] **Database:** Create migration SQL file
- [ ] **Database:** Run migration in Supabase
- [ ] **Backend:** Create `routes/[module]Routes.js`
- [ ] **Backend:** Register routes in `server.js`
- [ ] **Frontend:** Add to `menuConfig.jsx` with `requiredPermission`
- [ ] **Frontend:** Create page component
- [ ] **Frontend:** Add route in `App.jsx`
- [ ] **Frontend:** Add translations (EN + AR)
- [ ] **Test:** Verify menu visibility with different roles
- [ ] **Test:** Verify API endpoint permissions

---

## Key Principles

1. **Never hardcode roles** - Always use `requiredPermission`
2. **Database is source of truth** - Permissions come from `roles` table
3. **Use hasPermission() everywhere** - In components, pages, and API routes
4. **Test with all roles** - Admin, Manager, Agent, Member
5. **Bilingual always** - Add both English and Arabic translations

---

## Managing Existing Modules

### Enable/Disable a Module
```javascript
// In menuConfig.jsx
{
  id: 'invoices',
  isActive: false, // ← Set to false to hide from menu
}
```

### Change Access Requirements
```sql
-- Remove permission from a role
UPDATE roles
SET permissions = permissions - 'invoices.delete'
WHERE slug = 'agent';

-- Add permission to a role
UPDATE roles
SET permissions = permissions || '["invoices.delete"]'::jsonb
WHERE slug = 'manager';
```

---

## Examples

See existing modules for reference:
- **Simple CRUD:** `/crm/contacts` - View, Create, Edit, Delete
- **Complex Module:** `/crm/segments` - With custom logic
- **Settings Page:** `/crm/settings` - Multiple sub-pages

---

## Troubleshooting

**Menu item not showing?**
- Check user has required permission in database
- Verify `isActive: true` in menuConfig
- Check `requiredPermission` matches permission in roles table

**API returning 403?**
- Ensure `requirePermission()` middleware uses correct permission
- Verify user role has permission in database
- Check JWT token includes role information

**Permission check not working?**
- Ensure user object includes `rolePermissions` from API
- Use `hasPermission(user, 'resource.action')` not role checks
- Verify permission string matches exactly (case-sensitive)

---

## Need Help?

- Check existing modules in `Frontend/src/pages/`
- Review backend routes in `backend/routes/`
- See permission utils in `Frontend/src/utils/permissionUtils.js`
