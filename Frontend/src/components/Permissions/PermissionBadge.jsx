/**
 * Permission Badge Component
 * Displays a single permission as a colored badge
 */

import React from 'react';
import { X } from 'lucide-react';
import { formatPermissionLabel, getPermissionBadgeColor } from '../../utils/permissionUtils';

const PermissionBadge = ({
  permission,
  variant = 'default',
  onRemove = null,
  showLabel = true
}) => {
  const colorClasses = getPermissionBadgeColor(variant);
  const label = showLabel ? formatPermissionLabel(permission) : permission;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${colorClasses}`}>
      {label}
      {onRemove && (
        <button
          onClick={() => onRemove(permission)}
          className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
          aria-label="Remove permission"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

export default PermissionBadge;
