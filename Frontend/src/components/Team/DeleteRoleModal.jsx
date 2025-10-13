/**
 * DeleteRoleModal Component
 * Confirmation dialog for role deletion
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';

const DeleteRoleModal = ({
  role,
  onConfirm,
  onCancel,
  deleting,
}) => {
  const { t } = useTranslation(['common', 'settings']);

  if (!role) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t('settings:deleteRole')}
            </h3>
            <p className="text-sm text-gray-600">
              {t('settings:confirmDeleteRole')}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-gray-900">
            {role.name} ({role.slug})
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {role.user_count || 0} {t('common:users')} • {role.permission_count || 0} {t('settings:permissions')}
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-yellow-800">
            ⚠️ {t('settings:deleteRoleWarning')}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {t('common:cancel')}
          </button>
          <button
            onClick={() => onConfirm(role.id)}
            disabled={deleting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? t('common:loading') : t('common:delete')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteRoleModal;
