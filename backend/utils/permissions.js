/**
 * Permission Helper Utilities
 * Functions to check and manage user permissions
 */

import { ROLE_PERMISSIONS } from '../constants/permissions.js';
import supabase from '../config/supabase.js';

/**
 * Get role permissions from database
 * @param {string} roleId - Role UUID
 * @returns {Promise<string[]>} Array of permission strings
 */
export const getRolePermissionsFromDB = async (roleId) => {
  if (!roleId) return [];

  const { data: role, error } = await supabase
    .from('roles')
    .select('permissions, slug')
    .eq('id', roleId)
    .single();

  if (error || !role) {
    console.error('Error fetching role permissions:', error);
    return [];
  }

  return role.permissions || [];
};

/**
 * Get default permissions for a role (LEGACY - for backward compatibility)
 * @param {string} role - User role slug (admin, manager, agent, member)
 * @returns {string[]} Array of permission strings
 */
export const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.member;
};

/**
 * Merge role-based permissions with custom user permissions
 * Custom permissions can grant OR revoke permissions
 * @param {string} role - User role slug OR role permissions array
 * @param {object} customPermissions - Custom permissions object from user.permissions JSONB
 * @returns {string[]} Array of effective permission strings
 */
export const getEffectivePermissions = (role, customPermissions = {}) => {
  // Handle both role slug (string) and permissions array
  let rolePerms;
  if (Array.isArray(role)) {
    rolePerms = role; // Already permissions array from DB
  } else {
    rolePerms = getRolePermissions(role); // Legacy: role slug
  }

  // If no custom permissions, return role defaults
  if (!customPermissions || Object.keys(customPermissions).length === 0) {
    return rolePerms;
  }

  // Apply custom permissions (grants and revokes)
  const { grant = [], revoke = [] } = customPermissions;

  // Start with role permissions, add grants, remove revokes
  const effectivePerms = new Set(rolePerms);

  // Add granted permissions
  grant.forEach(perm => effectivePerms.add(perm));

  // Remove revoked permissions
  revoke.forEach(perm => effectivePerms.delete(perm));

  return Array.from(effectivePerms);
};

/**
 * Check if user has a specific permission
 * @param {object} user - User object with role/roleSlug and permissions
 * @param {string} permission - Permission to check
 * @returns {boolean} True if user has permission
 */
export const hasPermission = (user, permission) => {
  if (!user) return false;

  // Check if user has roleSlug (new) or role (legacy)
  const roleSlug = user.roleSlug || user.role;

  // Admins always have all permissions
  if (roleSlug === 'admin') return true;

  // Use rolePermissions if available (from DB), otherwise use role slug
  const roleData = user.rolePermissions || user.role;

  // Get effective permissions (role + custom)
  const effectivePerms = getEffectivePermissions(roleData, user.permissions);

  return effectivePerms.includes(permission);
};

/**
 * Check if user has ANY of the specified permissions
 * @param {object} user - User object with role and permissions
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} True if user has at least one permission
 */
export const hasAnyPermission = (user, permissions) => {
  return permissions.some(perm => hasPermission(user, perm));
};

/**
 * Check if user has ALL of the specified permissions
 * @param {object} user - User object with role and permissions
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} True if user has all permissions
 */
export const hasAllPermissions = (user, permissions) => {
  return permissions.every(perm => hasPermission(user, perm));
};

/**
 * Get all permissions for a user (for display purposes)
 * @param {object} user - User object with role/rolePermissions and custom permissions
 * @returns {object} Object with rolePermissions, customPermissions, and effectivePermissions
 */
export const getUserPermissionsSummary = (user) => {
  // Use rolePermissions from database if available, otherwise fall back to hardcoded
  const rolePermissions = user.rolePermissions || getRolePermissions(user.role);
  const customPermissions = user.permissions || {};
  const effectivePermissions = getEffectivePermissions(rolePermissions, customPermissions);

  return {
    role: user.role,
    rolePermissions,
    customPermissions,
    effectivePermissions,
    hasCustomOverrides: Object.keys(customPermissions).length > 0,
  };
};

export default {
  getRolePermissions,
  getEffectivePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissionsSummary,
};
