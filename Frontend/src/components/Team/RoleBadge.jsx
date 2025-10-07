/**
 * Role Badge Component
 * Displays user role as a colored badge
 */

import React from 'react';
import { getRoleBadgeColor } from '../../utils/permissionUtils';

const RoleBadge = ({ role }) => {
  const colorClasses = getRoleBadgeColor(role);

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${colorClasses}`}>
      {role}
    </span>
  );
};

export default RoleBadge;
