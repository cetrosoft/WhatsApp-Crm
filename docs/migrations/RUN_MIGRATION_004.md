# Migration 004: Clean Up Duplicate Fields

## ⚠️ Important - Run This Migration

This migration removes duplicate limit fields from the `organizations` table and makes the `packages` table the single source of truth.

## 🎯 What This Migration Does

**Removes from `organizations` table:**
- `max_users`, `max_whatsapp_profiles`, `max_customers`, `max_messages_per_day` (now in `packages` only)
- `custom_limits` JSONB (replaced with custom packages)
- `features` JSONB (now in `packages` only)
- `subscription_plan` VARCHAR (deprecated, replaced by `package_id`)

**Keeps in `organizations` table:**
- `package_id` (foreign key to packages)
- `subscription_status` (trialing, active, etc.)
- `trial_ends_at` (trial expiry date)
- `settings` (organization preferences only)

**Updates helper functions:**
- Simplifies `get_organization_limits()` to read directly from packages
- Simplifies `organization_has_feature()` to read directly from packages

## 📋 How to Run

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/004_cleanup_duplicate_fields.sql`
4. Copy the entire contents
5. Paste into SQL Editor
6. Click **Run**
7. Wait for success message

### Option 2: Supabase CLI

```bash
supabase db reset  # If in local dev
# OR
supabase db push   # If using migration files
```

## ✅ Verification

After running the migration, verify it worked:

```bash
cd backend
node verify-schema.js
```

Expected output:
```
✅ Schema is clean! Migration already applied.
```

## 🧪 Test Backend API

```bash
cd backend
node test-package-api.js
```

All tests should pass.

## 🔄 Changes Made to Backend Code

**Files updated:**
1. ✅ `backend/routes/packageRoutes.js` - Removed custom-limits endpoint, simplified queries
2. ✅ `backend/routes/userRoutes.js` - Updated to get max_users from packages table
3. ✅ `backend/routes/authRoutes.js` - Already clean (only sets package_id)

**No frontend changes needed yet** - Frontend will be updated when building CRM pages.

## 📊 New Architecture

```
organizations table          packages table
├── id                      ├── id
├── name                    ├── name
├── package_id  ────────────┤ slug
├── trial_ends_at           ├── max_users ◄─── LIMITS HERE
├── settings                ├── max_whatsapp_profiles
└── ...                     ├── max_customers
                            ├── max_messages_per_day
                            ├── features ◄─── FEATURES HERE
                            └── ...
```

## 🎯 For Custom Customer Deals

Instead of using `custom_limits` JSONB, create a custom package:

```sql
-- Example: Custom package for "Acme Corp"
INSERT INTO packages (
  name,
  slug,
  is_custom,
  max_users,
  max_whatsapp_profiles,
  price_monthly
) VALUES (
  'Acme Corp Custom',
  'acme-corp-custom',
  true,
  500,
  50,
  999.00
);

-- Link organization to custom package
UPDATE organizations
SET package_id = (SELECT id FROM packages WHERE slug = 'acme-corp-custom')
WHERE slug = 'acme-corp';
```

## 🚀 Benefits

✅ **Single source of truth** - All limits in one place
✅ **Simpler queries** - Just JOIN to packages table
✅ **Easier maintenance** - Update limits in one place
✅ **Better performance** - No COALESCE fallback logic
✅ **Flexible** - Easy to create custom packages for special deals
✅ **Audit trail** - Package history is clear

---

**Status:** Migration file created ✅ | Backend updated ✅ | Ready to run ⏳
