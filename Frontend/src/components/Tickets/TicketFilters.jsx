/**
 * TicketFilters Component
 * Advanced filtering for tickets
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Tag, Folder, AlertCircle, Zap, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { userAPI, tagAPI, ticketAPI } from '../../services/api';

const TicketFilters = ({ filters, onFiltersChange, isOpen }) => {
  const { t, i18n } = useTranslation(['common']);
  const isRTL = i18n.language === 'ar';

  // State for filter options
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

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
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await userAPI.getUsers();
      setUsers(response.users || []);
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
      setTags(response.tags || []);
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
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error(t('failedToLoad', { resource: t('ticketCategories') }));
    } finally {
      setLoadingCategories(false);
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
        {/* Row 1: Status, Priority, Category */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
        </div>

        {/* Row 2: Assigned To, Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

          {/* Tags (Multi-select placeholder - simplified) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <Tag className="w-3 h-3 inline me-1" />
              {t('ticketTags')}
            </label>
            <select
              multiple
              value={filters.tags || []}
              onChange={(e) => {
                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                handleFilterChange('tags', selectedOptions);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loadingTags}
              size={3}
            >
              {tags.map(tag => (
                <option key={tag.id} value={tag.id}>
                  {isRTL && tag.name_ar ? tag.name_ar : tag.name_en}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple</p>
          </div>
        </div>

        {/* Row 3: Due Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Due Date From */}
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

          {/* Due Date To */}
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

        {/* Row 4: Checkboxes */}
        <div className="flex flex-wrap gap-4">
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
