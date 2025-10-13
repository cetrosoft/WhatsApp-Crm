// Frontend/src/hooks/useDealsFilters.js
import { useState, useCallback, useMemo } from 'react';

export const useDealsFilters = (deals) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedProbability, setSelectedProbability] = useState('');
  const [valueRange, setValueRange] = useState({ min: '', max: '' });
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });

  // Get date range based on period selection
  const getPeriodDateRange = useCallback((period) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case 'today':
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        return { start: weekStart, end: weekEnd };
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { start: monthStart, end: monthEnd };
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        const quarterStart = new Date(today.getFullYear(), quarter * 3, 1);
        const quarterEnd = new Date(today.getFullYear(), quarter * 3 + 3, 0);
        return { start: quarterStart, end: quarterEnd };
      case 'year':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        const yearEnd = new Date(today.getFullYear(), 11, 31);
        return { start: yearStart, end: yearEnd };
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          return {
            start: new Date(customDateRange.start),
            end: new Date(customDateRange.end)
          };
        }
        return null;
      default:
        return null;
    }
  }, [customDateRange]);

  // Apply all filters to deals
  const filteredDeals = useMemo(() => {
    let filtered = [...deals];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(deal =>
        deal.title?.toLowerCase().includes(search) ||
        deal.contact?.name?.toLowerCase().includes(search) ||
        deal.company?.name?.toLowerCase().includes(search)
      );
    }

    // User filter
    if (selectedUsers.length > 0) {
      filtered = filtered.filter(deal =>
        selectedUsers.includes(deal.assignedTo?.toString())
      );
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(deal =>
        deal.tags?.some(tag => selectedTags.includes(tag.id?.toString()))
      );
    }

    // Probability filter
    if (selectedProbability) {
      filtered = filtered.filter(deal =>
        deal.probability?.toString() === selectedProbability
      );
    }

    // Value range filter
    if (valueRange.min || valueRange.max) {
      filtered = filtered.filter(deal => {
        const value = parseFloat(deal.value) || 0;
        const min = parseFloat(valueRange.min) || 0;
        const max = parseFloat(valueRange.max) || Infinity;
        return value >= min && value <= max;
      });
    }

    // Period filter
    if (selectedPeriod) {
      const dateRange = getPeriodDateRange(selectedPeriod);
      if (dateRange) {
        filtered = filtered.filter(deal => {
          const expectedCloseDate = new Date(deal.expectedCloseDate);
          return expectedCloseDate >= dateRange.start && expectedCloseDate <= dateRange.end;
        });
      }
    }

    return filtered;
  }, [deals, searchTerm, selectedUsers, selectedTags, selectedProbability, valueRange, selectedPeriod, getPeriodDateRange]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedUsers([]);
    setSelectedTags([]);
    setSelectedProbability('');
    setValueRange({ min: '', max: '' });
    setSelectedPeriod('');
    setCustomDateRange({ start: '', end: '' });
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return searchTerm || selectedUsers.length > 0 || selectedTags.length > 0 ||
           selectedProbability || valueRange.min || valueRange.max || selectedPeriod;
  }, [searchTerm, selectedUsers, selectedTags, selectedProbability, valueRange, selectedPeriod]);

  return {
    // Filter state
    searchTerm,
    selectedUsers,
    selectedTags,
    selectedProbability,
    valueRange,
    selectedPeriod,
    customDateRange,

    // Setters
    setSearchTerm,
    setSelectedUsers,
    setSelectedTags,
    setSelectedProbability,
    setValueRange,
    setSelectedPeriod,
    setCustomDateRange,

    // Computed
    filteredDeals,
    hasActiveFilters,

    // Actions
    resetFilters,
    getPeriodDateRange,
  };
};
