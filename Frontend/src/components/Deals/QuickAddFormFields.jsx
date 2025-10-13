/**
 * QuickAddFormFields Component
 * Form fields for quick deal creation
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import CountryCodeSelector from './CountryCodeSelector';

const QuickAddFormFields = ({
  formData,
  onChange,
  errors,
  disabled = false,
}) => {
  const { t, i18n } = useTranslation(['common']);
  const isRTL = i18n.language === 'ar';

  /**
   * Handle phone number change (numeric only)
   */
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // Only allow digits
    onChange({ phone: value });
  };

  return (
    <>
      {/* Deal Title */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {t('dealTitle')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={t('dealTitle')}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={disabled}
        />
        {errors.title && (
          <p className="mt-1 text-xs text-red-600">{errors.title}</p>
        )}
      </div>

      {/* Phone with Country Code */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {t('phone')} {!formData.contactId && <span className="text-red-500">*</span>}
        </label>
        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Country Code Selector */}
          <CountryCodeSelector
            value={formData.phone_country_code}
            onChange={(value) => onChange({ phone_country_code: value })}
            disabled={disabled || !!formData.contactId}
            error={errors.phone}
          />

          {/* Phone Number Input */}
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handlePhoneChange}
            placeholder="501234567"
            maxLength={11}
            inputMode="numeric"
            pattern="[0-9]*"
            className={`w-28 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            } ${formData.contactId ? 'bg-gray-50' : ''}`}
            disabled={disabled || !!formData.contactId}
          />
        </div>
        {errors.phone && (
          <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
        )}
      </div>

      {/* Email (optional) */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {t('email')} <span className="text-xs text-gray-500">({t('optional')})</span>
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={(e) => onChange({ email: e.target.value })}
          placeholder={t('email')}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          } ${formData.contactId ? 'bg-gray-50' : ''}`}
          disabled={disabled || !!formData.contactId}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600">{errors.email}</p>
        )}
      </div>

      {/* Revenue */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {t('expectedRevenue')} <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="value"
          value={formData.value}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder="0.00"
          min="0"
          step="0.01"
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
            errors.value ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={disabled}
        />
        {errors.value && (
          <p className="mt-1 text-xs text-red-600">{errors.value}</p>
        )}
      </div>

      {/* New Contact Notice */}
      {!formData.contactId && formData.contactName && (
        <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{t('newContactWillBeCreated')}</span>
        </div>
      )}
    </>
  );
};

export default QuickAddFormFields;
