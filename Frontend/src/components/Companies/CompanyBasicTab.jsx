/**
 * Company Basic Info Tab
 * Basic company information fields
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Upload } from 'lucide-react';
import SearchableSelect from '../SearchableSelect';
import MultiSelectTags from '../MultiSelectTags';

const CompanyBasicTab = ({
  formData,
  setFormData,
  lookupData,
  uploading,
  handleLogoUpload,
}) => {
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.language === 'ar';

  const employeeSizeOptions = [
    { value: '1-10', label: '1-10' },
    { value: '11-50', label: '11-50' },
    { value: '51-200', label: '51-200' },
    { value: '201-500', label: '201-500' },
    { value: '500+', label: '500+' }
  ];

  return (
    <div className="space-y-3">
      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('logo')}
        </label>
        <div className="flex items-center gap-2">
          {formData.logo_url ? (
            <img
              src={formData.logo_url}
              alt="Company logo"
              className="w-12 h-12 rounded object-cover border border-gray-200"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-gray-400" />
            </div>
          )}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              disabled={uploading}
            />
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              {uploading ? t('loading') : t('uploadLogo')}
            </div>
          </label>
        </div>
      </div>

      {/* Company Name + Industry + Website (3 columns) */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('companyName')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('industry')}
          </label>
          <input
            type="text"
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('website')}
          </label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Phone + Email + Employee Size (3 columns) */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('phone')}
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('email')}
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('employeeSize')}
          </label>
          <SearchableSelect
            value={formData.employee_size}
            onChange={(value) => setFormData({ ...formData, employee_size: value })}
            options={employeeSizeOptions}
            placeholder={t('select')}
            displayKey="label"
            valueKey="value"
          />
        </div>
      </div>

      {/* Status + Assigned To (2 columns) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('status')}
          </label>
          <SearchableSelect
            value={formData.status_id}
            onChange={(value) => setFormData({ ...formData, status_id: value })}
            options={lookupData.statuses}
            placeholder={t('select')}
            displayKey={isRTL ? 'name_ar' : 'name_en'}
            valueKey="id"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('assignedTo')}
          </label>
          <SearchableSelect
            value={formData.assigned_to}
            onChange={(value) => setFormData({ ...formData, assigned_to: value })}
            options={lookupData.users}
            placeholder={t('select')}
            displayKey="full_name"
            valueKey="id"
          />
        </div>
      </div>

      {/* Tags (full width) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('tags')}
        </label>
        <MultiSelectTags
          selectedTags={Array.isArray(formData.tags) ? formData.tags : []}
          onChange={(newTags) => setFormData({ ...formData, tags: newTags })}
          options={lookupData.tags}
          placeholder={t('select')}
        />
      </div>
    </div>
  );
};

export default CompanyBasicTab;
