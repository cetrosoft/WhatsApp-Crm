/**
 * UserPermissionsList Component
 * Displays users with custom permissions
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import PermissionBadge from '../Permissions/PermissionBadge';

const UserPermissionsList = ({
  users,
  onManagePermissions,
}) => {
  const { t } = useTranslation(['common', 'settings']);

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div
          key={user.id}
          className="border border-gray-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">
                {user.full_name || user.email}
              </h4>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-xs text-gray-500 mt-1 capitalize">
                {t('common:role')}: {t(`settings:${user.role}`)}
              </p>
            </div>
            <button
              onClick={() => onManagePermissions(user)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {t('common:managePermissions')}
            </button>
          </div>

          {/* Custom Permissions Summary */}
          <div className="mt-3 flex gap-6">
            {user.permissions?.grant?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-700 mb-1">
                  {t('common:grantedPermissions')} ({user.permissions.grant.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {user.permissions.grant.map((perm) => (
                    <PermissionBadge
                      key={perm}
                      permission={perm}
                      variant="granted"
                    />
                  ))}
                </div>
              </div>
            )}
            {user.permissions?.revoke?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-700 mb-1">
                  {t('common:revokedPermissions')} ({user.permissions.revoke.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {user.permissions.revoke.map((perm) => (
                    <PermissionBadge
                      key={perm}
                      permission={perm}
                      variant="revoked"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserPermissionsList;
