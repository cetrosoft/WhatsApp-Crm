/**
 * Companies Page
 * Manage companies with enhanced fields (logo, tax_id, commercial_id, legal_docs, employee_size)
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { companyAPI, countryAPI, tagAPI } from '../services/api';
import { Plus, Building2, Grid3x3, List, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import CompanyModal from '../components/CompanyModal';
import SearchableSelect from '../components/SearchableSelect';
import MultiSelectTags from '../components/MultiSelectTags';
import CompanyCardView from '../components/Companies/CompanyCardView';
import CompanyListView from '../components/Companies/CompanyListView';

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
      toast.error(t('failedToLoad', { resource: t('companies') }));
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

        if (error.response?.status === 403) {
          toast.error(t('noPermissionDelete', { resource: t('companies') }), {
            duration: 5000
          });
        } else {
          toast.error(error.response?.data?.message || t('failedToDelete', { resource: t('company') }));
        }
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
        <CompanyCardView
          companies={displayCompanies}
          onEdit={handleEditCompany}
          onDelete={handleDeleteCompany}
          deletingId={deletingId}
        />
      ) : (
        <CompanyListView
          companies={displayCompanies}
          countries={countries}
          tags={tags}
          onEdit={handleEditCompany}
          onDelete={handleDeleteCompany}
          deletingId={deletingId}
        />
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
