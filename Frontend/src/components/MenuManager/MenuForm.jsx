/**
 * MenuForm Component
 * Modal form for creating/editing menu items
 *
 * Features:
 * - Create new menu item
 * - Edit existing menu item
 * - Form validation
 * - Sub-forms for organization
 */

import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { superAdminMenuAPI } from '../../services/superAdminAPI';
import toast from 'react-hot-toast';
import MenuFormBasic from './MenuFormBasic';
import MenuFormNavigation from './MenuFormNavigation';
import MenuFormPermissions from './MenuFormPermissions';

const MenuForm = ({ menu, onClose }) => {
  const [formData, setFormData] = useState(menu || {
    key: '',
    parent_key: null,
    name_en: '',
    name_ar: '',
    icon: '',
    path: '',
    display_order: 0,
    permission_module: '',
    required_permission: '',
    required_feature: '',
    is_system: false,
    is_active: true,
    show_in_menu: true
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // Key validation
    if (!formData.key) {
      newErrors.key = 'Key is required';
    } else if (!/^[a-z0-9_-]+$/.test(formData.key)) {
      newErrors.key = 'Key must be lowercase with underscores/hyphens only';
    } else if (formData.key.length < 3) {
      newErrors.key = 'Key must be at least 3 characters';
    }

    // Name validation
    if (!formData.name_en || formData.name_en.trim().length < 3) {
      newErrors.name_en = 'English name required (min 3 chars)';
    }
    if (!formData.name_ar || formData.name_ar.trim().length < 3) {
      newErrors.name_ar = 'Arabic name required (min 3 chars)';
    }

    // Icon validation
    if (!formData.icon) {
      newErrors.icon = 'Icon is required';
    }

    // Circular reference check
    if (formData.parent_key === formData.key) {
      newErrors.parent_key = 'Menu cannot be its own parent';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix validation errors');
      return;
    }

    setLoading(true);
    try {
      if (menu) {
        await superAdminMenuAPI.updateMenu(menu.id, formData);
        toast.success('Menu item updated successfully');
      } else {
        await superAdminMenuAPI.createMenu(formData);
        toast.success('Menu item created successfully');
      }
      onClose(true); // true = reload menus
    } catch (error) {
      console.error('Error saving menu:', error);
      toast.error(error.response?.data?.error || 'Failed to save menu item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-red-50 to-orange-50">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            {menu ? 'Edit Menu Item' : 'Create Menu Item'}
          </h3>
          <button
            onClick={() => onClose(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Basic Information */}
            <MenuFormBasic
              formData={formData}
              errors={errors}
              onChange={handleChange}
            />

            {/* Navigation */}
            <MenuFormNavigation
              formData={formData}
              errors={errors}
              onChange={handleChange}
              editingMenuKey={menu?.key}
            />

            {/* Permissions & Features */}
            <MenuFormPermissions
              formData={formData}
              errors={errors}
              onChange={handleChange}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Menu Item
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuForm;
