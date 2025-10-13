/**
 * Ticket Settings Page
 * Manage ticket categories and other ticket-related settings
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Settings as SettingsIcon, FolderOpen, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissionUtils';
import { ticketAPI } from '../services/api';
import CategoryListView from '../components/Tickets/CategoryListView';

const TicketSettings = () => {
  const { t, i18n } = useTranslation(['common']);
  const isRTL = i18n.language === 'ar';
  const { user } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    color: '#6366f1',
    icon: 'Folder',
    sort_order: 0
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Permissions
  const canManage = hasPermission(user, 'ticket_categories.manage');

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await ticketAPI.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error(t('failedToLoad', { resource: t('categories') }));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle add category
   */
  const handleAddCategory = () => {
    if (!canManage) {
      toast.error(t('insufficientPermissions'));
      return;
    }

    setEditingCategory(null);
    setFormData({
      name_en: '',
      name_ar: '',
      color: '#6366f1',
      icon: 'Folder',
      sort_order: categories.length
    });
    setErrors({});
    setShowModal(true);
  };

  /**
   * Handle edit category
   */
  const handleEditCategory = (category) => {
    if (!canManage) {
      toast.error(t('insufficientPermissions'));
      return;
    }

    setEditingCategory(category);
    setFormData({
      name_en: category.name_en,
      name_ar: category.name_ar,
      color: category.color || '#6366f1',
      icon: category.icon || 'Folder',
      sort_order: category.sort_order || 0
    });
    setErrors({});
    setShowModal(true);
  };

  /**
   * Validate form
   */
  const validate = () => {
    const newErrors = {};

    if (!formData.name_en.trim()) {
      newErrors.name_en = t('required');
    }

    if (!formData.name_ar.trim()) {
      newErrors.name_ar = t('required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle save category
   */
  const handleSave = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setSaving(true);

      const categoryData = {
        name_en: formData.name_en.trim(),
        name_ar: formData.name_ar.trim(),
        color: formData.color,
        icon: formData.icon,
        sort_order: formData.sort_order
      };

      if (editingCategory) {
        await ticketAPI.updateCategory(editingCategory.id, categoryData);
        toast.success(t('categoryUpdated'));
      } else {
        await ticketAPI.createCategory(categoryData);
        toast.success(t('categoryCreated'));
      }

      setShowModal(false);
      setEditingCategory(null);
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      const errorMessage = editingCategory
        ? t('failedToUpdate', { resource: t('category') })
        : t('failedToCreate', { resource: t('category') });
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle delete category
   */
  const handleDeleteCategory = async (category) => {
    if (!canManage) {
      toast.error(t('insufficientPermissions'));
      return;
    }

    if (!confirm(t('confirmDeleteCategory'))) return;

    try {
      setDeletingId(category.id);
      await ticketAPI.deleteCategory(category.id);
      toast.success(t('categoryDeleted'));
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      // Show backend error message if available (e.g., "Category is in use")
      const errorMessage = error.response?.data?.message || t('failedToDelete', { resource: t('category') });
      toast.error(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  // Permission guard
  if (!canManage) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('insufficientPermissions')}</h2>
          <p className="text-gray-600">{t('contactAdmin')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('ticketSettings')}</h1>
            <p className="text-sm text-gray-600">{t('manageTicketConfiguration')}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px gap-4">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'categories'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>{t('categories')}</span>
          </button>
          {/* Future tabs can be added here */}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'categories' && (
        <div>
          {/* Add Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleAddCategory}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addCategory')}</span>
            </button>
          </div>

          {/* Categories List */}
          {loading && categories.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">{t('noCategories')}</h3>
              <p className="text-gray-600 mb-4">{t('noCategoriesDescription')}</p>
              <button
                onClick={handleAddCategory}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus className="w-4 h-4" />
                <span>{t('addFirstCategory')}</span>
              </button>
            </div>
          ) : (
            <CategoryListView
              categories={categories}
              onEdit={handleEditCategory}
              onDelete={handleDeleteCategory}
              deletingId={deletingId}
            />
          )}
        </div>
      )}

      {/* Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowModal(false)}
          />

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCategory ? t('editCategory') : t('addCategory')}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSave} className="px-6 py-4 space-y-4">
                {/* English Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('categoryNameEnglish')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.name_en ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Technical Support"
                  />
                  {errors.name_en && (
                    <p className="mt-1 text-sm text-red-500">{errors.name_en}</p>
                  )}
                </div>

                {/* Arabic Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('categoryNameArabic')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.name_ar ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="الدعم الفني"
                    dir="rtl"
                  />
                  {errors.name_ar && (
                    <p className="mt-1 text-sm text-red-500">{errors.name_ar}</p>
                  )}
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('categoryColor')}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                      placeholder="#6366f1"
                    />
                  </div>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('sortOrder')}
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    min="0"
                  />
                  <p className="mt-1 text-xs text-gray-500">{t('sortOrderHelp')}</p>
                </div>
              </form>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  disabled={saving}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={saving}
                >
                  {saving ? t('saving') : t('save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketSettings;
