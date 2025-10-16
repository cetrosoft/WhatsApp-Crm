/**
 * Quick Add Ticket Card Component
 * Inline form for rapid ticket creation (matches Deals pattern)
 * Appears at top of Kanban column
 *
 * Smart Features:
 * - Auto-sets and HIDES the field that matches groupBy (status/priority)
 * - Single "Related To" field combining Contacts + Companies + Deals
 * - Auto-derives contact_id, company_id, deal_id based on selection
 * - Handles orphan records (contacts without companies, etc.)
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import SearchableSelect from '../SearchableSelect';
import RelatedToSelect from '../RelatedToSelect';

const QuickAddTicketCard = ({
  columnId,
  columnName,
  groupBy,
  onSubmit,
  onCancel,
  categories,
  users,
  contacts,
  companies,
  deals,
  saving
}) => {
  const { t, i18n } = useTranslation(['common']);
  const isRTL = i18n.language === 'ar';

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    related_to_type: null,    // 'contact' | 'company' | 'deal'
    related_to_id: null,
    contact_id: null,         // Auto-derived
    company_id: null,         // Auto-derived
    deal_id: null,            // Auto-derived
    category_id: '',
    priority: 'medium',
    status: 'open',
    assigned_to: ''
  });

  const [errors, setErrors] = useState({});

  // Auto-set status or priority based on column group
  useEffect(() => {
    if (groupBy === 'status') {
      setFormData(prev => ({ ...prev, status: columnId }));
    } else if (groupBy === 'priority') {
      setFormData(prev => ({ ...prev, priority: columnId }));
    }
  }, [groupBy, columnId]);

  /**
   * Handle "Related To" selection from RelatedToSelect
   * Auto-derives contact_id, company_id, deal_id based on selected option
   */
  const handleRelatedToChange = (selectedId, selectedOption) => {
    if (!selectedId || !selectedOption) {
      // Clear selection
      setFormData(prev => ({
        ...prev,
        related_to_type: null,
        related_to_id: null,
        contact_id: null,
        company_id: null,
        deal_id: null
      }));
      return;
    }

    // Auto-derive based on type
    const updates = {
      related_to_type: selectedOption.type,
      related_to_id: selectedOption.id,
      contact_id: null,
      company_id: null,
      deal_id: null
    };

    if (selectedOption.type === 'contact') {
      updates.contact_id = selectedOption.data.id;
      updates.company_id = selectedOption.data.company_id || null;
    } else if (selectedOption.type === 'company') {
      updates.company_id = selectedOption.data.id;
    } else if (selectedOption.type === 'deal') {
      updates.deal_id = selectedOption.data.id;
      updates.contact_id = selectedOption.data.contact_id || null;
      updates.company_id = selectedOption.data.company_id || null;
    }

    setFormData(prev => ({ ...prev, ...updates }));
  };

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error
    setErrors(prev => ({ ...prev, [name]: null }));
  };

  /**
   * Validate form
   */
  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = t('required');
    }

    if (!formData.category_id) {
      newErrors.category_id = t('required');
    }

    if (!formData.priority) {
      newErrors.priority = t('required');
    }

    if (!formData.status) {
      newErrors.status = t('required');
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
      title: formData.title,
      contact_id: formData.contact_id || null,
      company_id: formData.company_id || null,
      deal_id: formData.deal_id || null,
      category_id: formData.category_id,
      priority: formData.priority,
      status: formData.status,
      assigned_to: formData.assigned_to || null
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border-2 border-indigo-300 p-4 mb-3 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-indigo-600">
          {t('quickAdd')} • {columnName}
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
        {/* Title */}
        <div>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder={t('ticketTitle') + ' *'}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={saving}
            autoFocus
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-500">{errors.title}</p>
          )}
        </div>

        {/* Related To (Contact | Company | Deal) - Optional */}
        <div>
          <RelatedToSelect
            contacts={contacts}
            companies={companies}
            deals={deals}
            value={formData.related_to_id}
            onChange={handleRelatedToChange}
            placeholder={t('relatedTo') + ' (' + t('optional') + ')'}
            disabled={saving}
            allowClear
          />
        </div>

        {/* Category */}
        <div>
          <SearchableSelect
            options={categories}
            value={formData.category_id}
            onChange={(value) => {
              setFormData(prev => ({ ...prev, category_id: value }));
              setErrors(prev => ({ ...prev, category_id: null }));
            }}
            placeholder={t('selectCategory') + ' *'}
            getOptionLabel={(cat) => isRTL && cat.name_ar ? cat.name_ar : cat.name_en}
            getOptionValue={(cat) => cat.id}
            disabled={saving}
            error={errors.category_id}
          />
          {errors.category_id && (
            <p className="mt-1 text-xs text-red-500">{errors.category_id}</p>
          )}
        </div>

        {/* Priority (Only show if NOT grouping by priority) */}
        {groupBy !== 'priority' && (
          <div>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.priority ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={saving}
            >
              <option value="low">{t('priorityLow')}</option>
              <option value="medium">{t('priorityMedium')}</option>
              <option value="high">{t('priorityHigh')}</option>
              <option value="urgent">{t('priorityUrgent')}</option>
            </select>
          </div>
        )}

        {/* Status (Only show if NOT grouping by status) */}
        {groupBy !== 'status' && (
          <div>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.status ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={saving}
            >
              <option value="open">{t('statusOpen')}</option>
              <option value="in_progress">{t('statusInProgress')}</option>
              <option value="waiting">{t('statusWaiting')}</option>
              <option value="resolved">{t('statusResolved')}</option>
              <option value="closed">{t('statusClosed')}</option>
            </select>
          </div>
        )}

        {/* Assigned To (Optional) */}
        <div>
          <SearchableSelect
            options={users}
            value={formData.assigned_to}
            onChange={(value) => {
              setFormData(prev => ({ ...prev, assigned_to: value }));
            }}
            placeholder={t('assignedTo') + ' (' + t('optional') + ')'}
            getOptionLabel={(user) => user.full_name || user.email}
            getOptionValue={(user) => user.id}
            disabled={saving}
            allowClear
          />
        </div>

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

export default QuickAddTicketCard;
