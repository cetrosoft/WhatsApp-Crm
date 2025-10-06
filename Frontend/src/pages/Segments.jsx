/**
 * Segments Page
 * Dynamic contact segmentation with filter-based rules
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { segmentAPI, statusAPI, countryAPI, userAPI, tagAPI, leadSourceAPI } from '../services/api';
import { Plus, Edit2, Trash2, Users, RefreshCw, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import SegmentBuilderModal from '../components/SegmentBuilderModal';

const Segments = () => {
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.language === 'ar';

  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [lookupData, setLookupData] = useState({
    statuses: [],
    countries: [],
    users: [],
    tags: [],
    leadSources: []
  });

  useEffect(() => {
    loadSegments();
    loadLookupData();
  }, []);

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
    }
  };

  const loadSegments = async () => {
    try {
      setLoading(true);
      const response = await segmentAPI.getSegments();
      setSegments(response.segments || []);
    } catch (error) {
      console.error('Error loading segments:', error);
      toast.error('Failed to load segments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSegment = () => {
    setEditingSegment(null);
    setShowModal(true);
  };

  const handleEditSegment = (segment) => {
    setEditingSegment(segment);
    setShowModal(true);
  };

  const handleDeleteSegment = async (segment) => {
    if (!confirm(t('deleteSegmentConfirm'))) {
      return;
    }

    try {
      setDeletingId(segment.id);
      await segmentAPI.deleteSegment(segment.id);
      toast.success(t('segmentDeleted'));
      loadSegments();
    } catch (error) {
      console.error('Error deleting segment:', error);
      toast.error('Failed to delete segment');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRefreshCount = async (segmentId) => {
    try {
      await segmentAPI.calculateSegment(segmentId);
      toast.success(t('refreshCount') + ' ' + t('success').toLowerCase());
      loadSegments();
    } catch (error) {
      console.error('Error refreshing count:', error);
      toast.error('Failed to refresh count');
    }
  };

  const handleSaveSegment = async () => {
    setShowModal(false);
    loadSegments();
  };

  const handleViewContacts = (segment) => {
    // Navigate to contacts page with segment filter
    // For now, just show a message
    toast.success(`${t('viewContacts')}: ${isRTL && segment.name_ar ? segment.name_ar : segment.name_en}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US');
  };

  const buildFilterSummary = (segment) => {
    if (!segment.filter_rules || !segment.filter_rules.conditions || segment.filter_rules.conditions.length === 0) {
      return '';
    }

    const { operator, conditions } = segment.filter_rules;
    // Translate AND/OR to Arabic
    const operatorText = operator === 'AND'
      ? (isRTL ? 'و' : 'AND')
      : (isRTL ? 'أو' : 'OR');
    const separator = ` ${operatorText} `;

    const conditionTexts = conditions.map(condition => {
      const { field, operator: condOp, value } = condition;

      // Get human-readable field value
      let displayValue = '';

      switch (field) {
        case 'status_id':
          const status = lookupData.statuses.find(s => s.id === value);
          displayValue = status ? (isRTL && status.name_ar ? status.name_ar : status.name_en) : value;
          break;

        case 'country_id':
          const country = lookupData.countries.find(c => c.id === value);
          displayValue = country ? (isRTL ? country.name_ar : country.name_en) : value;
          break;

        case 'lead_source':
          const source = lookupData.leadSources.find(s => s.slug === value);
          displayValue = source ? (isRTL && source.name_ar ? source.name_ar : source.name_en) : value;
          break;

        case 'assigned_to':
          if (condOp === 'is_null') {
            return t('unassigned');
          } else if (condOp === 'is_not_null') {
            return t('assignedTo') + ': ' + t('any');
          }
          const user = lookupData.users.find(u => u.id === value);
          displayValue = user ? user.full_name : value;
          break;

        case 'tags':
          if (Array.isArray(value) && value.length > 0) {
            const tagNames = value.map(tagId => {
              const tag = lookupData.tags.find(t => t.id === tagId);
              return tag ? (isRTL && tag.name_ar ? tag.name_ar : tag.name_en) : tagId;
            });
            return tagNames.join(', ');
          }
          return '';

        case 'created_at':
          if (condOp === 'after') {
            return `${t('after')} ${value}`;
          } else if (condOp === 'before') {
            return `${t('before')} ${value}`;
          }
          return value;

        default:
          displayValue = value;
      }

      return displayValue;
    }).filter(text => text); // Remove empty strings

    return conditionTexts.join(separator);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('segments')}
            </h1>
            <p className="mt-2 text-gray-600">
              {t('createFirstSegment')}
            </p>
          </div>
          <button
            onClick={handleCreateSegment}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('createSegment')}
          </button>
        </div>
      </div>

      {/* Segments Grid */}
      {segments.length === 0 ? (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('noSegments')}
          </h3>
          <p className="text-gray-600 mb-6">
            {t('createFirstSegment')}
          </p>
          <button
            onClick={handleCreateSegment}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            {t('createSegment')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {segments.map((segment) => (
            <div
              key={segment.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow"
            >
              {/* Segment Header */}
              <div className="mb-3">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {isRTL && segment.name_ar ? segment.name_ar : segment.name_en}
                </h3>
                {(segment.description_en || segment.description_ar) && (
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {isRTL && segment.description_ar ? segment.description_ar : segment.description_en}
                  </p>
                )}
              </div>

              {/* Contact Count */}
              <div className="mb-3 p-3 bg-indigo-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">
                      {segment.contact_count || 0}
                    </div>
                    <div className="text-xs text-gray-600">
                      {t('contactsInSegment')}
                    </div>
                  </div>
                  <Users className="w-6 h-6 text-indigo-400" />
                </div>
              </div>

              {/* Filter Summary */}
              {buildFilterSummary(segment) && (
                <div className={`mb-3 p-2 rounded-lg border ${
                  segment.filter_rules?.operator === 'OR'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className={`text-xs font-medium ${
                    segment.filter_rules?.operator === 'OR'
                      ? 'text-green-800'
                      : 'text-blue-800'
                  }`}>
                    {buildFilterSummary(segment)}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleViewContacts(segment)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  title={t('viewContacts')}
                >
                  <Eye className="w-4 h-4" />
                  {t('viewContacts')}
                </button>
                <button
                  onClick={() => handleRefreshCount(segment.id)}
                  className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title={t('refreshCount')}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEditSegment(segment)}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title={t('edit')}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteSegment(segment)}
                  disabled={deletingId === segment.id}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title={t('delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Segment Builder Modal */}
      {showModal && (
        <SegmentBuilderModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          segment={editingSegment}
          onSave={handleSaveSegment}
        />
      )}
    </div>
  );
};

export default Segments;
