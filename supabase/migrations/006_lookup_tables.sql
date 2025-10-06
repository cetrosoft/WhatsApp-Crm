/**
 * Lookup Tables Migration
 *
 * Creates reference tables for:
 * - Countries (bilingual support)
 * - Contact Statuses (bilingual support)
 * - Company Statuses (bilingual support)
 *
 * Then updates contacts and companies tables to use foreign keys
 */

-- ============================================
-- 1. COUNTRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- ISO 3166-1 alpha-2 (e.g., 'SA', 'US')
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  phone_code TEXT, -- e.g., '+966'
  flag_emoji TEXT, -- e.g., '🇸🇦'
  display_order INTEGER DEFAULT 999,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_countries_code ON countries(code);
CREATE INDEX idx_countries_active ON countries(is_active);

-- Insert common countries (pre-populated)
INSERT INTO countries (code, name_en, name_ar, phone_code, flag_emoji, display_order) VALUES
  -- Priority countries (Arab world)
  ('SA', 'Saudi Arabia', 'السعودية', '+966', '🇸🇦', 1),
  ('AE', 'United Arab Emirates', 'الإمارات العربية المتحدة', '+971', '🇦🇪', 2),
  ('EG', 'Egypt', 'مصر', '+20', '🇪🇬', 3),
  ('JO', 'Jordan', 'الأردن', '+962', '🇯🇴', 4),
  ('KW', 'Kuwait', 'الكويت', '+965', '🇰🇼', 5),
  ('BH', 'Bahrain', 'البحرين', '+973', '🇧🇭', 6),
  ('QA', 'Qatar', 'قطر', '+974', '🇶🇦', 7),
  ('OM', 'Oman', 'عمان', '+968', '🇴🇲', 8),
  ('IQ', 'Iraq', 'العراق', '+964', '🇮🇶', 9),
  ('LB', 'Lebanon', 'لبنان', '+961', '🇱🇧', 10),
  ('SY', 'Syria', 'سوريا', '+963', '🇸🇾', 11),
  ('PS', 'Palestine', 'فلسطين', '+970', '🇵🇸', 12),
  ('YE', 'Yemen', 'اليمن', '+967', '🇾🇪', 13),
  ('LY', 'Libya', 'ليبيا', '+218', '🇱🇾', 14),
  ('SD', 'Sudan', 'السودان', '+249', '🇸🇩', 15),
  ('TN', 'Tunisia', 'تونس', '+216', '🇹🇳', 16),
  ('DZ', 'Algeria', 'الجزائر', '+213', '🇩🇿', 17),
  ('MA', 'Morocco', 'المغرب', '+212', '🇲🇦', 18),
  ('MR', 'Mauritania', 'موريتانيا', '+222', '🇲🇷', 19),
  ('SO', 'Somalia', 'الصومال', '+252', '🇸🇴', 20),
  ('DJ', 'Djibouti', 'جيبوتي', '+253', '🇩🇯', 21),
  ('KM', 'Comoros', 'جزر القمر', '+269', '🇰🇲', 22),

  -- Other major countries
  ('US', 'United States', 'الولايات المتحدة', '+1', '🇺🇸', 50),
  ('GB', 'United Kingdom', 'المملكة المتحدة', '+44', '🇬🇧', 51),
  ('CA', 'Canada', 'كندا', '+1', '🇨🇦', 52),
  ('AU', 'Australia', 'أستراليا', '+61', '🇦🇺', 53),
  ('DE', 'Germany', 'ألمانيا', '+49', '🇩🇪', 54),
  ('FR', 'France', 'فرنسا', '+33', '🇫🇷', 55),
  ('IT', 'Italy', 'إيطاليا', '+39', '🇮🇹', 56),
  ('ES', 'Spain', 'إسبانيا', '+34', '🇪🇸', 57),
  ('NL', 'Netherlands', 'هولندا', '+31', '🇳🇱', 58),
  ('BE', 'Belgium', 'بلجيكا', '+32', '🇧🇪', 59),
  ('CH', 'Switzerland', 'سويسرا', '+41', '🇨🇭', 60),
  ('AT', 'Austria', 'النمسا', '+43', '🇦🇹', 61),
  ('SE', 'Sweden', 'السويد', '+46', '🇸🇪', 62),
  ('NO', 'Norway', 'النرويج', '+47', '🇳🇴', 63),
  ('DK', 'Denmark', 'الدنمارك', '+45', '🇩🇰', 64),
  ('FI', 'Finland', 'فنلندا', '+358', '🇫🇮', 65),
  ('PL', 'Poland', 'بولندا', '+48', '🇵🇱', 66),
  ('TR', 'Turkey', 'تركيا', '+90', '🇹🇷', 67),
  ('RU', 'Russia', 'روسيا', '+7', '🇷🇺', 68),
  ('CN', 'China', 'الصين', '+86', '🇨🇳', 69),
  ('JP', 'Japan', 'اليابان', '+81', '🇯🇵', 70),
  ('KR', 'South Korea', 'كوريا الجنوبية', '+82', '🇰🇷', 71),
  ('IN', 'India', 'الهند', '+91', '🇮🇳', 72),
  ('PK', 'Pakistan', 'باكستان', '+92', '🇵🇰', 73),
  ('BD', 'Bangladesh', 'بنغلاديش', '+880', '🇧🇩', 74),
  ('ID', 'Indonesia', 'إندونيسيا', '+62', '🇮🇩', 75),
  ('MY', 'Malaysia', 'ماليزيا', '+60', '🇲🇾', 76),
  ('SG', 'Singapore', 'سنغافورة', '+65', '🇸🇬', 77),
  ('TH', 'Thailand', 'تايلاند', '+66', '🇹🇭', 78),
  ('PH', 'Philippines', 'الفلبين', '+63', '🇵🇭', 79),
  ('VN', 'Vietnam', 'فيتنام', '+84', '🇻🇳', 80),
  ('BR', 'Brazil', 'البرازيل', '+55', '🇧🇷', 81),
  ('MX', 'Mexico', 'المكسيك', '+52', '🇲🇽', 82),
  ('AR', 'Argentina', 'الأرجنتين', '+54', '🇦🇷', 83),
  ('CL', 'Chile', 'تشيلي', '+56', '🇨🇱', 84),
  ('CO', 'Colombia', 'كولومبيا', '+57', '🇨🇴', 85),
  ('ZA', 'South Africa', 'جنوب أفريقيا', '+27', '🇿🇦', 86),
  ('NG', 'Nigeria', 'نيجيريا', '+234', '🇳🇬', 87),
  ('KE', 'Kenya', 'كينيا', '+254', '🇰🇪', 88),
  ('GH', 'Ghana', 'غانا', '+233', '🇬🇭', 89),
  ('ET', 'Ethiopia', 'إثيوبيا', '+251', '🇪🇹', 90),
  ('NZ', 'New Zealand', 'نيوزيلندا', '+64', '🇳🇿', 91),
  ('IE', 'Ireland', 'أيرلندا', '+353', '🇮🇪', 92),
  ('PT', 'Portugal', 'البرتغال', '+351', '🇵🇹', 93),
  ('GR', 'Greece', 'اليونان', '+30', '🇬🇷', 94),
  ('CZ', 'Czech Republic', 'التشيك', '+420', '🇨🇿', 95),
  ('HU', 'Hungary', 'المجر', '+36', '🇭🇺', 96),
  ('RO', 'Romania', 'رومانيا', '+40', '🇷🇴', 97),
  ('IL', 'Israel', 'إسرائيل', '+972', '🇮🇱', 98),
  ('IR', 'Iran', 'إيران', '+98', '🇮🇷', 99),
  ('AF', 'Afghanistan', 'أفغانستان', '+93', '🇦🇫', 100)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 2. CONTACT STATUSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contact_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE, -- e.g., 'lead', 'prospect', 'customer'
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  color TEXT NOT NULL, -- Hex color for UI badges
  description_en TEXT,
  description_ar TEXT,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contact_statuses_slug ON contact_statuses(slug);

-- Insert default contact statuses
INSERT INTO contact_statuses (slug, name_en, name_ar, color, description_en, description_ar, display_order) VALUES
  ('lead', 'Lead', 'عميل محتمل', '#3B82F6', 'New unqualified contact', 'جهة اتصال جديدة غير مؤهلة', 1),
  ('prospect', 'Prospect', 'محتمل مؤهل', '#F59E0B', 'Qualified potential customer', 'عميل محتمل مؤهل', 2),
  ('customer', 'Customer', 'عميل', '#10B981', 'Active paying customer', 'عميل نشط يدفع', 3),
  ('inactive', 'Inactive', 'غير نشط', '#6B7280', 'Inactive or churned contact', 'جهة اتصال غير نشطة أو متوقفة', 4)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 3. COMPANY STATUSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS company_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  color TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_company_statuses_slug ON company_statuses(slug);

-- Insert default company statuses
INSERT INTO company_statuses (slug, name_en, name_ar, color, description_en, description_ar, display_order) VALUES
  ('prospect', 'Prospect', 'شركة محتملة', '#F59E0B', 'Potential client company', 'شركة عميل محتمل', 1),
  ('active', 'Active', 'نشط', '#10B981', 'Active client company', 'شركة عميل نشطة', 2),
  ('inactive', 'Inactive', 'غير نشط', '#6B7280', 'Inactive company', 'شركة غير نشطة', 3)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 4. UPDATE CONTACTS TABLE
-- ============================================

-- Add new foreign key columns
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES countries(id);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS status_id UUID REFERENCES contact_statuses(id);

-- Migrate existing data (country)
-- Map text countries to country IDs
UPDATE contacts c
SET country_id = (
  SELECT id FROM countries
  WHERE LOWER(name_en) = LOWER(c.country)
     OR LOWER(name_ar) = LOWER(c.country)
  LIMIT 1
)
WHERE c.country IS NOT NULL AND c.country_id IS NULL;

-- Migrate existing data (status)
-- Map text statuses to status IDs
UPDATE contacts c
SET status_id = (
  SELECT id FROM contact_statuses
  WHERE slug = LOWER(c.status)
  LIMIT 1
)
WHERE c.status IS NOT NULL AND c.status_id IS NULL;

-- Set default status for contacts without status
UPDATE contacts c
SET status_id = (SELECT id FROM contact_statuses WHERE slug = 'lead' LIMIT 1)
WHERE c.status_id IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contacts_country ON contacts(country_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status_new ON contacts(status_id);

-- Drop old columns (commented out for safety - run manually after verification)
-- ALTER TABLE contacts DROP COLUMN IF EXISTS country;
-- ALTER TABLE contacts DROP COLUMN IF EXISTS status;

-- ============================================
-- 5. UPDATE COMPANIES TABLE
-- ============================================

-- Add new foreign key columns
ALTER TABLE companies ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES countries(id);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS status_id UUID REFERENCES company_statuses(id);

-- Migrate existing data (country)
UPDATE companies c
SET country_id = (
  SELECT id FROM countries
  WHERE LOWER(name_en) = LOWER(c.country)
     OR LOWER(name_ar) = LOWER(c.country)
  LIMIT 1
)
WHERE c.country IS NOT NULL AND c.country_id IS NULL;

-- Migrate existing data (status)
UPDATE companies c
SET status_id = (
  SELECT id FROM company_statuses
  WHERE slug = LOWER(c.status)
  LIMIT 1
)
WHERE c.status IS NOT NULL AND c.status_id IS NULL;

-- Set default status for companies without status
UPDATE companies c
SET status_id = (SELECT id FROM company_statuses WHERE slug = 'active' LIMIT 1)
WHERE c.status_id IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_companies_country ON companies(country_id);
CREATE INDEX IF NOT EXISTS idx_companies_status_new ON companies(status_id);

-- Drop old columns (commented out for safety - run manually after verification)
-- ALTER TABLE companies DROP COLUMN IF EXISTS country;
-- ALTER TABLE companies DROP COLUMN IF EXISTS status;

-- ============================================
-- 6. COMMENTS
-- ============================================

COMMENT ON TABLE countries IS 'Lookup table for countries with bilingual support';
COMMENT ON TABLE contact_statuses IS 'Lookup table for contact statuses with bilingual support';
COMMENT ON TABLE company_statuses IS 'Lookup table for company statuses with bilingual support';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
