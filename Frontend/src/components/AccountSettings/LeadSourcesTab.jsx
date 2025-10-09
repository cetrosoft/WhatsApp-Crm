/**
 * Lead Sources Tab
 * Manage lead sources with bilingual support
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { leadSourceAPI } from '../../services/api';
import { Plus, Edit2, Trash2, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../utils/permissionUtils';

const LeadSourcesTab = () => {
  const { t, i18n } = useTranslation(['common', 'settings']);
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';

  // Helper function to generate slug from text
  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')  // Remove special characters
      .replace(/\s+/g, '-')       // Replace spaces with hyphens
      .replace(/-+/g, '-');       // Replace multiple hyphens with single
  };

  // State
  const [leadSources, setLeadSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [sourceForm, setSourceForm] = useState({
    slug: '',
    name_en: '',
    name_ar: '',
    color: '#6366f1',
    description_en: '',
    description_ar: '',
    display_order: ''
  });

  // Predefined colors
  const colorOptions = [
    '#6366f1', // Indigo
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#10b981', // Green
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Orange
  ];

  useEffect(() => {
    loadLeadSources();
  }, []);

  const loadLeadSources = async () => {
    try {
      setLoading(true);
      const response = await leadSourceAPI.getLeadSources();
      setLeadSources(response.leadSources || []);
    } catch (error) {
      console.error('Error loading lead sources:', error);
      toast.error(t('failedToLoad', { resource: t('leadSources') }));
    } finally {
      setLoading(false);
    }
  };

  const handleAddSource = () => {
    // Check permission before opening modal
    if (!hasPermission(user, 'leadSources.create')) {
      toast.error(t('common:permissionDenied'), { duration: 5000 });
      return;
    }

    setEditingSource(null);
    setSourceForm({
      slug: '',
      name_en: '',
      name_ar: '',
      color: '#6366f1',
      description_en: '',
      description_ar: '',
      display_order: ''
    });
    setShowModal(true);
  };

  const handleEditSource = (source) => {
    // Check permission before opening modal
    if (!hasPermission(user, 'leadSources.edit')) {
      toast.error(t('common:permissionDenied'), { duration: 5000 });
      return;
    }

    setEditingSource(source);
    setSourceForm({
      slug: source.slug || '',
      name_en: source.name_en,
      name_ar: source.name_ar || '',
      color: source.color || '#6366f1',
      description_en: source.description_en || '',
      description_ar: source.description_ar || '',
      display_order: source.display_order || ''
    });
    setShowModal(true);
  };

  const handleSaveSource = async (e) => {
    e.preventDefault();

    if (!sourceForm.name_en.trim()) {
      toast.error(t('nameEnglishRequired', { resource: t('leadSource') }));
      return;
    }

    if (!editingSource && !sourceForm.slug.trim()) {
      toast.error(t('slugRequired', { resource: t('leadSource') }));
      return;
    }

    try {
      if (editingSource) {
        // Update existing lead source
        await leadSourceAPI.updateLeadSource(editingSource.id, sourceForm);
        toast.success(t('successUpdated', { resource: t('leadSource') }));
      } else {
        // Create new lead source
        await leadSourceAPI.createLeadSource(sourceForm);
        toast.success(t('successCreated', { resource: t('leadSource') }));
      }

      setShowModal(false);
      loadLeadSources();
    } catch (error) {
      console.error('Error saving lead source:', error);

      if (error.response?.status === 403) {
        toast.error(t('noPermissionManage', { resource: t('leadSources') }), {
          duration: 5000
        });
      } else {
        toast.error(error.response?.data?.message || t('failedToSave', { resource: t('leadSource') }));
      }
    }
  };

  const handleDeleteSource = async (source) => {
    // Check permission before showing confirm dialog
    if (!hasPermission(user, 'leadSources.delete')) {
      toast.error(t('common:permissionDenied'), { duration: 5000 });
      return;
    }

    if (!confirm(`Are you sure you want to delete the lead source "${source.name_en}"?`)) {
      return;
    }

    try {
      await leadSourceAPI.deleteLeadSource(source.id);
      toast.success(t('successDeleted', { resource: t('leadSource') }));
      loadLeadSources();
    } catch (error) {
      console.error('Error deleting lead source:', error);

      if (error.response?.status === 403) {
        toast.error(t('cannotDeleteLeadSources'), {
          duration: 5000
        });
      } else {
        toast.error(t('failedToDelete', { resource: t('leadSource') }));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {t('leadSourcesManagement')}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {t('leadSourcesManagementDescription')}
          </p>
        </div>
        <button
          onClick={handleAddSource}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          {t('addLeadSource')}
        </button>
      </div>

      {/* Lead Sources Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">
                {t('leadSource')}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">
                {t('slug')}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">
                {t('englishName')}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">
                {t('arabicName')}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">
                {t('color')}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">
                {t('displayOrder')}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leadSources.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  No lead sources found. Create your first lead source to get started.
                </td>
              </tr>
            ) : (
              leadSources.map((source) => (
                <tr key={source.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: source.color }}
                    >
                      <Target className="w-3 h-3 me-1" />
                      {isRTL && source.name_ar ? source.name_ar : source.name_en}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {source.slug}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {source.name_en}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {source.name_ar || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: source.color }}
                      ></div>
                      <span className="text-xs text-gray-500">{source.color}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {source.display_order || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditSource(source)}
                        className="p-1 text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSource(source)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Lead Source Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingSource ? t('editLeadSource') : t('addNewLeadSource')}
            </h3>
            <form onSubmit={handleSaveSource} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
                  {t('leadSourceNameEnglish')} *
                </label>
                <input
                  type="text"
                  required
                  value={sourceForm.name_en}
                  onChange={(e) => {
                    const name = e.target.value;
                    setSourceForm({
                      ...sourceForm,
                      name_en: name,
                      slug: editingSource ? sourceForm.slug : generateSlug(name)
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder={t('egSocialMedia')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
                  {t('leadSourceNameArabic')}
                </label>
                <input
                  type="text"
                  value={sourceForm.name_ar}
                  onChange={(e) => setSourceForm({ ...sourceForm, name_ar: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="مثال: وسائل التواصل الاجتماعي"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-start">
                  {t('color')}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSourceForm({ ...sourceForm, color })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        sourceForm.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
                  {t('displayOrder')}
                </label>
                <input
                  type="number"
                  value={sourceForm.display_order}
                  onChange={(e) => setSourceForm({ ...sourceForm, display_order: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder={t('egOrder')}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingSource ? t('update') : t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadSourcesTab;
