/**
 * Matrix Utility Functions
 * Helper functions for permission matrix parsing and display
 */

/**
 * Parse flat permission list into matrix structure
 * @param {array} permissions - Array of permission strings (e.g., ['contacts.view', 'contacts.create'])
 * @returns {object} Matrix structure grouped by resource
 *
 * Example output:
 * {
 *   contacts: { view: true, create: true, edit: false, delete: false, export: false },
 *   companies: { view: true, create: false, edit: false, delete: false, export: false }
 * }
 */
export const parsePermissionsToMatrix = (permissions = []) => {
  const matrix = {};

  permissions.forEach((perm) => {
    // Handle both object {key, label} and string formats
    const permKey = typeof perm === 'object' ? perm.key : perm;

    if (!permKey || typeof permKey !== 'string') return;

    const [resource, action] = permKey.split('.');

    if (!resource || !action) return;

    if (!matrix[resource]) {
      matrix[resource] = {};
    }

    matrix[resource][action] = true;
  });

  return matrix;
};

/**
 * Get all available actions for a specific resource
 * @param {string} resource - Resource name (e.g., 'contacts', 'companies')
 * @param {object} availablePermissions - All available permissions from API
 * @returns {array} Array of action objects with key and label
 */
export const getAvailableActions = (resource, availablePermissions) => {
  if (!availablePermissions || !availablePermissions.groups) return [];

  const actions = new Set();

  // Search all groups for permissions related to this resource
  Object.values(availablePermissions.groups).forEach((group) => {
    if (!group.permissions) return;

    group.permissions.forEach((perm) => {
      const permKey = typeof perm === 'object' ? perm.key : perm;
      const [permResource, permAction] = permKey.split('.');

      if (permResource === resource && permAction) {
        actions.add(permAction);
      }
    });
  });

  // Convert to array with labels
  return Array.from(actions).map((action) => ({
    key: action,
    label: getActionLabel(action),
  }));
};

/**
 * Get all resources from available permissions
 * @param {object} availablePermissions - All available permissions from API
 * @returns {array} Array of unique resource names
 */
export const getResourcesFromPermissions = (availablePermissions) => {
  if (!availablePermissions || !availablePermissions.groups) return [];

  const resources = new Set();

  Object.values(availablePermissions.groups).forEach((group) => {
    if (!group.permissions) return;

    group.permissions.forEach((perm) => {
      const permKey = typeof perm === 'object' ? perm.key : perm;
      const [resource] = permKey.split('.');

      if (resource) {
        resources.add(resource);
      }
    });
  });

  return Array.from(resources);
};

/**
 * Group permissions by module
 * @param {object} availablePermissions - Available permissions from API
 * @returns {object} Permissions grouped by module with resources
 */
export const groupPermissionsByModule = (availablePermissions) => {
  if (!availablePermissions || !availablePermissions.groups) return {};

  const modules = {};

  // Build a map of resource labels from backend (supports bilingual labels)
  const resourceLabelsMap = {};

  Object.entries(availablePermissions.groups).forEach(([groupKey, group]) => {
    const resources = new Set();

    // Collect resource names and their bilingual labels from backend
    group.permissions.forEach((perm) => {
      const permKey = typeof perm === 'object' ? perm.key : perm;
      const [resource] = permKey.split('.');

      if (resource) {
        resources.add(resource);

        // Extract module labels from first permission of each resource (if available)
        if (perm.label_en && perm.label_ar && !resourceLabelsMap[resource]) {
          // Extract module name from permission label (e.g., "View Pipelines" → "Pipelines")
          const moduleNameEn = perm.label_en.split(' ').slice(1).join(' ') || getResourceLabel(resource);
          const moduleNameAr = perm.label_ar.split(' ').slice(1).join(' ') || getResourceLabel(resource);

          resourceLabelsMap[resource] = {
            label_en: moduleNameEn,
            label_ar: moduleNameAr
          };
        }
      }
    });

    modules[groupKey] = {
      label: group.label,
      resources: Array.from(resources).map((resource) => ({
        key: resource,
        label: getResourceLabel(resource), // Fallback for backward compatibility
        label_en: resourceLabelsMap[resource]?.label_en || getResourceLabel(resource),
        label_ar: resourceLabelsMap[resource]?.label_ar || getResourceLabel(resource),
        actions: getAvailableActions(resource, availablePermissions),
      })),
    };
  });

  return modules;
};

/**
 * Determine the state of a permission (default, granted, revoked)
 * @param {string} permissionKey - Permission key (e.g., 'contacts.view')
 * @param {array} roleDefaults - Default permissions for the role
 * @param {array} grants - Custom granted permissions
 * @param {array} revokes - Custom revoked permissions
 * @returns {object} State object with isChecked, isDefault, isGranted, isRevoked
 */
export const getPermissionState = (permissionKey, roleDefaults = [], grants = [], revokes = []) => {
  const isDefault = roleDefaults.includes(permissionKey);
  const isGranted = grants.includes(permissionKey);
  const isRevoked = revokes.includes(permissionKey);

  // Determine if checkbox should be checked
  const isChecked = (isDefault && !isRevoked) || isGranted;

  return {
    isChecked,
    isDefault,
    isGranted,
    isRevoked,
  };
};

/**
 * Get human-readable label for an action
 * @param {string} action - Action key (e.g., 'view', 'create')
 * @returns {string} Formatted label
 */
export const getActionLabel = (action) => {
  const labels = {
    view: 'View',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    export: 'Export',
    invite: 'Invite',
    manage: 'Manage',
  };

  return labels[action] || action.charAt(0).toUpperCase() + action.slice(1);
};

/**
 * Get human-readable label for a resource
 * @param {string} resource - Resource key (e.g., 'contacts', 'lead_sources')
 * @returns {string} Formatted label
 */
export const getResourceLabel = (resource) => {
  const labels = {
    contacts: 'Contacts',
    companies: 'Companies',
    segments: 'Segments',
    tags: 'Tags',
    statuses: 'Contact Statuses',
    lead_sources: 'Lead Sources',
    users: 'Users',
    permissions: 'Permissions',
    organization: 'Organization',
  };

  return labels[resource] || resource.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

/**
 * Get permission key from resource and action
 * @param {string} resource - Resource name
 * @param {string} action - Action name
 * @returns {string} Permission key (e.g., 'contacts.view')
 */
export const buildPermissionKey = (resource, action) => {
  return `${resource}.${action}`;
};

/**
 * Check if a resource has a specific action available
 * @param {string} resource - Resource name
 * @param {string} action - Action name
 * @param {object} availablePermissions - Available permissions from API
 * @returns {boolean}
 */
export const hasAction = (resource, action, availablePermissions) => {
  const actions = getAvailableActions(resource, availablePermissions);
  return actions.some((a) => a.key === action);
};
