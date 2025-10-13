/**
 * Roles & Permissions Page
 * Overview of roles and permission management
 * Route: /team/roles
 */

import React, { useState, useEffect } from 'react';
import { Shield, Users, Settings, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAvailablePermissions } from '../../hooks/usePermissions';
import { useUsers } from '../../hooks/useUsers';
import PermissionModal from '../../components/Permissions/PermissionModal';
import RoleQuickEditModal from '../../components/RoleQuickEditModal';
import RoleCard from '../../components/Team/RoleCard';
import DeleteRoleModal from '../../components/Team/DeleteRoleModal';
import UserPermissionsList from '../../components/Team/UserPermissionsList';
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
                    <RoleCard
                      key={role.id}
                      role={role}
                      onEdit={handleQuickEdit}
                      onDuplicate={handleDuplicate}
                      onDelete={setDeleteConfirm}
                      duplicating={duplicating}
                      getRoleBadgeColor={getRoleBadgeColor}
                    />
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
                <UserPermissionsList
                  users={usersWithCustomPermissions}
                  onManagePermissions={handleManagePermissions}
                />
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
      <DeleteRoleModal
        role={deleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        deleting={deleting}
      />
    </div>
  );
};

export default RolesPermissions;
