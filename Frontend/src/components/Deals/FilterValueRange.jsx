/**
 * FilterValueRange Component
 * Min/Max value input fields
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign } from 'lucide-react';

const FilterValueRange = ({ valueMin, valueMax, onChange }) => {
  const { t } = useTranslation(['common']);

  return (
    <>
      {/* Value Range - Min */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          <DollarSign className="w-3 h-3 inline me-1" />
          {t('minValue')}
        </label>
        <input
          type="number"
          value={valueMin || ''}
          onChange={(e) => onChange('valueMin', e.target.value ? parseFloat(e.target.value) : null)}
          placeholder="0"
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          min="0"
          step="1000"
        />
      </div>

      {/* Value Range - Max */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          <DollarSign className="w-3 h-3 inline me-1" />
          {t('maxValue')}
        </label>
        <input
          type="number"
          value={valueMax || ''}
          onChange={(e) => onChange('valueMax', e.target.value ? parseFloat(e.target.value) : null)}
          placeholder="999999"
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          min="0"
          step="1000"
        />
      </div>
    </>
  );
};

export default FilterValueRange;
