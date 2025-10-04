-- =====================================================
-- Internationalization (i18n) Support
-- Add language preference columns
-- =====================================================
-- Created: 2025-10-02
-- =====================================================

-- Add language preference to users table
ALTER TABLE users
ADD COLUMN preferred_language VARCHAR(5) DEFAULT 'ar'
CHECK (preferred_language IN ('ar', 'en'));

-- Add default language to organizations table
ALTER TABLE organizations
ADD COLUMN default_language VARCHAR(5) DEFAULT 'ar'
CHECK (default_language IN ('ar', 'en'));

-- Add comment for documentation
COMMENT ON COLUMN users.preferred_language IS 'User preferred language: ar (Arabic) or en (English)';
COMMENT ON COLUMN organizations.default_language IS 'Organization default language for new users and emails';

-- =====================================================
-- i18n Support Migration Complete
-- =====================================================
