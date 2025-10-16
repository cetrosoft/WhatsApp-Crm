/**
 * Contacts Page
 * Displays list of contacts with search, filters, and pagination
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { contactAPI, statusAPI, userAPI, tagAPI, companyAPI } from '../services/api';
import { Users, Plus, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import ContactModal from '../components/ContactModal';
import ContactsFilters from '../components/Contacts/ContactsFilters';
import ContactsTable from '../components/Contacts/ContactsTable';

const Contacts = () => {
  const { t, i18n } = useTranslation(['contacts', 'common']);
  const isRTL = i18n.language === 'ar';

  // State
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [tagFilter, setTagFilter] = useState([]);
  const [companyFilter, setCompanyFilter] = useState('');

  // Lookup data
  const [statuses, setStatuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [companies, setCompanies] = useState([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);

  /**
   * Load lookup data on mount
   */
  useEffect(() => {
    loadLookupData();
  }, []);

  /**
   * Load contacts when filters change
   */
  useEffect(() => {
    loadContacts();
  }, [pagination.page, pagination.limit, searchTerm, statusFilter, assignedFilter, tagFilter, companyFilter]);

  /**
   * Load statuses, users, tags, and companies
   */
  const loadLookupData = async () => {
    try {
      const [statusesRes, usersRes, tagsRes, companiesRes] = await Promise.all([
        statusAPI.getContactStatuses(),
        userAPI.getUsers(),
        tagAPI.getTags(),
        companyAPI.getCompanies(),
      ]);

      setStatuses(statusesRes.data || []);
      setUsers(usersRes.data || []);
      setTags(tagsRes.data || []);
      setCompanies(companiesRes.data || []);
    } catch (error) {
      console.error('Error loading lookup data:', error);
    }
  };

  /**
   * Load contacts with current filters
   */
  const loadContacts = async () => {
    try {
      setLoading(true);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      if (assignedFilter) params.assigned_to = assignedFilter;
      if (tagFilter.length > 0) params.tags = tagFilter.join(',');
      if (companyFilter) params.company_id = companyFilter;

      const response = await contactAPI.getContacts(params);

      if (response.success) {
        setContacts(response.data || []);
        setPagination(response.pagination || pagination);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error(t('failedToLoad', { ns: 'common', resource: t('contacts', { ns: 'common' }) }));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle search with debounce
   */
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setPagination({ ...pagination, page: 1 }); // Reset to page 1
  };

  /**
   * Handle add contact
   */
  const handleAdd = () => {
    setSelectedContact(null);
    setIsModalOpen(true);
  };

  /**
   * Handle edit contact
   */
  const handleEdit = (contact) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  };

  /**
   * Handle delete contact - show confirmation modal
   */
  const handleDeleteClick = (contact) => {
    setContactToDelete(contact);
    setDeleteModalOpen(true);
  };

  /**
   * Confirm delete contact
   */
  const confirmDelete = async () => {
    if (!contactToDelete) return;

    try {
      const response = await contactAPI.deleteContact(contactToDelete.id);
      if (response.success) {
        toast.success(t('contactDeleted'));
        loadContacts();
      }
    } catch (error) {
      console.error('Error deleting contact:', error);

      if (error.response?.status === 403) {
        toast.error(t('noPermissionDelete', { ns: 'common', resource: t('contacts', { ns: 'common' }) }), {
          duration: 5000
        });
      } else {
        toast.error(error.response?.data?.message || t('failedToDelete', { ns: 'common', resource: t('contact', { ns: 'common' }) }));
      }
    } finally {
      setDeleteModalOpen(false);
      setContactToDelete(null);
    }
  };

  /**
   * Cancel delete
   */
  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setContactToDelete(null);
  };

  /**
   * Handle contact saved (create or update)
   */
  const handleContactSaved = () => {
    setIsModalOpen(false);
    setSelectedContact(null);
    loadContacts();
  };

  /**
   * Get status badge color
   */
  const getStatusBadge = (status) => {
    if (!status) return null;

    const name = isRTL ? status.name_ar : status.name_en;
    const color = status.color || '#6B7280';

    return (
      <span
        className="px-2 py-1 text-xs font-medium rounded-full"
        style={{
          backgroundColor: `${color}20`,
          color: color,
        }}
      >
        {name}
      </span>
    );
  };

  /**
   * Get country name
   */
  const getCountryDisplay = (country) => {
    if (!country) return '-';
    const name = isRTL ? country.name_ar : country.name_en;
    return name;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7" />
            {t('contacts')}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {t('showing')} {contacts.length} {t('of')} {pagination.total} {t('results')}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t('addContact')}
        </button>
      </div>

      {/* Search and Filters */}
      <ContactsFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        tagFilter={tagFilter}
        onTagFilterChange={(tagIds) => {
          setTagFilter(tagIds);
          setPagination({ ...pagination, page: 1 });
        }}
        companyFilter={companyFilter}
        onCompanyFilterChange={(value) => {
          setCompanyFilter(value || '');
          setPagination({ ...pagination, page: 1 });
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(value) => {
          setStatusFilter(value || '');
          setPagination({ ...pagination, page: 1 });
        }}
        assignedFilter={assignedFilter}
        onAssignedFilterChange={(value) => {
          setAssignedFilter(value || '');
          setPagination({ ...pagination, page: 1 });
        }}
        onClearFilters={() => {
          setSearchTerm('');
          setTagFilter([]);
          setCompanyFilter('');
          setStatusFilter('');
          setAssignedFilter('');
          setPagination({ ...pagination, page: 1 });
        }}
        companies={companies}
        statuses={statuses}
        users={users}
        tags={tags}
      />

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <ContactsTable
          contacts={contacts}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          getStatusBadge={getStatusBadge}
          getCountryDisplay={getCountryDisplay}
          loading={loading}
        />
        {contacts.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('previous')}
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('next')}
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  {t('showing')} <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> {t('to')}{' '}
                  <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> {t('of')}{' '}
                  <span className="font-medium">{pagination.total}</span> {t('results')}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={pagination.limit}
                  onChange={(e) => setPagination({ ...pagination, limit: parseInt(e.target.value), page: 1 })}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value={10}>10 {t('perPage')}</option>
                  <option value={25}>25 {t('perPage')}</option>
                  <option value={50}>50 {t('perPage')}</option>
                  <option value={100}>100 {t('perPage')}</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('previous')}
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    {pagination.page} / {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page >= pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('next')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contact Modal */}
      {isModalOpen && (
        <ContactModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedContact(null);
          }}
          contact={selectedContact}
          onSave={handleContactSaved}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && contactToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={cancelDelete}
            ></div>

            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-lg text-start overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-5 pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ms-4 sm:text-start flex-1">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">
                      {t('deleteContact')}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">{contactToDelete.name}</span>
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {t('deleteWarning')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 sm:flex sm:flex-row-reverse gap-2">
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm transition-colors"
                >
                  {t('delete')}
                </button>
                <button
                  type="button"
                  onClick={cancelDelete}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
