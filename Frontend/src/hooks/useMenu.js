/**
 * useMenu Hook
 * Fetches and manages dynamic menu structure
 * Filters based on package features and user permissions
 */

import { useState, useEffect, useCallback } from 'react';
import { menuAPI } from '../services/api';

/**
 * Hook to fetch menu from database
 * @param {string} lang - Language code ('en' or 'ar')
 */
export const useMenu = (lang = 'en') => {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch menu for specified language
  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await menuAPI.getMenu(lang);
      setMenu(data.menu || []);
    } catch (err) {
      console.error('Error fetching menu:', err);
      setError(err.message || 'Failed to fetch menu');
      // Fallback to empty array on error
      setMenu([]);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  // Fetch on mount and when language changes
  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  return {
    menu,
    loading,
    error,
    fetchMenu,
  };
};

export default useMenu;
