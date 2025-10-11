/**
 * Matrix Row Component
 * Renders a single row in the permission matrix table
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { getPermissionState, buildPermissionKey, getResourceLabel } from '../../utils/matrixUtils';

const MatrixRow = ({
  resourceData,
  actions = [],
  roleDefaults = [],
  grants = [],
  revokes = [],
  onToggle,
  disabled = false,
}) => {
  const { t, i18n } = useTranslation(['common']);
  const resource = resourceData.key;
  const currentLanguage = i18n.language;

  // Check if this resource has this specific action available
  const hasAction = (actionKey) => {
    return resourceData.actions?.some(a => a.key === actionKey);
  };

  const renderCheckbox = (action) => {
    const permissionKey = buildPermissionKey(resource, action.key);
    const state = getPermissionState(permissionKey, roleDefaults, grants, revokes);

    // Determine checkbox visual state
    const getCheckboxClasses = () => {
      if (disabled) {
        return 'w-5 h-5 rounded border-2 border-gray-300 bg-gray-100 cursor-not-allowed';
      }

      if (state.isRevoked) {
        return 'w-5 h-5 rounded border-2 border-red-500 bg-red-50 cursor-pointer hover:border-red-600';
      }

      if (state.isGranted) {
        return 'w-5 h-5 rounded border-2 border-green-500 bg-green-50 cursor-pointer hover:border-green-600';
      }

      if (state.isDefault) {
        return 'w-5 h-5 rounded border-2 border-blue-500 bg-blue-50 cursor-pointer hover:border-blue-600';
      }

      return 'w-5 h-5 rounded border-2 border-gray-300 cursor-pointer hover:border-indigo-500';
    };

    // Determine badge/indicator
    const renderIndicator = () => {
      if (state.isGranted) {
        return (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white" />
        );
      }

      if (state.isRevoked) {
        return (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
        );
      }

      return null;
    };

    return (
      <div className="relative flex items-center justify-center group">
        <input
          type="checkbox"
          checked={state.isChecked}
          onChange={(e) => onToggle(permissionKey, e.target.checked)}
          disabled={disabled}
          className={getCheckboxClasses()}
        />
        {renderIndicator()}

        {/* Tooltip */}
        <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
          <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
            {state.isDefault && !state.isRevoked && t('common:roleDefault')}
            {state.isGranted && t('common:customGrant')}
            {state.isRevoked && t('common:customRevoke')}
            {!state.isChecked && !state.isRevoked && t('common:notGranted')}
          </div>
        </div>
      </div>
    );
  };

  // Get resource display name (use bilingual label from backend if available)
  const getResourceDisplayName = () => {
    if (currentLanguage === 'ar' && resourceData.label_ar) {
      return resourceData.label_ar;
    }
    if (resourceData.label_en) {
      return resourceData.label_en;
    }
    // Fallback to i18n translation
    return t(`common:${resource}`);
  };

  return (
    <tr className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
      {/* Resource Name */}
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        {getResourceDisplayName()}
      </td>

      {/* Action Checkboxes */}
      {actions.map((action) => (
        <td key={action.key} className="px-4 py-3 text-center border-l border-gray-100">
          {hasAction(action.key) ? renderCheckbox(action) : (
            <span className="text-gray-300 text-sm">—</span>
          )}
        </td>
      ))}
    </tr>
  );
};

export default MatrixRow;
