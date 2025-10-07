/**
 * Permission Utility Functions
 * Helper functions for permission calculations and formatting
 */

/**
 * Calculate effective permissions based on role and custom overrides
 * @param {string} role - User's role (admin, manager, agent, member)
 * @param {object} customPermissions - Custom grant/revoke permissions
 * @returns {array} Array of effective permission strings
 */
export const calculateEffectivePermissions = (role, customPermissions = {}) => {
  const { grant = [], revoke = [] } = customPermissions;

  // Get role default permissions from backend
  // This will be fetched from API, but we can calculate client-side
  const rolePermissions = getRoleDefaultPermissions(role);

  // Start with role permissions
  const effectivePerms = new Set(rolePermissions);

  // Add custom grants
  grant.forEach(perm => effectivePerms.add(perm));

  // Remove custom revokes
  revoke.forEach(perm => effectivePerms.delete(perm));

  return Array.from(effectivePerms);
};

/**
 * Get default permissions for a role
 * Note: This should match backend constants
 */
const getRoleDefaultPermissions = (role) => {
  const ROLE_PERMISSIONS = {
    admin: [], // Admin has all permissions (handled specially)
    manager: [
      'contacts.view', 'contacts.create', 'contacts.edit', 'contacts.delete', 'contacts.export',
      'companies.view', 'companies.create', 'companies.edit', 'companies.delete', 'companies.export',
      'segments.view', 'segments.create', 'segments.edit', 'segments.delete',
      'tags.view', 'statuses.view', 'lead_sources.view',
      'users.view', 'users.invite',
    ],
    agent: [
      'contacts.view', 'contacts.create', 'contacts.edit',
      'companies.view', 'companies.create', 'companies.edit',
      'segments.view',
      'tags.view', 'statuses.view', 'lead_sources.view',
      'users.view',
    ],
    member: [
      'contacts.view',
      'companies.view',
      'segments.view',
      'tags.view', 'statuses.view', 'lead_sources.view',
      'users.view',
    ],
  };

  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.member;
};

/**
 * Check if user has a specific permission
 * @param {object} user - User object with role and permissions
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const hasPermission = (user, permission) => {
  if (!user) return false;

  // Admin always has all permissions
  if (user.role === 'admin') return true;

  const effectivePermissions = calculateEffectivePermissions(
    user.role,
    user.permissions
  );

  return effectivePermissions.includes(permission);
};

/**
 * Group permissions by category
 * @param {array} permissions - Array of permission strings
 * @param {object} groups - Permission group definitions from API
 * @returns {object} Grouped permissions
 */
export const getPermissionsByGroup = (permissions, groups) => {
  if (!groups) return {};

  const grouped = {};

  Object.keys(groups).forEach(groupKey => {
    const group = groups[groupKey];
    grouped[groupKey] = {
      label: group.label,
      permissions: permissions.filter(p => group.permissions.includes(p))
    };
  });

  return grouped;
};

/**
 * Format permission string to human-readable label
 * @param {string} permission - Permission string (e.g., "contacts.create")
 * @returns {string} Formatted label (e.g., "Create Contacts")
 */
export const formatPermissionLabel = (permission) => {
  // Type guard: ensure permission is a string
  if (!permission) return '';

  if (typeof permission !== 'string') {
    console.warn('formatPermissionLabel: Invalid permission type:', typeof permission, permission);
    return String(permission);
  }

  const [resource, action] = permission.split('.');

  const actionLabels = {
    view: 'View',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    export: 'Export',
    invite: 'Invite',
    manage: 'Manage',
  };

  const resourceLabels = {
    contacts: 'Contacts',
    companies: 'Companies',
    segments: 'Segments',
    tags: 'Tags',
    statuses: 'Statuses',
    lead_sources: 'Lead Sources',
    users: 'Users',
    permissions: 'Permissions',
    organization: 'Organization',
  };

  const actionLabel = actionLabels[action] || action;
  const resourceLabel = resourceLabels[resource] || resource;

  return `${actionLabel} ${resourceLabel}`;
};

/**
 * Get role badge color
 * @param {string} role - User role
 * @returns {string} Tailwind CSS classes for badge
 */
export const getRoleBadgeColor = (role) => {
  const colors = {
    admin: 'bg-purple-100 text-purple-800',
    manager: 'bg-blue-100 text-blue-800',
    agent: 'bg-green-100 text-green-800',
    member: 'bg-gray-100 text-gray-800',
  };
  return colors[role] || colors.member;
};

/**
 * Get permission badge variant color
 * @param {string} variant - 'granted' or 'revoked'
 * @returns {string} Tailwind CSS classes
 */
export const getPermissionBadgeColor = (variant) => {
  const colors = {
    granted: 'bg-green-100 text-green-800 border-green-200',
    revoked: 'bg-red-100 text-red-800 border-red-200',
    default: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return colors[variant] || colors.default;
};

/**
 * Compare two permission arrays to find differences
 * @param {array} oldPermissions - Original permissions
 * @param {array} newPermissions - New permissions
 * @returns {object} { added: [], removed: [] }
 */
export const comparePermissions = (oldPermissions = [], newPermissions = []) => {
  const oldSet = new Set(oldPermissions);
  const newSet = new Set(newPermissions);

  const added = newPermissions.filter(p => !oldSet.has(p));
  const removed = oldPermissions.filter(p => !newSet.has(p));

  return { added, removed };
};
