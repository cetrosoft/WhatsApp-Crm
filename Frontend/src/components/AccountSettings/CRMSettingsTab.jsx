/**
 * CRM Settings Tab
 * Manage CRM lookup tables: Tags, Statuses, Lead Sources, Pipelines
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { tagAPI } from '../../services/api';
import { Plus, Edit2, Trash2, Tag as TagIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../utils/permissionUtils';

const CRMSettingsTab = () => {
  const { t, i18n } = useTranslation(['common', 'settings']);
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';

  // State
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTagModal, setShowTagModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [tagForm, setTagForm] = useState({
    name_en: '',
    name_ar: '',
    color: '#6366f1'
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
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const response = await tagAPI.getTags();
      setTags(response.data || []);
    } catch (error) {
      console.error('Error loading tags:', error);
      toast.error(t('failedToLoad', { resource: t('tags') }));
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    // Check permission before opening modal
    if (!hasPermission(user, 'tags.create')) {
      toast.error(t('common:permissionDenied'), { duration: 5000 });
      return;
    }

    setEditingTag(null);
    setTagForm({ name_en: '', name_ar: '', color: '#6366f1' });
    setShowTagModal(true);
  };

  const handleEditTag = (tag) => {
    // Check permission before opening modal
    if (!hasPermission(user, 'tags.edit')) {
      toast.error(t('common:permissionDenied'), { duration: 5000 });
      return;
    }

    setEditingTag(tag);
    setTagForm({
      name_en: tag.name_en,
      name_ar: tag.name_ar || '',
      color: tag.color || '#6366f1'
    });
    setShowTagModal(true);
  };

  const handleSaveTag = async (e) => {
    e.preventDefault();

    if (!tagForm.name_en.trim()) {
      toast.error(t('nameEnglishRequired', { resource: t('tag') }));
      return;
    }

    try {
      if (editingTag) {
        // Update existing tag
        await tagAPI.updateTag(editingTag.id, tagForm);
        toast.success(t('successUpdated', { resource: t('tag') }));
      } else {
        // Create new tag
        await tagAPI.createTag(tagForm);
        toast.success(t('successCreated', { resource: t('tag') }));
      }

      setShowTagModal(false);
      loadTags();
    } catch (error) {
      console.error('Error saving tag:', error);

      if (error.response?.status === 403) {
        toast.error(t('noPermissionManage', { resource: t('tags') }), {
          duration: 5000
        });
      } else {
        toast.error(error.response?.data?.message || t('failedToSave', { resource: t('tag') }));
      }
    }
  };

  const handleDeleteTag = async (tag) => {
    // Check permission before showing confirm dialog
    if (!hasPermission(user, 'tags.delete')) {
      toast.error(t('common:permissionDenied'), { duration: 5000 });
      return;
    }

    if (!confirm(`Are you sure you want to delete the tag "${tag.name_en}"?`)) {
      return;
    }

    try {
      await tagAPI.deleteTag(tag.id);
      toast.success(t('successDeleted', { resource: t('tag') }));
      loadTags();
    } catch (error) {
      console.error('Error deleting tag:', error);

      if (error.response?.status === 403) {
        toast.error(t('cannotDeleteTags'), {
          duration: 5000
        });
      } else {
        toast.error(t('failedToDelete', { resource: t('tag') }));
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
            {t('tagsManagement')}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {t('tagsManagementDescription')}
          </p>
        </div>
        <button
          onClick={handleAddTag}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          {t('addTag')}
        </button>
      </div>

      {/* Tags Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">
                {t('tag')}
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
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tags.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                  No tags found. Create your first tag to get started.
                </td>
              </tr>
            ) : (
              tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      <TagIcon className="w-3 h-3 me-1" />
                      {isRTL && tag.name_ar ? tag.name_ar : tag.name_en}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {tag.name_en}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {tag.name_ar || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: tag.color }}
                      ></div>
                      <span className="text-xs text-gray-500">{tag.color}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditTag(tag)}
                        className="p-1 text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag)}
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

      {/* Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingTag ? t('editTag') : t('addNewTag')}
            </h3>
            <form onSubmit={handleSaveTag} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
                  {t('tagNameEnglish')} *
                </label>
                <input
                  type="text"
                  required
                  value={tagForm.name_en}
                  onChange={(e) => setTagForm({ ...tagForm, name_en: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder={t('egVIPCustomer')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
                  {t('tagNameArabic')}
                </label>
                <input
                  type="text"
                  value={tagForm.name_ar}
                  onChange={(e) => setTagForm({ ...tagForm, name_ar: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="مثال: عميل مميز"
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
                      onClick={() => setTagForm({ ...tagForm, color })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        tagForm.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTagModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingTag ? t('update') : t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMSettingsTab;
