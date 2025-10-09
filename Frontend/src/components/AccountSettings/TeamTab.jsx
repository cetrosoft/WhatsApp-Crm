/**
 * Team Tab
 * Manage team members - invite, view, change roles, deactivate
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { userAPI, roleAPI } from '../../services/api';
import { Mail, UserPlus, MoreVertical, Shield, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

const TeamTab = () => {
  const { t } = useTranslation(['settings', 'common']);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', roleId: '' });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchUsers(), fetchRoles()]);
  };

  const fetchUsers = async () => {
    try {
      const data = await userAPI.getUsers();
      setUsers(data.users || []);
    } catch (error) {
      toast.error(t('failedToLoadTeamMembers', { ns: 'common' }));
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await roleAPI.getRoles();
      setRoles(data.roles || []);
      // Set default roleId to member role
      if (data.roles && data.roles.length > 0) {
        const memberRole = data.roles.find(r => r.slug === 'member');
        if (memberRole) {
          setInviteData(prev => ({ ...prev, roleId: memberRole.id }));
        }
      }
    } catch (error) {
      toast.error(t('failedToLoadRoles', { ns: 'common' }));
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);

    try {
      // Send roleId to backend
      await userAPI.inviteUser(inviteData.email, null, inviteData.roleId);
      toast.success(t('invitationSent'));
      setShowInviteModal(false);
      // Reset to default member role
      const memberRole = roles.find(r => r.slug === 'member');
      setInviteData({ email: '', roleId: memberRole?.id || '' });
    } catch (error) {
      toast.error(error.message || t('failedToSave', { ns: 'common', resource: t('invitation', { ns: 'common' }) }));
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (userId, newRoleId) => {
    try {
      await userAPI.updateUser(userId, { roleId: newRoleId });
      toast.success(t('roleUpdated'));
      fetchUsers();
    } catch (error) {
      toast.error(error.message || t('failedToUpdate', { ns: 'common', resource: t('role', { ns: 'settings' }) }));
    }
  };

  const handleToggleActive = async (userId, isActive) => {
    try {
      await userAPI.updateUser(userId, { isActive: !isActive });
      toast.success(isActive ? t('userDeactivated') : t('userActivated'));
      fetchUsers();
    } catch (error) {
      toast.error(error.message || t('failedToUpdate', { ns: 'common', resource: t('user', { ns: 'common' }) }));
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      agent: 'bg-green-100 text-green-800',
      member: 'bg-gray-100 text-gray-800',
    };
    return colors[role] || colors.member;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {t('teamMembers')}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage your team members and their roles
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <UserPlus className="w-4 h-4" />
          {t('inviteUser')}
        </button>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('name', { ns: 'common' })}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('email', { ns: 'common' })}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('role')}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('status')}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap text-start">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-600">
                        {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {user.full_name || 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-start text-sm text-gray-600">
                  {user.email}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-start">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                    {t(user.role)}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-start">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? t('active') : t('inactive')}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-start">
                  <div className="flex items-center gap-2">
                    <select
                      value={user.roleId || user.role}
                      onChange={(e) => handleChangeRole(user.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name} {role.is_system ? '' : '(Custom)'}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleToggleActive(user.id, user.is_active)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title={user.is_active ? t('deactivate') : t('activate')}
                    >
                      {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('inviteUser')}
            </h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
                  {t('email', { ns: 'common' })}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={inviteData.email}
                    onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full ps-10 pe-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-start"
                    placeholder={t('enterEmail')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
                  {t('role')}
                </label>
                <select
                  value={inviteData.roleId}
                  onChange={(e) => setInviteData(prev => ({ ...prev, roleId: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-start"
                  required
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} {role.is_system ? '' : '(Custom)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  {t('cancel', { ns: 'common' })}
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {inviting ? t('loading', { ns: 'common' }) : t('send')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamTab;
