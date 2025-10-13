/**
 * Contacts Filters Component
 * Search and filter controls for contacts
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import SearchableSelect from '../SearchableSelect';
import MultiSelectTags from '../MultiSelectTags';

const ContactsFilters = ({
  searchTerm,
  onSearchChange,
  tagFilter,
  onTagFilterChange,
  companyFilter,
  onCompanyFilterChange,
  statusFilter,
  onStatusFilterChange,
  assignedFilter,
  onAssignedFilterChange,
  onClearFilters,
  companies,
  statuses,
  users,
  tags,
}) => {
  const { t, i18n } = useTranslation(['contacts', 'common']);
  const isRTL = i18n.language === 'ar';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Search */}
        <div className="md:col-span-1">
          <div className="relative">
            <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t('searchContacts')}
              value={searchTerm}
              onChange={onSearchChange}
              className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
            />
          </div>
        </div>

        {/* Tags Filter (Multi-select) */}
        <div className="md:col-span-1">
          <MultiSelectTags
            selectedTags={tagFilter}
            onChange={onTagFilterChange}
            options={tags}
            placeholder={t('allTags')}
          />
        </div>

        {/* Company Filter */}
        <div>
          <SearchableSelect
            value={companyFilter}
            onChange={onCompanyFilterChange}
            options={companies}
            placeholder={t('allCompanies')}
            displayKey="name"
            valueKey="id"
          />
        </div>

        {/* Status Filter */}
        <div>
          <SearchableSelect
            value={statusFilter}
            onChange={onStatusFilterChange}
            options={[
              { label: t('allStatuses'), value: '' },
              ...statuses.map(status => ({
                label: isRTL ? status.name_ar : status.name_en,
                value: status.id
              }))
            ]}
            placeholder={t('allStatuses')}
            displayKey="label"
            valueKey="value"
          />
        </div>

        {/* Assigned Filter */}
        <div>
          <SearchableSelect
            value={assignedFilter}
            onChange={onAssignedFilterChange}
            options={[
              { label: t('allUsers'), value: '' },
              ...users.map(user => ({
                label: user.full_name,
                value: user.id
              }))
            ]}
            placeholder={t('allUsers')}
            displayKey="label"
            valueKey="value"
          />
        </div>

        {/* Clear Filters Button */}
        <div className="flex items-center">
          <button
            onClick={onClearFilters}
            className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
          >
            {t('clearFilters')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactsFilters;
