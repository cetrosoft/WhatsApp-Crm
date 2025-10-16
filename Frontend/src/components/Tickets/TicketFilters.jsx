/**
 * TicketFilters Component
 * Advanced filtering for tickets
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Tag, Folder, AlertCircle, Zap, Calendar, Building2, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { userAPI, tagAPI, ticketAPI, contactAPI, companyAPI } from '../../services/api';
import MultiSelectTags from '../MultiSelectTags';
import SearchableSelect from '../SearchableSelect';

const TicketFilters = ({ filters, onFiltersChange, isOpen }) => {
  const { t, i18n } = useTranslation(['common']);
  const isRTL = i18n.language === 'ar';

  // State for filter options
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Status options
  const statusOptions = [
    { value: 'open', label: t('statusOpen') },
    { value: 'in_progress', label: t('statusInProgress') },
    { value: 'waiting', label: t('statusWaiting') },
    { value: 'resolved', label: t('statusResolved') },
    { value: 'closed', label: t('statusClosed') },
  ];

  // Priority options
  const priorityOptions = [
    { value: 'low', label: t('priorityLow') },
    { value: 'medium', label: t('priorityMedium') },
    { value: 'high', label: t('priorityHigh') },
    { value: 'urgent', label: t('priorityUrgent') },
  ];

  // Load filter data when panel opens
  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadTags();
      loadCategories();
      loadContacts();
      loadCompanies();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await userAPI.getUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error(t('failedToLoad', { resource: t('users') }));
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadTags = async () => {
    try {
      setLoadingTags(true);
      const response = await tagAPI.getTags();
      setTags(response.data || []);
    } catch (error) {
      console.error('Error loading tags:', error);
      toast.error(t('failedToLoad', { resource: t('tags') }));
    } finally {
      setLoadingTags(false);
    }
  };

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await ticketAPI.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error(t('failedToLoad', { resource: t('ticketCategories') }));
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadContacts = async () => {
    try {
      setLoadingContacts(true);
      const response = await contactAPI.getContacts();
      setContacts(response.data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error(t('failedToLoad', { resource: t('contacts') }));
    } finally {
      setLoadingContacts(false);
    }
  };

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const response = await companyAPI.getCompanies();
      setCompanies(response.data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error(t('failedToLoad', { resource: t('companies') }));
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      status: null,
      priority: null,
      category: null,
      assignedTo: null,
      contact: null,
      company: null,
      tags: [],
      showOverdue: false,
      showUnassigned: false,
      dueDateFrom: null,
      dueDateTo: null,
    });
  };

  const countActiveFilters = () => {
    let count = 0;
    if (filters.status) count++;
    if (filters.priority) count++;
    if (filters.category) count++;
    if (filters.assignedTo) count++;
    if (filters.contact) count++;
    if (filters.company) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    if (filters.showOverdue) count++;
    if (filters.showUnassigned) count++;
    if (filters.dueDateFrom) count++;
    if (filters.dueDateTo) count++;
    return count;
  };

  const hasActiveFilters = () => {
    return countActiveFilters() > 0;
  };

  if (!isOpen) return null;

  return (
    <div className="bg-white border-x border-b border-gray-200 rounded-b-lg shadow-sm px-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{t('advancedFilters')}</h3>
        {hasActiveFilters() && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {t('clearAll')}
          </button>
        )}
      </div>

      {/* Filter Grid */}
      <div className="space-y-3">
        {/* Row 1: Status, Priority, Category, Assigned To */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <AlertCircle className="w-3 h-3 inline me-1" />
              {t('ticketStatus')}
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || null)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">{t('all')}</option>
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <Zap className="w-3 h-3 inline me-1" />
              {t('ticketPriority')}
            </label>
            <select
              value={filters.priority || ''}
              onChange={(e) => handleFilterChange('priority', e.target.value || null)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">{t('all')}</option>
              {priorityOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <Folder className="w-3 h-3 inline me-1" />
              {t('ticketCategory')}
            </label>
            <select
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value || null)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loadingCategories}
            >
              <option value="">{t('all')}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {isRTL && cat.name_ar ? cat.name_ar : cat.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <User className="w-3 h-3 inline me-1" />
              {t('assignedTo')}
            </label>
            <select
              value={filters.assignedTo || ''}
              onChange={(e) => handleFilterChange('assignedTo', e.target.value || null)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loadingUsers}
            >
              <option value="">{t('all')}</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Contact, Company, Date From, Date To */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Contact */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <UserCircle className="w-3 h-3 inline me-1" />
              {t('contact')}
            </label>
            <SearchableSelect
              value={filters.contact || null}
              onChange={(value) => handleFilterChange('contact', value)}
              options={contacts}
              placeholder={t('selectContact')}
              getOptionLabel={(contact) => contact.name}
              getOptionValue={(contact) => contact.id}
              allowClear
              disabled={loadingContacts}
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <Building2 className="w-3 h-3 inline me-1" />
              {t('company')}
            </label>
            <SearchableSelect
              value={filters.company || null}
              onChange={(value) => handleFilterChange('company', value)}
              options={companies}
              placeholder={t('selectCompany')}
              getOptionLabel={(company) => company.name}
              getOptionValue={(company) => company.id}
              allowClear
              disabled={loadingCompanies}
            />
          </div>

          {/* Close Date From */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <Calendar className="w-3 h-3 inline me-1" />
              {t('ticketDueDate')} ({t('from')})
            </label>
            <input
              type="date"
              value={filters.dueDateFrom || ''}
              onChange={(e) => handleFilterChange('dueDateFrom', e.target.value || null)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Close Date To */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <Calendar className="w-3 h-3 inline me-1" />
              {t('ticketDueDate')} ({t('to')})
            </label>
            <input
              type="date"
              value={filters.dueDateTo || ''}
              onChange={(e) => handleFilterChange('dueDateTo', e.target.value || null)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Row 3: Tags + Checkboxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Tags (spans 2 columns) */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <Tag className="w-3 h-3 inline me-1" />
              {t('ticketTags')}
            </label>
            <MultiSelectTags
              selectedTags={filters.tags || []}
              onChange={(selectedTags) => handleFilterChange('tags', selectedTags)}
              options={tags}
              placeholder={t('selectTags')}
            />
          </div>

          {/* Checkboxes (span 1 column) */}
          <div className="flex flex-col gap-2 justify-end pb-1">
            {/* Show Overdue */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showOverdue || false}
                onChange={(e) => handleFilterChange('showOverdue', e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">{t('showOverdue')}</span>
            </label>

            {/* Show Unassigned */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showUnassigned || false}
                onChange={(e) => handleFilterChange('showUnassigned', e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">{t('showUnassigned')}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters() && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            <strong>{t('activeFilters')}:</strong> {countActiveFilters()} {t('applied')}
          </p>
        </div>
      )}
    </div>
  );
};

export default TicketFilters;
