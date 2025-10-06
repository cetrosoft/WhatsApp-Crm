-- =============================================
-- Update Country Flag Emojis
-- Ensures all countries have proper flag emoji icons
-- =============================================

-- Update all countries with their flag emojis
UPDATE countries SET flag_emoji = '🇸🇦' WHERE code = 'SA';
UPDATE countries SET flag_emoji = '🇦🇪' WHERE code = 'AE';
UPDATE countries SET flag_emoji = '🇪🇬' WHERE code = 'EG';
UPDATE countries SET flag_emoji = '🇯🇴' WHERE code = 'JO';
UPDATE countries SET flag_emoji = '🇰🇼' WHERE code = 'KW';
UPDATE countries SET flag_emoji = '🇧🇭' WHERE code = 'BH';
UPDATE countries SET flag_emoji = '🇶🇦' WHERE code = 'QA';
UPDATE countries SET flag_emoji = '🇴🇲' WHERE code = 'OM';
UPDATE countries SET flag_emoji = '🇮🇶' WHERE code = 'IQ';
UPDATE countries SET flag_emoji = '🇱🇧' WHERE code = 'LB';
UPDATE countries SET flag_emoji = '🇸🇾' WHERE code = 'SY';
UPDATE countries SET flag_emoji = '🇵🇸' WHERE code = 'PS';
UPDATE countries SET flag_emoji = '🇾🇪' WHERE code = 'YE';
UPDATE countries SET flag_emoji = '🇱🇾' WHERE code = 'LY';
UPDATE countries SET flag_emoji = '🇸🇩' WHERE code = 'SD';
UPDATE countries SET flag_emoji = '🇹🇳' WHERE code = 'TN';
UPDATE countries SET flag_emoji = '🇩🇿' WHERE code = 'DZ';
UPDATE countries SET flag_emoji = '🇲🇦' WHERE code = 'MA';
UPDATE countries SET flag_emoji = '🇲🇷' WHERE code = 'MR';
UPDATE countries SET flag_emoji = '🇸🇴' WHERE code = 'SO';
UPDATE countries SET flag_emoji = '🇩🇯' WHERE code = 'DJ';
UPDATE countries SET flag_emoji = '🇰🇲' WHERE code = 'KM';
UPDATE countries SET flag_emoji = '🇹🇷' WHERE code = 'TR';
UPDATE countries SET flag_emoji = '🇮🇷' WHERE code = 'IR';
UPDATE countries SET flag_emoji = '🇦🇫' WHERE code = 'AF';
UPDATE countries SET flag_emoji = '🇵🇰' WHERE code = 'PK';
UPDATE countries SET flag_emoji = '🇮🇳' WHERE code = 'IN';
UPDATE countries SET flag_emoji = '🇧🇩' WHERE code = 'BD';
UPDATE countries SET flag_emoji = '🇲🇾' WHERE code = 'MY';
UPDATE countries SET flag_emoji = '🇮🇩' WHERE code = 'ID';
UPDATE countries SET flag_emoji = '🇵🇭' WHERE code = 'PH';
UPDATE countries SET flag_emoji = '🇹🇭' WHERE code = 'TH';
UPDATE countries SET flag_emoji = '🇻🇳' WHERE code = 'VN';
UPDATE countries SET flag_emoji = '🇸🇬' WHERE code = 'SG';
UPDATE countries SET flag_emoji = '🇨🇳' WHERE code = 'CN';
UPDATE countries SET flag_emoji = '🇯🇵' WHERE code = 'JP';
UPDATE countries SET flag_emoji = '🇰🇷' WHERE code = 'KR';
UPDATE countries SET flag_emoji = '🇦🇺' WHERE code = 'AU';
UPDATE countries SET flag_emoji = '🇳🇿' WHERE code = 'NZ';
UPDATE countries SET flag_emoji = '🇺🇸' WHERE code = 'US';
UPDATE countries SET flag_emoji = '🇨🇦' WHERE code = 'CA';
UPDATE countries SET flag_emoji = '🇲🇽' WHERE code = 'MX';
UPDATE countries SET flag_emoji = '🇧🇷' WHERE code = 'BR';
UPDATE countries SET flag_emoji = '🇦🇷' WHERE code = 'AR';
UPDATE countries SET flag_emoji = '🇨🇱' WHERE code = 'CL';
UPDATE countries SET flag_emoji = '🇨🇴' WHERE code = 'CO';
UPDATE countries SET flag_emoji = '🇻🇪' WHERE code = 'VE';
UPDATE countries SET flag_emoji = '🇵🇪' WHERE code = 'PE';
UPDATE countries SET flag_emoji = '🇬🇧' WHERE code = 'GB';
UPDATE countries SET flag_emoji = '🇫🇷' WHERE code = 'FR';
UPDATE countries SET flag_emoji = '🇩🇪' WHERE code = 'DE';
UPDATE countries SET flag_emoji = '🇮🇹' WHERE code = 'IT';
UPDATE countries SET flag_emoji = '🇪🇸' WHERE code = 'ES';
UPDATE countries SET flag_emoji = '🇵🇹' WHERE code = 'PT';
UPDATE countries SET flag_emoji = '🇳🇱' WHERE code = 'NL';
UPDATE countries SET flag_emoji = '🇧🇪' WHERE code = 'BE';
UPDATE countries SET flag_emoji = '🇨🇭' WHERE code = 'CH';
UPDATE countries SET flag_emoji = '🇦🇹' WHERE code = 'AT';
UPDATE countries SET flag_emoji = '🇸🇪' WHERE code = 'SE';
UPDATE countries SET flag_emoji = '🇳🇴' WHERE code = 'NO';
UPDATE countries SET flag_emoji = '🇩🇰' WHERE code = 'DK';
UPDATE countries SET flag_emoji = '🇫🇮' WHERE code = 'FI';
UPDATE countries SET flag_emoji = '🇮🇪' WHERE code = 'IE';
UPDATE countries SET flag_emoji = '🇵🇱' WHERE code = 'PL';
UPDATE countries SET flag_emoji = '🇨🇿' WHERE code = 'CZ';
UPDATE countries SET flag_emoji = '🇭🇺' WHERE code = 'HU';
UPDATE countries SET flag_emoji = '🇷🇴' WHERE code = 'RO';
UPDATE countries SET flag_emoji = '🇬🇷' WHERE code = 'GR';
UPDATE countries SET flag_emoji = '🇧🇬' WHERE code = 'BG';
UPDATE countries SET flag_emoji = '🇷🇺' WHERE code = 'RU';
UPDATE countries SET flag_emoji = '🇺🇦' WHERE code = 'UA';
UPDATE countries SET flag_emoji = '🇰🇿' WHERE code = 'KZ';
UPDATE countries SET flag_emoji = '🇿🇦' WHERE code = 'ZA';
UPDATE countries SET flag_emoji = '🇳🇬' WHERE code = 'NG';
UPDATE countries SET flag_emoji = '🇰🇪' WHERE code = 'KE';
UPDATE countries SET flag_emoji = '🇪🇹' WHERE code = 'ET';
UPDATE countries SET flag_emoji = '🇬🇭' WHERE code = 'GH';
UPDATE countries SET flag_emoji = '🇺🇬' WHERE code = 'UG';
UPDATE countries SET flag_emoji = '🇹🇿' WHERE code = 'TZ';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Country flag emojis updated successfully';
  RAISE NOTICE 'Total countries updated: %', (SELECT COUNT(*) FROM countries WHERE flag_emoji IS NOT NULL);
END $$;
