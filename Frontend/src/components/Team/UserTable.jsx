/**
 * User Table Component
 * Reusable table for displaying team members
 */

import React from 'react';
import { MoreVertical, Shield, UserX, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import RoleBadge from './RoleBadge';

const UserTable = ({
  users = [],
  roles = [],
  onManagePermissions,
  onChangeRole,
  onToggleActive,
  showPermissions = true
}) => {
  const { t } = useTranslation(['common', 'settings']);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('default', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('common:name')}
            </th>
            <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('common:email')}
            </th>
            <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('settings:role')}
            </th>
            <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('settings:status')}
            </th>
            <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('common:createdAt')}
            </th>
            <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('settings:actions')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              {/* Name */}
              <td className="px-4 py-4 whitespace-nowrap text-start">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-600">
                      {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {user.full_name || 'N/A'}
                  </span>
                </div>
              </td>

              {/* Email */}
              <td className="px-4 py-4 whitespace-nowrap text-start text-sm text-gray-600">
                {user.email}
              </td>

              {/* Role */}
              <td className="px-4 py-4 whitespace-nowrap text-start">
                <RoleBadge role={user.role} />
              </td>

              {/* Status */}
              <td className="px-4 py-4 whitespace-nowrap text-start">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  user.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.is_active ? t('settings:active') : t('settings:inactive')}
                </span>
              </td>

              {/* Created At */}
              <td className="px-4 py-4 whitespace-nowrap text-start text-sm text-gray-600">
                {formatDate(user.created_at)}
              </td>

              {/* Actions */}
              <td className="px-4 py-4 whitespace-nowrap text-start">
                <div className="flex items-center gap-2">
                  {/* Role Select */}
                  <select
                    value={user.role}
                    onChange={(e) => onChangeRole(user.id, e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.slug}>
                        {role.name}
                      </option>
                    ))}
                  </select>

                  {/* Manage Permissions */}
                  {showPermissions && (
                    <button
                      onClick={() => onManagePermissions(user)}
                      className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title={t('common:managePermissions')}
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                  )}

                  {/* Toggle Active */}
                  <button
                    onClick={() => onToggleActive(user.id, user.is_active)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title={user.is_active ? t('settings:deactivate') : t('settings:activate')}
                  >
                    {user.is_active ? (
                      <UserX className="w-4 h-4" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Empty State */}
      {users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">{t('common:noData')}</p>
        </div>
      )}
    </div>
  );
};

export default UserTable;
