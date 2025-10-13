/**
 * Contacts Table Component
 * Displays contacts in a table format
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Edit, Trash2 } from 'lucide-react';

const ContactsTable = ({ contacts, onEdit, onDelete, getStatusBadge, getCountryDisplay, loading }) => {
  const { t, i18n } = useTranslation(['contacts', 'common']);
  const isRTL = i18n.language === 'ar';

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading...</p>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="p-8 text-center">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">{t('noContacts')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">
              {t('name')}
            </th>
            <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">
              {t('phone')}
            </th>
            <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">
              {t('email')}
            </th>
            <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">
              {t('tags')}
            </th>
            <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">
              {t('status')}
            </th>
            <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">
              {t('company')}
            </th>
            <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">
              {t('country')}
            </th>
            <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">
              {t('assignedTo')}
            </th>
            <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase w-20">
              {t('actions')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {contacts.map((contact) => (
            <tr key={contact.id} className="hover:bg-gray-50">
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  {contact.avatar_url ? (
                    <img
                      src={contact.avatar_url}
                      alt={contact.name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-600 font-medium text-sm">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">{contact.name}</div>
                    {contact.position && (
                      <div className="text-xs text-gray-500 truncate">{contact.position}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-sm text-gray-900" dir="ltr">
                {contact.phone_country_code && contact.phone ? `${contact.phone_country_code} ${contact.phone}` : contact.phone || '-'}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900">
                <span className="truncate block max-w-[200px]">{contact.email || '-'}</span>
              </td>
              <td className="px-4 py-4">
                {contact.contact_tags && contact.contact_tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {contact.contact_tags.slice(0, 3).map((ct) => {
                      const tag = ct.tags;
                      const tagName = isRTL && tag.name_ar ? tag.name_ar : tag.name_en;
                      return (
                        <span
                          key={ct.tag_id}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: tag.color || '#6366f1' }}
                        >
                          {tagName}
                        </span>
                      );
                    })}
                    {contact.contact_tags.length > 3 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        +{contact.contact_tags.length - 3}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-4">
                {getStatusBadge(contact.status)}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900">
                <span className="truncate block max-w-[150px]">{contact.companies?.name || t('noCompany')}</span>
              </td>
              <td className="px-4 py-4 text-sm text-gray-900">
                {getCountryDisplay(contact.country)}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900">
                <span className="truncate block max-w-[120px]">
                  {contact.assigned_user?.full_name || (
                    <span className="text-gray-400">{t('unassigned')}</span>
                  )}
                </span>
              </td>
              <td className="px-4 py-4 text-sm font-medium">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(contact)}
                    className="text-indigo-600 hover:text-indigo-900 transition-colors"
                    title={t('edit')}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(contact)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
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
  );
};

export default ContactsTable;
