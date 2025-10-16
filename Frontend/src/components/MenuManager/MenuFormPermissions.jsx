/**
 * MenuFormPermissions Component
 * Permission and feature-related fields for menu form
 *
 * Fields:
 * - Permission Module (KEY field for v3.0 architecture!)
 * - Required Permission
 * - Required Feature (package feature)
 * - Status toggles (is_active, is_system, show_in_menu)
 */

import React from 'react';
import { Info } from 'lucide-react';

const MenuFormPermissions = ({ formData, errors, onChange }) => {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
        <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
        Permissions & Features
      </h4>

      <div className="space-y-4">
        {/* Permission Module - KEY FIELD! */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            Permission Module
            <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Important
            </span>
          </label>
          <input
            type="text"
            value={formData.permission_module || ''}
            onChange={(e) => onChange('permission_module', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
              errors.permission_module ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="projects"
          />
          {errors.permission_module && (
            <p className="text-red-600 text-xs mt-1">{errors.permission_module}</p>
          )}
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              Links this menu to the permission system. For example, "projects" for projects.view, projects.create, etc.
              This enables auto-categorization in the permission matrix.
            </p>
          </div>
        </div>

        {/* Required Permission */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Required Permission
          </label>
          <input
            type="text"
            value={formData.required_permission || ''}
            onChange={(e) => onChange('required_permission', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
              errors.required_permission ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="projects.view"
          />
          {errors.required_permission && (
            <p className="text-red-600 text-xs mt-1">{errors.required_permission}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            User must have this permission to see menu item (e.g., "projects.view")
          </p>
        </div>

        {/* Required Feature */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Required Feature (Package)
          </label>
          <select
            value={formData.required_feature || ''}
            onChange={(e) => onChange('required_feature', e.target.value || null)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
              errors.required_feature ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">None (Always Visible)</option>
            <option value="crm">CRM</option>
            <option value="tickets">Tickets</option>
            <option value="ticketing">Ticketing</option>
            <option value="bulk_sender">Bulk Sender</option>
            <option value="analytics">Analytics</option>
            <option value="api_access">API Access</option>
            <option value="white_label">White Label</option>
            <option value="priority_support">Priority Support</option>
            <option value="custom_branding">Custom Branding</option>
          </select>
          {errors.required_feature && (
            <p className="text-red-600 text-xs mt-1">{errors.required_feature}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Organization package must have this feature enabled to see menu
          </p>
        </div>

        {/* Status Toggles */}
        <div className="pt-4 border-t border-gray-200">
          <h5 className="text-sm font-medium text-gray-700 mb-3">Status</h5>
          <div className="space-y-2">
            {/* Is Active */}
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active ?? true}
                onChange={(e) => onChange('is_active', e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
              <span className="ml-2 text-xs text-gray-500">(Menu is visible)</span>
            </label>

            {/* Show in Menu */}
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.show_in_menu ?? true}
                onChange={(e) => onChange('show_in_menu', e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show in Menu</span>
              <span className="ml-2 text-xs text-gray-500">(Display in sidebar)</span>
            </label>

            {/* Is System */}
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_system ?? false}
                onChange={(e) => onChange('is_system', e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="ml-2 text-sm text-gray-700">System Menu</span>
              <span className="ml-2 text-xs text-gray-500">(Protected from deletion)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuFormPermissions;
