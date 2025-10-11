/**
 * Dynamic Permission Discovery Utilities
 * Automatically discovers permissions from database roles
 * Supports bilingual labels from menu_items table
 * No hardcoded permission lists - fully database-driven
 */

/**
 * Bilingual action labels (English and Arabic)
 */
const ACTION_LABELS = {
  'view': { en: 'View', ar: 'عرض' },
  'create': { en: 'Create', ar: 'إنشاء' },
  'edit': { en: 'Edit', ar: 'تعديل' },
  'delete': { en: 'Delete', ar: 'حذف' },
  'export': { en: 'Export', ar: 'تصدير' },
  'invite': { en: 'Invite', ar: 'دعوة' },
  'manage': { en: 'Manage', ar: 'إدارة' },
  'send': { en: 'Send', ar: 'إرسال' },
  'reply': { en: 'Reply', ar: 'الرد' },
  'assign': { en: 'Assign', ar: 'تعيين' }
};

/**
 * Map permission module to menu item key
 * @param {string} module - Permission module (e.g., 'pipelines', 'contacts')
 * @returns {string} Menu key (e.g., 'crm_pipelines', 'crm_contacts')
 */
function mapModuleToMenuKey(module) {
  const moduleToMenu = {
    'contacts': 'crm_contacts',
    'companies': 'crm_companies',
    'segments': 'crm_segmentation',
    'deals': 'crm_deals',
    'pipelines': 'crm_pipelines',
    'campaigns': 'campaigns',
    'conversations': 'conversations',
    'tickets': 'tickets',
    'analytics': 'analytics',
    'tags': 'crm_settings',
    'statuses': 'crm_settings',
    'lead_sources': 'crm_settings',
    'users': 'team_members',
    'permissions': 'team_roles',
    'organization': 'settings_account'
  };

  return moduleToMenu[module] || module;
}

/**
 * Format module key to display name (fallback if not found in menu_items)
 * @param {string} module - Module key (e.g., 'contacts', 'pipelines')
 * @returns {string} Display name (e.g., 'Contacts', 'Pipelines')
 */
export function formatModuleName(module) {
  const moduleLabels = {
    'contacts': 'Contacts',
    'companies': 'Companies',
    'segments': 'Segments',
    'deals': 'Deals',
    'pipelines': 'Pipelines',
    'campaigns': 'Campaigns',
    'conversations': 'Conversations',
    'tickets': 'Tickets',
    'analytics': 'Analytics',
    'tags': 'Tags',
    'statuses': 'Contact Statuses',
    'lead_sources': 'Lead Sources',
    'users': 'Users',
    'permissions': 'Permissions',
    'organization': 'Organization'
  };

  return moduleLabels[module] || module.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format permission key to bilingual display labels
 * @param {string} permKey - Permission key (e.g., 'pipelines.view')
 * @param {Array} menuItems - Menu items from database (optional)
 * @returns {Object} Bilingual labels { label_en, label_ar }
 */
export function formatPermissionLabel(permKey, menuItems = []) {
  const [module, action] = permKey.split('.');

  if (!module || !action) {
    return { label_en: permKey, label_ar: permKey };
  }

  // Get action labels
  const actionLabel = ACTION_LABELS[action] || {
    en: action.charAt(0).toUpperCase() + action.slice(1),
    ar: action
  };

  // Try to get module name from menu_items table
  let moduleNameEn = formatModuleName(module);
  let moduleNameAr = formatModuleName(module); // fallback to English

  if (menuItems.length > 0) {
    const menuKey = mapModuleToMenuKey(module);
    const menuItem = menuItems.find(item => item.key === menuKey);

    if (menuItem) {
      moduleNameEn = menuItem.name_en;
      moduleNameAr = menuItem.name_ar;
    }
  }

  return {
    label_en: `${actionLabel.en} ${moduleNameEn}`,
    label_ar: `${actionLabel.ar} ${moduleNameAr}`
  };
}

/**
 * Discover all permissions from database roles and organize them by category
 * @param {Array} roles - Array of role objects with permissions property
 * @param {Array} menuItems - Array of menu items from database (optional)
 * @returns {Object} Permission groups organized by category with bilingual labels
 */
export function discoverPermissionsFromRoles(roles, menuItems = []) {
  // Collect all unique permissions from all roles
  const allPermissions = new Set();

  roles.forEach(role => {
    const perms = role.permissions || [];
    perms.forEach(perm => allPermissions.add(perm));
  });

  // Group permissions by module
  const modules = {};

  allPermissions.forEach(permKey => {
    const [module, action] = permKey.split('.');

    if (!module || !action) return; // Skip invalid permission keys

    if (!modules[module]) {
      // Get module name from menu items for bilingual labels
      const menuKey = mapModuleToMenuKey(module);
      const menuItem = menuItems.find(item => item.key === menuKey);

      modules[module] = {
        key: module,
        label: formatModuleName(module), // Fallback English label
        label_en: menuItem?.name_en || formatModuleName(module),
        label_ar: menuItem?.name_ar || formatModuleName(module),
        permissions: []
      };
    }

    // Get bilingual labels from menu items
    const bilingualLabels = formatPermissionLabel(permKey, menuItems);

    modules[module].permissions.push({
      key: permKey,
      label: bilingualLabels.label_en, // Keep for backward compatibility
      label_en: bilingualLabels.label_en,
      label_ar: bilingualLabels.label_ar
    });
  });

  // Categorize modules into logical groups
  const categories = {
    crm: {
      key: 'crm',
      label: 'CRM',
      permissions: []
    },
    settings: {
      key: 'settings',
      label: 'Settings',
      permissions: []
    },
    team: {
      key: 'team',
      label: 'Team Management',
      permissions: []
    }
  };

  // Define which modules belong to which category
  const crmModules = ['contacts', 'companies', 'segments', 'deals', 'pipelines'];
  const settingsModules = ['tags', 'statuses', 'lead_sources'];
  const teamModules = ['users', 'permissions'];

  // Distribute module permissions to categories
  Object.keys(modules).forEach(moduleKey => {
    if (crmModules.includes(moduleKey)) {
      // Add to CRM category
      categories.crm.permissions.push(...modules[moduleKey].permissions);
    } else if (settingsModules.includes(moduleKey)) {
      // Add to Settings category
      categories.settings.permissions.push(...modules[moduleKey].permissions);
    } else if (teamModules.includes(moduleKey)) {
      // Add to Team category
      categories.team.permissions.push(...modules[moduleKey].permissions);
    } else {
      // Standalone module - create its own category
      categories[moduleKey] = {
        key: moduleKey,
        label: modules[moduleKey].label,
        permissions: modules[moduleKey].permissions
      };
    }
  });

  // Remove empty categories
  Object.keys(categories).forEach(key => {
    if (categories[key].permissions.length === 0) {
      delete categories[key];
    }
  });

  return categories;
}

export default {
  formatModuleName,
  formatPermissionLabel,
  discoverPermissionsFromRoles
};
