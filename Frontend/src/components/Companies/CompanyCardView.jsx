/**
 * Company Card View Component
 * Grid layout for displaying companies as cards
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Trash2, Building2, Users, MapPin, Phone, Mail, Globe } from 'lucide-react';

const CompanyCardView = ({ companies, onEdit, onDelete, deletingId }) => {
  const { t } = useTranslation('common');

  const getEmployeeSizeLabel = (size) => {
    if (!size) return '-';
    return size;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {companies.map((company) => (
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
              onClick={() => onEdit(company)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              {t('edit')}
            </button>
            <button
              onClick={() => onDelete(company)}
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
  );
};

export default CompanyCardView;
