# Pipelines Permissions Migration - Setup Guide

**Date:** October 11, 2025
**Migration:** 016_add_pipelines_permissions.sql
**Purpose:** Add pipelines management permissions to all system roles

---

## Problem Statement

The Pipelines page (`/crm/pipelines`) exists with full functionality, but users cannot access it because:
- The dynamic menu requires `pipelines.view` permission to show the "Pipelines" menu item
- System roles (admin, manager, agent, member) don't have any `pipelines.*` permissions
- Result: Even admin users can't see or access the Pipelines page

---

## Solution Overview

**Migration 016** adds 4 pipeline-related permissions to system roles:
- `pipelines.view` - View pipelines page
- `pipelines.create` - Create new pipelines
- `pipelines.edit` - Edit pipeline details & stages
- `pipelines.delete` - Delete pipelines

**Permission Distribution:**

| Role | View | Create | Edit | Delete |
|------|------|--------|------|--------|
| **Admin** | ✅ | ✅ | ✅ | ✅ |
| **Manager** | ✅ | ✅ | ✅ | ✅ |
| **Agent** | ✅ | ✅ | ✅ | ❌ |
| **Member** | ✅ | ❌ | ❌ | ❌ |

---

## Step-by-Step Setup

### Step 1: Run the Migration

1. **Open Supabase SQL Editor:**
   - Go to your Supabase project dashboard
   - Click **SQL Editor** in the left sidebar

2. **Copy Migration SQL:**
   - Open file: `supabase/migrations/016_add_pipelines_permissions.sql`
   - Copy the entire contents

3. **Execute Migration:**
   - Paste the SQL into Supabase SQL Editor
   - Click **Run** button
   - Wait for "Success" message

4. **Expected Output:**
   ```
   UPDATE 4  (4 system roles updated)
   UPDATE 4  (4 system roles updated again)
   UPDATE 4  (4 system roles updated again)
   UPDATE 4  (4 system roles updated again)
   CREATE FUNCTION (get_default_role_permissions updated)
   ```

---

### Step 2: Verify the Migration

**Option A: Quick Verification (SQL)**

Run this query in Supabase SQL Editor:

```sql
SELECT
  slug as role_name,
  permissions ? 'pipelines.view' as has_view,
  permissions ? 'pipelines.create' as has_create,
  permissions ? 'pipelines.edit' as has_edit,
  permissions ? 'pipelines.delete' as has_delete
FROM roles
WHERE is_system = true
ORDER BY slug;
```

**Expected Output:**
```
role_name | has_view | has_create | has_edit | has_delete
----------|----------|------------|----------|------------
admin     | true     | true       | true     | true
manager   | true     | true       | true     | true
agent     | true     | true       | true     | false
member    | true     | false      | false    | false
```

**Option B: Comprehensive Verification**

Use the verification script: `supabase/migrations/016_VERIFY_pipelines_permissions.sql`

This script includes:
1. Permission checks by role
2. Organization-wide verification
3. Dynamic menu testing
4. Troubleshooting queries

---

### Step 3: Test in Your Application

1. **Login to your application:**
   ```
   http://localhost:5173/login
   Email: walid.abdallah.ahmed@gmail.com
   Password: Wa#123456
   ```

2. **Check the sidebar menu:**
   - Look under **CRM** section
   - You should now see **"Pipelines"** menu item (خطوط المبيعات in Arabic)
   - Icon: GitBranch

3. **Click Pipelines menu:**
   - Page should load: `http://localhost:5173/crm/pipelines`
   - No permission error should appear

4. **Verify permission-based buttons:**
   - **Admin/Manager:** Should see "Create Pipeline" button + Edit/Delete buttons on cards
   - **Agent:** Should see "Create Pipeline" + Edit buttons (no Delete)
   - **Member:** No action buttons (view-only)

---

## What Changed

### 1. Database (Roles Table)

**Before Migration:**
```json
// Admin role permissions (example)
[
  "contacts.view", "contacts.create", "contacts.edit", "contacts.delete",
  "companies.view", "companies.create", "companies.edit", "companies.delete",
  "deals.view", "deals.create", "deals.edit", "deals.delete",
  // NO pipelines permissions!
]
```

**After Migration:**
```json
// Admin role permissions (updated)
[
  "contacts.view", "contacts.create", "contacts.edit", "contacts.delete",
  "companies.view", "companies.create", "companies.edit", "companies.delete",
  "deals.view", "deals.create", "deals.edit", "deals.delete",
  "pipelines.view", "pipelines.create", "pipelines.edit", "pipelines.delete" // ← ADDED!
]
```

### 2. Dynamic Menu System

**Before:**
- Menu item `crm_pipelines` requires `pipelines.view` permission
- No roles have this permission
- Menu item hidden for all users

**After:**
- Admin, Manager, Agent, Member all have `pipelines.view`
- Menu item appears in sidebar for all users
- Access controlled by permission level

### 3. Frontend Permission Checks

The Pipelines.jsx page checks these permissions:

```javascript
const canView = hasPermission(user, 'pipelines.view');      // All roles
const canCreate = hasPermission(user, 'pipelines.create');  // Admin, Manager, Agent
const canEdit = hasPermission(user, 'pipelines.edit');      // Admin, Manager, Agent
const canDelete = hasPermission(user, 'pipelines.delete');  // Admin, Manager only
```

These checks now work correctly after migration.

---

## Troubleshooting

### Issue 1: "Pipelines" menu item not showing

**Possible Causes:**
1. Migration not run successfully
2. Browser cache not cleared
3. User role doesn't have `pipelines.view` permission

**Solutions:**
1. Re-run verification query #1 in `016_VERIFY_pipelines_permissions.sql`
2. Clear browser cache (Ctrl+F5)
3. Check user's role:
   ```sql
   SELECT email, role FROM users WHERE email = 'your@email.com';
   ```
4. Check dynamic menu query:
   ```sql
   SELECT * FROM get_user_menu('YOUR_USER_ID'::uuid, 'en')
   WHERE key = 'crm_pipelines';
   ```

---

### Issue 2: "Permission Denied" when accessing Pipelines page

**Possible Causes:**
1. User's role doesn't have `pipelines.view` permission
2. Custom permission revokes applied to user
3. JWT token not refreshed

**Solutions:**
1. Check user's effective permissions:
   ```sql
   SELECT
     u.email,
     r.slug as role,
     r.permissions ? 'pipelines.view' as has_permission,
     u.permissions->'revoke' ? 'pipelines.view' as is_revoked
   FROM users u
   JOIN roles r ON r.id = u.role_id
   WHERE u.email = 'your@email.com';
   ```
2. If `is_revoked = true`, remove custom revoke:
   - Go to Team → Members
   - Edit user permissions
   - Remove `pipelines.view` from revoked list
3. Logout and login again to refresh JWT token

---

### Issue 3: Create/Edit/Delete buttons not showing

**Expected Behavior:**
- **Admin/Manager:** All buttons visible
- **Agent:** Create and Edit visible, Delete hidden
- **Member:** No buttons (view-only)

**Verify:**
```sql
SELECT
  slug,
  permissions ? 'pipelines.create' as can_create,
  permissions ? 'pipelines.edit' as can_edit,
  permissions ? 'pipelines.delete' as can_delete
FROM roles
WHERE slug IN ('admin', 'manager', 'agent', 'member')
  AND is_system = true;
```

---

### Issue 4: Migration failed with error

**Common Errors:**

1. **"column permissions does not exist"**
   - Cause: Roles table not created
   - Solution: Run migration `014_custom_roles.sql` first

2. **"function get_default_role_permissions already exists"**
   - Cause: Function already defined
   - Solution: Use `CREATE OR REPLACE FUNCTION` (already in migration)

3. **"no rows updated"**
   - Cause: No system roles in database
   - Solution: Run migration `014_custom_roles.sql` to seed system roles

---

## Related Files

- **Migration:** `supabase/migrations/016_add_pipelines_permissions.sql`
- **Verification:** `supabase/migrations/016_VERIFY_pipelines_permissions.sql`
- **Frontend Page:** `Frontend/src/pages/Pipelines.jsx`
- **Menu Config:** `supabase/migrations/015_dynamic_menu_system.sql` (line 98)
- **Permission Utils:** `Frontend/src/utils/permissionUtils.js`
- **Backend Routes:** `backend/routes/pipelineRoutes.js`

---

## Permission Reference

### All Pipelines Permissions

| Permission | Description | Used By |
|------------|-------------|---------|
| `pipelines.view` | View pipelines page and list all pipelines | Pipelines.jsx, Dynamic menu |
| `pipelines.create` | Create new pipelines with stages | PipelineModal.jsx create mode |
| `pipelines.edit` | Edit existing pipelines and stages | PipelineModal.jsx edit mode |
| `pipelines.delete` | Delete pipelines | Pipelines.jsx delete button |

### Related Permissions (Already Added)

| Permission | Description | Migration |
|------------|-------------|-----------|
| `deals.view` | View deals Kanban board | 015 |
| `deals.create` | Create new deals | 015 |
| `deals.edit` | Edit existing deals | 015 |
| `deals.delete` | Delete deals | 015 |

---

## Next Steps

After successfully adding pipelines permissions:

1. ✅ **Test Pipelines Page:**
   - Navigate to `/crm/pipelines`
   - Create a new pipeline
   - Add stages with drag-to-reorder
   - Edit and delete pipelines

2. ✅ **Test Deals Integration:**
   - Go to `/crm/deals`
   - Select different pipelines from dropdown
   - Verify deals are grouped by pipeline stages

3. ✅ **Test Permission Levels:**
   - Login as different user roles
   - Verify correct buttons show/hide
   - Test permission denied messages

4. ✅ **Update Documentation:**
   - Document any custom roles you create
   - Add pipelines permissions to custom roles as needed

---

## Future Considerations

### For New Organizations

The `get_default_role_permissions()` function has been updated, so:
- **New organizations** created after this migration will automatically get pipelines permissions
- **Existing organizations** have been updated by the migration
- **No manual work needed** for future orgs

### Adding Pipelines Permissions to Custom Roles

If you've created custom roles, add pipelines permissions manually:

```sql
UPDATE roles
SET permissions = permissions || jsonb_build_array(
  'pipelines.view',
  'pipelines.create',
  'pipelines.edit'
)
WHERE slug = 'your_custom_role_slug'
  AND organization_id = 'YOUR_ORG_ID'::uuid;
```

---

## Success Criteria

✅ **Migration is successful when:**
1. Verification query shows all 4 roles have pipelines permissions
2. "Pipelines" menu item appears in CRM section
3. `/crm/pipelines` page loads without errors
4. Admin users see Create/Edit/Delete buttons
5. Agent users see Create/Edit buttons (no Delete)
6. Member users have view-only access

---

## Support

If you encounter issues:
1. Check Troubleshooting section above
2. Run verification queries in `016_VERIFY_pipelines_permissions.sql`
3. Review Supabase SQL Editor for error messages
4. Check browser console for frontend permission errors

---

*Migration created: October 11, 2025*
*Last updated: October 11, 2025*
*Status: Ready for Production*
