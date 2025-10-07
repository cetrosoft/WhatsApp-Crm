/**
 * Permission Group Component
 * Displays a group of related permissions with checkboxes
 */

import React from 'react';
import { formatPermissionLabel } from '../../utils/permissionUtils';

const PermissionGroup = ({
  title,
  permissions = [],
  selectedPermissions = [],
  revokedPermissions = [],
  grantedPermissions = [],
  onChange,
  disabled = false
}) => {
  // Handle both object {key, label} and string formats
  const getPermissionKey = (perm) => {
    return typeof perm === 'object' ? perm.key : perm;
  };

  const getPermissionLabel = (perm) => {
    return typeof perm === 'object' ? perm.label : formatPermissionLabel(perm);
  };

  const isSelected = (perm) => selectedPermissions.includes(getPermissionKey(perm));
  const isRevoked = (perm) => revokedPermissions.includes(getPermissionKey(perm));
  const isGranted = (perm) => grantedPermissions.includes(getPermissionKey(perm));

  const handleChange = (perm, checked) => {
    if (onChange) {
      onChange(getPermissionKey(perm), checked);
    }
  };

  if (permissions.length === 0) {
    return null;
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">{title}</h4>
      <div className="space-y-2">
        {permissions.map((permission) => {
          const permKey = getPermissionKey(permission);
          const permLabel = getPermissionLabel(permission);
          const selected = isSelected(permission);
          const revoked = isRevoked(permission);
          const granted = isGranted(permission);

          return (
            <label
              key={permKey}
              className={`flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={(e) => handleChange(permission, e.target.checked)}
                disabled={disabled}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="flex-1 text-sm text-gray-700">
                {permLabel}
              </span>
              {granted && (
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                  Granted
                </span>
              )}
              {revoked && (
                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                  Revoked
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default PermissionGroup;
