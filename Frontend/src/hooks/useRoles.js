/**
 * useRoles Hook
 * Fetches and manages organization roles (system + custom)
 */

import { useState, useEffect, useCallback } from 'react';
import { roleAPI } from '../services/api';

/**
 * Hook to fetch roles from database
 */
export const useRoles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all roles
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await roleAPI.getRoles();
      setRoles(data.data || []);
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError(err.message || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    roles,
    loading,
    error,
    fetchRoles,
  };
};

export default useRoles;
