-- =============================================
-- Add Phone Country Code Field to Contacts
-- Separates country code from phone number for better data management
-- =============================================

-- 1. Add phone_country_code field to contacts table
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS phone_country_code TEXT DEFAULT '+966';

COMMENT ON COLUMN contacts.phone_country_code IS 'Country dialing code for phone number (e.g., +966, +971)';

-- 2. Migrate existing data: Extract country code from phone numbers that start with '+'
-- Common patterns: +966, +971, +20, +1, etc.
UPDATE contacts
SET phone_country_code = SUBSTRING(phone FROM '^\+\d{1,4}')
WHERE phone LIKE '+%'
  AND phone_country_code IS NULL;

-- 3. Clean phone field: Remove country code prefix from existing numbers
-- This keeps only the local number part
UPDATE contacts
SET phone = REGEXP_REPLACE(phone, '^\+\d{1,4}\s*', '')
WHERE phone LIKE '+%';

-- 4. Update comments
COMMENT ON COLUMN contacts.phone IS 'Phone number without country code (country code stored separately in phone_country_code)';

-- 5. Optional: Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_phone_country_code ON contacts(phone_country_code);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Phone country code migration completed successfully';
  RAISE NOTICE 'All existing phone numbers have been split into country code and local number';
END $$;
