/**
 * Company Location Tab
 * Address, city, country, and notes
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import SearchableSelect from '../SearchableSelect';

const CompanyLocationTab = ({
  formData,
  setFormData,
  lookupData,
}) => {
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.language === 'ar';

  return (
    <div className="space-y-3">
      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('location')}
        </label>
        <textarea
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          rows={2}
          className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* City + Country (2 columns) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('country')}
          </label>
          <SearchableSelect
            value={formData.country_id}
            onChange={(value) => setFormData({ ...formData, country_id: value })}
            options={lookupData.countries}
            placeholder={t('select')}
            displayKey={isRTL ? 'name_ar' : 'name_en'}
            valueKey="id"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>
    </div>
  );
};

export default CompanyLocationTab;
