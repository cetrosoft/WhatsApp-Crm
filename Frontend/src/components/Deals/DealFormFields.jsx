/**
 * Deal Form Fields Component
 * All form fields for creating/editing deals
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react';
import SearchableSelect from '../SearchableSelect';

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'SAR', label: 'SAR (﷼)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
];

const DealFormFields = ({
  formData,
  handleChange,
  errors,
  pipeline,
  stages,
  contacts,
  companies,
  users,
  tags,
  tagInput,
  setTagInput,
  handleTagKeyDown,
  addTag,
  removeTag,
  loadingDropdowns,
}) => {
  const { t, i18n } = useTranslation(['common']);
  const isRTL = i18n.language === 'ar';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('dealTitle')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder={t('dealTitle')}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      {/* Value and Currency */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('dealValue')} <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="value"
            value={formData.value}
            onChange={handleChange}
            min="0"
            step="0.01"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              errors.value ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0.00"
          />
          {errors.value && (
            <p className="mt-1 text-sm text-red-600">{errors.value}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('currency')}
          </label>
          <SearchableSelect
            value={formData.currency}
            onChange={(value) => handleChange({ target: { name: 'currency', value } })}
            options={CURRENCIES}
            placeholder={t('currency')}
            displayKey="label"
            valueKey="value"
          />
        </div>
      </div>

      {/* Pipeline and Stage */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('pipeline')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={pipeline?.name || ''}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('stage')} <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            value={formData.stage_id}
            onChange={(value) => handleChange({ target: { name: 'stage_id', value } })}
            options={stages.map(s => ({ value: s.id, label: s.name }))}
            placeholder={t('selectStage')}
            displayKey="label"
            valueKey="value"
            className={errors.stage_id ? 'border-red-500' : ''}
          />
          {errors.stage_id && (
            <p className="mt-1 text-sm text-red-600">{errors.stage_id}</p>
          )}
        </div>
      </div>

      {/* Contact and Company */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('contact')}
          </label>
          {loadingDropdowns ? (
            <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
              {t('loading')}...
            </div>
          ) : (
            <SearchableSelect
              value={formData.contact_id}
              onChange={(value) => handleChange({ target: { name: 'contact_id', value } })}
              options={[{ value: '', label: t('selectContact') }, ...contacts.map(c => ({ value: c.id, label: c.name }))]}
              placeholder={t('selectContact')}
              displayKey="label"
              valueKey="value"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('company')}
          </label>
          {loadingDropdowns ? (
            <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
              {t('loading')}...
            </div>
          ) : (
            <SearchableSelect
              value={formData.company_id}
              onChange={(value) => handleChange({ target: { name: 'company_id', value } })}
              options={[{ value: '', label: t('selectCompany') }, ...companies.map(c => ({ value: c.id, label: c.name }))]}
              placeholder={t('selectCompany')}
              displayKey="label"
              valueKey="value"
            />
          )}
        </div>
      </div>

      {/* Expected Close Date and Probability */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('expectedCloseDate')}
          </label>
          <input
            type="date"
            name="expected_close_date"
            value={formData.expected_close_date}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('probability')} ({formData.probability}%)
          </label>
          <input
            type="range"
            name="probability"
            value={formData.probability}
            onChange={handleChange}
            min="0"
            max="100"
            step="5"
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Assigned To */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('assignedTo')}
        </label>
        <select
          name="assigned_to"
          value={formData.assigned_to}
          onChange={handleChange}
          disabled={loadingDropdowns}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">{t('unassigned')}</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.full_name}
            </option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('tags')}
        </label>
        <div className="space-y-2">
          {/* Tag input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={t('typeToAddTag')}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              {t('add')}
            </button>
          </div>
          <p className="text-xs text-gray-500">{t('pressEnterToAdd')}</p>

          {/* Tag chips */}
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tagId) => {
                const tag = tags.find(t => t.id === tagId);
                if (!tag) return null;
                const tagName = isRTL && tag.name_ar ? tag.name_ar : tag.name_en;
                return (
                  <span
                    key={tagId}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: tag.color || '#6366f1' }}
                  >
                    {tagName}
                    <button
                      type="button"
                      onClick={() => removeTag(tagId)}
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

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('notes')}
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder={t('notes')}
        />
      </div>
    </div>
  );
};

export default DealFormFields;
