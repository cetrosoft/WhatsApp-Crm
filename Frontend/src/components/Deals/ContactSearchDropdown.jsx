/**
 * ContactSearchDropdown Component
 * Searchable dropdown for contact selection with autocomplete
 * Supports creating new contacts
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, AlertCircle, UserPlus } from 'lucide-react';

const ContactSearchDropdown = ({
  value,
  onChange,
  onContactSearch,
  disabled = false,
  error = null,
}) => {
  const { t, i18n } = useTranslation(['common']);
  const isRTL = i18n.language === 'ar';

  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [contactNotFound, setContactNotFound] = useState(false);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  /**
   * Handle contact name input change
   * Debounced search for contacts
   */
  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange({
      contactName: inputValue,
      contactId: null,
      email: '',
      phone: '',
      phone_country_code: '+966',
    });
    setContactNotFound(false);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (inputValue.trim().length >= 2) {
      setSearching(true);
      setShowDropdown(true);

      // Debounce search (300ms)
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await onContactSearch(inputValue.trim());
          setSearchResults(results);
          setSearching(false);

          // Show "not found" if no results
          if (results.length === 0) {
            setContactNotFound(true);
          }
        } catch (error) {
          console.error('Contact search error:', error);
          setSearching(false);
          setSearchResults([]);
        }
      }, 300);
    } else {
      setShowDropdown(false);
      setSearchResults([]);
    }
  };

  /**
   * Handle contact selection from dropdown
   */
  const handleContactSelect = (contact) => {
    onChange({
      contactName: contact.name,
      contactId: contact.id,
      email: contact.email || '',
      phone: contact.phone || '',
      phone_country_code: contact.phone_country_code || '+966',
    });
    setShowDropdown(false);
    setContactNotFound(false);
    setSearchResults([]);
  };

  /**
   * Handle create new contact option
   */
  const handleCreateNewContact = () => {
    setContactNotFound(false);
    setShowDropdown(false);
    // Keep the typed name and let user fill email/phone
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
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  /**
   * Cleanup timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {t('contact')} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={t('searchContactByName')}
          className={`w-full px-3 py-2 text-sm border rounded-lg ${isRTL ? 'pr-9' : 'pl-9'} focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={disabled}
          autoComplete="off"
        />
        <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className={`absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto ${isRTL ? 'left-0' : 'right-0'}`}
        >
          {searching ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              {t('searching')}...
            </div>
          ) : searchResults.length > 0 ? (
            <>
              {searchResults.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => handleContactSelect(contact)}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                >
                  <div className="font-medium text-gray-900">{contact.name}</div>
                  <div className="text-xs text-gray-500">
                    {contact.email && <span>{contact.email}</span>}
                    {contact.email && contact.phone && <span className="mx-1">•</span>}
                    {contact.phone && <span>{contact.phone}</span>}
                  </div>
                </button>
              ))}
            </>
          ) : contactNotFound ? (
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-orange-600 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span>{t('contactNotFound')}</span>
              </div>
              <button
                type="button"
                onClick={handleCreateNewContact}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 text-sm font-medium"
              >
                <UserPlus className="w-4 h-4" />
                {t('createNewContact')}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ContactSearchDropdown;
