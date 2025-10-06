/**
 * Companies Page
 * Manage companies with enhanced fields (logo, tax_id, commercial_id, legal_docs, employee_size)
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { companyAPI, countryAPI, tagAPI } from '../services/api';
import { Plus, Edit2, Trash2, Building2, Users, MapPin, Phone, Mail, Globe, Grid3x3, List, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import CompanyModal from '../components/CompanyModal';
import SearchableSelect from '../components/SearchableSelect';
import MultiSelectTags from '../components/MultiSelectTags';

const Companies = () => {
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.language === 'ar';

  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [countries, setCountries] = useState([]);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    loadCompanies();
    loadFilters();
  }, []);

  // Filter companies when search/filters change
  useEffect(() => {
    filterCompanies();
  }, [companies, searchQuery, selectedCountry, selectedTags]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getCompanies();
      setCompanies(response.companies || []);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const loadFilters = async () => {
    try {
      const [countriesRes, tagsRes] = await Promise.all([
        countryAPI.getCountries(),
        tagAPI.getTags()
      ]);
      setCountries(countriesRes.countries || []);
      setTags(tagsRes.tags || []);
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  const filterCompanies = () => {
    let filtered = [...companies];

    // Search query filter (name, phone, email, website)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(company =>
        company.name?.toLowerCase().includes(query) ||
        company.phone?.toLowerCase().includes(query) ||
        company.email?.toLowerCase().includes(query) ||
        company.website?.toLowerCase().includes(query) ||
        company.industry?.toLowerCase().includes(query)
      );
    }

    // Country filter
    if (selectedCountry) {
      filtered = filtered.filter(company => company.country_id === selectedCountry);
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(company => {
        if (!company.tags || company.tags.length === 0) return false;
        return selectedTags.some(tagId => company.tags.includes(tagId));
      });
    }

    setFilteredCompanies(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCountry('');
    setSelectedTags([]);
  };

  const handleCreateCompany = () => {
    setEditingCompany(null);
    setShowModal(true);
  };

  const handleEditCompany = (company) => {
    setEditingCompany(company);
    setShowModal(true);
  };

  const handleSaveCompany = async () => {
    setShowModal(false);
    loadCompanies();
  };

  const handleDeleteCompany = async (company) => {
    const performDelete = async () => {
      try {
        setDeletingId(company.id);
        await companyAPI.deleteCompany(company.id);
        toast.success(t('companyDeleted'));
        loadCompanies();
      } catch (error) {
        console.error('Error deleting company:', error);
        toast.error('Failed to delete company');
      } finally {
        setDeletingId(null);
      }
    };

    toast((toastInstance) => (
      <div className="flex flex-col gap-3">
        <p className="font-medium text-gray-900">{t('deleteCompanyConfirm')}</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              toast.dismiss(toastInstance.id);
              performDelete();
            }}
            className="flex-1 px-3 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('delete')}
          </button>
          <button
            onClick={() => toast.dismiss(toastInstance.id)}
            className="flex-1 px-3 py-2 text-sm font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
      position: 'top-center',
    });
  };

  const getEmployeeSizeLabel = (size) => {
    if (!size) return '-';
    return size;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const displayCompanies = filteredCompanies.length > 0 ? filteredCompanies : companies;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('companies')}
            </h1>
            <p className="mt-2 text-gray-600">
              {t('manageYourCompanies')}
            </p>
          </div>
          <button
            onClick={handleCreateCompany}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('addCompany')}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      {companies.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                <input
                  type="text"
                  placeholder={t('searchCompanies')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>
            </div>

            {/* Country Filter */}
            <div>
              <SearchableSelect
                value={selectedCountry}
                onChange={setSelectedCountry}
                options={countries}
                placeholder={t('allCountries')}
                displayKey={isRTL ? 'name_ar' : 'name_en'}
                valueKey="id"
              />
            </div>

            {/* Tags Filter */}
            <div>
              <MultiSelectTags
                selectedTags={selectedTags}
                onChange={setSelectedTags}
                options={tags}
                placeholder={t('allTags')}
              />
            </div>
          </div>

          {/* Active Filters + View Toggle */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              {(searchQuery || selectedCountry || selectedTags.length > 0) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  {t('clearFilters')}
                </button>
              )}
              <span className="text-sm text-gray-600">
                {filteredCompanies.length} {t('results')}
              </span>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'card'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={t('cardView')}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={t('listView')}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Companies Display */}
      {companies.length === 0 ? (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('noCompanies')}
          </h3>
          <p className="text-gray-600 mb-6">
            {t('createFirstCompany')}
          </p>
          <button
            onClick={handleCreateCompany}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            {t('addCompany')}
          </button>
        </div>
      ) : filteredCompanies.length === 0 && (searchQuery || selectedCountry || selectedTags.length > 0) ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('noResults')}
          </h3>
          <p className="text-gray-600 mb-4">
            {t('tryDifferentFilters')}
          </p>
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <X className="w-4 h-4" />
            {t('clearFilters')}
          </button>
        </div>
      ) : viewMode === 'card' ? (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayCompanies.map((company) => (
            <div
              key={company.id}
              className="flex flex-col bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden"
            >
              {/* Company Header with Logo */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-start gap-3">
                  {/* Logo */}
                  <div className="flex-shrink-0">
                    {company.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt={company.name}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-indigo-600" />
                      </div>
                    )}
                  </div>

                  {/* Company Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {company.name}
                    </h3>
                    {company.industry && (
                      <p className="text-xs text-gray-600 mt-1">
                        {company.industry}
                      </p>
                    )}
                    {company.employee_size && (
                      <div className="flex items-center gap-1 mt-1">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {getEmployeeSizeLabel(company.employee_size)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Details */}
              <div className="flex-1 p-3 space-y-2">
                {/* Contact Info */}
                {company.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{company.phone}</span>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{company.email}</span>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Globe className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate hover:text-indigo-600"
                    >
                      {company.website}
                    </a>
                  </div>
                )}
                {company.address && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{company.address}</span>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-base font-semibold text-gray-900">
                      {company.contact_count || 0}
                    </div>
                    <div className="text-xs text-gray-600">
                      {t('contacts')}
                    </div>
                  </div>
                  {company.tax_id && (
                    <div className="text-center border-l border-gray-200 pl-3">
                      <div className="text-xs text-gray-600">
                        {t('taxId')}
                      </div>
                      <div className="text-xs font-medium text-gray-900 truncate">
                        {company.tax_id}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-auto px-3 py-3 bg-gray-50 border-t border-gray-200 flex items-center gap-2">
                <button
                  onClick={() => handleEditCompany(company)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  {t('edit')}
                </button>
                <button
                  onClick={() => handleDeleteCompany(company)}
                  disabled={deletingId === company.id}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title={t('delete')}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200" dir={isRTL ? 'rtl' : 'ltr'}>
            <thead className="bg-gray-50">
              <tr>
                <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('company')}
                </th>
                <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('contact')}
                </th>
                <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('industry')}
                </th>
                <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('employeeSize')}
                </th>
                <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('country')}
                </th>
                <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('tags')}
                </th>
                <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-left' : 'text-right'}`}>
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                  {/* Company */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {company.logo_url ? (
                        <img
                          src={company.logo_url}
                          alt={company.name}
                          className="w-10 h-10 rounded object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-indigo-600" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {company.name}
                        </div>
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 hover:text-indigo-800 truncate block"
                          >
                            {company.website}
                          </a>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {company.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{company.phone}</span>
                        </div>
                      )}
                      {company.email && (
                        <div className="flex items-center gap-1 mt-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="truncate">{company.email}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Industry */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {company.industry || '-'}
                    </div>
                  </td>

                  {/* Employee Size */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-900">
                      {company.employee_size && (
                        <>
                          <Users className="w-3 h-3 text-gray-400" />
                          <span>{getEmployeeSizeLabel(company.employee_size)}</span>
                        </>
                      )}
                      {!company.employee_size && '-'}
                    </div>
                  </td>

                  {/* Country */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {company.country_id ? (
                        (() => {
                          const country = countries.find(c => c.id === company.country_id);
                          return country ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="truncate">
                                {isRTL ? country.name_ar : country.name_en}
                              </span>
                            </div>
                          ) : '-';
                        })()
                      ) : '-'}
                    </div>
                  </td>

                  {/* Tags */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {company.tags && company.tags.length > 0 ? (
                        company.tags.slice(0, 3).map((tagId) => {
                          const tag = tags.find(t => t.id === tagId);
                          return tag ? (
                            <span
                              key={tag.id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                              style={{
                                backgroundColor: tag.color ? `${tag.color}20` : '#E5E7EB',
                                color: tag.color || '#374151'
                              }}
                            >
                              {isRTL ? tag.name_ar : tag.name_en}
                            </span>
                          ) : null;
                        })
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                      {company.tags && company.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{company.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className={`px-4 py-3 whitespace-nowrap ${isRTL ? 'text-left' : 'text-right'}`}>
                    <div className={`flex items-center gap-2 ${isRTL ? 'justify-start' : 'justify-end'}`}>
                      <button
                        onClick={() => handleEditCompany(company)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title={t('edit')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCompany(company)}
                        disabled={deletingId === company.id}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title={t('delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Company Modal */}
      {showModal && (
        <CompanyModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          company={editingCompany}
          onSave={handleSaveCompany}
        />
      )}
    </div>
  );
};

export default Companies;
