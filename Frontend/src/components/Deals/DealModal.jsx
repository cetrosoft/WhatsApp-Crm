/**
 * Deal Modal Component
 * Create/Edit deal with comprehensive form
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { dealAPI, contactAPI, companyAPI, userAPI } from '../../services/api';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import SearchableSelect from '../SearchableSelect';

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'SAR', label: 'SAR (﷼)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
];

const DealModal = ({ deal, pipeline, stages, onSave, onClose }) => {
  const { t } = useTranslation(['common']);
  const isEdit = !!deal;

  // Form state
  const [formData, setFormData] = useState({
    title: deal?.title || '',
    value: deal?.value || '',
    currency: deal?.currency || 'SAR',
    pipeline_id: deal?.pipeline_id || pipeline?.id || '',
    stage_id: deal?.stage_id || '',
    contact_id: deal?.contact_id || '',
    company_id: deal?.company_id || '',
    expected_close_date: deal?.expected_close_date || '',
    probability: deal?.probability || 50,
    assigned_to: deal?.assigned_to || '',
    notes: deal?.notes || '',
    tags: deal?.tags || [],
  });

  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Dropdown data
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  /**
   * Load dropdown data
   */
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        setLoadingDropdowns(true);
        const [contactsRes, companiesRes, usersRes] = await Promise.all([
          contactAPI.getContacts({ limit: 1000 }),
          companyAPI.getCompanies({ limit: 1000 }),
          userAPI.getUsers(),
        ]);

        setContacts(contactsRes.data || []);
        setCompanies(companiesRes.data || []);
        setUsers(usersRes.users || []);
      } catch (error) {
        console.error('Error loading dropdown data:', error);
        toast.error(t('failedToLoadData'));
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdownData();
  }, [t]);

  /**
   * Validate form
   */
  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = t('required');
    }

    if (!formData.value || formData.value <= 0) {
      newErrors.value = t('required');
    }

    if (!formData.pipeline_id) {
      newErrors.pipeline_id = t('required');
    }

    if (!formData.stage_id) {
      newErrors.stage_id = t('required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  /**
   * Handle tag input
   */
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  /**
   * Add tag
   */
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  /**
   * Remove tag
   */
  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  /**
   * Handle save
   */
  const handleSave = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setSaving(true);

      const dealData = {
        ...formData,
        value: parseFloat(formData.value),
        probability: parseInt(formData.probability),
        contact_id: formData.contact_id || null,
        company_id: formData.company_id || null,
        assigned_to: formData.assigned_to || null,
        expected_close_date: formData.expected_close_date || null,
      };

      if (isEdit) {
        await dealAPI.updateDeal(deal.id, dealData);
        toast.success(t('dealUpdated'));
      } else {
        await dealAPI.createDeal(dealData);
        toast.success(t('dealCreated'));
      }

      onSave();
    } catch (error) {
      console.error('Error saving deal:', error);
      const errorMessage = isEdit ? t('failedToUpdate', { resource: t('deal') }) : t('failedToCreate', { resource: t('deal') });
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEdit ? t('editDeal') : t('createDeal')}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
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
                    onChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
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
                    onChange={(value) => setFormData(prev => ({ ...prev, stage_id: value }))}
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
                      onChange={(value) => setFormData(prev => ({ ...prev, contact_id: value }))}
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
                      onChange={(value) => setFormData(prev => ({ ...prev, company_id: value }))}
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
                  {/* Tag chips */}
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-indigo-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Tag input */}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={addTag}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder={t('typeToAddTag')}
                  />
                  <p className="text-xs text-gray-500">{t('pressEnterToAdd')}</p>
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

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                disabled={saving}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving || loadingDropdowns}
              >
                {saving ? t('saving') : t('save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DealModal;
