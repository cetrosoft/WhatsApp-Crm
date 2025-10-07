/**
 * Create Role Page
 * Form to create a new custom role with permission selection
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { roleAPI, permissionAPI } from '../services/api';
import { Shield, ArrowLeft, Save, Settings, Users, Building, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import PermissionMatrix from '../components/Permissions/PermissionMatrix';

const CreateRole = () => {
  const { t } = useTranslation(['common', 'settings']);
  const navigate = useNavigate();
  const { roleId } = useParams();
  const isEditMode = !!roleId;
  const isViewMode = isEditMode; // For now, edit mode is read-only for system roles

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    is_system: false,
  });

  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState(null);
  const [selectedModule, setSelectedModule] = useState('crm');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAvailablePermissions();
    if (isEditMode) {
      fetchRole();
    }
  }, [roleId]);

  const fetchAvailablePermissions = async () => {
    try {
      const data = await permissionAPI.getAvailablePermissions();
      console.log('Available permissions response:', data);

      if (!data || !data.groups) {
        throw new Error('Invalid permissions data structure');
      }

      // PermissionMatrix expects full data object with groups and roles
      setAvailablePermissions(data);
      setError(null);
    } catch (error) {
      console.error('Fetch permissions error:', error);
      setError(error.message || t('common:error'));
      toast.error(error.message || t('common:error'));
      // Set empty array so page doesn't stay loading
      setAvailablePermissions({ groups: [], roles: {} });
    } finally {
      if (!isEditMode) {
        setLoading(false);
      }
    }
  };

  const fetchRole = async () => {
    try {
      const data = await roleAPI.getRole(roleId);
      console.log('Role data:', data);

      setFormData({
        name: data.role.name,
        slug: data.role.slug,
        description: data.role.description || '',
        is_system: data.role.is_system,
      });

      // Set permissions
      const permissions = Array.isArray(data.role.permissions) ? data.role.permissions : [];
      setSelectedPermissions(permissions);
      setError(null);
    } catch (error) {
      console.error('Fetch role error:', error);
      setError(error.message || t('common:error'));
      toast.error(error.message || t('common:error'));
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

    setFormData(prev => ({ ...prev, name, slug }));
  };

  // Handle permission toggle
  const handleTogglePermission = (permission) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permission)) {
        // Remove permission
        return prev.filter(p => p !== permission);
      } else {
        // Add permission
        return [...prev, permission];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // System roles are read-only
    if (formData.is_system) {
      toast.error(t('settings:cannotEditSystemRole'));
      return;
    }

    // Validation
    if (!formData.name.trim()) {
      toast.error(t('settings:roleNameRequired'));
      return;
    }

    if (!formData.slug.trim()) {
      toast.error(t('settings:roleSlugRequired'));
      return;
    }

    if (selectedPermissions.length === 0) {
      toast.error(t('settings:selectAtLeastOnePermission'));
      return;
    }

    setSubmitting(true);
    try {
      if (isEditMode) {
        // Update existing role
        await roleAPI.updateRole(roleId, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          permissions: selectedPermissions,
        });
        toast.success(t('settings:roleUpdated'));
      } else {
        // Create new role
        await roleAPI.createRole({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          description: formData.description.trim(),
          permissions: selectedPermissions,
        });
        toast.success(t('settings:roleCreated'));
      }
      navigate('/team/roles');
    } catch (error) {
      console.error('Save role error:', error);
      toast.error(error.message || t('common:error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Permissions</h3>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchAvailablePermissions}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Compact Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/team/roles')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-indigo-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {isEditMode ? (formData.is_system ? t('common:view') : t('common:edit')) : t('settings:createRole')} {isEditMode && formData.name}
              </h1>
              <p className="text-xs text-gray-600">
                {isEditMode ? `${selectedPermissions.length} ${t('settings:permissionsSelected')}` : t('settings:createRoleDescription')}
              </p>
            </div>
          </div>
          {formData.is_system && (
            <span className="ms-auto px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {t('settings:systemRole')}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Compact Role Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 text-start">
                  {t('settings:roleName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={formData.is_system}
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-start disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder={t('settings:roleNamePlaceholder')}
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 text-start">
                  {t('settings:roleSlug')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={isEditMode}
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-start font-mono disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder={t('settings:roleSlugPlaceholder')}
                  pattern="[a-z0-9_]+"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 text-start">
                  {t('common:description')}
                </label>
                <input
                  type="text"
                  disabled={formData.is_system}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-start disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder={t('settings:roleDescriptionPlaceholder')}
                />
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            {/* Module Tabs - More compact */}
            <div className="border-b border-gray-200 mb-4">
              <nav className="flex -mb-px gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedModule('crm')}
                  className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium text-xs transition-colors ${
                    selectedModule === 'crm'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{t('common:crm')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedModule('settings')}
                  className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium text-xs transition-colors ${
                    selectedModule === 'settings'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>{t('common:settings')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedModule('team')}
                  className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium text-xs transition-colors ${
                    selectedModule === 'team'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{t('common:team')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedModule('organization')}
                  className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium text-xs transition-colors ${
                    selectedModule === 'organization'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>{t('common:organization')}</span>
                </button>
                <div className="ms-auto flex items-center px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>{selectedPermissions.length}</strong> {t('settings:permissionsSelected')}
                  </p>
                </div>
              </nav>
            </div>

            {/* Permission Matrix */}
            <PermissionMatrix
              moduleKey={selectedModule}
              availablePermissions={availablePermissions}
              roleDefaults={[]}
              grants={selectedPermissions}
              revokes={[]}
              onToggle={handleTogglePermission}
              disabled={formData.is_system}
            />
          </div>

          {/* Compact Action Buttons */}
          {!formData.is_system && (
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => navigate('/team/roles')}
                disabled={submitting}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {t('common:cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {submitting ? t('common:loading') : (isEditMode ? t('common:save') : t('settings:createRole'))}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateRole;
