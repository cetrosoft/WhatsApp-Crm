/**
 * Super Admin Protected Route Component
 * Redirects to super admin login if not authenticated
 *
 * Key Differences from Organization ProtectedRoute:
 * - Uses SuperAdminContext instead of AuthContext
 * - Redirects to /super-admin/login
 * - Red-themed loading spinner
 *
 * Related: docs/SUPER_ADMIN_IMPLEMENTATION_PLAN.md
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSuperAdmin } from '../contexts/SuperAdminContext';

const SuperAdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSuperAdmin();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Redirect to super admin login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/super-admin/login" replace />;
  }

  // Render protected content
  return children;
};

export default SuperAdminProtectedRoute;
