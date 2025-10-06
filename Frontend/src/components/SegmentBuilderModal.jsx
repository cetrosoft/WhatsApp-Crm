/**
 * Segment Builder Modal
 * Visual filter builder for creating dynamic segments
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { segmentAPI, statusAPI, countryAPI, userAPI, tagAPI, leadSourceAPI } from '../services/api';
import { X, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import SearchableSelect from './SearchableSelect';
import MultiSelectTags from './MultiSelectTags';

const SegmentBuilderModal = ({ isOpen, onClose, segment, onSave }) => {
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.language === 'ar';

  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    description_en: '',
    description_ar: '',
    filter_rules: {
      operator: 'AND',
      conditions: []
    }
  });

  const [lookupData, setLookupData] = useState({
    statuses: [],
    countries: [],
    users: [],
    tags: [],
    leadSources: []
  });

  const [contactCount, setContactCount] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const [loading, setLoading] = useState(false);

  // Field options
  const fieldOptions = [
    { value: 'status_id', label: t('status') },
    { value: 'country_id', label: t('country') },
    { value: 'lead_source', label: t('leadSource') },
    { value: 'assigned_to', label: t('assignedTo') },
    { value: 'tags', label: t('tags') },
    { value: 'created_at', label: t('createdAt') }
  ];

  // Operator options (vary by field type)
  const getOperatorOptions = (field) => {
    if (field === 'tags') {
      return [
        { value: 'contains_any', label: t('containsAny') }
      ];
    }
    if (field === 'created_at') {
      return [
        { value: 'after', label: t('after') },
        { value: 'before', label: t('before') }
      ];
    }
    if (field === 'assigned_to') {
      return [
        { value: 'equals', label: t('equals') },
        { value: 'is_null', label: t('isNull') },
        { value: 'is_not_null', label: t('isNotNull') }
      ];
    }
    return [
      { value: 'equals', label: t('equals') },
      { value: 'not_equals', label: t('notEquals') }
    ];
  };

  useEffect(() => {
    if (isOpen) {
      loadLookupData();
      if (segment) {
        setFormData({
          name_en: segment.name_en || '',
          name_ar: segment.name_ar || '',
          description_en: segment.description_en || '',
          description_ar: segment.description_ar || '',
          filter_rules: segment.filter_rules || { operator: 'AND', conditions: [] }
        });
        setContactCount(segment.contact_count || 0);
      } else {
        setFormData({
          name_en: '',
          name_ar: '',
          description_en: '',
          description_ar: '',
          filter_rules: {
            operator: 'AND',
            conditions: []
          }
        });
        setContactCount(0);
      }
    }
  }, [isOpen, segment]);

  const loadLookupData = async () => {
    try {
      const [statusesRes, countriesRes, usersRes, tagsRes, leadSourcesRes] = await Promise.all([
        statusAPI.getContactStatuses(),
        countryAPI.getCountries(),
        userAPI.getUsers(),
        tagAPI.getTags(),
        leadSourceAPI.getLeadSources()
      ]);

      setLookupData({
        statuses: statusesRes.statuses || [],
        countries: countriesRes.countries || [],
        users: usersRes.data || usersRes.users || [],
        tags: tagsRes.tags || [],
        leadSources: leadSourcesRes.leadSources || []
      });
    } catch (error) {
      console.error('Error loading lookup data:', error);
      toast.error('Failed to load form data');
    }
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      filter_rules: {
        ...formData.filter_rules,
        conditions: [
          ...formData.filter_rules.conditions,
          { field: '', operator: '', value: '' }
        ]
      }
    });
  };

  const removeCondition = (index) => {
    const newConditions = formData.filter_rules.conditions.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      filter_rules: {
        ...formData.filter_rules,
        conditions: newConditions
      }
    });
  };

  const updateCondition = (index, field, value) => {
    const newConditions = [...formData.filter_rules.conditions];
    newConditions[index] = {
      ...newConditions[index],
      [field]: value
    };

    // Reset value and operator when field changes
    if (field === 'field') {
      newConditions[index].value = value === 'tags' ? [] : '';
      newConditions[index].operator = getOperatorOptions(value)[0]?.value || '';
    }

    // Reset value when operator changes to is_null or is_not_null
    if (field === 'operator' && (value === 'is_null' || value === 'is_not_null')) {
      newConditions[index].value = '';
    }

    setFormData({
      ...formData,
      filter_rules: {
        ...formData.filter_rules,
        conditions: newConditions
      }
    });
  };

  const renderValueInput = (condition, index) => {
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
            onChange={(newValue) => updateCondition(index, 'value', newValue)}
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
            onChange={(newValue) => updateCondition(index, 'value', newValue)}
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
            onChange={(newValue) => updateCondition(index, 'value', newValue)}
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
            onChange={(newValue) => updateCondition(index, 'value', newValue)}
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
            onChange={(newValue) => updateCondition(index, 'value', newValue)}
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
            onChange={(e) => updateCondition(index, 'value', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => updateCondition(index, 'value', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder={t('value')}
          />
        );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name_en.trim()) {
      toast.error('Segment name (English) is required');
      return;
    }

    if (formData.filter_rules.conditions.length === 0) {
      toast.error('Please add at least one filter condition');
      return;
    }

    try {
      setLoading(true);

      console.log('Saving segment with data:', formData);

      if (segment) {
        const response = await segmentAPI.updateSegment(segment.id, formData);
        console.log('Update response:', response);
        toast.success(t('segmentUpdated'));
      } else {
        const response = await segmentAPI.createSegment(formData);
        console.log('Create response:', response);
        toast.success(t('segmentCreated'));
      }

      onSave();
    } catch (error) {
      console.error('Error saving segment:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        error
      });
      toast.error(error.message || 'Failed to save segment. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h3 className="text-lg font-semibold text-white">
            {segment ? t('editSegment') : t('createSegment')}
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
                {t('segmentNameEnglish')} *
              </label>
              <input
                type="text"
                required
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows={2}
                placeholder={t('egSegmentDescription')}
              />
            </div>
          </div>

          {/* Filter Rules */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h4 className="text-sm font-semibold text-gray-900">
                  {t('filterRules')}
                </h4>
                {/* AND/OR Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, filter_rules: { ...formData.filter_rules, operator: 'AND' } })}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      formData.filter_rules.operator === 'AND'
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t('matchAll')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, filter_rules: { ...formData.filter_rules, operator: 'OR' } })}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      formData.filter_rules.operator === 'OR'
                        ? 'bg-green-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t('matchAny')}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={addCondition}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                {t('addCondition')}
              </button>
            </div>

            {formData.filter_rules.conditions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                {t('addCondition')}
              </div>
            ) : (
              <div className="space-y-2">
                {formData.filter_rules.conditions.map((condition, index) => (
                  <React.Fragment key={index}>
                    <div className="flex items-start gap-1.5 p-2.5 bg-gray-50 rounded-lg">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-1.5">
                        {/* Field */}
                        <SearchableSelect
                          value={condition.field}
                          onChange={(value) => updateCondition(index, 'field', value)}
                          options={fieldOptions}
                          placeholder={t('field')}
                          displayKey="label"
                          valueKey="value"
                        />

                        {/* Operator */}
                        <SearchableSelect
                          value={condition.operator}
                          onChange={(value) => updateCondition(index, 'operator', value)}
                          options={getOperatorOptions(condition.field)}
                          placeholder={t('operator')}
                          displayKey="label"
                          valueKey="value"
                        />

                        {/* Value */}
                        <div className="md:col-span-1">
                          {renderValueInput(condition, index)}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeCondition(index)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* AND/OR Separator */}
                    {index < formData.filter_rules.conditions.length - 1 && (
                      <div className="flex items-center justify-center">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          formData.filter_rules.operator === 'AND'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {formData.filter_rules.operator}
                        </span>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Contact Count Preview */}
          {formData.filter_rules.conditions.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {calculating ? t('calculating') : contactCount}
              </div>
              <div className="text-sm text-gray-600">
                {t('contactsInSegment')}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? t('saving') : (segment ? t('update') : t('create'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SegmentBuilderModal;
