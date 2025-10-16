/**
 * MenuFormNavigation Component
 * Navigation-related fields for menu form
 *
 * Fields:
 * - Icon (with IconSelector)
 * - Path (URL route)
 * - Parent Menu (hierarchy)
 * - Display Order (sorting)
 */

import React, { useState, useEffect } from 'react';
import IconSelector from './IconSelector';
import { superAdminMenuAPI } from '../../services/superAdminAPI';

const MenuFormNavigation = ({ formData, errors, onChange, editingMenuKey }) => {
  const [parentMenus, setParentMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParentMenus();
  }, []);

  const loadParentMenus = async () => {
    try {
      const response = await superAdminMenuAPI.getMenus();
      const allMenus = flattenMenus(response.menus || []);
      // Filter out the current menu being edited to prevent circular reference
      const availableParents = allMenus.filter(m => m.key !== editingMenuKey);
      setParentMenus(availableParents);
    } catch (error) {
      console.error('Error loading parent menus:', error);
    } finally {
      setLoading(false);
    }
  };

  // Flatten hierarchical menu structure
  const flattenMenus = (menus) => {
    let flat = [];
    menus.forEach(menu => {
      flat.push(menu);
      if (menu.children && menu.children.length > 0) {
        flat = flat.concat(flattenMenus(menu.children));
      }
    });
    return flat;
  };

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
        <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
        Navigation
      </h4>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Icon Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icon <span className="text-red-600">*</span>
            </label>
            <IconSelector
              selected={formData.icon}
              onChange={(icon) => onChange('icon', icon)}
            />
            {errors.icon && (
              <p className="text-red-600 text-xs mt-1">{errors.icon}</p>
            )}
          </div>

          {/* Path */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Path
            </label>
            <input
              type="text"
              value={formData.path || ''}
              onChange={(e) => onChange('path', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                errors.path ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="/crm/projects"
            />
            {errors.path && (
              <p className="text-red-600 text-xs mt-1">{errors.path}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Leave empty for parent menus
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Parent Menu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent Menu
            </label>
            <select
              value={formData.parent_key || ''}
              onChange={(e) => onChange('parent_key', e.target.value || null)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                errors.parent_key ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            >
              <option value="">None (Root Level)</option>
              {parentMenus.map((menu) => (
                <option key={menu.key} value={menu.key}>
                  {menu.name_en} ({menu.key})
                </option>
              ))}
            </select>
            {errors.parent_key && (
              <p className="text-red-600 text-xs mt-1">{errors.parent_key}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Select parent for hierarchical menu
            </p>
          </div>

          {/* Display Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Order
            </label>
            <input
              type="number"
              value={formData.display_order ?? 0}
              onChange={(e) => onChange('display_order', parseInt(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                errors.display_order ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0"
            />
            {errors.display_order && (
              <p className="text-red-600 text-xs mt-1">{errors.display_order}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Lower numbers appear first
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuFormNavigation;
