/**
 * RoleCard Component
 * Single role card with actions
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Lock, Edit2, Copy, Eye, Trash2 } from 'lucide-react';

const RoleCard = ({
  role,
  onEdit,
  onDuplicate,
  onDelete,
  duplicating,
  getRoleBadgeColor,
}) => {
  const { t } = useTranslation(['common', 'settings']);
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition">
      {/* Role Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg ${getRoleBadgeColor(role.slug)} border-2 flex items-center justify-center`}>
            {role.is_system ? (
              <Lock className="w-6 h-6" />
            ) : (
              <Shield className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {role.name}
            </h3>
            <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor(role.slug)}`}>
              {role.slug}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {role.description || t('settings:noDescription')}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1 text-gray-500">
          <Users className="w-4 h-4" />
          <span>{role.user_count || 0} {t('common:users')}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-500">
          <Shield className="w-4 h-4" />
          <span>{role.permission_count || 0} {t('settings:permissions')}</span>
        </div>
      </div>

      {/* Custom Role Badge */}
      {!role.is_system && (
        <div className="mb-4 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-orange-700">
            <Shield className="w-3 h-3" />
            <span>{t('settings:customRole')}</span>
          </div>
        </div>
      )}

      {/* System Role Badge */}
      {role.is_system && (
        <div className="mb-4 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-blue-700">
            <Lock className="w-3 h-3" />
            <span>{t('settings:systemRole')}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
        {/* View Details */}
        <button
          onClick={() => navigate(`/team/roles/edit/${role.id}`)}
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          title={t('common:viewDetails')}
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('common:view')}</span>
        </button>

        {/* Quick Edit - All roles except Admin */}
        {role.slug !== 'admin' && (
          <button
            onClick={() => onEdit(role)}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
            title={t('common:edit')}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('common:edit')}</span>
          </button>
        )}

        {/* Duplicate - All roles */}
        <button
          onClick={() => onDuplicate(role)}
          disabled={duplicating === role.id}
          className="px-2 py-2 text-xs border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          title={t('settings:duplicateRole')}
        >
          {duplicating === role.id ? (
            <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Delete - Custom roles only (not system roles) */}
        {!role.is_system && (
          <button
            onClick={() => onDelete(role)}
            className="px-2 py-2 text-xs border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
            title={t('common:delete')}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default RoleCard;
