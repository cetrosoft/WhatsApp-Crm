/**
 * MenuFormBasic Component
 * Basic information fields for menu form (key, names)
 *
 * Fields:
 * - Menu Key (unique identifier)
 * - English Name
 * - Arabic Name
 */

import React from 'react';

const MenuFormBasic = ({ formData, errors, onChange }) => {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
        <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
        Basic Information
      </h4>

      <div className="space-y-4">
        {/* Menu Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Menu Key <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={formData.key || ''}
            onChange={(e) => onChange('key', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
              errors.key ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="crm_projects"
          />
          {errors.key && (
            <p className="text-red-600 text-xs mt-1">{errors.key}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Unique identifier (lowercase, underscores, no spaces)
          </p>
        </div>

        {/* English Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            English Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={formData.name_en || ''}
            onChange={(e) => onChange('name_en', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
              errors.name_en ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Projects"
          />
          {errors.name_en && (
            <p className="text-red-600 text-xs mt-1">{errors.name_en}</p>
          )}
        </div>

        {/* Arabic Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Arabic Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={formData.name_ar || ''}
            onChange={(e) => onChange('name_ar', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
              errors.name_ar ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="المشاريع"
            dir="rtl"
          />
          {errors.name_ar && (
            <p className="text-red-600 text-xs mt-1">{errors.name_ar}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuFormBasic;
