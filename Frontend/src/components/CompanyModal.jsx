/**
 * CompanyModal Component
 * Multi-tab modal for creating/editing companies with enhanced fields
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { companyAPI, countryAPI, statusAPI, userAPI, tagAPI } from '../services/api';
import { X, Building2, FileText, MapPin, Upload, File, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import SearchableSelect from './SearchableSelect';
import MultiSelectTags from './MultiSelectTags';

const CompanyModal = ({ isOpen, onClose, company, onSave }) => {
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.language === 'ar';

  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lookupData, setLookupData] = useState({
    countries: [],
    statuses: [],
    users: [],
    tags: []
  });

  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    website: '',
    phone: '',
    email: '',
    logo_url: '',
    tax_id: '',
    commercial_id: '',
    legal_docs: [],
    employee_size: '',
    address: '',
    city: '',
    country_id: '',
    status_id: '',
    assigned_to: '',
    tags: [],
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadLookupData();
      if (company) {
        setFormData({
          name: company.name || '',
          industry: company.industry || '',
          website: company.website || '',
          phone: company.phone || '',
          email: company.email || '',
          logo_url: company.logo_url || '',
          tax_id: company.tax_id || '',
          commercial_id: company.commercial_id || '',
          legal_docs: company.legal_docs || [],
          employee_size: company.employee_size || '',
          address: company.address || '',
          city: company.city || '',
          country_id: company.country_id || '',
          status_id: company.status_id || '',
          assigned_to: company.assigned_to || '',
          tags: company.tags || [],
          notes: company.notes || ''
        });
      } else {
        // Reset for new company
        setFormData({
          name: '',
          industry: '',
          website: '',
          phone: '',
          email: '',
          logo_url: '',
          tax_id: '',
          commercial_id: '',
          legal_docs: [],
          employee_size: '',
          address: '',
          city: '',
          country_id: '',
          status_id: '',
          assigned_to: '',
          tags: [],
          notes: ''
        });
      }
      setActiveTab('basic');
    }
  }, [isOpen, company]);

  const loadLookupData = async () => {
    try {
      const [countriesRes, statusesRes, usersRes, tagsRes] = await Promise.all([
        countryAPI.getCountries(),
        statusAPI.getCompanyStatuses(),
        userAPI.getUsers(),
        tagAPI.getTags()
      ]);

      setLookupData({
        countries: countriesRes.countries || [],
        statuses: statusesRes.statuses || [],
        users: usersRes.data || usersRes.users || [],
        tags: tagsRes.tags || []
      });
    } catch (error) {
      console.error('Error loading lookup data:', error);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!company?.id) {
      toast.error('Please save the company first before uploading logo');
      return;
    }

    try {
      setUploading(true);
      const response = await companyAPI.uploadLogo(company.id, file);
      setFormData({ ...formData, logo_url: response.logo_url });
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!company?.id) {
      toast.error('Please save the company first before uploading documents');
      return;
    }

    try {
      setUploading(true);
      const response = await companyAPI.uploadDocument(company.id, file);
      setFormData({
        ...formData,
        legal_docs: [...formData.legal_docs, response.document]
      });
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!confirm(t('deleteCompanyConfirm'))) return;

    try {
      await companyAPI.deleteDocument(company.id, documentId);
      setFormData({
        ...formData,
        legal_docs: formData.legal_docs.filter(doc => doc.id !== documentId)
      });
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error(t('required') + ': ' + t('companyName'));
      return;
    }

    try {
      setLoading(true);

      // Clean data: convert empty strings to null for UUID fields
      const cleanedData = {
        ...formData,
        country_id: formData.country_id || null,
        status_id: formData.status_id || null,
        assigned_to: formData.assigned_to || null,
      };

      if (company) {
        await companyAPI.updateCompany(company.id, cleanedData);
        toast.success(t('companyUpdated'));
      } else {
        await companyAPI.createCompany(cleanedData);
        toast.success(t('companyCreated'));
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error(error.message || 'Failed to save company');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic', label: t('basicInfo'), icon: Building2 },
    { id: 'legal', label: t('legalInfo'), icon: FileText },
    { id: 'location', label: t('location'), icon: MapPin }
  ];

  const employeeSizeOptions = [
    { value: '1-10', label: '1-10' },
    { value: '11-50', label: '11-50' },
    { value: '51-200', label: '51-200' },
    { value: '201-500', label: '201-500' },
    { value: '500+', label: '500+' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {company ? t('editCompany') : t('addCompany')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 pt-4 border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'text-indigo-600 border-indigo-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-3">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('logo')}
                  </label>
                  <div className="flex items-center gap-2">
                    {formData.logo_url ? (
                      <img
                        src={formData.logo_url}
                        alt="Company logo"
                        className="w-12 h-12 rounded object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        {uploading ? t('loading') : t('uploadLogo')}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Company Name + Industry + Website (3 columns) */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('companyName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('industry')}
                    </label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('website')}
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Phone + Email + Employee Size (3 columns) */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('phone')}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('email')}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('employeeSize')}
                    </label>
                    <SearchableSelect
                      value={formData.employee_size}
                      onChange={(value) => setFormData({ ...formData, employee_size: value })}
                      options={employeeSizeOptions}
                      placeholder={t('select')}
                      displayKey="label"
                      valueKey="value"
                    />
                  </div>
                </div>

                {/* Status + Assigned To (2 columns) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('status')}
                    </label>
                    <SearchableSelect
                      value={formData.status_id}
                      onChange={(value) => setFormData({ ...formData, status_id: value })}
                      options={lookupData.statuses}
                      placeholder={t('select')}
                      displayKey={isRTL ? 'name_ar' : 'name_en'}
                      valueKey="id"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('assignedTo')}
                    </label>
                    <SearchableSelect
                      value={formData.assigned_to}
                      onChange={(value) => setFormData({ ...formData, assigned_to: value })}
                      options={lookupData.users}
                      placeholder={t('select')}
                      displayKey="full_name"
                      valueKey="id"
                    />
                  </div>
                </div>

                {/* Tags (full width) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('tags')}
                  </label>
                  <MultiSelectTags
                    selectedTags={Array.isArray(formData.tags) ? formData.tags : []}
                    onChange={(newTags) => setFormData({ ...formData, tags: newTags })}
                    options={lookupData.tags}
                    placeholder={t('select')}
                  />
                </div>
              </div>
            )}

            {/* Legal Info Tab */}
            {activeTab === 'legal' && (
              <div className="space-y-3">
                {/* Tax ID + Commercial ID (2 columns) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('taxId')}
                    </label>
                    <input
                      type="text"
                      value={formData.tax_id}
                      onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('commercialId')}
                    </label>
                    <input
                      type="text"
                      value={formData.commercial_id}
                      onChange={(e) => setFormData({ ...formData, commercial_id: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Legal Documents */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('legalDocuments')}
                  </label>

                  {/* Upload Button */}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      onChange={handleDocumentUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-fit">
                      <Upload className="w-4 h-4" />
                      {uploading ? t('loading') : t('uploadDocument')}
                    </div>
                  </label>

                  {/* Documents List */}
                  {formData.legal_docs && formData.legal_docs.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {formData.legal_docs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <File className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {doc.name}
                              </div>
                              {doc.uploaded_at && (
                                <div className="text-xs text-gray-500">
                                  {new Date(doc.uploaded_at).toLocaleDateString(
                                    i18n.language === 'ar' ? 'ar-SA' : 'en-US'
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Location Tab */}
            {activeTab === 'location' && (
              <div className="space-y-3">
                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('location')}
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* City + Country (2 columns) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('country')}
                    </label>
                    <SearchableSelect
                      value={formData.country_id}
                      onChange={(value) => setFormData({ ...formData, country_id: value })}
                      options={lookupData.countries}
                      placeholder={t('select')}
                      displayKey={isRTL ? 'name_ar' : 'name_en'}
                      valueKey="id"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? t('loading') : company ? t('update') : t('create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyModal;
