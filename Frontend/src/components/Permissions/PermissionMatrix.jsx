/**
 * Permission Matrix Component
 * Displays permissions in a table/matrix format with actions as columns
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import MatrixRow from './MatrixRow';
import { groupPermissionsByModule } from '../../utils/matrixUtils';

const PermissionMatrix = ({
  moduleKey,
  availablePermissions,
  roleDefaults = [],
  grants = [],
  revokes = [],
  onToggle,
  disabled = false,
}) => {
  const { t } = useTranslation(['common']);
  const { isRTL } = useLanguage();

  if (!availablePermissions) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('common:loading')}
      </div>
    );
  }

  // Group permissions by module
  const modules = groupPermissionsByModule(availablePermissions);
  const currentModule = modules[moduleKey];

  if (!currentModule || !currentModule.resources || currentModule.resources.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('common:noPermissionsAvailable')}
      </div>
    );
  }

  // Get all unique actions across all resources in this module
  const allActions = new Set();
  currentModule.resources.forEach((resource) => {
    resource.actions.forEach((action) => {
      allActions.add(JSON.stringify(action)); // Use JSON to deduplicate objects
    });
  });

  // Convert back to array and sort by priority
  const actionPriority = { view: 1, create: 2, edit: 3, delete: 4, export: 5, invite: 6, manage: 7 };
  const uniqueActions = Array.from(allActions)
    .map((json) => JSON.parse(json))
    .sort((a, b) => (actionPriority[a.key] || 99) - (actionPriority[b.key] || 99));

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-200 rounded-lg">
        {/* Table Header */}
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
              {t('common:resource')}
            </th>
            {uniqueActions.map((action) => (
              <th
                key={action.key}
                className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-l border-b border-gray-100"
              >
                {isRTL ? (action.label_ar || action.label_en) : action.label_en}
              </th>
            ))}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {currentModule.resources.map((resource) => (
            <MatrixRow
              key={resource.key}
              resourceData={resource}
              actions={uniqueActions}
              roleDefaults={roleDefaults}
              grants={grants}
              revokes={revokes}
              onToggle={onToggle}
              disabled={disabled}
            />
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded border-2 border-blue-500 bg-blue-50"></div>
          <span>{t('common:roleDefault')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-5 h-5 rounded border-2 border-green-500 bg-green-50">
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
          </div>
          <span>{t('common:customGrantAdded')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-5 h-5 rounded border-2 border-red-500 bg-red-50">
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </div>
          <span>{t('common:customRevokeRemoved')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded border-2 border-gray-300"></div>
          <span>{t('common:notGranted')}</span>
        </div>
      </div>
    </div>
  );
};

export default PermissionMatrix;
