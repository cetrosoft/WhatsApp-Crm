/**
 * FilterPanel Component
 * Advanced filtering for deals (Odoo-style)
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Tag, Percent } from 'lucide-react';
import { userAPI, tagAPI } from '../../services/api';
import toast from 'react-hot-toast';
import SearchableFilterDropdown from './SearchableFilterDropdown';
import FilterValueRange from './FilterValueRange';
import FilterDatePeriod from './FilterDatePeriod';
import { countActiveFilters } from '../../utils/filterUtils';

const FilterPanel = ({ filters, onFiltersChange, isOpen }) => {
  const { t, i18n } = useTranslation(['common']);
  const isRTL = i18n.language === 'ar';

  // State for filter options
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);

  // Probability options
  const probabilityOptions = [
    { value: '0-25', label: '0-25%' },
    { value: '25-50', label: '25-50%' },
    { value: '50-75', label: '50-75%' },
    { value: '75-100', label: '75-100%' },
  ];

  // Load users and tags when panel opens
  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadTags();
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
      console.log('Tags loaded:', response);
      setTags(response.data || []);
    } catch (error) {
      console.error('Error loading tags:', error);
      toast.error(t('failedToLoad', { resource: t('tags') }));
    } finally {
      setLoadingTags(false);
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
      assignedTo: null,
      tags: [],
      probability: null,
      valueMin: null,
      valueMax: null,
      expectedClosePeriod: null,
      createdPeriod: null,
    });
  };

  const hasActiveFilters = () => {
    return countActiveFilters(filters) > 0;
  };

  // Helper functions for display
  const getSelectedTagNames = () => {
    if (!filters.tags || filters.tags.length === 0) return t('selectTags');
    const selectedTags = tags.filter(tag => filters.tags.includes(tag.id));
    if (selectedTags.length === 1) {
      const tag = selectedTags[0];
      return isRTL && tag?.name_ar ? tag.name_ar : tag?.name_en || t('tag');
    }
    return `${selectedTags.length} ${t('tagsSelected')}`;
  };

  const getSelectedUserName = () => {
    if (!filters.assignedTo) return t('all');
    const selectedUser = users.find(user => user.id === filters.assignedTo);
    return selectedUser?.full_name || selectedUser?.email || t('user');
  };

  const getSelectedProbabilityLabel = () => {
    if (!filters.probability) return t('all');
    const selectedOption = probabilityOptions.find(opt => opt.value === filters.probability);
    return selectedOption?.label || t('all');
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

      {/* Filter Grid - Compact 2 Rows */}
      <div className="space-y-3">
        {/* Row 1: User, Tags, Probability, Value Min, Value Max */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Assigned To */}
          <SearchableFilterDropdown
            label={t('assignedTo')}
            icon={User}
            value={filters.assignedTo}
            onChange={(value) => handleFilterChange('assignedTo', value)}
            options={users}
            loading={loadingUsers}
            getDisplayValue={getSelectedUserName}
            renderOption={(user) => user.full_name || user.email}
          />

          {/* Tags */}
          <SearchableFilterDropdown
            label={t('tags')}
            icon={Tag}
            value={filters.tags}
            onChange={(value) => handleFilterChange('tags', value)}
            options={tags}
            loading={loadingTags}
            multiSelect
            getDisplayValue={getSelectedTagNames}
            renderOption={(tag) => isRTL && tag.name_ar ? tag.name_ar : tag.name_en || t('tag')}
          />

          {/* Probability */}
          <SearchableFilterDropdown
            label={t('probability')}
            icon={Percent}
            value={filters.probability}
            onChange={(value) => handleFilterChange('probability', value)}
            options={probabilityOptions}
            getDisplayValue={getSelectedProbabilityLabel}
          />

          {/* Value Min/Max */}
          <FilterValueRange
            valueMin={filters.valueMin}
            valueMax={filters.valueMax}
            onChange={handleFilterChange}
          />
        </div>

        {/* Row 2: Date Periods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Expected Close Date Period */}
          <FilterDatePeriod
            label={t('expectedCloseDate')}
            value={filters.expectedClosePeriod}
            onChange={(value) => handleFilterChange('expectedClosePeriod', value)}
          />

          {/* Created Date Period */}
          <FilterDatePeriod
            label={t('createdAt')}
            value={filters.createdPeriod}
            onChange={(value) => handleFilterChange('createdPeriod', value)}
          />
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters() && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            <strong>{t('activeFilters')}:</strong> {countActiveFilters(filters)} {t('applied')}
          </p>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
