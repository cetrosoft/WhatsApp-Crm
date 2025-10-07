/**
 * Permission Summary Component
 * Displays a summary of user's effective permissions
 */

import React from 'react';
import { Shield, Plus, Minus } from 'lucide-react';
import PermissionBadge from './PermissionBadge';

const PermissionSummary = ({
  role,
  customGrants = [],
  customRevokes = [],
  effectiveCount = 0
}) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Role & Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              Role: <span className="capitalize">{role}</span>
            </p>
            <p className="text-xs text-gray-500">
              {effectiveCount} effective permissions
            </p>
          </div>
        </div>
      </div>

      {/* Custom Grants */}
      {customGrants.length > 0 && (
        <div>
          <div className="flex items-center gap-1 mb-2">
            <Plus className="w-4 h-4 text-green-600" />
            <p className="text-xs font-medium text-gray-700">
              Granted Permissions ({customGrants.length})
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {customGrants.map((permission) => (
              <PermissionBadge
                key={permission}
                permission={permission}
                variant="granted"
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom Revokes */}
      {customRevokes.length > 0 && (
        <div>
          <div className="flex items-center gap-1 mb-2">
            <Minus className="w-4 h-4 text-red-600" />
            <p className="text-xs font-medium text-gray-700">
              Revoked Permissions ({customRevokes.length})
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {customRevokes.map((permission) => (
              <PermissionBadge
                key={permission}
                permission={permission}
                variant="revoked"
              />
            ))}
          </div>
        </div>
      )}

      {/* No Custom Permissions */}
      {customGrants.length === 0 && customRevokes.length === 0 && (
        <p className="text-xs text-gray-500 italic">
          No custom permissions. Using role defaults only.
        </p>
      )}
    </div>
  );
};

export default PermissionSummary;
