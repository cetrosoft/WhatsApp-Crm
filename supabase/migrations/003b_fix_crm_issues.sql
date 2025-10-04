/**
 * FIX CRM Module Issues
 *
 * Fixes:
 * 1. Add missing created_by column to pipelines table
 * 2. Fix company_size check constraint values
 * 3. Fix contact status check constraint values
 *
 * Run this in Supabase SQL Editor
 */

-- 1. Fix pipelines table - Add created_by column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pipelines' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE pipelines ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL;
    RAISE NOTICE '✓ Added created_by column to pipelines table';
  END IF;
END $$;

-- 1b. Fix deals table - Add priority column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'priority'
  ) THEN
    ALTER TABLE deals ADD COLUMN priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
    RAISE NOTICE '✓ Added priority column to deals table';
  END IF;
END $$;

-- 2. Fix companies table - Update company_size check constraint
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_company_size_check;
ALTER TABLE companies ADD CONSTRAINT companies_company_size_check
  CHECK (company_size IN ('small', 'medium', 'large', 'enterprise'));

-- 3. Fix contacts table - Update status check constraint
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_status_check;
ALTER TABLE contacts ADD CONSTRAINT contacts_status_check
  CHECK (status IN ('lead', 'prospect', 'customer', 'active', 'inactive'));

-- 4. Fix companies table - Update status check constraint
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_status_check;
ALTER TABLE companies ADD CONSTRAINT companies_status_check
  CHECK (status IN ('active', 'inactive', 'prospect'));

-- 5. Fix deals table - Update status check constraint
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_status_check;
ALTER TABLE deals ADD CONSTRAINT deals_status_check
  CHECK (status IN ('open', 'won', 'lost'));

-- 6. Fix deals table - Update priority check constraint
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_priority_check;
ALTER TABLE deals ADD CONSTRAINT deals_priority_check
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ CRM schema fixes applied successfully!';
END $$;
