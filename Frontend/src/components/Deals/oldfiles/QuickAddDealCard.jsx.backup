/**
 * Quick Add Deal Card Component
 * Odoo-style inline form for rapid deal creation
 * Appears at top of pipeline stage
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, Search, AlertCircle, UserPlus } from 'lucide-react';
import { countryAPI } from '../../services/api';

const QuickAddDealCard = ({
  stageId,
  stageName,
  onSubmit,
  onCancel,
  onContactSearch,
  saving
}) => {
  const { t, i18n } = useTranslation(['common']);
  const isRTL = i18n.language === 'ar';

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    contactName: '',
    contactId: null,
    email: '',
    phone: '',
    phone_country_code: '+966', // Default Saudi Arabia
    country_id: '', // Optional for contact creation
    value: '',
  });

  // UI state
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [contactNotFound, setContactNotFound] = useState(false);
  const [errors, setErrors] = useState({});
  const [countries, setCountries] = useState([]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');

  // Refs
  const contactInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const countryInputRef = useRef(null);
  const countryDropdownRef = useRef(null);

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
   * Handle contact name input change
   * Debounced search for contacts
   */
  const handleContactNameChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      contactName: value,
      contactId: null,
      email: '',
      phone: ''
    }));
    setContactNotFound(false);
    setErrors(prev => ({ ...prev, contactName: null }));

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length >= 2) {
      setSearching(true);
      setShowDropdown(true);

      // Debounce search (300ms)
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await onContactSearch(value.trim());
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
   * Auto-fill email, phone, and country code
   */
  const handleContactSelect = (contact) => {
    setFormData(prev => ({
      ...prev,
      contactName: contact.name,
      contactId: contact.id,
      email: contact.email || '',
      phone: contact.phone || '',
      phone_country_code: contact.phone_country_code || '+966',
    }));
    setShowDropdown(false);
    setContactNotFound(false);
    setSearchResults([]);
    setErrors(prev => ({ ...prev, contactName: null }));
  };

  /**
   * Handle create new contact option
   */
  const handleCreateNewContact = () => {
    setContactNotFound(false);
    setShowDropdown(false);
    // Keep the typed name and let user fill email/phone
    // contactId will remain null, signaling new contact creation
  };

  /**
   * Handle regular input change
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: null }));
  };

  /**
   * Handle phone number change (numeric only)
   */
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // Only allow digits
    setFormData(prev => ({ ...prev, phone: value }));
    setErrors(prev => ({ ...prev, phone: null }));
  };

  /**
   * Get filtered countries based on search term (max 3 chars)
   */
  const getFilteredCountries = () => {
    if (!countrySearchTerm) return countries;

    const searchLower = countrySearchTerm.toLowerCase().slice(0, 3);
    return countries.filter(country =>
      country.code?.toLowerCase().includes(searchLower) ||
      country.name_en?.toLowerCase().includes(searchLower) ||
      country.name_ar?.includes(countrySearchTerm.slice(0, 3))
    );
  };

  /**
   * Handle country search input (max 3 chars)
   */
  const handleCountrySearch = (e) => {
    const value = e.target.value.slice(0, 3); // Limit to 3 chars
    setCountrySearchTerm(value);
  };

  /**
   * Handle country selection from dropdown
   */
  const handleCountrySelect = (country) => {
    setFormData(prev => ({ ...prev, phone_country_code: country.phone_code }));
    setShowCountryDropdown(false);
    setCountrySearchTerm('');
  };

  /**
   * Validate form
   */
  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = t('required');
    }

    if (!formData.contactName.trim()) {
      newErrors.contactName = t('required');
    }

    if (!formData.value || parseFloat(formData.value) <= 0) {
      newErrors.value = t('required');
    }

    // If creating new contact, phone is required, email is optional
    if (!formData.contactId) {
      // Email is optional, but if provided, must be valid
      if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = t('invalidEmail');
      }

      if (!formData.phone.trim()) {
        newErrors.phone = t('required');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submit
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Pass data to parent
    onSubmit({
      ...formData,
      stageId,
      value: parseFloat(formData.value),
      createContact: !formData.contactId, // Flag to create new contact
    });
  };

  /**
   * Click outside to close dropdown
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !contactInputRef.current.contains(event.target)
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
   * Click outside to close country dropdown
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target) &&
        countryInputRef.current &&
        !countryInputRef.current.contains(event.target)
      ) {
        setShowCountryDropdown(false);
        setCountrySearchTerm('');
      }
    };

    if (showCountryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCountryDropdown]);

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
    <div className="bg-white rounded-lg shadow-sm border-2 border-indigo-300 p-4 mb-3 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-indigo-600">
          {t('quickAddDeal')} • {stageName}
        </h4>
        <button
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
          disabled={saving}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Contact Search */}
        <div className="relative">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {t('contact')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              ref={contactInputRef}
              type="text"
              value={formData.contactName}
              onChange={handleContactNameChange}
              placeholder={t('searchContactByName')}
              className={`w-full px-3 py-2 text-sm border rounded-lg ${isRTL ? 'pr-9' : 'pl-9'} focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.contactName ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={saving}
              autoComplete="off"
            />
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
          </div>
          {errors.contactName && (
            <p className="mt-1 text-xs text-red-600">{errors.contactName}</p>
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

        {/* Deal Title */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {t('dealTitle')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder={t('dealTitle')}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={saving}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-600">{errors.title}</p>
          )}
        </div>

        {/* Phone with Country Code (required for new contacts) */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {t('phone')} {!formData.contactId && <span className="text-red-500">*</span>}
          </label>
          <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Country Code Searchable Dropdown */}
            <div className="relative">
              <input
                ref={countryInputRef}
                type="text"
                value={formData.phone_country_code}
                onClick={() => !formData.contactId && !saving && setShowCountryDropdown(true)}
                readOnly
                dir="ltr"
                className={`w-16 px-2 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                } ${formData.contactId ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                disabled={saving || !!formData.contactId}
              />

              {/* Country Dropdown */}
              {showCountryDropdown && (
                <div
                  ref={countryDropdownRef}
                  className={`absolute top-full mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-50 ${isRTL ? 'left-0' : 'right-0'}`}
                >
                  {/* Search Box */}
                  <div className="p-2 border-b border-gray-200">
                    <input
                      type="text"
                      value={countrySearchTerm}
                      onChange={handleCountrySearch}
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
                            formData.phone_country_code === country.phone_code ? 'bg-indigo-50 text-indigo-600 font-medium' : ''
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

            {/* Phone Number Input */}
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="501234567"
              maxLength={11}
              inputMode="numeric"
              pattern="[0-9]*"
              className={`w-28 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              } ${formData.contactId ? 'bg-gray-50' : ''}`}
              disabled={saving || !!formData.contactId}
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
          )}
        </div>

        {/* Email (optional) */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {t('email')} <span className="text-xs text-gray-500">({t('optional')})</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={t('email')}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            } ${formData.contactId ? 'bg-gray-50' : ''}`}
            disabled={saving || !!formData.contactId}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Revenue */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {t('expectedRevenue')} <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="value"
            value={formData.value}
            onChange={handleChange}
            placeholder="0.00"
            min="0"
            step="0.01"
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              errors.value ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={saving}
          />
          {errors.value && (
            <p className="mt-1 text-xs text-red-600">{errors.value}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex-1"
            disabled={saving}
          >
            <Check className="w-4 h-4" />
            {saving ? t('adding') : t('add')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium"
            disabled={saving}
          >
            {t('cancel')}
          </button>
        </div>

        {/* New Contact Notice */}
        {!formData.contactId && formData.contactName && (
          <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{t('newContactWillBeCreated')}</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default QuickAddDealCard;
