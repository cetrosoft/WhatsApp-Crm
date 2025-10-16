/**
 * Ticket Form Fields Component
 * Reusable form fields for creating/editing tickets
 *
 * @reusable
 * @category Tickets
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import SearchableSelect from '../SearchableSelect';
import { X } from 'lucide-react';

const TicketFormFields = ({
  mode = 'full', // 'quick' | 'full'
  formData,
  handleChange,
  errors,
  categories,
  contacts,
  companies,
  deals,
  users,
  tags,
  tagInput,
  setTagInput,
  handleTagKeyDown,
  addTag,
  removeTag,
  loadingDropdowns
}) => {
  const { t, i18n } = useTranslation(['common']);
  const isRTL = i18n.language === 'ar';

  // Quick mode: Only show mandatory fields (Title, Category, Priority, Status)
  if (mode === 'quick') {
    return (
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('ticketTitle')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={t('ticketTitle')}
            autoFocus
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('ticketCategory')} <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            options={categories}
            value={formData.category_id}
            onChange={(value) => handleChange({ target: { name: 'category_id', value } })}
            placeholder={t('selectCategory')}
            getOptionLabel={(cat) => isRTL && cat.name_ar ? cat.name_ar : cat.name_en}
            getOptionValue={(cat) => cat.id}
            disabled={loadingDropdowns}
            error={errors.category_id}
          />
          {errors.category_id && (
            <p className="mt-1 text-sm text-red-500">{errors.category_id}</p>
          )}
        </div>

        {/* Row: Priority + Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('ticketPriority')} <span className="text-red-500">*</span>
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.priority ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">{t('selectPriority')}</option>
              <option value="low">{t('priorityLow')}</option>
              <option value="medium">{t('priorityMedium')}</option>
              <option value="high">{t('priorityHigh')}</option>
              <option value="urgent">{t('priorityUrgent')}</option>
            </select>
            {errors.priority && (
              <p className="mt-1 text-sm text-red-500">{errors.priority}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('ticketStatus')} <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.status ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">{t('selectStatus')}</option>
              <option value="open">{t('statusOpen')}</option>
              <option value="in_progress">{t('statusInProgress')}</option>
              <option value="waiting">{t('statusWaiting')}</option>
              <option value="resolved">{t('statusResolved')}</option>
              <option value="closed">{t('statusClosed')}</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-500">{errors.status}</p>
            )}
          </div>
        </div>

        {/* Help text */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
          <p className="text-sm text-indigo-700">
            💡 {t('quickAddHint')}: {t('quickAddHintText')}
          </p>
        </div>
      </div>
    );
  }

  // Full mode: Show all fields with optimized layout
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('ticketTitle')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder={t('ticketTitle')}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500">{errors.title}</p>
        )}
      </div>

      {/* Row: Category + Assigned To */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('ticketCategory')} <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            options={categories}
            value={formData.category_id}
            onChange={(value) => handleChange({ target: { name: 'category_id', value } })}
            placeholder={t('selectCategory')}
            getOptionLabel={(cat) => isRTL && cat.name_ar ? cat.name_ar : cat.name_en}
            getOptionValue={(cat) => cat.id}
            disabled={loadingDropdowns}
            error={errors.category_id}
          />
          {errors.category_id && (
            <p className="mt-1 text-sm text-red-500">{errors.category_id}</p>
          )}
        </div>

        {/* Assigned To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('assignedTo')}
          </label>
          <SearchableSelect
            options={users}
            value={formData.assigned_to}
            onChange={(value) => handleChange({ target: { name: 'assigned_to', value } })}
            placeholder={t('selectUser')}
            getOptionLabel={(user) => user.full_name || user.email}
            getOptionValue={(user) => user.id}
            disabled={loadingDropdowns}
            allowClear
          />
        </div>
      </div>

      {/* Row: Status + Priority + Close Date */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('ticketStatus')} <span className="text-red-500">*</span>
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              errors.status ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">{t('selectStatus')}</option>
            <option value="open">{t('statusOpen')}</option>
            <option value="in_progress">{t('statusInProgress')}</option>
            <option value="waiting">{t('statusWaiting')}</option>
            <option value="resolved">{t('statusResolved')}</option>
            <option value="closed">{t('statusClosed')}</option>
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-500">{errors.status}</p>
          )}
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('ticketPriority')} <span className="text-red-500">*</span>
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              errors.priority ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">{t('selectPriority')}</option>
            <option value="low">{t('priorityLow')}</option>
            <option value="medium">{t('priorityMedium')}</option>
            <option value="high">{t('priorityHigh')}</option>
            <option value="urgent">{t('priorityUrgent')}</option>
          </select>
          {errors.priority && (
            <p className="mt-1 text-sm text-red-500">{errors.priority}</p>
          )}
        </div>

        {/* Close Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('ticketDueDate')}
          </label>
          <input
            type="date"
            name="due_date"
            value={formData.due_date}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Row: Contact + Company */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('relatedContact')}
          </label>
          <SearchableSelect
            options={contacts}
            value={formData.contact_id}
            onChange={(value) => handleChange({ target: { name: 'contact_id', value } })}
            placeholder={t('selectContact')}
            getOptionLabel={(contact) => contact.name}
            getOptionValue={(contact) => contact.id}
            disabled={loadingDropdowns}
            allowClear
          />
        </div>

        {/* Company */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('relatedCompany')}
          </label>
          <SearchableSelect
            options={companies}
            value={formData.company_id}
            onChange={(value) => handleChange({ target: { name: 'company_id', value } })}
            placeholder={t('selectCompany')}
            getOptionLabel={(company) => company.name}
            getOptionValue={(company) => company.id}
            disabled={loadingDropdowns}
            allowClear
          />
        </div>
      </div>

      {/* Related Deal */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('relatedDeal')}
        </label>
        <SearchableSelect
          options={deals || []}
          value={formData.deal_id}
          onChange={(value) => handleChange({ target: { name: 'deal_id', value } })}
          placeholder={t('selectDeal')}
          getOptionLabel={(deal) => deal.title}
          getOptionValue={(deal) => deal.id}
          disabled={loadingDropdowns}
          allowClear
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('ticketTags')}
        </label>
        <div className="space-y-2">
          {/* Selected Tags */}
          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {formData.tags.map((tagId) => {
                const tag = tags.find(t => t.id === tagId);
                if (!tag) return null;
                const tagName = isRTL && tag.name_ar ? tag.name_ar : tag.name_en;
                return (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                    style={{
                      backgroundColor: tag.color ? `${tag.color}20` : '#e5e7eb',
                      color: tag.color || '#374151'
                    }}
                  >
                    {tagName}
                    <button
                      type="button"
                      onClick={() => removeTag(tagId)}
                      className="hover:bg-black hover:bg-opacity-10 rounded p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Tag Input */}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder={t('typeToAddTag')}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Description (moved to bottom) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('ticketDescription')}
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder={t('ticketDescription')}
        />
      </div>
    </div>
  );
};

export default TicketFormFields;
