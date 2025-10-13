/**
 * Permission Modal Component
 * Main reusable modal for managing user permissions
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAvailablePermissions } from '../../hooks/usePermissions';
import { calculateEffectivePermissions } from '../../utils/permissionUtils';
import PermissionMatrix from './PermissionMatrix';
import PermissionSummary from './PermissionSummary';
import { getModuleIcon } from '../../utils/iconMapper';

const PermissionModal = ({
  user,
  isOpen,
  onClose,
  onSave
}) => {
  const { t } = useTranslation(['common']);
  const { availablePermissions, loading } = useAvailablePermissions();
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [customGrants, setCustomGrants] = useState([]);
  const [customRevokes, setCustomRevokes] = useState([]);
  const [saving, setSaving] = useState(false);

  // Get available modules from backend (dynamic)
  const availableModules = availablePermissions?.groups
    ? Object.keys(availablePermissions.groups)
    : [];
  console.log('Available modules:', availableModules); // ← Add this
  console.log('Available permissions:', availablePermissions); // ← Add this
  const [activeModule, setActiveModule] = useState('crm');

  // Set active module to first available when permissions load
  useEffect(() => {
    if (availableModules.length > 0 && !availableModules.includes(activeModule)) {
      setActiveModule(availableModules[0]);
    }
  }, [availableModules]);

  // Initialize permissions when user or modal opens
  useEffect(() => {
    if (!user) return;

    // Get role defaults from user's role object (includes custom roles)
    const roleDefaults = user.rolePermissions || [];

    // Get custom overrides
    const userCustom = user.permissions || {};
    const grants = userCustom.grant || [];
    const revokes = userCustom.revoke || [];

    // Calculate effective permissions: role defaults + grants - revokes
    const effective = [
      ...roleDefaults,
      ...grants
    ].filter(p => !revokes.includes(p));

    // Remove duplicates
    const uniqueEffective = [...new Set(effective)];

    setSelectedPermissions(uniqueEffective);
    setCustomGrants(grants);
    setCustomRevokes(revokes);
  }, [user]);

  const handlePermissionToggle = (permission, checked) => {
    const roleDefaults = user.rolePermissions || [];
    const isRoleDefault = roleDefaults.includes(permission);

    let newGrants = [...customGrants];
    let newRevokes = [...customRevokes];
    let newSelected = [...selectedPermissions];

    if (checked) {
      // Permission is being enabled
      newSelected.push(permission);

      if (isRoleDefault) {
        // It's a role default - remove from revokes
        newRevokes = newRevokes.filter(p => p !== permission);
      } else {
        // It's not a role default - add to grants
        if (!newGrants.includes(permission)) {
          newGrants.push(permission);
        }
      }
    } else {
      // Permission is being disabled
      newSelected = newSelected.filter(p => p !== permission);

      if (isRoleDefault) {
        // It's a role default - add to revokes
        if (!newRevokes.includes(permission)) {
          newRevokes.push(permission);
        }
      } else {
        // It's not a role default - remove from grants
        newGrants = newGrants.filter(p => p !== permission);
      }
    }

    setSelectedPermissions(newSelected);
    setCustomGrants(newGrants);
    setCustomRevokes(newRevokes);
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      await onSave(customGrants, customRevokes);
      onClose();
    } catch (error) {
      console.error('Error saving permissions:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t('common:managePermissions')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {user?.full_name || user?.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="p-6 border-b border-gray-200">
                <PermissionSummary
                  role={user?.role}
                  customGrants={customGrants}
                  customRevokes={customRevokes}
                  effectiveCount={selectedPermissions.length}
                />
              </div>

              {/* Module Tabs - Dynamic from Backend */}
              <div className="border-b border-gray-200 bg-gray-50">
                <nav className="flex -mb-px px-6 overflow-x-auto">
                  {availableModules.map((moduleKey, index) => {
                    const moduleGroup = availablePermissions?.groups[moduleKey];
                    const IconComponent = getModuleIcon(moduleKey, moduleGroup?.icon);
                    const moduleLabel = moduleGroup?.label || moduleKey;

                    console.log(`🏷️ Rendering tab ${index + 1}:`, moduleKey, 'Icon:', moduleGroup?.icon || 'default', 'Label:', moduleLabel);

                    return (
                      <button
                        key={moduleKey}
                        onClick={() => setActiveModule(moduleKey)}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                          activeModule === moduleKey
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span>{t(`common:${moduleKey}`, moduleLabel)}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Permission Matrix */}
              <div className="p-6">
                <PermissionMatrix
                  moduleKey={activeModule}
                  availablePermissions={availablePermissions}
                  roleDefaults={user?.rolePermissions || []}
                  grants={customGrants}
                  revokes={customRevokes}
                  onToggle={handlePermissionToggle}
                  disabled={user?.role === 'admin'}
                />
              </div>

              {/* Admin Notice */}
              {user?.role === 'admin' && (
                <div className="px-6 pb-6">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-purple-800">
                      {t('common:adminPermissionNotice')}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('common:cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || user?.role === 'admin'}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? t('common:saving') : t('common:saveChanges')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionModal;
