/**
 * Role Builder Component
 * Allows building a role by selecting permissions from available options
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, CheckSquare, Square } from 'lucide-react';

const RoleBuilder = ({ availablePermissions, selectedPermissions = [], onPermissionsChange }) => {
  const { t } = useTranslation(['common', 'settings']);
  const [expandedModules, setExpandedModules] = useState({});

  console.log('RoleBuilder - availablePermissions:', availablePermissions);
  console.log('RoleBuilder - selectedPermissions:', selectedPermissions);

  if (!availablePermissions) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('common:loading')}
      </div>
    );
  }

  if (!Array.isArray(availablePermissions) || availablePermissions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('settings:noPermissionsAvailable')}
      </div>
    );
  }

  const toggleModule = (moduleKey) => {
    setExpandedModules(prev => ({ ...prev, [moduleKey]: !prev[moduleKey] }));
  };

  const togglePermission = (permission) => {
    if (selectedPermissions.includes(permission)) {
      // Remove permission
      onPermissionsChange(selectedPermissions.filter(p => p !== permission));
    } else {
      // Add permission
      onPermissionsChange([...selectedPermissions, permission]);
    }
  };

  const toggleAllModulePermissions = (modulePermissions) => {
    const allSelected = modulePermissions.every(p => selectedPermissions.includes(p));

    if (allSelected) {
      // Deselect all from this module
      onPermissionsChange(selectedPermissions.filter(p => !modulePermissions.includes(p)));
    } else {
      // Select all from this module
      const newPermissions = [...selectedPermissions];
      modulePermissions.forEach(p => {
        if (!newPermissions.includes(p)) {
          newPermissions.push(p);
        }
      });
      onPermissionsChange(newPermissions);
    }
  };

  return (
    <div className="space-y-4">
      {availablePermissions.map((group) => {
        const isExpanded = expandedModules[group.key] ?? false;

        // Get all permissions in this group
        const groupPermissions = group.permissions || [];
        const selectedCount = groupPermissions.filter(p => selectedPermissions.includes(p)).length;
        const totalCount = groupPermissions.length;
        const allSelected = selectedCount === totalCount && totalCount > 0;
        const someSelected = selectedCount > 0 && selectedCount < totalCount;

        return (
          <div
            key={group.key}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* Module Header */}
            <div
              className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
              onClick={() => toggleModule(group.key)}
            >
              <div className="flex items-center gap-3 flex-1">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleModule(group.key);
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>

                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 text-start">
                    {t(`common:${group.key}`)}
                  </h3>
                  <p className="text-xs text-gray-500 text-start">
                    {selectedCount} / {totalCount} {t('settings:permissionsSelected')}
                  </p>
                </div>
              </div>

              {/* Select All Checkbox */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAllModulePermissions(groupPermissions);
                }}
                className="p-1 text-gray-400 hover:text-indigo-600"
                title={allSelected ? t('common:deselectAll') : t('common:selectAll')}
              >
                {allSelected ? (
                  <CheckSquare className="w-5 h-5 text-indigo-600" />
                ) : someSelected ? (
                  <div className="w-5 h-5 border-2 border-indigo-600 rounded flex items-center justify-center">
                    <div className="w-2 h-2 bg-indigo-600"></div>
                  </div>
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Permissions List */}
            {isExpanded && (
              <div className="px-4 py-3 bg-white space-y-2">
                {groupPermissions.length === 0 ? (
                  <p className="text-sm text-gray-500 text-start">
                    {t('settings:noPermissionsInModule')}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {groupPermissions.map((permission) => {
                      const isSelected = selectedPermissions.includes(permission);

                      // Parse permission key (e.g., "contacts.view" → "view")
                      const parts = permission.split('.');
                      const action = parts[parts.length - 1];

                      return (
                        <label
                          key={permission}
                          className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePermission(permission)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700 text-start">
                            {t(`common:${action}`)}
                          </span>
                          <span className="text-xs text-gray-400 font-mono ms-auto">
                            {permission}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Summary */}
      {selectedPermissions.length === 0 && (
        <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 text-start">
            ⚠️ {t('settings:noPermissionsSelectedWarning')}
          </p>
        </div>
      )}
    </div>
  );
};

export default RoleBuilder;
