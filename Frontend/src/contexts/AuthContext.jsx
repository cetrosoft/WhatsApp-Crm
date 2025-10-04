/**
 * Authentication Context
 * Manages user authentication state and provides auth methods
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, tokenUtils } from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation('auth');

  /**
   * Check if user is authenticated on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      if (tokenUtils.isAuthenticated()) {
        try {
          const data = await authAPI.getMe();
          setUser(data.user);
          setOrganization(data.organization);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auth init error:', error);
          tokenUtils.removeToken();
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Login user
   */
  const login = async (email, password) => {
    try {
      const data = await authAPI.login(email, password);
      setUser(data.user);
      setOrganization(data.organization);
      setIsAuthenticated(true);
      toast.success(t('loginSuccess'));
      navigate('/dashboard');
      return data;
    } catch (error) {
      toast.error(error.message || t('loginError'));
      throw error;
    }
  };

  /**
   * Register new organization
   */
  const register = async (formData) => {
    try {
      const data = await authAPI.register(formData);
      setUser(data.user);
      setOrganization(data.organization);
      setIsAuthenticated(true);
      toast.success(t('accountCreated'));
      navigate('/dashboard');
      return data;
    } catch (error) {
      toast.error(error.message || t('loginError'));
      throw error;
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setOrganization(null);
      setIsAuthenticated(false);
      toast.success(t('logoutSuccess'));
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear state anyway
      setUser(null);
      setOrganization(null);
      setIsAuthenticated(false);
      tokenUtils.removeToken();
      navigate('/login');
    }
  };

  /**
   * Update user info
   */
  const updateUser = (userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
  };

  const value = {
    user,
    organization,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
