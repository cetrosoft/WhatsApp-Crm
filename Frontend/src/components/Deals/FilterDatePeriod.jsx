/**
 * FilterDatePeriod Component
 * Date period select dropdown
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';
import { getPeriodOptions } from '../../utils/filterUtils';

const FilterDatePeriod = ({ label, value, onChange }) => {
  const { t, i18n } = useTranslation(['common']);

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        <Calendar className="w-3 h-3 inline me-1" />
        {label}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      >
        <option value="">{t('all')}</option>
        {getPeriodOptions(i18n.language).map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FilterDatePeriod;
