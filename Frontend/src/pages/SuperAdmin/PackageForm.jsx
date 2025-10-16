/**
 * Package Form Component
 * Create and edit subscription packages
 *
 * Features:
 * - Create new package
 * - Edit existing package
 * - Form validation
 * - Feature toggles
 * - Limit inputs
 * - Pricing inputs
 *
 * Related: Packages.jsx
 */

import React, { useState, useEffect } from 'react';
import { superAdminPackageAPI } from '../../services/superAdminAPI';
import { X, Save, Package as PackageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const PackageForm = ({ package: initialPackage, onClose }) => {
  const isEditMode = !!initialPackage;

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price_monthly: '',
    price_yearly: '',
    max_users: '',
    max_whatsapp_profiles: '',
    max_customers: '',
    max_messages_per_day: '',
    features: {
      crm: true,
      ticketing: false,
      bulk_sender: false,
      analytics: false,
      api_access: false,
      white_label: false,
      priority_support: false,
      custom_branding: false,
    },
    is_active: true,
    display_order: 0,
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialPackage) {
      setFormData({
        name: initialPackage.name || '',
        slug: initialPackage.slug || '',
        description: initialPackage.description || '',
        price_monthly: initialPackage.price_monthly === null ? '' : initialPackage.price_monthly,
        price_yearly: initialPackage.price_yearly === null ? '' : initialPackage.price_yearly,
        max_users: initialPackage.max_users || '',
        max_whatsapp_profiles: initialPackage.max_whatsapp_profiles || '',
        max_customers: initialPackage.max_customers || '',
        max_messages_per_day: initialPackage.max_messages_per_day || '',
        features: initialPackage.features || formData.features,
        is_active: initialPackage.is_active !== undefined ? initialPackage.is_active : true,
        display_order: initialPackage.display_order || 0,
      });
    }
  }, [initialPackage]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Auto-generate slug from name
      if (name === 'name' && !isEditMode) {
        const slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        setFormData((prev) => ({
          ...prev,
          slug,
        }));
      }
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFeatureChange = (featureName) => {
    setFormData((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [featureName]: !prev.features[featureName],
      },
    }));
  };

  const validate = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    // Slug validation
    if (!formData.slug || formData.slug.trim().length < 3) {
      newErrors.slug = 'Slug must be at least 3 characters';
    } else if (formData.slug.length > 50) {
      newErrors.slug = 'Slug must be less than 50 characters';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    }

    // Pricing validation
    if (formData.price_monthly !== '' && (isNaN(formData.price_monthly) || parseFloat(formData.price_monthly) < 0)) {
      newErrors.price_monthly = 'Monthly price must be >= 0 or leave blank';
    }

    if (formData.price_yearly !== '' && (isNaN(formData.price_yearly) || parseFloat(formData.price_yearly) < 0)) {
      newErrors.price_yearly = 'Yearly price must be >= 0 or leave blank';
    }

    // Limits validation
    if (formData.max_users !== '' && (isNaN(formData.max_users) || parseInt(formData.max_users) <= 0)) {
      newErrors.max_users = 'Max users must be > 0 or leave blank';
    }

    if (formData.max_whatsapp_profiles !== '' && (isNaN(formData.max_whatsapp_profiles) || parseInt(formData.max_whatsapp_profiles) <= 0)) {
      newErrors.max_whatsapp_profiles = 'Max WhatsApp profiles must be > 0 or leave blank';
    }

    if (formData.max_customers !== '' && (isNaN(formData.max_customers) || parseInt(formData.max_customers) <= 0)) {
      newErrors.max_customers = 'Max customers must be > 0 or leave blank';
    }

    if (formData.max_messages_per_day !== '' && (isNaN(formData.max_messages_per_day) || parseInt(formData.max_messages_per_day) <= 0)) {
      newErrors.max_messages_per_day = 'Max messages per day must be > 0 or leave blank';
    }

    // At least one feature must be enabled
    const hasActiveFeature = Object.values(formData.features).some((v) => v === true);
    if (!hasActiveFeature) {
      newErrors.features = 'At least one feature must be enabled';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setSaving(true);

    try {
      // Prepare data for API
      const apiData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || null,
        price_monthly: formData.price_monthly === '' ? null : parseFloat(formData.price_monthly),
        price_yearly: formData.price_yearly === '' ? null : parseFloat(formData.price_yearly),
        max_users: formData.max_users === '' ? null : parseInt(formData.max_users),
        max_whatsapp_profiles: formData.max_whatsapp_profiles === '' ? null : parseInt(formData.max_whatsapp_profiles),
        max_customers: formData.max_customers === '' ? null : parseInt(formData.max_customers),
        max_messages_per_day: formData.max_messages_per_day === '' ? null : parseInt(formData.max_messages_per_day),
        features: formData.features,
        is_active: formData.is_active,
        display_order: parseInt(formData.display_order) || 0,
      };

      if (isEditMode) {
        await superAdminPackageAPI.updatePackage(initialPackage.id, apiData);
        toast.success('Package updated successfully');
      } else {
        await superAdminPackageAPI.createPackage(apiData);
        toast.success('Package created successfully');
      }

      onClose(true); // Close and reload
    } catch (error) {
      console.error('Error saving package:', error);
      const errorMessage = error.response?.data?.error || 'Failed to save package';
      toast.error(errorMessage);

      // Handle specific validation errors from backend
      if (error.response?.data?.error?.includes('slug')) {
        setErrors((prev) => ({ ...prev, slug: error.response.data.error }));
      }
    } finally {
      setSaving(false);
    }
  };

  const featuresList = [
    { key: 'crm', label: 'CRM', description: 'Customer Relationship Management' },
    { key: 'ticketing', label: 'Ticketing', description: 'Support ticket system' },
    { key: 'bulk_sender', label: 'Bulk Sender', description: 'Mass WhatsApp messaging' },
    { key: 'analytics', label: 'Analytics', description: 'Advanced analytics & reports' },
    { key: 'api_access', label: 'API Access', description: 'REST API access' },
    { key: 'white_label', label: 'White Label', description: 'Remove platform branding' },
    { key: 'priority_support', label: 'Priority Support', description: '24/7 priority support' },
    { key: 'custom_branding', label: 'Custom Branding', description: 'Custom logo & colors' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <PackageIcon className="w-6 h-6 mr-2" />
            {isEditMode ? 'Edit Package' : 'Create New Package'}
          </h2>
          <button
            onClick={() => onClose(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Professional"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="e.g., professional"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.slug ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
                  <p className="mt-1 text-xs text-gray-500">Lowercase, hyphens only (auto-generated)</p>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Brief description of this package..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Price ($)
                  </label>
                  <input
                    type="number"
                    name="price_monthly"
                    value={formData.price_monthly}
                    onChange={handleChange}
                    placeholder="Leave blank for custom"
                    step="0.01"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.price_monthly ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.price_monthly && <p className="mt-1 text-sm text-red-600">{errors.price_monthly}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yearly Price ($)
                  </label>
                  <input
                    type="number"
                    name="price_yearly"
                    value={formData.price_yearly}
                    onChange={handleChange}
                    placeholder="Leave blank for custom"
                    step="0.01"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.price_yearly ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.price_yearly && <p className="mt-1 text-sm text-red-600">{errors.price_yearly}</p>}
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">Leave blank for custom pricing (Enterprise plans)</p>
            </div>

            {/* Usage Limits */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Limits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Users
                  </label>
                  <input
                    type="number"
                    name="max_users"
                    value={formData.max_users}
                    onChange={handleChange}
                    placeholder="Leave blank for unlimited"
                    min="1"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.max_users ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.max_users && <p className="mt-1 text-sm text-red-600">{errors.max_users}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max WhatsApp Profiles
                  </label>
                  <input
                    type="number"
                    name="max_whatsapp_profiles"
                    value={formData.max_whatsapp_profiles}
                    onChange={handleChange}
                    placeholder="Leave blank for unlimited"
                    min="1"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.max_whatsapp_profiles ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.max_whatsapp_profiles && <p className="mt-1 text-sm text-red-600">{errors.max_whatsapp_profiles}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Customers/Contacts
                  </label>
                  <input
                    type="number"
                    name="max_customers"
                    value={formData.max_customers}
                    onChange={handleChange}
                    placeholder="Leave blank for unlimited"
                    min="1"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.max_customers ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.max_customers && <p className="mt-1 text-sm text-red-600">{errors.max_customers}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Messages Per Day
                  </label>
                  <input
                    type="number"
                    name="max_messages_per_day"
                    value={formData.max_messages_per_day}
                    onChange={handleChange}
                    placeholder="Leave blank for unlimited"
                    min="1"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.max_messages_per_day ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.max_messages_per_day && <p className="mt-1 text-sm text-red-600">{errors.max_messages_per_day}</p>}
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">Leave blank for unlimited access</p>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Features <span className="text-red-500">*</span>
              </h3>
              {errors.features && <p className="mb-2 text-sm text-red-600">{errors.features}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {featuresList.map((feature) => (
                  <label
                    key={feature.key}
                    className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.features[feature.key]}
                      onChange={() => handleFeatureChange(feature.key)}
                      className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{feature.label}</div>
                      <div className="text-xs text-gray-500">{feature.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Status & Display */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Status & Display</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Active</span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500">Package is available for selection</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="display_order"
                    value={formData.display_order}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">Lower numbers appear first</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3 bg-gray-50">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditMode ? 'Update Package' : 'Create Package'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PackageForm;
