/**
 * Super Admin Authentication Context
 * Manages super admin authentication state and provides auth methods
 *
 * Key Differences from Organization AuthContext:
 * - No organization state
 * - Uses superAdminAPI instead of authAPI
 * - Separate token storage (superAdminToken)
 * - Navigates to /super-admin/* routes
 * - Shorter token expiry (1 hour vs 7 days)
 *
 * Related: docs/SUPER_ADMIN_IMPLEMENTATION_PLAN.md
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  superAdminAuthAPI,
  superAdminTokenUtils
} from '../services/superAdminAPI';
import toast from 'react-hot-toast';

const SuperAdminContext = createContext();

export const SuperAdminProvider = ({ children }) => {
  const [superAdmin, setSuperAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  /**
   * Check if super admin is authenticated on mount
   * Auto-redirects to login if token is invalid/expired
   */
  useEffect(() => {
    const initAuth = async () => {
      if (superAdminTokenUtils.isAuthenticated()) {
        try {
          const data = await superAdminAuthAPI.getMe();
          setSuperAdmin(data.superAdmin);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Super admin auth init error:', error);
          superAdminTokenUtils.removeToken();
          setIsAuthenticated(false);

          // If token expired, redirect to super admin login
          if (error.response?.status === 401) {
            toast.error('Session expired. Please login again.');
            navigate('/super-admin/login');
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [navigate]);

  /**
   * Login super admin with email and password
   */
  const login = async (email, password) => {
    try {
      const data = await superAdminAuthAPI.login(email, password);
      setSuperAdmin(data.superAdmin);
      setIsAuthenticated(true);
      toast.success('Welcome back, Super Admin!');
      navigate('/super-admin/dashboard');
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  /**
   * Logout super admin
   * Clears state and redirects to login
   */
  const logout = async () => {
    try {
      await superAdminAuthAPI.logout();
      setSuperAdmin(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
      navigate('/super-admin/login');
    } catch (error) {
      console.error('Super admin logout error:', error);
      // Clear state anyway even if API call fails
      setSuperAdmin(null);
      setIsAuthenticated(false);
      superAdminTokenUtils.removeToken();
      navigate('/super-admin/login');
    }
  };

  /**
   * Refresh super admin info
   * Useful after profile updates
   */
  const refreshSuperAdmin = async () => {
    try {
      const data = await superAdminAuthAPI.getMe();
      setSuperAdmin(data.superAdmin);
    } catch (error) {
      console.error('Refresh super admin error:', error);
      throw error;
    }
  };

  /**
   * Update super admin info locally (optimistic update)
   */
  const updateSuperAdmin = (updates) => {
    setSuperAdmin((prev) => ({ ...prev, ...updates }));
  };

  const value = {
    superAdmin,
    loading,
    isAuthenticated,
    login,
    logout,
    refreshSuperAdmin,
    updateSuperAdmin,
  };

  return (
    <SuperAdminContext.Provider value={value}>
      {children}
    </SuperAdminContext.Provider>
  );
};

/**
 * Hook to use super admin context
 * Must be used within SuperAdminProvider
 */
export const useSuperAdmin = () => {
  const context = useContext(SuperAdminContext);
  if (!context) {
    throw new Error('useSuperAdmin must be used within SuperAdminProvider');
  }
  return context;
};

export default SuperAdminContext;
