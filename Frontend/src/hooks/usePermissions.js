/**
 * usePermissions Hook
 * Manages user permissions - fetching, updating, and checking
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { permissionAPI } from '../services/api';
import { hasPermission as checkPermission } from '../utils/permissionUtils';
import toast from 'react-hot-toast';

/**
 * Hook to manage a specific user's permissions
 * @param {string} userId - User ID to fetch permissions for
 */
export const usePermissions = (userId) => {
  const { t } = useTranslation('common');
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user permissions
  const fetchPermissions = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await permissionAPI.getUserPermissions(userId);
      setPermissions(data);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError(err.message || t('failedToLoad', { resource: t('permissions') }));
      toast.error(t('failedToLoadPermissions'));
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  // Update user permissions
  const updatePermissions = useCallback(async (grant = [], revoke = []) => {
    if (!userId) return;

    try {
      const data = await permissionAPI.updateUserPermissions(userId, grant, revoke);
      setPermissions(data.user);
      toast.success(t('permissionsUpdated'));
      return data;
    } catch (err) {
      console.error('Error updating permissions:', err);
      toast.error(err.message || t('failedToUpdate', { resource: t('permissions') }));
      throw err;
    }
  }, [userId, t]);

  // Check if user has a specific permission
  const hasPermission = useCallback((permission) => {
    if (!permissions) return false;

    const user = {
      role: permissions.role,
      permissions: permissions.customPermissions || {}
    };

    return checkPermission(user, permission);
  }, [permissions]);

  // Refresh permissions
  const refresh = useCallback(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Fetch on mount and when userId changes
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    loading,
    error,
    hasPermission,
    updatePermissions,
    refresh,
  };
};

/**
 * Hook to get all available permissions
 */
export const useAvailablePermissions = () => {
  const [availablePermissions, setAvailablePermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAvailablePermissions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await permissionAPI.getAvailablePermissions();

        // DEBUG: Log what we received from backend
        console.log('📥 [Frontend Hook] Received data:', data);
        console.log('📥 [Frontend Hook] Groups keys:', data?.groups ? Object.keys(data.groups) : 'NO GROUPS');
        console.log('🎫 [Frontend Hook] Tickets group:', data?.groups?.tickets ? 'EXISTS' : 'NOT FOUND');

        setAvailablePermissions(data);
      } catch (err) {
        console.error('Error fetching available permissions:', err);
        setError(err.message || 'Failed to fetch available permissions');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailablePermissions();
  }, []);

  return {
    availablePermissions,
    loading,
    error,
  };
};

export default usePermissions;
