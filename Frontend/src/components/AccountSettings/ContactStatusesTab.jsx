/**
 * Contact Statuses Tab
 * Manage contact statuses with bilingual support
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { statusAPI } from '../../services/api';
import { Plus, Edit2, Trash2, Circle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../utils/permissionUtils';

const ContactStatusesTab = () => {
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
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [statusForm, setStatusForm] = useState({
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
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    try {
      setLoading(true);
      const response = await statusAPI.getContactStatuses();
      setStatuses(response.statuses || []);
    } catch (error) {
      console.error('Error loading statuses:', error);
      toast.error(t('failedToLoad', { resource: t('contactStatuses') }));
    } finally {
      setLoading(false);
    }
  };

  const handleAddStatus = () => {
    // Check permission before opening modal
    if (!hasPermission(user, 'statuses.create')) {
      toast.error(t('common:permissionDenied'), { duration: 5000 });
      return;
    }

    setEditingStatus(null);
    setStatusForm({
      slug: '',
      name_en: '',
      name_ar: '',
      color: '#6366f1',
      description_en: '',
      description_ar: '',
      display_order: ''
    });
    setShowStatusModal(true);
  };

  const handleEditStatus = (status) => {
    // Check permission before opening modal
    if (!hasPermission(user, 'statuses.edit')) {
      toast.error(t('common:permissionDenied'), { duration: 5000 });
      return;
    }

    setEditingStatus(status);
    setStatusForm({
      slug: status.slug || '',
      name_en: status.name_en,
      name_ar: status.name_ar || '',
      color: status.color || '#6366f1',
      description_en: status.description_en || '',
      description_ar: status.description_ar || '',
      display_order: status.display_order || ''
    });
    setShowStatusModal(true);
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();

    if (!statusForm.name_en.trim()) {
      toast.error(t('nameEnglishRequired', { resource: t('status') }));
      return;
    }

    if (!editingStatus && !statusForm.slug.trim()) {
      toast.error(t('slugRequired', { resource: t('status') }));
      return;
    }

    try {
      if (editingStatus) {
        // Update existing status
        await statusAPI.updateContactStatus(editingStatus.id, statusForm);
        toast.success(t('successUpdated', { resource: t('status') }));
      } else {
        // Create new status
        await statusAPI.createContactStatus(statusForm);
        toast.success(t('successCreated', { resource: t('status') }));
      }

      setShowStatusModal(false);
      loadStatuses();
    } catch (error) {
      console.error('Error saving status:', error);

      if (error.response?.status === 403) {
        toast.error(t('noPermissionManage', { resource: t('contactStatuses') }), {
          duration: 5000
        });
      } else {
        toast.error(error.response?.data?.message || t('failedToSave', { resource: t('status') }));
      }
    }
  };

  const handleDeleteStatus = async (status) => {
    // Check permission before showing confirm dialog
    if (!hasPermission(user, 'statuses.delete')) {
      toast.error(t('common:permissionDenied'), { duration: 5000 });
      return;
    }

    if (!confirm(`Are you sure you want to delete the status "${status.name_en}"?`)) {
      return;
    }

    try {
      await statusAPI.deleteContactStatus(status.id);
      toast.success(t('successDeleted', { resource: t('status') }));
      loadStatuses();
    } catch (error) {
      console.error('Error deleting status:', error);

      if (error.response?.status === 403) {
        toast.error(t('cannotDeleteStatuses'), {
          duration: 5000
        });
      } else {
        toast.error(t('failedToDelete', { resource: t('status') }));
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
            {t('contactStatusesManagement')}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {t('contactStatusesManagementDescription')}
          </p>
        </div>
        <button
          onClick={handleAddStatus}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          {t('addContactStatus')}
        </button>
      </div>

      {/* Statuses Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">
                {t('status')}
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
            {statuses.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  No contact statuses found. Create your first status to get started.
                </td>
              </tr>
            ) : (
              statuses.map((status) => (
                <tr key={status.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: status.color }}
                    >
                      <Circle className="w-3 h-3 me-1 fill-current" />
                      {isRTL && status.name_ar ? status.name_ar : status.name_en}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {status.slug}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {status.name_en}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {status.name_ar || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: status.color }}
                      ></div>
                      <span className="text-xs text-gray-500">{status.color}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {status.display_order || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditStatus(status)}
                        className="p-1 text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStatus(status)}
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

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingStatus ? t('editContactStatus') : t('addNewContactStatus')}
            </h3>
            <form onSubmit={handleSaveStatus} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
                  {t('statusNameEnglish')} *
                </label>
                <input
                  type="text"
                  required
                  value={statusForm.name_en}
                  onChange={(e) => {
                    const name = e.target.value;
                    setStatusForm({
                      ...statusForm,
                      name_en: name,
                      slug: editingStatus ? statusForm.slug : generateSlug(name)
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder={t('egNewLead')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
                  {t('statusNameArabic')}
                </label>
                <input
                  type="text"
                  value={statusForm.name_ar}
                  onChange={(e) => setStatusForm({ ...statusForm, name_ar: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="مثال: عميل محتمل جديد"
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
                      onClick={() => setStatusForm({ ...statusForm, color })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        statusForm.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
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
                  value={statusForm.display_order}
                  onChange={(e) => setStatusForm({ ...statusForm, display_order: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder={t('egOrder')}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingStatus ? t('update') : t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactStatusesTab;
