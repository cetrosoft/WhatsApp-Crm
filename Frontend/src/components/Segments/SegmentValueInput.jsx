/**
 * SegmentValueInput Component
 * Renders appropriate input based on condition field type
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import SearchableSelect from '../SearchableSelect';
import MultiSelectTags from '../MultiSelectTags';

const SegmentValueInput = ({
  condition,
  index,
  lookupData,
  onUpdate,
}) => {
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.language === 'ar';
  const { field, operator, value } = condition;

  // No value input for is_null/is_not_null operators
  if (operator === 'is_null' || operator === 'is_not_null') {
    return null;
  }

  switch (field) {
    case 'status_id':
      const statusOptions = lookupData.statuses.map(status => ({
        label: isRTL && status.name_ar ? status.name_ar : status.name_en,
        value: status.id
      }));
      return (
        <SearchableSelect
          value={value}
          onChange={(newValue) => onUpdate(index, 'value', newValue)}
          options={statusOptions}
          placeholder={t('select')}
          displayKey="label"
          valueKey="value"
        />
      );

    case 'country_id':
      const countryOptions = lookupData.countries.map(country => ({
        label: isRTL ? country.name_ar : country.name_en,
        value: country.id
      }));
      return (
        <SearchableSelect
          value={value}
          onChange={(newValue) => onUpdate(index, 'value', newValue)}
          options={countryOptions}
          placeholder={t('select')}
          displayKey="label"
          valueKey="value"
        />
      );

    case 'lead_source':
      const leadSourceOptions = lookupData.leadSources.map(source => ({
        label: isRTL && source.name_ar ? source.name_ar : source.name_en,
        value: source.slug
      }));
      return (
        <SearchableSelect
          value={value}
          onChange={(newValue) => onUpdate(index, 'value', newValue)}
          options={leadSourceOptions}
          placeholder={t('select')}
          displayKey="label"
          valueKey="value"
        />
      );

    case 'assigned_to':
      const userOptions = lookupData.users.map(user => ({
        label: user.full_name,
        value: user.id
      }));
      return (
        <SearchableSelect
          value={value}
          onChange={(newValue) => onUpdate(index, 'value', newValue)}
          options={userOptions}
          placeholder={t('select')}
          displayKey="label"
          valueKey="value"
        />
      );

    case 'tags':
      return (
        <MultiSelectTags
          selectedTags={Array.isArray(value) ? value : []}
          onChange={(newValue) => onUpdate(index, 'value', newValue)}
          options={lookupData.tags}
          placeholder={t('select')}
          className="flex-1"
        />
      );

    case 'created_at':
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => onUpdate(index, 'value', e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      );

    default:
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onUpdate(index, 'value', e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          placeholder={t('value')}
        />
      );
  }
};

export default SegmentValueInput;
