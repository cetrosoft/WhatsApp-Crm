/**
 * ActionsDropdown Component
 * Icon-based action buttons for user actions in team members table
 */

import React from 'react';
import { Edit, Shield, UserX, UserCheck, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ActionsDropdown = ({
  user,
  onEdit,
  onManagePermissions,
  onToggleActive,
  onDelete,
  currentUserId,
}) => {
  const { t } = useTranslation('common');

  const isSelf = user.id === currentUserId;

  return (
    <div className="flex items-center gap-1">
      {/* Edit User */}
      {onEdit && (
        <button
          onClick={() => onEdit(user)}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title={t('editUser')}
        >
          <Edit className="w-4 h-4" />
        </button>
      )}

      {/* Manage Permissions */}
      {onManagePermissions && (
        <button
          onClick={() => onManagePermissions(user)}
          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
          title={t('managePermissions')}
        >
          <Shield className="w-4 h-4" />
        </button>
      )}

      {/* Toggle Active Status */}
      {onToggleActive && (
        <button
          onClick={() => onToggleActive(user.id, user.is_active)}
          disabled={isSelf}
          className={`p-1.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
            user.is_active
              ? 'text-orange-600 hover:bg-orange-50'
              : 'text-green-600 hover:bg-green-50'
          }`}
          title={isSelf ? t('cannotModifySelf') : (user.is_active ? t('deactivate') : t('activate'))}
        >
          {user.is_active ? (
            <UserX className="w-4 h-4" />
          ) : (
            <UserCheck className="w-4 h-4" />
          )}
        </button>
      )}

      {/* Delete User */}
      {onDelete && (
        <button
          onClick={() => onDelete(user)}
          disabled={isSelf}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title={isSelf ? t('cannotDeleteSelf') : t('deleteUser')}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default ActionsDropdown;
