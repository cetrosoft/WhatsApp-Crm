# Quick Start: Add New Feature with Permissions

## Overview
This guide shows you how to add a new CRM feature (page with CRUD operations) with full permission enforcement in **15 minutes**.

## Prerequisites
- Basic understanding of Express.js and React
- Database access (Supabase)
- Features to implement: List, Create, Edit, Delete

---

## Step 1: Define Permissions (2 minutes)

### 1.1 Add to Backend Constants
**File:** `backend/constants/permissions.js`

```javascript
// Add your new resource permissions
export const PERMISSIONS = {
  // ... existing permissions ...

  // Products (example)
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_EDIT: 'products.edit',
  PRODUCTS_DELETE: 'products.delete',
  PRODUCTS_EXPORT: 'products.export',
};

// Add to ROLE_PERMISSIONS
export const ROLE_PERMISSIONS = {
  admin: [
    // ... existing ...
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.PRODUCTS_DELETE,
    PERMISSIONS.PRODUCTS_EXPORT,
  ],
  manager: [
    // ... existing ...
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    // No delete or export
  ],
  agent: [
    // ... existing ...
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    // No edit, delete, or export
  ],
  member: [
    // ... existing ...
    PERMISSIONS.PRODUCTS_VIEW,
    // View only
  ],
};

// Add to PERMISSION_GROUPS for UI organization
export const PERMISSION_GROUPS = {
  // ... existing ...
  products: {
    label: 'Products Management',
    permissions: [
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.PRODUCTS_CREATE,
      PERMISSIONS.PRODUCTS_EDIT,
      PERMISSIONS.PRODUCTS_DELETE,
      PERMISSIONS.PRODUCTS_EXPORT,
    ],
  },
};
```

---

## Step 2: Update Database (2 minutes)

### 2.1 Create Migration File
**File:** `supabase/migrations/XXX_add_products_permissions.sql`

```sql
-- Add products permissions to all system roles

-- Update admin role (all permissions)
UPDATE roles
SET permissions = permissions ||
  '["products.view", "products.create", "products.edit", "products.delete", "products.export"]'::jsonb
WHERE slug = 'admin' AND is_system = true;

-- Update manager role (no delete/export)
UPDATE roles
SET permissions = permissions ||
  '["products.view", "products.create", "products.edit"]'::jsonb
WHERE slug = 'manager' AND is_system = true;

-- Update agent role (view and create only)
UPDATE roles
SET permissions = permissions ||
  '["products.view", "products.create"]'::jsonb
WHERE slug = 'agent' AND is_system = true;

-- Update member role (view only)
UPDATE roles
SET permissions = permissions ||
  '["products.view"]'::jsonb
WHERE slug = 'member' AND is_system = true;
```

### 2.2 Run Migration
```bash
# In Supabase SQL Editor, paste and run the SQL above
```

---

## Step 3: Create Backend Routes (5 minutes)

### 3.1 Create Routes File
**File:** `backend/routes/productRoutes.js`

```javascript
import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../constants/permissions.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * GET /api/crm/products
 * List all products (no permission check - used for dropdowns)
 */
router.get('/', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { page = 1, limit = 20, search } = req.query;

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      products: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

/**
 * GET /api/crm/products/:id
 * Get single product (no permission check)
 */
router.get('/:id', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, product: data });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

/**
 * POST /api/crm/products
 * Create product (requires permission)
 */
router.post('/', requirePermission(PERMISSIONS.PRODUCTS_CREATE), async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const { name, description, price, sku } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        organization_id: organizationId,
        name,
        description,
        price,
        sku,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, product: data });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

/**
 * PUT /api/crm/products/:id
 * Update product (requires permission)
 */
router.put('/:id', requirePermission(PERMISSIONS.PRODUCTS_EDIT), async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const { name, description, price, sku } = req.body;

    const { data, error } = await supabase
      .from('products')
      .update({ name, description, price, sku, updated_at: new Date() })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, product: data });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

/**
 * DELETE /api/crm/products/:id
 * Delete product (requires permission)
 */
router.delete('/:id', requirePermission(PERMISSIONS.PRODUCTS_DELETE), async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw error;

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
```

### 3.2 Register Routes
**File:** `backend/server.js` or `backend/app.js`

```javascript
import productRoutes from './routes/productRoutes.js';

// Add after other CRM routes
app.use('/api/crm/products', productRoutes);
```

---

## Step 4: Create Frontend Page (4 minutes)

### 4.1 Create Page Component
**File:** `Frontend/src/pages/Products.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { productAPI } from '../services/api';
import { Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissionUtils';

const Products = () => {
  const { t } = useTranslation(['common']);
  const { user } = useAuth();

  // Check permissions
  const canCreate = hasPermission(user, 'products.create');
  const canEdit = hasPermission(user, 'products.edit');
  const canDelete = hasPermission(user, 'products.delete');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getProducts();
      setProducts(response.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error(t('failedToLoad', { ns: 'common', resource: t('products', { ns: 'common' }) }));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (product) => {
    if (!canDelete) {
      toast.error(t('insufficientPermissions', { ns: 'common' }), { duration: 5000 });
      return;
    }

    if (!confirm(`Delete ${product.name}?`)) return;

    try {
      await productAPI.deleteProduct(product.id);
      toast.success(t('successDeleted', { ns: 'common', resource: t('product', { ns: 'common' }) }));
      loadProducts();
    } catch (error) {
      if (error.response?.data?.error === 'INSUFFICIENT_PERMISSIONS') {
        toast.error(t('insufficientPermissions', { ns: 'common' }), { duration: 5000 });
      } else {
        toast.error(t('failedToDelete', { ns: 'common', resource: t('product', { ns: 'common' }) }));
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between">
        <h1 className="text-3xl font-bold">{t('products', { ns: 'common' })}</h1>
        {canCreate && (
          <button className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            {t('create', { ns: 'common' })}
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-start">{t('name', { ns: 'common' })}</th>
              <th className="px-4 py-3 text-start">{t('price', { ns: 'common' })}</th>
              <th className="px-4 py-3 text-start">{t('actions', { ns: 'common' })}</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td className="px-4 py-3">{product.name}</td>
                <td className="px-4 py-3">${product.price}</td>
                <td className="px-4 py-3 flex gap-2">
                  {canEdit && <button onClick={() => {}} className="text-blue-600"><Edit size={18} /></button>}
                  {canDelete && <button onClick={() => handleDelete(product)} className="text-red-600"><Trash2 size={18} /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Products;
```

### 4.2 Add API Functions
**File:** `Frontend/src/services/api.js`

```javascript
// Add to existing API object
export const productAPI = {
  getProducts: (params) => api.get('/crm/products', { params }),
  getProduct: (id) => api.get(`/crm/products/${id}`),
  createProduct: (data) => api.post('/crm/products', data),
  updateProduct: (id, data) => api.put(`/crm/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/crm/products/${id}`),
};
```

### 4.3 Add Route
**File:** `Frontend/src/App.jsx`

```javascript
import Products from './pages/Products';

// Add route
<Route
  path="/crm/products"
  element={
    <PermissionRoute permission="products.view">
      <Products />
    </PermissionRoute>
  }
/>
```

---

## Step 5: Add Translations (1 minute)

**File:** `Frontend/public/locales/en/common.json`
```json
{
  "products": "Products",
  "product": "Product"
}
```

**File:** `Frontend/public/locales/ar/common.json`
```json
{
  "products": "المنتجات",
  "product": "منتج"
}
```

---

## Step 6: Add to Menu (1 minute)

**File:** `Frontend/src/menuConfig.jsx`

```javascript
{
  id: 'products',
  path: '/crm/products',
  labelKey: 'products',
  icon: 'Package',
  requiredPermission: 'products.view',
  isActive: true
}
```

---

## Step 7: Test (Automated)

```bash
# Test backend permissions
npm test -- products

# Test frontend E2E
npm run e2e:test -- products agent

# Full test suite
npm run test:full products
```

---

## Verification Checklist

### Backend
- [ ] Permissions added to `constants/permissions.js`
- [ ] Database migration run successfully
- [ ] GET routes have NO permission check
- [ ] POST route has CREATE permission
- [ ] PUT route has EDIT permission
- [ ] DELETE route has DELETE permission
- [ ] All routes return error code (not text) for 403

### Frontend
- [ ] Page checks `hasPermission()` before showing buttons
- [ ] Create button hidden if no `products.create`
- [ ] Edit button hidden if no `products.edit`
- [ ] Delete button hidden if no `products.delete`
- [ ] Error handling checks `error === 'INSUFFICIENT_PERMISSIONS'`
- [ ] All toast messages use `t()` with `{ ns: 'common' }`
- [ ] Translation keys exist in EN and AR

### Menu & Routes
- [ ] Menu item has `requiredPermission`
- [ ] Route wrapped in `<PermissionRoute>`
- [ ] Icon imported in Sidebar.jsx

### Automated Tests Pass
- [ ] Backend tests pass for all roles
- [ ] Frontend E2E tests pass in English
- [ ] Frontend E2E tests pass in Arabic

---

## Common Mistakes to Avoid

❌ **DON'T:** Add permission check to GET routes (used for dropdowns)
✅ **DO:** Add permission checks to POST/PUT/DELETE only

❌ **DON'T:** Return hardcoded error messages from backend
✅ **DO:** Return error codes like `'INSUFFICIENT_PERMISSIONS'`

❌ **DON'T:** Forget to check `{ ns: 'common' }` in frontend
✅ **DO:** Always specify namespace for shared keys

❌ **DON'T:** Hardcode role checks like `if (user.role === 'admin')`
✅ **DO:** Use `hasPermission(user, 'permission.name')`

---

## Time Estimate
- Step 1: 2 minutes
- Step 2: 2 minutes
- Step 3: 5 minutes
- Step 4: 4 minutes
- Step 5: 1 minute
- Step 6: 1 minute
- **Total: 15 minutes**

## Next Steps
Run automated tests to verify everything works:
```bash
npm run test:full products agent
```
