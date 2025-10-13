/**
 * SegmentConditionRow Component
 * Single filter condition with field, operator, value
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import SearchableSelect from '../SearchableSelect';
import SegmentValueInput from './SegmentValueInput';

const SegmentConditionRow = ({
  condition,
  index,
  fieldOptions,
  getOperatorOptions,
  lookupData,
  onUpdate,
  onRemove,
}) => {
  const { t } = useTranslation('common');

  return (
    <div className="flex items-start gap-1.5 p-2.5 bg-gray-50 rounded-lg">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-1.5">
        {/* Field */}
        <SearchableSelect
          value={condition.field}
          onChange={(value) => onUpdate(index, 'field', value)}
          options={fieldOptions}
          placeholder={t('field')}
          displayKey="label"
          valueKey="value"
        />

        {/* Operator */}
        <SearchableSelect
          value={condition.operator}
          onChange={(value) => onUpdate(index, 'operator', value)}
          options={getOperatorOptions(condition.field)}
          placeholder={t('operator')}
          displayKey="label"
          valueKey="value"
        />

        {/* Value */}
        <div className="md:col-span-1">
          <SegmentValueInput
            condition={condition}
            index={index}
            lookupData={lookupData}
            onUpdate={onUpdate}
          />
        </div>
      </div>

      {/* Remove Button */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export default SegmentConditionRow;
