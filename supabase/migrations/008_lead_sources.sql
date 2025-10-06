/**
 * Lead Sources Migration
 *
 * Creates lead_sources lookup table with bilingual support
 * Similar to contact_statuses table structure
 */

-- ============================================
-- LEAD SOURCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE, -- e.g., 'website', 'referral', 'campaign'
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  color TEXT NOT NULL, -- Hex color for UI badges
  description_en TEXT,
  description_ar TEXT,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lead_sources_slug ON lead_sources(slug);
CREATE INDEX idx_lead_sources_active ON lead_sources(is_active);

-- Insert default lead sources
INSERT INTO lead_sources (slug, name_en, name_ar, color, description_en, description_ar, display_order) VALUES
  ('website', 'Website', 'الموقع الإلكتروني', '#3B82F6', 'Contact came through website', 'جهة اتصال من خلال الموقع', 1),
  ('referral', 'Referral', 'إحالة', '#8B5CF6', 'Referred by existing contact', 'محال من جهة اتصال موجودة', 2),
  ('campaign', 'Campaign', 'حملة', '#EC4899', 'Marketing campaign lead', 'عميل محتمل من حملة تسويقية', 3),
  ('whatsapp', 'WhatsApp', 'واتساب', '#10B981', 'Contact via WhatsApp', 'جهة اتصال عبر واتساب', 4),
  ('import', 'Import', 'استيراد', '#F59E0B', 'Imported from file', 'مستورد من ملف', 5),
  ('manual', 'Manual Entry', 'إدخال يدوي', '#6366F1', 'Manually entered', 'تم الإدخال يدوياً', 6),
  ('other', 'Other', 'أخرى', '#6B7280', 'Other sources', 'مصادر أخرى', 7)
ON CONFLICT (slug) DO NOTHING;

-- Add comment
COMMENT ON TABLE lead_sources IS 'Lookup table for lead sources with bilingual support';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
