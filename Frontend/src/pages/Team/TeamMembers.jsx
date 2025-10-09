/**
 * Team Members Page
 * Main page for managing team members
 * Route: /team/members
 */

import React, { useState } from 'react';
import { UserPlus, Search, Users as UsersIcon, Mail, Shield, Send, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUsers } from '../../hooks/useUsers';
import { useRoles } from '../../hooks/useRoles';
import UserTable from '../../components/Team/UserTable';
import PermissionModal from '../../components/Permissions/PermissionModal';
import EditUserModal from '../../components/Team/EditUserModal';
import ConfirmDialog from '../../components/Team/ConfirmDialog';
import { permissionAPI } from '../../services/api';

const TeamMembers = () => {
  const { t } = useTranslation(['common', 'settings']);
  const { users, loading, inviteUser, updateUser, deleteUser, changeRole, toggleActive, fetchUsers } = useUsers();
  const { roles, loading: rolesLoading } = useRoles();

  const [activeTab, setActiveTab] = useState('members');
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Set default invite role when roles load
  React.useEffect(() => {
    if (roles.length > 0 && !inviteRole) {
      const memberRole = roles.find(r => r.slug === 'member');
      setInviteRole(memberRole?.slug || roles[0]?.slug || '');
    }
  }, [roles, inviteRole]);

  // Filter users based on search and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch = !searchQuery ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setInviting(true);
      setInviteSuccess(false);
      // Find the role object to get the roleId
      const selectedRole = roles.find(r => r.slug === inviteRole);
      await inviteUser(inviteEmail, inviteRole, selectedRole?.id);
      setInviteSuccess(true);
      // Reset form after 2 seconds
      setTimeout(() => {
        setInviteEmail('');
        const memberRole = roles.find(r => r.slug === 'member');
        setInviteRole(memberRole?.slug || roles[0]?.slug || '');
        setInviteSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Invite error:', error);
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (userId, roleSlug) => {
    // Find the role object to get the roleId
    const selectedRole = roles.find(r => r.slug === roleSlug);
    if (!selectedRole) {
      console.error('Role not found:', roleSlug);
      return;
    }

    // Call changeRole with both slug and roleId
    await changeRole(userId, roleSlug, selectedRole.id);
  };

  const handleManagePermissions = (user) => {
    setSelectedUser(user);
    setShowPermissionModal(true);
  };

  const handleSavePermissions = async (grant, revoke) => {
    if (!selectedUser) return;

    console.log('=== SAVING PERMISSIONS ===');
    console.log('User:', selectedUser.email);
    console.log('Granting:', grant);
    console.log('Revoking:', revoke);

    try {
      const result = await permissionAPI.updateUserPermissions(selectedUser.id, grant, revoke);
      console.log('Permission update result:', result);
      // Refresh users to get updated permissions
      await fetchUsers();
      console.log('Users refreshed after permission update');
    } catch (error) {
      console.error('Error saving permissions:', error);
      throw error;
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleSaveUser = async (userId, formData) => {
    try {
      await updateUser(userId, {
        fullName: formData.fullName,
        roleId: formData.roleId,
        isActive: formData.isActive,
      });
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    try {
      await deleteUser(selectedUser.id);
      setShowDeleteDialog(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  if (loading || rolesLoading) {
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
          {t('common:teamMembers')}
        </h1>
        <p className="mt-2 text-gray-600">
          {t('common:manageTeamDescription')}
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'members'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UsersIcon className="w-5 h-5" />
              <span>{t('common:teamMembers')}</span>
            </button>
            <button
              onClick={() => setActiveTab('invite')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'invite'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserPlus className="w-5 h-5" />
              <span>{t('common:inviteMember')}</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'members' && (
            <div className="space-y-6">
              {/* Filters & Actions */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 w-full md:max-w-md">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <Search className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('common:search')}
                    className="w-full ps-10 pe-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">{t('common:allRoles')}</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.slug}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Users Table */}
              <UserTable
                users={filteredUsers}
                roles={roles}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                onChangeRole={handleChangeRole}
                onToggleActive={toggleActive}
                showPermissions={false}
              />
            </div>
          )}

          {activeTab === 'invite' && (
            <div className="max-w-2xl mx-auto">
              {/* Invitation Form */}
              <form onSubmit={handleInviteSubmit} className="space-y-6">
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-start">
                    {t('common:email')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full ps-10 pe-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-start"
                      placeholder="colleague@example.com"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500 text-start">
                    {t('common:inviteEmailHelp')}
                  </p>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-start">
                    {t('settings:role')}
                  </label>
                  <div className="space-y-3">
                    {roles.map((role) => (
                      <label
                        key={role.id}
                        className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-indigo-300 transition-colors ${
                          inviteRole === role.slug ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role.slug}
                          checked={inviteRole === role.slug}
                          onChange={(e) => setInviteRole(e.target.value)}
                          className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <div className="flex-1 text-start">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900">
                              {role.name}
                            </span>
                            {!role.is_system && (
                              <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                                Custom
                              </span>
                            )}
                          </div>
                          {role.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {role.description}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={inviting || !inviteEmail.trim() || inviteSuccess}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {inviteSuccess ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        {t('common:invitationSent')}
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {inviting ? t('common:sending') : t('settings:send')}
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Info Box */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2 text-start">
                  {t('common:whatHappensNext')}
                </h3>
                <ul className="space-y-1 text-sm text-blue-800 text-start">
                  <li>• {t('common:inviteStep1')}</li>
                  <li>• {t('common:inviteStep2')}</li>
                  <li>• {t('common:inviteStep3')}</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}

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

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        onSave={handleSaveUser}
        user={selectedUser}
        roles={roles}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedUser(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t('common:deleteUser')}
        message={t('common:confirmDeleteUser', { name: selectedUser?.full_name || selectedUser?.email })}
        confirmText={t('common:delete')}
        cancelText={t('common:cancel')}
        variant="danger"
      />
    </div>
  );
};

export default TeamMembers;
