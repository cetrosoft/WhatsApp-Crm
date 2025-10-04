/**
 * Organization Tab
 * Manage organization information (name, domain, logo)
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const OrganizationTab = () => {
  const { t } = useTranslation('settings');
  const { organization, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    slug: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        domain: organization.domain || '',
        slug: organization.slug || '',
      });
    }
  }, [organization]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // TODO: API call to update organization
      // await organizationAPI.update(formData);

      toast.success(t('settingsSaved'));
    } catch (error) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          {t('organizationInfo')}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Update your organization's basic information
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1 text-start"
          >
            {t('companyName')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              <Building2 className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full ps-10 pe-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-start"
              placeholder={t('companyName')}
            />
          </div>
        </div>

        {/* Company Domain */}
        <div>
          <label
            htmlFor="domain"
            className="block text-sm font-medium text-gray-700 mb-1 text-start"
          >
            {t('companyDomain')}
          </label>
          <input
            type="text"
            id="domain"
            name="domain"
            value={formData.domain}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-start"
            placeholder="example.com"
          />
        </div>

        {/* Slug (Read-only) */}
        <div>
          <label
            htmlFor="slug"
            className="block text-sm font-medium text-gray-700 mb-1 text-start"
          >
            Organization Slug
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            value={formData.slug}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-start cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500 text-start">
            Organization slug cannot be changed
          </p>
        </div>

        {/* Logo Upload (Placeholder for now) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 text-start">
            {t('companyLogo')}
          </label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
              <Building2 className="w-10 h-10 text-gray-400" />
            </div>
            <button
              type="button"
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {t('uploadLogo')}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500 text-start">
            PNG, JPG up to 2MB. Recommended 200x200px
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? t('loading', { ns: 'common' }) : t('saveChanges')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrganizationTab;
