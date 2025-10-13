/**
 * Contact Form Fields Component
 * Reusable form fields for contact creation/editing
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, User, Trash2, Plus, X } from 'lucide-react';
import SearchableSelect from '../SearchableSelect';

const ContactFormFields = ({
  formData,
  handleChange,
  avatarPreview,
  fileInputRef,
  handleAvatarSelect,
  handleRemoveAvatar,
  tagInput,
  setTagInput,
  handleAddTag,
  handleRemoveTag,
  handleTagKeyPress,
  countries,
  statuses,
  users,
  tags,
  leadSources,
  companies,
}) => {
  const { t, i18n } = useTranslation(['contacts', 'common']);
  const isRTL = i18n.language === 'ar';

  return (
    <div className="space-y-5">
      {/* Avatar Upload */}
      <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center overflow-hidden border-2 border-indigo-300 shadow-sm">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-10 h-10 text-indigo-600" />
          )}
        </div>
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleAvatarSelect}
            className="hidden"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              {avatarPreview ? t('changeAvatar') : t('uploadAvatar')}
            </button>
            {avatarPreview && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-md text-sm font-medium text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t('remove')}
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            JPG, PNG or WEBP. Max 2MB
          </p>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('contactDetails')}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Name */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('name')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder={t('name')}
            />
          </div>

          {/* Phone with Country Code */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('phone')} <span className="text-red-500">*</span>
            </label>
            <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {/* Country Code Dropdown with Flag Display */}
              <div className="relative">
                {/* Flag Display as Image */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                  {(() => {
                    const selectedCountry = countries.find(c => c.phone_code === formData.phone_country_code);
                    if (!selectedCountry || !selectedCountry.code) return null;
                    return (
                      <span
                        className={`fi fi-${selectedCountry.code.toLowerCase()} text-lg`}
                        style={{ fontSize: '1.25rem', lineHeight: 1 }}
                      />
                    );
                  })()}
                </div>
                <select
                  name="phone_country_code"
                  value={formData.phone_country_code}
                  onChange={handleChange}
                  className="w-28 pl-10 pr-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors appearance-none"
                >
                  {countries.map((country) => (
                    <option key={country.id} value={country.phone_code}>
                      {country.code} {country.phone_code}
                    </option>
                  ))}
                </select>
              </div>
              {/* Phone Number Input */}
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="123456789"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('email')}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="email@example.com"
            />
          </div>

          {/* Position */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('position')}
            </label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder={t('position')}
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('company')}
            </label>
            <SearchableSelect
              value={formData.company_id}
              onChange={(value) => handleChange({ target: { name: 'company_id', value: value || '' } })}
              options={companies}
              placeholder={t('selectCompany')}
              displayKey="name"
              valueKey="id"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('status')}
            </label>
            <SearchableSelect
              value={formData.status_id}
              onChange={(value) => handleChange({ target: { name: 'status_id', value: value || '' } })}
              options={[
                { label: t('selectStatus'), value: '' },
                ...statuses.map(status => ({
                  label: isRTL ? status.name_ar : status.name_en,
                  value: status.id
                }))
              ]}
              placeholder={t('selectStatus')}
              displayKey="label"
              valueKey="value"
            />
          </div>

          {/* Tags */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('tags')}
            </label>

            {/* Tag Input */}
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
                placeholder={t('addTag')}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-1 text-sm"
              >
                <Plus className="w-4 h-4" />
                {t('add')}
              </button>
            </div>

            {/* Tags Display */}
            {formData.tag_ids.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tag_ids.map((tagId) => {
                  const tag = tags.find(t => t.id === tagId);
                  if (!tag) return null;
                  const tagName = isRTL && tag.name_ar ? tag.name_ar : tag.name_en;
                  return (
                    <span
                      key={tagId}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: tag.color || '#6366f1' }}
                    >
                      {tagName}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tagId)}
                        className="hover:opacity-80 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Location Information */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('locationInfo')}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Country */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('country')}
            </label>
            <SearchableSelect
              value={formData.country_id}
              onChange={(value) => handleChange({ target: { name: 'country_id', value: value || '' } })}
              options={countries}
              placeholder={t('selectCountry')}
              displayKey={isRTL ? 'name_ar' : 'name_en'}
              valueKey="id"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('city')}
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder={t('city')}
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('address')}
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder={t('address')}
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('additionalInfo')}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Lead Source */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('leadSource')}
            </label>
            <SearchableSelect
              value={formData.lead_source}
              onChange={(value) => handleChange({ target: { name: 'lead_source', value: value || '' } })}
              options={[
                { label: t('selectLeadSource'), value: '' },
                ...leadSources.map(source => ({
                  label: isRTL && source.name_ar ? source.name_ar : source.name_en,
                  value: source.slug
                }))
              ]}
              placeholder={t('selectLeadSource')}
              displayKey="label"
              valueKey="value"
            />
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('assignedTo')}
            </label>
            <SearchableSelect
              value={formData.assigned_to}
              onChange={(value) => handleChange({ target: { name: 'assigned_to', value: value || '' } })}
              options={[
                { label: t('selectUser'), value: '' },
                ...users.map(user => ({
                  label: user.full_name,
                  value: user.id
                }))
              ]}
              placeholder={t('selectUser')}
              displayKey="label"
              valueKey="value"
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('notes')}
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
              placeholder={t('notes')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactFormFields;
