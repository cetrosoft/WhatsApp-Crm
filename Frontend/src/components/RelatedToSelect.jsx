/**
 * RelatedToSelect Component
 * Performance-optimized dropdown for selecting Contacts, Companies, or Deals
 *
 * Features:
 * - Type filtering (Contact/Company/Deal) reduces dataset by ~66%
 * - Multi-field search (name + phone for contacts/companies, name for deals)
 * - Lazy loading (show 10 results, load more on scroll)
 * - Debounced search (300ms) prevents excessive re-renders
 * - Handles large datasets (>1000 records)
 *
 * @param {Array} contacts - Array of contact objects
 * @param {Array} companies - Array of company objects
 * @param {Array} deals - Array of deal objects
 * @param {string|null} value - Selected ID
 * @param {Function} onChange - Callback when selection changes
 * @param {string} placeholder - Placeholder text
 * @param {boolean} disabled - Disabled state
 * @param {boolean} allowClear - Show clear button
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, ChevronDown } from 'lucide-react';

// Debounce utility
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const RelatedToSelect = ({
  contacts = [],
  companies = [],
  deals = [],
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  allowClear = false
}) => {
  const { t, i18n } = useTranslation(['common']);
  const isRTL = i18n.language === 'ar';

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [activeType, setActiveType] = useState('all'); // 'all' | 'contact' | 'company' | 'deal'
  const [searchInput, setSearchInput] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);

  // Debounced search query (300ms)
  const searchQuery = useDebounce(searchInput, 300);

  // Refs
  const dropdownRef = useRef(null);
  const scrollRef = useRef(null);

  // Counts by type
  const contactCount = contacts.length;
  const companyCount = companies.length;
  const dealCount = deals.length;

  /**
   * Build combined options with metadata
   * Format: { type, id, label, sortKey, data, searchText }
   */
  const allOptions = useMemo(() => {
    const options = [];

    // Add contacts
    contacts.forEach(contact => {
      const companyInfo = contact.company?.name || contact.company_name || '';
      const label = companyInfo
        ? `${contact.name} (${companyInfo})`
        : contact.name;

      // Build searchable text (name + phone + mobile + email)
      const searchText = [
        contact.name,
        contact.phone,
        contact.mobile,
        contact.email
      ].filter(Boolean).join(' ').toLowerCase();

      options.push({
        type: 'contact',
        id: contact.id,
        label,
        icon: '📞',
        sortKey: `1_contact_${contact.name}`,
        data: contact,
        searchText,
        subtitle: companyInfo ? `🏢 ${companyInfo}` : null
      });
    });

    // Add companies
    companies.forEach(company => {
      const searchText = [
        company.name,
        company.phone,
        company.website
      ].filter(Boolean).join(' ').toLowerCase();

      options.push({
        type: 'company',
        id: company.id,
        label: company.name,
        icon: '🏢',
        sortKey: `2_company_${company.name}`,
        data: company,
        searchText,
        subtitle: company.phone ? `📞 ${company.phone}` : null
      });
    });

    // Add deals
    deals.forEach(deal => {
      const contactName = deal.contact?.name || '';
      const companyName = deal.company?.name || deal.company_name || '';
      const relatedInfo = contactName || companyName;
      const valueDisplay = deal.value ? ` - $${deal.value}` : '';
      const label = `${deal.title}${valueDisplay}`;

      const searchText = [
        deal.title,
        contactName,
        companyName
      ].filter(Boolean).join(' ').toLowerCase();

      options.push({
        type: 'deal',
        id: deal.id,
        label,
        icon: '💰',
        sortKey: `3_deal_${deal.title}`,
        data: deal,
        searchText,
        subtitle: relatedInfo ? `📞 ${relatedInfo}` : null
      });
    });

    return options.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [contacts, companies, deals]);

  /**
   * Filter by active type (reduces dataset by ~66%)
   */
  const filteredByType = useMemo(() => {
    if (activeType === 'all') return allOptions;
    return allOptions.filter(opt => opt.type === activeType);
  }, [allOptions, activeType]);

  /**
   * Search within filtered results (multi-field)
   */
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return filteredByType.slice(0, visibleCount);
    }

    const query = searchQuery.toLowerCase();
    const results = filteredByType.filter(opt =>
      opt.searchText.includes(query)
    );

    return results.slice(0, visibleCount);
  }, [filteredByType, searchQuery, visibleCount]);

  /**
   * Get selected option
   */
  const selectedOption = useMemo(() => {
    if (!value) return null;
    return allOptions.find(opt => opt.id === value);
  }, [value, allOptions]);

  /**
   * Handle type button click
   */
  const handleTypeClick = (type) => {
    setActiveType(type);
    setSearchInput('');
    setVisibleCount(10);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  };

  /**
   * Handle option click
   */
  const handleOptionClick = (option) => {
    onChange(option.id, option);
    setIsOpen(false);
    setSearchInput('');
    setVisibleCount(10);
  };

  /**
   * Handle clear
   */
  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null, null);
    setSearchInput('');
    setVisibleCount(10);
  };

  /**
   * Handle scroll - load more results
   */
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      setVisibleCount(prev => prev + 10);
    }
  };

  /**
   * Close dropdown on outside click
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  /**
   * Reset visible count when search or type changes
   */
  useEffect(() => {
    setVisibleCount(10);
  }, [searchQuery, activeType]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Input */}
      <div
        className={`w-full px-3 py-2 text-sm border rounded-lg bg-white cursor-pointer flex items-center justify-between ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'
        } ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-300'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption ? (
            <span className="flex items-center gap-1">
              <span>{selectedOption.icon}</span>
              <span>{selectedOption.label}</span>
            </span>
          ) : (
            placeholder
          )}
        </span>
        <div className="flex items-center gap-1">
          {allowClear && selectedOption && !disabled && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded"
              type="button"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Type Filter Buttons */}
          <div className="p-2 border-b border-gray-200">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTypeClick('contact')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeType === 'contact'
                    ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500'
                    : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">📞</span>
                  <span className="text-sm font-semibold">({contactCount})</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeClick('company')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeType === 'company'
                    ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500'
                    : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏢</span>
                  <span className="text-sm font-semibold">({companyCount})</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeClick('deal')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeType === 'deal'
                    ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500'
                    : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">💰</span>
                  <span className="text-sm font-semibold">({dealCount})</span>
                </div>
              </button>
            </div>

            {activeType !== 'all' && (
              <button
                type="button"
                onClick={() => handleTypeClick('all')}
                className="w-full mt-2 px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                {t('showAll')} ({contactCount + companyCount + dealCount})
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={
                  activeType === 'deal'
                    ? t('searchByName')
                    : t('searchByNameOrPhone')
                }
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Results */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="max-h-64 overflow-y-auto"
          >
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                {t('noResultsFound')}
              </div>
            ) : (
              <>
                {searchResults.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => handleOptionClick(option)}
                    className={`px-3 py-2 cursor-pointer hover:bg-indigo-50 border-b border-gray-100 ${
                      value === option.id ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{option.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {option.label}
                        </div>
                        {option.subtitle && (
                          <div className="text-xs text-gray-500 truncate">
                            {option.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Load More Hint */}
                {visibleCount < filteredByType.length && (
                  <div className="p-2 text-center text-xs text-gray-500 bg-gray-50">
                    {searchQuery
                      ? t('typeToSeeMore')
                      : `${t('showing')} ${searchResults.length} ${t('of')} ${filteredByType.length}`}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RelatedToSelect;
