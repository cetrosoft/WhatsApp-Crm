-- =============================================
-- Companies Enhanced Fields Migration
-- Adds logo, tax ID, commercial ID, legal docs, employee size
-- =============================================

-- 1. Add new columns to companies table (without CHECK constraint yet)
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS commercial_id TEXT,
ADD COLUMN IF NOT EXISTS legal_docs JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS employee_size TEXT;

-- 2. Migrate and normalize data from company_size to employee_size
UPDATE companies
SET employee_size = CASE
  WHEN company_size IN ('small', 'Small', 'SMALL') THEN '1-10'
  WHEN company_size IN ('medium', 'Medium', 'MEDIUM') THEN '11-50'
  WHEN company_size IN ('large', 'Large', 'LARGE') THEN '51-200'
  WHEN company_size IN ('enterprise', 'Enterprise', 'ENTERPRISE') THEN '201-500'
  WHEN company_size = '1-10' THEN '1-10'
  WHEN company_size = '11-50' THEN '11-50'
  WHEN company_size = '51-200' THEN '51-200'
  WHEN company_size = '201-500' THEN '201-500'
  WHEN company_size = '500+' THEN '500+'
  ELSE '11-50' -- Default for unrecognized values
END
WHERE company_size IS NOT NULL AND employee_size IS NULL;

-- 3. Drop old company_size column if it exists
ALTER TABLE companies DROP COLUMN IF EXISTS company_size CASCADE;

-- 4. Now add the CHECK constraint after data is normalized
ALTER TABLE companies
ADD CONSTRAINT companies_employee_size_check
CHECK (employee_size IS NULL OR employee_size IN ('1-10', '11-50', '51-200', '201-500', '500+'));

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_tax_id ON companies(tax_id) WHERE tax_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_commercial_id ON companies(commercial_id) WHERE commercial_id IS NOT NULL;

-- 5. Add comment for documentation
COMMENT ON COLUMN companies.logo_url IS 'URL to company logo stored in Supabase Storage';
COMMENT ON COLUMN companies.tax_id IS 'Tax identification number';
COMMENT ON COLUMN companies.commercial_id IS 'Commercial registration number';
COMMENT ON COLUMN companies.legal_docs IS 'Array of legal document objects with {id, name, url, uploaded_at}';
COMMENT ON COLUMN companies.employee_size IS 'Company size by employee count';
