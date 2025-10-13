/**
 * SegmentHeader Component
 * Segment name and description fields
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

const SegmentHeader = ({ formData, onChange }) => {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
          {t('segmentNameEnglish')} *
        </label>
        <input
          type="text"
          required
          value={formData.name_en}
          onChange={(e) => onChange({ ...formData, name_en: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          placeholder={t('egActiveCustomers')}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
          {t('segmentNameArabic')}
        </label>
        <input
          type="text"
          value={formData.name_ar}
          onChange={(e) => onChange({ ...formData, name_ar: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          placeholder="مثال: العملاء النشطون"
          dir="rtl"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
          {t('descriptionEnglish')}
        </label>
        <textarea
          value={formData.description_en}
          onChange={(e) => onChange({ ...formData, description_en: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          rows={2}
          placeholder={t('egSegmentDescription')}
        />
      </div>
    </div>
  );
};

export default SegmentHeader;
