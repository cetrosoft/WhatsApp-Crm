/**
 * Searchable Select Component
 * Uses Headless UI Combobox for searchable dropdown functionality
 *
 * @reusable
 * @category Shared/Universal
 * @example
 * // Using simple string keys:
 * <SearchableSelect
 *   value={selectedId}
 *   onChange={setSelectedId}
 *   options={users}
 *   placeholder="Select user"
 *   displayKey="name"
 *   valueKey="id"
 * />
 *
 * // Using function props for complex logic:
 * <SearchableSelect
 *   value={selectedId}
 *   onChange={setSelectedId}
 *   options={users}
 *   placeholder="Select user"
 *   getOptionLabel={(user) => user.full_name || user.email}
 *   getOptionValue={(user) => user.id}
 *   allowClear
 * />
 */

import React, { useState } from 'react';
import { Combobox } from '@headlessui/react';
import { Check, ChevronDown, X } from 'lucide-react';

const SearchableSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  displayKey = 'label',
  valueKey = 'value',
  getOptionLabel = null,
  getOptionValue = null,
  allowClear = false,
  disabled = false,
  error = null,
  className = ''
}) => {
  const [query, setQuery] = useState('');

  // Helper functions to get label and value from option
  const getLabel = (option) => {
    if (!option) return '';
    if (getOptionLabel) return getOptionLabel(option);
    return typeof option === 'string' ? option : option[displayKey];
  };

  const getValue = (option) => {
    if (!option) return null;
    if (getOptionValue) return getOptionValue(option);
    return typeof option === 'string' ? option : option[valueKey];
  };

  // Find selected option
  const selectedOption = options.find(opt => getValue(opt) === value);

  // Filter options based on search query
  const filteredOptions = query === ''
    ? options
    : options.filter((option) => {
        const label = getLabel(option);
        return label && label.toLowerCase().includes(query.toLowerCase());
      });

  // Handle clear button click
  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setQuery('');
  };

  return (
    <Combobox
      value={value}
      onChange={onChange}
      disabled={disabled}
    >
      <div className="relative">
        <div className="relative">
          <Combobox.Input
            className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
              allowClear && value ? 'pr-16' : 'pr-10'
            } ${
              error ? 'border-red-500' : 'border-gray-300'
            } ${
              disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
            } ${className}`}
            displayValue={(val) => {
              if (!val) return '';
              const opt = selectedOption;
              return opt ? getLabel(opt) : '';
            }}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
          />

          {/* Clear Button */}
          {allowClear && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-8 flex items-center pr-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Dropdown Button */}
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </Combobox.Button>
        </div>

        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {filteredOptions.length === 0 && query !== '' ? (
            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
              Nothing found.
            </div>
          ) : (
            filteredOptions.map((option, idx) => {
              const optValue = getValue(option);
              const optLabel = getLabel(option);

              return (
                <Combobox.Option
                  key={idx}
                  value={optValue}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                    }`
                  }
                >
                  {({ selected, active }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                        {optLabel}
                      </span>
                      {selected && (
                        <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                          active ? 'text-white' : 'text-indigo-600'
                        }`}>
                          <Check className="w-4 h-4" />
                        </span>
                      )}
                    </>
                  )}
                </Combobox.Option>
              );
            })
          )}
        </Combobox.Options>
      </div>
    </Combobox>
  );
};

export default SearchableSelect;
