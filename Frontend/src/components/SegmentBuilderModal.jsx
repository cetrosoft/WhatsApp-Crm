/**
 * Segment Builder Modal
 * Visual filter builder for creating dynamic segments
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { segmentAPI, statusAPI, countryAPI, userAPI, tagAPI, leadSourceAPI } from '../services/api';
import { X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import SegmentHeader from './Segments/SegmentHeader';
import SegmentConditionRow from './Segments/SegmentConditionRow';

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
      toast.error(t('failedToLoadFormData'));
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name_en.trim()) {
      toast.error(t('nameEnglishRequired', { resource: t('segment') }));
      return;
    }

    if (formData.filter_rules.conditions.length === 0) {
      toast.error(t('atLeastOneCondition'));
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

      if (error.response?.data?.error === 'INSUFFICIENT_PERMISSIONS') {
        toast.error(t('insufficientPermissions'), {
          duration: 5000
        });
      } else {
        toast.error(error.response?.data?.message || error.message || t('failedToSave', { resource: t('segment') }));
      }
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
          <SegmentHeader
            formData={formData}
            onChange={setFormData}
          />

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
                    <SegmentConditionRow
                      condition={condition}
                      index={index}
                      fieldOptions={fieldOptions}
                      getOperatorOptions={getOperatorOptions}
                      lookupData={lookupData}
                      onUpdate={updateCondition}
                      onRemove={removeCondition}
                    />

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
