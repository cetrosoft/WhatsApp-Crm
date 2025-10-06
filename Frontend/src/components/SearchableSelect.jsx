/**
 * Searchable Select Component
 * Uses Headless UI Combobox for searchable dropdown functionality
 */

import React, { useState } from 'react';
import { Combobox } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';

const SearchableSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  displayKey = 'label',
  valueKey = 'value',
  className = ''
}) => {
  const [query, setQuery] = useState('');

  // Find selected option
  const selectedOption = options.find(opt =>
    (opt[valueKey] || opt) === value
  );

  // Filter options based on search query
  const filteredOptions = query === ''
    ? options
    : options.filter((option) => {
        const label = typeof option === 'string' ? option : option[displayKey];
        return label.toLowerCase().includes(query.toLowerCase());
      });

  return (
    <Combobox
      value={value}
      onChange={onChange}
    >
      <div className="relative">
        <div className="relative">
          <Combobox.Input
            className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors pr-10 ${className}`}
            displayValue={(val) => {
              if (!val) return '';
              const opt = options.find(o => (o[valueKey] || o) === val);
              return typeof opt === 'string' ? opt : (opt?.[displayKey] || '');
            }}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
          />
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
              const optValue = typeof option === 'string' ? option : option[valueKey];
              const optLabel = typeof option === 'string' ? option : option[displayKey];

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
