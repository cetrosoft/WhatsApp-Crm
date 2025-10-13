/**
 * CountryCodeSelector Component
 * Searchable dropdown for selecting country phone codes with bilingual support
 *
 * @reusable
 * @category Shared/Forms
 * @example
 * <CountryCodeSelector
 *   value={phoneCode}
 *   onChange={setPhoneCode}
 *   disabled={false}
 *   error={errors.phone}
 * />
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { countryAPI } from '../../services/api';

const CountryCodeSelector = ({
  value,
  onChange,
  disabled = false,
  error = null,
}) => {
  const { t, i18n } = useTranslation(['common']);
  const isRTL = i18n.language === 'ar';

  const [countries, setCountries] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  /**
   * Load countries on mount
   */
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const response = await countryAPI.getCountries();
        setCountries(response.countries || []);
      } catch (error) {
        console.error('Error loading countries:', error);
      }
    };
    loadCountries();
  }, []);

  /**
   * Get filtered countries based on search term (max 3 chars)
   */
  const getFilteredCountries = () => {
    if (!searchTerm) return countries;

    const searchLower = searchTerm.toLowerCase().slice(0, 3);
    return countries.filter(country =>
      country.code?.toLowerCase().includes(searchLower) ||
      country.name_en?.toLowerCase().includes(searchLower) ||
      country.name_ar?.includes(searchTerm.slice(0, 3))
    );
  };

  /**
   * Handle country selection
   */
  const handleCountrySelect = (country) => {
    onChange(country.phone_code);
    setShowDropdown(false);
    setSearchTerm('');
  };

  /**
   * Click outside to close dropdown
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
        setSearchTerm('');
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onClick={() => !disabled && setShowDropdown(true)}
        readOnly
        dir="ltr"
        className={`w-16 px-2 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
        disabled={disabled}
      />

      {/* Country Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className={`absolute top-full mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-50 ${isRTL ? 'left-0' : 'right-0'}`}
        >
          {/* Search Box */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.slice(0, 3))}
              placeholder={t('search') + ' (3 max)'}
              maxLength={3}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              autoFocus
            />
          </div>

          {/* Country List */}
          <div className="max-h-60 overflow-y-auto">
            {getFilteredCountries().length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-500 text-center">
                {t('noResults')}
              </div>
            ) : (
              getFilteredCountries().map((country) => (
                <button
                  key={country.id}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                    value === country.phone_code ? 'bg-indigo-50 text-indigo-600 font-medium' : ''
                  }`}
                >
                  <div className="font-medium">
                    {i18n.language === 'ar' && country.name_ar ? country.name_ar : country.name_en}
                  </div>
                  <div className="text-gray-500">
                    {country.code} {country.phone_code}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryCodeSelector;
