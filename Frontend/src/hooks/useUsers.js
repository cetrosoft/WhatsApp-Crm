/**
 * useUsers Hook
 * Manages user CRUD operations for team management
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';

/**
 * Hook to manage users in the organization
 */
export const useUsers = () => {
  const { t } = useTranslation('common');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userAPI.getUsers();
      setUsers(data.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || t('failedToLoad', { resource: t('users') }));
      toast.error(t('failedToLoadTeamMembers'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Invite user
  const inviteUser = useCallback(async (email, role, roleId = null) => {
    try {
      await userAPI.inviteUser(email, role, roleId);
      toast.success(t('invitationSent'));
      // Don't refetch - invited user not in list yet
    } catch (err) {
      console.error('Error inviting user:', err);
      toast.error(err.message || t('failedToSave', { resource: t('invitation') }));
      throw err;
    }
  }, [t]);

  // Update user
  const updateUser = useCallback(async (userId, updates) => {
    try {
      await userAPI.updateUser(userId, updates);
      toast.success(t('successUpdated', { resource: t('user') }));
      // Refresh list
      await fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      toast.error(err.message || t('failedToUpdate', { resource: t('user') }));
      throw err;
    }
  }, [fetchUsers, t]);

  // Delete user
  const deleteUser = useCallback(async (userId) => {
    try {
      await userAPI.deleteUser(userId);
      toast.success(t('successDeleted', { resource: t('user') }));
      // Refresh list
      await fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error(err.message || t('failedToDelete', { resource: t('user') }));
      throw err;
    }
  }, [fetchUsers, t]);

  // Change user role
  const changeRole = useCallback(async (userId, newRole, roleId = null) => {
    try {
      // Send roleId if available (new system), otherwise send role slug (legacy)
      const updates = roleId ? { roleId } : { role: newRole };
      await updateUser(userId, updates);
    } catch (err) {
      throw err;
    }
  }, [updateUser]);

  // Toggle user active status
  const toggleActive = useCallback(async (userId, isActive) => {
    try {
      await updateUser(userId, { isActive: !isActive });
    } catch (err) {
      throw err;
    }
  }, [updateUser]);

  // Fetch on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    inviteUser,
    updateUser,
    deleteUser,
    changeRole,
    toggleActive,
  };
};

export default useUsers;
