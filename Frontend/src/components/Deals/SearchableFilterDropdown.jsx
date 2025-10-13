/**
 * SearchableFilterDropdown Component
 * Reusable dropdown with search functionality
 * Supports both single-select and multi-select modes
 *
 * @reusable
 * @category Shared/Filters
 * @example
 * <SearchableFilterDropdown
 *   label="Assigned To"
 *   icon={User}
 *   value={selectedUser}
 *   onChange={setSelectedUser}
 *   options={users}
 *   getDisplayValue={() => 'Selected User'}
 *   renderOption={(user) => user.name}
 * />
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Search } from 'lucide-react';

const SearchableFilterDropdown = ({
  label,
  icon: Icon,
  value,
  onChange,
  options,
  multiSelect = false,
  loading = false,
  getDisplayValue,
  renderOption,
  placeholder,
}) => {
  const { t, i18n } = useTranslation(['common']);
  const isRTL = i18n.language === 'ar';

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search
  const filteredOptions = options.filter(option => {
    const optionText = renderOption ? renderOption(option, true) : option.label || '';
    return optionText.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSelect = (optionValue) => {
    if (multiSelect) {
      const currentValues = value || [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleClear = () => {
    onChange(multiSelect ? [] : null);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {Icon && <Icon className="w-3 h-3 inline me-1" />}
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-start flex items-center justify-between hover:border-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        disabled={loading}
      >
        <span className="truncate">
          {getDisplayValue ? getDisplayValue(value) : (placeholder || t('select'))}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ms-2" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-hidden">
          {/* Search Box */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 ${isRTL ? 'right-2' : 'left-2'}`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('search')}
                className={`w-full ${isRTL ? 'pr-8 pl-2' : 'pl-8 pr-2'} py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent`}
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {/* "All" option for single-select */}
            {!multiSelect && (
              <button
                onClick={handleClear}
                className="w-full text-start px-3 py-2 hover:bg-gray-50 text-sm"
              >
                {t('all')}
              </button>
            )}

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                {t('noResults')}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const optionValue = option.value || option.id;
                const isSelected = multiSelect
                  ? (value || []).includes(optionValue)
                  : value === optionValue;

                if (multiSelect) {
                  return (
                    <label
                      key={optionValue}
                      className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelect(optionValue)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="ms-2 text-sm text-gray-700">
                        {renderOption ? renderOption(option) : option.label}
                      </span>
                    </label>
                  );
                } else {
                  return (
                    <button
                      key={optionValue}
                      onClick={() => handleSelect(optionValue)}
                      className={`w-full text-start px-3 py-2 hover:bg-gray-50 text-sm ${
                        isSelected ? 'bg-indigo-50 text-indigo-700 font-medium' : ''
                      }`}
                    >
                      {renderOption ? renderOption(option) : option.label}
                    </button>
                  );
                }
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableFilterDropdown;
