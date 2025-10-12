/**
 * FilterPanel Component
 * Advanced filtering for deals (Odoo-style)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calendar, DollarSign, User, Tag, Percent, ChevronDown, Search } from 'lucide-react';
import { userAPI, tagAPI } from '../../services/api';
import toast from 'react-hot-toast';

const FilterPanel = ({ filters, onFiltersChange, isOpen }) => {
  const { t, i18n } = useTranslation(['common']);
  const isRTL = i18n.language === 'ar';

  // State for filter options
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);

  // State for searchable dropdowns
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);
  const [showAssignedToDropdown, setShowAssignedToDropdown] = useState(false);
  const [showProbabilityDropdown, setShowProbabilityDropdown] = useState(false);
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [assignedToSearchTerm, setAssignedToSearchTerm] = useState('');
  const [probabilitySearchTerm, setProbabilitySearchTerm] = useState('');

  // Refs for click outside detection
  const tagsDropdownRef = useRef(null);
  const assignedToDropdownRef = useRef(null);
  const probabilityDropdownRef = useRef(null);

  // Get current year
  const currentYear = new Date().getFullYear();

  // Probability options
  const probabilityOptions = [
    { value: '0-25', label: '0-25%' },
    { value: '25-50', label: '25-50%' },
    { value: '50-75', label: '50-75%' },
    { value: '75-100', label: '75-100%' },
  ];

  // Get month name
  const getMonthName = (monthIndex) => {
    const months = i18n.language === 'ar'
      ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthIndex];
  };

  // Get last 3 months as separate options
  const getLastThreeMonths = () => {
    const now = new Date();
    const months = [];
    for (let i = 2; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthIndex = date.getMonth();
      const year = date.getFullYear();
      months.push({
        value: `month-${year}-${monthIndex}`,
        label: `${getMonthName(monthIndex)} ${year}`
      });
    }
    return months;
  };

  // Period options with actual years
  const getPeriodOptions = () => {
    const lastThreeMonths = getLastThreeMonths();
    return [
      ...lastThreeMonths,
      { value: 'q1', label: 'Q1 (Jan-Mar)' },
      { value: 'q2', label: 'Q2 (Apr-Jun)' },
      { value: 'q3', label: 'Q3 (Jul-Sep)' },
      { value: 'q4', label: 'Q4 (Oct-Dec)' },
      { value: 'thisYear', label: `${currentYear}` },
      { value: 'lastYear', label: `${currentYear - 1}` },
    ];
  };

  // Load users for "Assigned To" filter
  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadTags();
    }
  }, [isOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tagsDropdownRef.current && !tagsDropdownRef.current.contains(event.target)) {
        setShowTagsDropdown(false);
      }
      if (assignedToDropdownRef.current && !assignedToDropdownRef.current.contains(event.target)) {
        setShowAssignedToDropdown(false);
      }
      if (probabilityDropdownRef.current && !probabilityDropdownRef.current.contains(event.target)) {
        setShowProbabilityDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      console.log('Tags loaded:', response);
      setTags(response.tags || response || []);
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
    return (
      filters.assignedTo ||
      (filters.tags && filters.tags.length > 0) ||
      filters.probability ||
      filters.valueMin ||
      filters.valueMax ||
      filters.expectedClosePeriod ||
      filters.createdPeriod
    );
  };

  // Toggle tag selection
  const toggleTag = (tagId) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId];
    handleFilterChange('tags', newTags);
  };

  // Get selected tag names
  const getSelectedTagNames = () => {
    if (!filters.tags || filters.tags.length === 0) return t('selectTags');
    const selectedTags = tags.filter(tag => filters.tags.includes(tag.id));
    if (selectedTags.length === 1) {
      const tag = selectedTags[0];
      return isRTL && tag?.name_ar ? tag.name_ar : tag?.name_en || t('tag');
    }
    return `${selectedTags.length} ${t('tagsSelected')}`;
  };

  // Get selected user name
  const getSelectedUserName = () => {
    if (!filters.assignedTo) return t('all');
    const selectedUser = users.find(user => user.id === filters.assignedTo);
    return selectedUser?.full_name || selectedUser?.email || t('user');
  };

  // Get selected probability label
  const getSelectedProbabilityLabel = () => {
    if (!filters.probability) return t('all');
    const selectedOption = probabilityOptions.find(opt => opt.value === filters.probability);
    return selectedOption?.label || t('all');
  };

  // Filter tags based on search
  const filteredTags = tags.filter(tag => {
    const tagName = isRTL && tag.name_ar ? tag.name_ar : tag.name_en || '';
    return tagName.toLowerCase().includes(tagSearchTerm.toLowerCase());
  });

  // Filter users based on search
  const filteredUsers = users.filter(user => {
    const userName = user.full_name || user.email || '';
    return userName.toLowerCase().includes(assignedToSearchTerm.toLowerCase());
  });

  // Filter probability based on search
  const filteredProbability = probabilityOptions.filter(opt =>
    opt.label.toLowerCase().includes(probabilitySearchTerm.toLowerCase())
  );

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
          {/* Assigned To - Searchable */}
          <div className="relative" ref={assignedToDropdownRef}>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <User className="w-3 h-3 inline me-1" />
              {t('assignedTo')}
            </label>
            <button
              type="button"
              onClick={() => setShowAssignedToDropdown(!showAssignedToDropdown)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-start flex items-center justify-between hover:border-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loadingUsers}
            >
              <span className="truncate">{getSelectedUserName()}</span>
              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ms-2" />
            </button>

            {showAssignedToDropdown && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-hidden">
                {/* Search Box */}
                <div className="p-2 border-b border-gray-200">
                  <div className="relative">
                    <Search className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 ${isRTL ? 'right-2' : 'left-2'}`} />
                    <input
                      type="text"
                      value={assignedToSearchTerm}
                      onChange={(e) => setAssignedToSearchTerm(e.target.value)}
                      placeholder={t('search')}
                      className={`w-full ${isRTL ? 'pr-8 pl-2' : 'pl-8 pr-2'} py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent`}
                    />
                  </div>
                </div>

                {/* Users List */}
                <div className="max-h-48 overflow-y-auto">
                  <button
                    onClick={() => {
                      handleFilterChange('assignedTo', null);
                      setShowAssignedToDropdown(false);
                      setAssignedToSearchTerm('');
                    }}
                    className="w-full text-start px-3 py-2 hover:bg-gray-50 text-sm"
                  >
                    {t('all')}
                  </button>
                  {filteredUsers.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500 text-center">
                      {t('noResults')}
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          handleFilterChange('assignedTo', user.id);
                          setShowAssignedToDropdown(false);
                          setAssignedToSearchTerm('');
                        }}
                        className={`w-full text-start px-3 py-2 hover:bg-gray-50 text-sm ${
                          filters.assignedTo === user.id ? 'bg-indigo-50 text-indigo-700 font-medium' : ''
                        }`}
                      >
                        {user.full_name || user.email}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tags - Searchable Multi-Select Dropdown */}
          <div className="relative" ref={tagsDropdownRef}>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <Tag className="w-3 h-3 inline me-1" />
              {t('tags')}
            </label>
            <button
              type="button"
              onClick={() => setShowTagsDropdown(!showTagsDropdown)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-start flex items-center justify-between hover:border-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loadingTags}
            >
              <span className="truncate">{getSelectedTagNames()}</span>
              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ms-2" />
            </button>

            {showTagsDropdown && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-hidden">
                {/* Search Box */}
                <div className="p-2 border-b border-gray-200">
                  <div className="relative">
                    <Search className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 ${isRTL ? 'right-2' : 'left-2'}`} />
                    <input
                      type="text"
                      value={tagSearchTerm}
                      onChange={(e) => setTagSearchTerm(e.target.value)}
                      placeholder={t('searchTags')}
                      className={`w-full ${isRTL ? 'pr-8 pl-2' : 'pl-8 pr-2'} py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent`}
                    />
                  </div>
                </div>

                {/* Tags List */}
                <div className="max-h-48 overflow-y-auto">
                  {filteredTags.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500 text-center">
                      {t('noTagsFound')}
                    </div>
                  ) : (
                    filteredTags.map((tag) => (
                      <label
                        key={tag.id}
                        className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.tags?.includes(tag.id) || false}
                          onChange={() => toggleTag(tag.id)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="ms-2 text-sm text-gray-700">
                          {isRTL && tag.name_ar ? tag.name_ar : tag.name_en || t('tag')}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Probability - Searchable */}
          <div className="relative" ref={probabilityDropdownRef}>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <Percent className="w-3 h-3 inline me-1" />
              {t('probability')}
            </label>
            <button
              type="button"
              onClick={() => setShowProbabilityDropdown(!showProbabilityDropdown)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-start flex items-center justify-between hover:border-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <span className="truncate">{getSelectedProbabilityLabel()}</span>
              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ms-2" />
            </button>

            {showProbabilityDropdown && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-hidden">
                {/* Search Box */}
                <div className="p-2 border-b border-gray-200">
                  <div className="relative">
                    <Search className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 ${isRTL ? 'right-2' : 'left-2'}`} />
                    <input
                      type="text"
                      value={probabilitySearchTerm}
                      onChange={(e) => setProbabilitySearchTerm(e.target.value)}
                      placeholder={t('search')}
                      className={`w-full ${isRTL ? 'pr-8 pl-2' : 'pl-8 pr-2'} py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent`}
                    />
                  </div>
                </div>

                {/* Probability List */}
                <div className="max-h-48 overflow-y-auto">
                  <button
                    onClick={() => {
                      handleFilterChange('probability', null);
                      setShowProbabilityDropdown(false);
                      setProbabilitySearchTerm('');
                    }}
                    className="w-full text-start px-3 py-2 hover:bg-gray-50 text-sm"
                  >
                    {t('all')}
                  </button>
                  {filteredProbability.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500 text-center">
                      {t('noResults')}
                    </div>
                  ) : (
                    filteredProbability.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          handleFilterChange('probability', option.value);
                          setShowProbabilityDropdown(false);
                          setProbabilitySearchTerm('');
                        }}
                        className={`w-full text-start px-3 py-2 hover:bg-gray-50 text-sm ${
                          filters.probability === option.value ? 'bg-indigo-50 text-indigo-700 font-medium' : ''
                        }`}
                      >
                        {option.label}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Value Range - Min */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <DollarSign className="w-3 h-3 inline me-1" />
              {t('minValue')}
            </label>
            <input
              type="number"
              value={filters.valueMin || ''}
              onChange={(e) => handleFilterChange('valueMin', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="0"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              min="0"
              step="1000"
            />
          </div>

          {/* Value Range - Max */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <DollarSign className="w-3 h-3 inline me-1" />
              {t('maxValue')}
            </label>
            <input
              type="number"
              value={filters.valueMax || ''}
              onChange={(e) => handleFilterChange('valueMax', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="999999"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              min="0"
              step="1000"
            />
          </div>
        </div>

        {/* Row 2: Date Periods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Expected Close Date Period */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <Calendar className="w-3 h-3 inline me-1" />
              {t('expectedCloseDate')}
            </label>
            <select
              value={filters.expectedClosePeriod || ''}
              onChange={(e) => handleFilterChange('expectedClosePeriod', e.target.value || null)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">{t('all')}</option>
              {getPeriodOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Created Date Period */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <Calendar className="w-3 h-3 inline me-1" />
              {t('createdAt')}
            </label>
            <select
              value={filters.createdPeriod || ''}
              onChange={(e) => handleFilterChange('createdPeriod', e.target.value || null)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">{t('all')}</option>
              {getPeriodOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
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

// Helper to count active filters
const countActiveFilters = (filters) => {
  let count = 0;
  if (filters.assignedTo) count++;
  if (filters.tags && filters.tags.length > 0) count++;
  if (filters.probability) count++;
  if (filters.valueMin) count++;
  if (filters.valueMax) count++;
  if (filters.expectedClosePeriod) count++;
  if (filters.createdPeriod) count++;
  return count;
};

export default FilterPanel;
