/**
 * CompanyModal Component
 * Multi-tab modal for creating/editing companies with enhanced fields
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { companyAPI, countryAPI, statusAPI, userAPI, tagAPI } from '../services/api';
import { X, Building2, FileText, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import CompanyBasicTab from './Companies/CompanyBasicTab';
import CompanyLegalTab from './Companies/CompanyLegalTab';
import CompanyLocationTab from './Companies/CompanyLocationTab';

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
        countries: countriesRes.data || [],
        statuses: statusesRes.data || [],
        users: usersRes.data || usersRes.users || [],
        tags: tagsRes.data || []
      });
    } catch (error) {
      console.error('Error loading lookup data:', error);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!company?.id) {
      toast.error(t('saveBefore', { resource: t('company'), action: t('uploadingLogo') }));
      return;
    }

    try {
      setUploading(true);
      const response = await companyAPI.uploadLogo(company.id, file);
      setFormData({ ...formData, logo_url: response.logo_url });
      toast.success(t('logoUploaded'));
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error(t('failedToUpload', { resource: t('logo') }));
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!company?.id) {
      toast.error(t('saveBefore', { resource: t('company'), action: t('uploadingDocuments') }));
      return;
    }

    try {
      setUploading(true);
      const response = await companyAPI.uploadDocument(company.id, file);
      setFormData({
        ...formData,
        legal_docs: [...formData.legal_docs, response.document]
      });
      toast.success(t('documentUploaded'));
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(t('failedToUpload', { resource: t('document') }));
    } finally{
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
      toast.success(t('documentDeleted'));
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error(t('failedToDelete', { resource: t('document') }));
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
      if (error.response?.data?.error === 'INSUFFICIENT_PERMISSIONS') {
        toast.error(t('insufficientPermissions'), { duration: 5000 });
      } else {
        toast.error(error.message || t('failedToSave', { resource: t('company') }));
      }
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
              <CompanyBasicTab
                formData={formData}
                setFormData={setFormData}
                lookupData={lookupData}
                uploading={uploading}
                handleLogoUpload={handleLogoUpload}
              />
            )}

            {/* Legal Info Tab */}
            {activeTab === 'legal' && (
              <CompanyLegalTab
                formData={formData}
                setFormData={setFormData}
                uploading={uploading}
                handleDocumentUpload={handleDocumentUpload}
                handleDeleteDocument={handleDeleteDocument}
              />
            )}

            {/* Location Tab */}
            {activeTab === 'location' && (
              <CompanyLocationTab
                formData={formData}
                setFormData={setFormData}
                lookupData={lookupData}
              />
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
