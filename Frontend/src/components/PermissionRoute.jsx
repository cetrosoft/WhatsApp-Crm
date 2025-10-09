import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissionUtils';
import PermissionDenied from '../pages/PermissionDenied';

/**
 * Permission-Protected Route Component
 * Checks if user has required permission before allowing access
 *
 * Usage:
 * <Route path="/crm/companies" element={
 *   <PermissionRoute permission="companies.view">
 *     <Companies />
 *   </PermissionRoute>
 * } />
 */
const PermissionRoute = ({ children, permission }) => {
  const { user } = useAuth();

  // Check if user is logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If no permission required, allow access
  if (!permission) {
    return children;
  }

  // Check if user has required permission
  if (!hasPermission(user, permission)) {
    console.warn(`Access denied: User lacks permission "${permission}"`);
    return <PermissionDenied />;
  }

  // User has permission, render the component
  return children;
};

export default PermissionRoute;
