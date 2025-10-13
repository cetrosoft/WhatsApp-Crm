/**
 * Roles & Permissions Page
 * Overview of roles and permission management
 * Route: /team/roles
 */

import React, { useState, useEffect } from 'react';
import { Shield, Users, Settings, Building, Plus, Trash2, Edit, Lock, Edit2, Copy, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAvailablePermissions } from '../../hooks/usePermissions';
import { useUsers } from '../../hooks/useUsers';
import PermissionBadge from '../../components/Permissions/PermissionBadge';
import PermissionModal from '../../components/Permissions/PermissionModal';
import PermissionMatrix from '../../components/Permissions/PermissionMatrix';
import RoleQuickEditModal from '../../components/RoleQuickEditModal';
import { permissionAPI, roleAPI } from '../../services/api';
import toast from 'react-hot-toast';

const RolesPermissions = () => {
  const { t } = useTranslation(['common', 'settings']);
  const navigate = useNavigate();
  const { availablePermissions, loading } = useAvailablePermissions();
  const { users, loading: usersLoading, fetchUsers } = useUsers();
  const [activeTab, setActiveTab] = useState('manage');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // Role management state
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [duplicating, setDuplicating] = useState(null);

  useEffect(() => {
    if (activeTab === 'manage') {
      fetchRoles();
    }
  }, [activeTab]);

  const fetchRoles = async () => {
    try {
      const data = await roleAPI.getRoles();
      console.log('Roles data:', data);
      setRoles(data.roles || []);
    } catch (error) {
      console.error('Fetch roles error:', error);
      toast.error(error.message || t('common:error'));
    } finally {
      setRolesLoading(false);
    }
  };

  const handleDelete = async (roleId) => {
    setDeleting(true);
    try {
      await roleAPI.deleteRole(roleId);
      toast.success(t('settings:roleDeleted'));
      fetchRoles();
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(error.message || t('common:error'));
    } finally {
      setDeleting(false);
    }
  };

  const handleQuickEdit = (role) => {
    setSelectedRole(role);
    setEditModalOpen(true);
  };

  const handleDuplicate = async (role) => {
    setDuplicating(role.id);
    try {
      // Create copy with modified name
      const duplicatedRole = {
        name: `${role.name} (Copy)`,
        slug: `${role.slug}_copy_${Date.now()}`,
        description: role.description || '',
        permissions: role.permissions || [],
      };

      const response = await roleAPI.createRole(duplicatedRole);
      toast.success(t('settings:roleDuplicated'));
      fetchRoles();

      // Open quick edit modal with the new role
      if (response.role) {
        setSelectedRole(response.role);
        setEditModalOpen(true);
      }
    } catch (error) {
      console.error('Duplicate role error:', error);
      toast.error(error.message || t('common:error'));
    } finally {
      setDuplicating(null);
    }
  };

  const getRoleBadgeColor = (slug) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800 border-purple-200',
      manager: 'bg-blue-100 text-blue-800 border-blue-200',
      agent: 'bg-green-100 text-green-800 border-green-200',
      member: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[slug] || 'bg-orange-100 text-orange-800 border-orange-200';
  };

  const handleManagePermissions = (user) => {
    setSelectedUser(user);
    setShowPermissionModal(true);
  };

  const handleSavePermissions = async (grant, revoke) => {
    if (!selectedUser) return;

    try {
      await permissionAPI.updateUserPermissions(selectedUser.id, grant, revoke);
      await fetchUsers();
    } catch (error) {
      throw error;
    }
  };

  // Get users with custom permissions
  const usersWithCustomPermissions = users.filter(
    (user) => user.permissions && (user.permissions.grant?.length > 0 || user.permissions.revoke?.length > 0)
  );

  // DEBUG: Console logging to diagnose data issues
  console.log('=== ROLES & PERMISSIONS DEBUG ===');
  console.log('Total users loaded:', users.length);
  console.log('Users with custom permissions:', usersWithCustomPermissions.length);
  console.log('User data sample:', users.slice(0, 2).map(u => ({
    email: u.email,
    role: u.role,
    permissions: u.permissions
  })));

  if (loading || usersLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {t('common:rolesPermissions')}
        </h1>
        <p className="mt-2 text-gray-600">
          {t('common:rolesPermissionsDescription')}
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('manage')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'manage'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>{t('settings:roleManagement')}</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>{t('common:userPermissions')} ({usersWithCustomPermissions.length})</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'manage' && (
            <div className="space-y-6">
              {/* Header with Create Button */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {t('settings:roleManagementDescription')}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/team/roles/create')}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  {t('settings:createRole')}
                </button>
              </div>

              {/* Roles Grid */}
              {rolesLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : roles.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('settings:noRolesYet')}
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    {t('settings:createFirstRole')}
                  </p>
                  <button
                    onClick={() => navigate('/team/roles/create')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4" />
                    {t('settings:createRole')}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition"
                    >
                      {/* Role Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg ${getRoleBadgeColor(role.slug)} border-2 flex items-center justify-center`}>
                            {role.is_system ? (
                              <Lock className="w-6 h-6" />
                            ) : (
                              <Shield className="w-6 h-6" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {role.name}
                            </h3>
                            <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor(role.slug)}`}>
                              {role.slug}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {role.description || t('settings:noDescription')}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Users className="w-4 h-4" />
                          <span>{role.user_count || 0} {t('common:users')}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Shield className="w-4 h-4" />
                          <span>{role.permission_count || 0} {t('settings:permissions')}</span>
                        </div>
                      </div>

                      {/* Custom Role Badge */}
                      {!role.is_system && (
                        <div className="mb-4 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center gap-2 text-xs text-orange-700">
                            <Shield className="w-3 h-3" />
                            <span>{t('settings:customRole')}</span>
                          </div>
                        </div>
                      )}

                      {/* System Role Badge */}
                      {role.is_system && (
                        <div className="mb-4 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 text-xs text-blue-700">
                            <Lock className="w-3 h-3" />
                            <span>{t('settings:systemRole')}</span>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                        {/* View Details */}
                        <button
                          onClick={() => navigate(`/team/roles/edit/${role.id}`)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                          title={t('common:viewDetails')}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{t('common:view')}</span>
                        </button>

                        {/* Quick Edit - All roles except Admin */}
                        {role.slug !== 'admin' && (
                          <button
                            onClick={() => handleQuickEdit(role)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
                            title={t('common:edit')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{t('common:edit')}</span>
                          </button>
                        )}

                        {/* Duplicate - All roles */}
                        <button
                          onClick={() => handleDuplicate(role)}
                          disabled={duplicating === role.id}
                          className="px-2 py-2 text-xs border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                          title={t('settings:duplicateRole')}
                        >
                          {duplicating === role.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Delete - Custom roles only (not system roles) */}
                        {!role.is_system && (
                          <button
                            onClick={() => setDeleteConfirm(role)}
                            className="px-2 py-2 text-xs border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                            title={t('common:delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              {usersWithCustomPermissions.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    {t('common:noCustomPermissions')}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {t('common:usersUsingDefaultRoles')}
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto text-start">
                    <p className="text-sm text-blue-800 mb-2">
                      <strong>{t('common:howToGrantCustomPermissions')}</strong>
                    </p>
                    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                      <li>{t('common:grantPermissionStep1')}</li>
                      <li>{t('common:grantPermissionStep2')}</li>
                      <li>{t('common:grantPermissionStep3')}</li>
                      <li>{t('common:grantPermissionStep4')}</li>
                    </ol>
                  </div>
                </div>
              ) : (
                usersWithCustomPermissions.map((user) => (
                  <div
                    key={user.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {user.full_name || user.email}
                        </h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500 mt-1 capitalize">
                          {t('common:role')}: {t(`settings:${user.role}`)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleManagePermissions(user)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        {t('common:managePermissions')}
                      </button>
                    </div>

                    {/* Custom Permissions Summary */}
                    <div className="mt-3 flex gap-6">
                      {user.permissions?.grant?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-green-700 mb-1">
                            {t('common:grantedPermissions')} ({user.permissions.grant.length})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {user.permissions.grant.map((perm) => (
                              <PermissionBadge
                                key={perm}
                                permission={perm}
                                variant="granted"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {user.permissions?.revoke?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-red-700 mb-1">
                            {t('common:revokedPermissions')} ({user.permissions.revoke.length})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {user.permissions.revoke.map((perm) => (
                              <PermissionBadge
                                key={perm}
                                permission={perm}
                                variant="revoked"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Permission Modal */}
      <PermissionModal
        user={selectedUser}
        isOpen={showPermissionModal}
        onClose={() => {
          setShowPermissionModal(false);
          setSelectedUser(null);
        }}
        onSave={handleSavePermissions}
      />

      {/* Quick Edit Modal */}
      <RoleQuickEditModal
        role={selectedRole}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedRole(null);
        }}
        onSuccess={() => {
          fetchRoles();
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('settings:deleteRole')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('settings:confirmDeleteRole')}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-900">
                {deleteConfirm.name} ({deleteConfirm.slug})
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {deleteConfirm.user_count || 0} {t('common:users')} • {deleteConfirm.permission_count || 0} {t('settings:permissions')}
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-800">
                ⚠️ {t('settings:deleteRoleWarning')}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {t('common:cancel')}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? t('common:loading') : t('common:delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPermissions;
