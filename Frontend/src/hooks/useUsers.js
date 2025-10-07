/**
 * useUsers Hook
 * Manages user CRUD operations for team management
 */

import { useState, useEffect, useCallback } from 'react';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';

/**
 * Hook to manage users in the organization
 */
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userAPI.getUsers();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, []);

  // Invite user
  const inviteUser = useCallback(async (email, role, roleId = null) => {
    try {
      await userAPI.inviteUser(email, role, roleId);
      toast.success('Invitation sent successfully');
      // Don't refetch - invited user not in list yet
    } catch (err) {
      console.error('Error inviting user:', err);
      toast.error(err.message || 'Failed to send invitation');
      throw err;
    }
  }, []);

  // Update user
  const updateUser = useCallback(async (userId, updates) => {
    try {
      await userAPI.updateUser(userId, updates);
      toast.success('User updated successfully');
      // Refresh list
      await fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      toast.error(err.message || 'Failed to update user');
      throw err;
    }
  }, [fetchUsers]);

  // Delete user
  const deleteUser = useCallback(async (userId) => {
    try {
      await userAPI.deleteUser(userId);
      toast.success('User deleted successfully');
      // Refresh list
      await fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error(err.message || 'Failed to delete user');
      throw err;
    }
  }, [fetchUsers]);

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
