/**
 * Quick Add Deal Card Component
 * Odoo-style inline form for rapid deal creation
 * Appears at top of pipeline stage
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import ContactSearchDropdown from './ContactSearchDropdown';
import QuickAddFormFields from './QuickAddFormFields';

const QuickAddDealCard = ({
  stageId,
  stageName,
  onSubmit,
  onCancel,
  onContactSearch,
  saving
}) => {
  const { t } = useTranslation(['common']);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    contactName: '',
    contactId: null,
    email: '',
    phone: '',
    phone_country_code: '+966', // Default Saudi Arabia
    country_id: '', // Optional for contact creation
    value: '',
  });

  const [errors, setErrors] = useState({});

  /**
   * Handle form data changes from child components
   */
  const handleFormDataChange = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
    // Clear errors for updated fields
    Object.keys(updates).forEach(key => {
      setErrors(prev => ({ ...prev, [key]: null }));
    });
  };

  /**
   * Validate form
   */
  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = t('required');
    }

    if (!formData.contactName.trim()) {
      newErrors.contactName = t('required');
    }

    if (!formData.value || parseFloat(formData.value) <= 0) {
      newErrors.value = t('required');
    }

    // If creating new contact, phone is required, email is optional
    if (!formData.contactId) {
      // Email is optional, but if provided, must be valid
      if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = t('invalidEmail');
      }

      if (!formData.phone.trim()) {
        newErrors.phone = t('required');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submit
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Pass data to parent
    onSubmit({
      ...formData,
      stageId,
      value: parseFloat(formData.value),
      createContact: !formData.contactId, // Flag to create new contact
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border-2 border-indigo-300 p-4 mb-3 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-indigo-600">
          {t('quickAddDeal')} • {stageName}
        </h4>
        <button
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
          disabled={saving}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Contact Search */}
        <ContactSearchDropdown
          value={formData.contactName}
          onChange={handleFormDataChange}
          onContactSearch={onContactSearch}
          disabled={saving}
          error={errors.contactName}
        />

        {/* Form Fields */}
        <QuickAddFormFields
          formData={formData}
          onChange={handleFormDataChange}
          errors={errors}
          disabled={saving}
        />

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex-1"
            disabled={saving}
          >
            <Check className="w-4 h-4" />
            {saving ? t('adding') : t('add')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium"
            disabled={saving}
          >
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuickAddDealCard;
