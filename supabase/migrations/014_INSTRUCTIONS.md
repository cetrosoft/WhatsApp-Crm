# Migration 014: Custom Roles System - Installation Instructions

## Overview
This migration implements database-driven role management using a **dual-column approach** to ensure zero-downtime and backward compatibility.

## What This Migration Does

1. ✅ Creates `roles` table for custom role management
2. ✅ Seeds 4 system roles per organization (Admin, Manager, Agent, Member)
3. ✅ Adds `role_id` column to `users` table (keeps existing `role` column)
4. ✅ Creates sync trigger to keep both columns synchronized
5. ✅ Maintains all existing RLS policies (no breaking changes)

## Prerequisites

- Supabase project must be set up
- At least one organization must exist in the database
- Users table must have the `role` column (VARCHAR)

## How to Run the Migration

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Migration

1. Open the file: `supabase/migrations/014_custom_roles.sql`
2. Copy the **entire contents** of the file (all 268 lines)
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify Migration Success

1. If the migration runs successfully, you should see:
   ```
   Success. No rows returned
   ```

2. Create a new query in SQL Editor
3. Copy contents of: `supabase/migrations/014_verification.sql`
4. Paste and run the verification queries
5. Review the results to ensure:
   - ✅ All organizations have 4 system roles
   - ✅ All users have `role_id` assigned
   - ✅ `role` and `role_id` columns are in sync
   - ✅ Trigger function exists

### Step 4: Check Summary Results

The last query in verification script provides a summary:

```
✓ roles table exists
✓ All 4 system roles created
✓ All users have role_id
✓ Sync trigger created
```

All checks should show ✓ (checkmark).

## Testing the Trigger

To verify the sync trigger works correctly, run this test:

```sql
-- 1. Get a user's current role
SELECT id, email, role, role_id FROM users LIMIT 1;

-- 2. Get a different role_id for testing
SELECT id, slug FROM roles WHERE organization_id = (
  SELECT organization_id FROM users LIMIT 1
) AND slug != (
  SELECT role FROM users LIMIT 1
) LIMIT 1;

-- 3. Update the user's role_id
UPDATE users
SET role_id = '<role_id_from_step_2>'
WHERE id = '<user_id_from_step_1>';

-- 4. Check if role slug updated automatically
SELECT id, email, role, role_id FROM users WHERE id = '<user_id_from_step_1>';

-- Expected: The 'role' column should now match the slug of the new role
```

## Troubleshooting

### Error: "relation 'roles' already exists"
**Solution:** The migration was already run. Check if roles table exists:
```sql
SELECT COUNT(*) FROM roles;
```

### Error: "column role_id already exists"
**Solution:** The migration was partially applied. Check current state:
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'users';
```

### Some users have NULL role_id
**Solution:** Run the population query manually:
```sql
UPDATE users u
SET role_id = r.id
FROM roles r
WHERE r.organization_id = u.organization_id
  AND r.slug = u.role
  AND r.is_system = true;
```

### Role and role_id are out of sync
**Solution:** The trigger might not be working. Re-create it:
```sql
DROP TRIGGER IF EXISTS trigger_sync_user_role ON users;

CREATE TRIGGER trigger_sync_user_role
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION sync_user_role();
```

## Next Steps After Migration

1. ✅ Migration complete
2. ⏳ Test backend API endpoints:
   - `GET /api/roles` - List all roles
   - `POST /api/roles` - Create custom role
   - `PATCH /api/roles/:id` - Update role
   - `DELETE /api/roles/:id` - Delete role

3. ⏳ Implement frontend UI:
   - RoleManagement.jsx - List/manage roles
   - CreateRole.jsx - Create new roles
   - Update InviteUserModal - Use role dropdown

## Migration Architecture Notes

### Dual Column Approach

This migration uses TWO columns:

1. **`users.role`** (VARCHAR) - **LEGACY**
   - Kept for backward compatibility
   - Existing RLS policies depend on this
   - Automatically synced by trigger

2. **`users.role_id`** (UUID) - **NEW**
   - References `roles.id`
   - Used by new code
   - Source of truth

### Why Not Drop the Old Column?

Many RLS policies across multiple tables depend on `users.role`:
- users (4 policies)
- companies (3 policies)
- contacts (3 policies)
- pipelines (3 policies)
- pipeline_stages (2 policies)
- deals (4 policies)
- interactions (2 policies)
- activities (2 policies)

Dropping it would require updating all these policies, which is risky.

### Future Migration Path

Once you're ready to fully migrate:

1. Update all RLS policies to use JOINs with roles table
2. Update any backend code still using `users.role`
3. Drop the sync trigger
4. Drop the `users.role` column

But for now, both columns coexist safely!

## Support

If you encounter any issues:
1. Check the verification queries output
2. Review the troubleshooting section
3. Check Supabase logs for detailed error messages
4. Ensure all prerequisites are met

---

**Migration Status:** Ready to execute ✅
**Risk Level:** Low (backward compatible, no data loss)
**Reversibility:** Medium (would need to drop role_id column and trigger)
