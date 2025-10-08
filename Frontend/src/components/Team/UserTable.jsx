/**
 * User Table Component
 * Reusable table for displaying team members with permission-based actions
 */

import React from 'react';
import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../utils/permissionUtils';
import RoleBadge from './RoleBadge';
import ActionsDropdown from './ActionsDropdown';

const UserTable = ({
  users = [],
  roles = [],
  onManagePermissions,
  onEdit,
  onDelete,
  onChangeRole,
  onToggleActive,
  showPermissions = true
}) => {
  const { t } = useTranslation(['common', 'settings']);
  const { user: currentUser } = useAuth();

  // Check permissions
  const canEditUsers = hasPermission(currentUser, 'users.edit');
  const canDeleteUsers = hasPermission(currentUser, 'users.delete');
  const canManagePermissions = hasPermission(currentUser, 'permissions.manage');

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
                {(canEditUsers || canDeleteUsers || canManagePermissions) ? (
                  <ActionsDropdown
                    user={user}
                    currentUserId={currentUser?.id}
                    onEdit={canEditUsers ? onEdit : null}
                    onManagePermissions={canManagePermissions && showPermissions ? onManagePermissions : null}
                    onToggleActive={canEditUsers ? onToggleActive : null}
                    onDelete={canDeleteUsers ? onDelete : null}
                  />
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
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
