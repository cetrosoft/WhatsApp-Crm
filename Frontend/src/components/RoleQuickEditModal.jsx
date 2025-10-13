/**
 * Role Quick Edit Modal
 * Inline permission editor for roles without full page navigation
 */

import React, { useState, useEffect } from 'react';
import { X, Save, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { roleAPI, permissionAPI } from '../services/api';
import PermissionMatrix from './Permissions/PermissionMatrix';
import { getModuleIcon } from '../utils/iconMapper';

const RoleQuickEditModal = ({ role, isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation(['common', 'settings']);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState(null);
  const [selectedModule, setSelectedModule] = useState('crm');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (isOpen && role) {
      loadData();
    }
  }, [isOpen, role]);

  // Set initial module to first available when permissions load
  useEffect(() => {
    if (availablePermissions?.groups) {
      const firstModule = Object.keys(availablePermissions.groups)[0];
      if (firstModule && !Object.keys(availablePermissions.groups).includes(selectedModule)) {
        setSelectedModule(firstModule);
      }
    }
  }, [availablePermissions]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load available permissions
      const perms = await permissionAPI.getAvailablePermissions();
      setAvailablePermissions(perms);

      // Set current role data
      setFormData({
        name: role.name,
        description: role.description || '',
      });
      setSelectedPermissions(Array.isArray(role.permissions) ? role.permissions : []);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast.error(t('common:error'));
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (permission) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission);
      } else {
        return [...prev, permission];
      }
    });
  };

  const handleSave = async () => {
    if (selectedPermissions.length === 0) {
      toast.error(t('settings:selectAtLeastOnePermission'));
      return;
    }

    setSaving(true);
    try {
      await roleAPI.updateRole(role.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        permissions: selectedPermissions,
      });

      toast.success(t('settings:roleUpdated'));
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(error.message || t('common:error'));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {t('common:edit')} {role?.name}
              </h2>
              <p className="text-sm text-gray-500">
                {selectedPermissions.length} {t('settings:permissionsSelected')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              {/* Role Details */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
                    {t('settings:roleName')}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={role?.slug === 'admin'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
                    {t('common:description')}
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={role?.slug === 'admin'}
                  />
                </div>
              </div>

              {/* Module Tabs - Dynamic from Backend */}
              <div className="border-b border-gray-200 mb-4">
                <nav className="flex -mb-px gap-1 overflow-x-auto">
                  {availablePermissions?.groups && Object.keys(availablePermissions.groups).map((moduleKey) => {
                    const moduleGroup = availablePermissions.groups[moduleKey];
                    const IconComponent = getModuleIcon(moduleKey, moduleGroup?.icon);
                    const moduleLabel = moduleGroup?.label || moduleKey;

                    return (
                      <button
                        key={moduleKey}
                        type="button"
                        onClick={() => setSelectedModule(moduleKey)}
                        className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                          selectedModule === moduleKey
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
              <PermissionMatrix
                moduleKey={selectedModule}
                availablePermissions={availablePermissions}
                roleDefaults={selectedPermissions}
                grants={[]}
                revokes={[]}
                onToggle={handleTogglePermission}
                disabled={role?.slug === 'admin'}
              />

              {/* Admin Role Warning */}
              {role?.slug === 'admin' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    ℹ️ {t('settings:systemRoleReadOnly')}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {t('common:cancel')}
          </button>
          {role?.slug !== 'admin' && (
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? t('common:saving') : t('common:save')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleQuickEditModal;
