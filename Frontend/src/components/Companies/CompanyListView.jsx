/**
 * Company List View Component
 * Table layout for displaying companies
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Trash2, Building2, Users, MapPin, Phone, Mail } from 'lucide-react';

const CompanyListView = ({ companies, countries, tags, onEdit, onDelete, deletingId }) => {
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.language === 'ar';

  const getEmployeeSizeLabel = (size) => {
    if (!size) return '-';
    return size;
  };

  return (
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
          {companies.map((company) => (
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
                    onClick={() => onEdit(company)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title={t('edit')}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(company)}
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
  );
};

export default CompanyListView;
