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
 * Map permission module to menu item key (for GROUPING - finds parent)
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
    'tickets': 'support_tickets',
    'ticket_categories': 'support_tickets',
    'analytics': 'analytics',
    'tags': 'crm_settings',              // Group under CRM Settings
    'statuses': 'crm_settings',          // Group under CRM Settings
    'lead_sources': 'crm_settings',      // Group under CRM Settings
    'users': 'team_members',
    'permissions': 'team_roles',
    'organization': 'settings_account'
  };

  return moduleToMenu[module] || module;
}

/**
 * Map permission module to its actual menu item key (for LABELS - finds individual item)
 * @param {string} module - Permission module (e.g., 'tags', 'statuses')
 * @returns {string} Actual menu item key (e.g., 'tags', 'contact_statuses')
 */
function mapModuleToLabelMenuKey(module) {
  const moduleToLabelMenu = {
    'contacts': 'crm_contacts',
    'companies': 'crm_companies',
    'segments': 'crm_segmentation',
    'deals': 'crm_deals',
    'pipelines': 'crm_pipelines',
    'campaigns': 'campaigns',
    'conversations': 'conversations',
    'tickets': 'support_tickets',
    'ticket_categories': 'ticket_settings',  // Individual settings item!
    'analytics': 'analytics',
    'tags': 'tags',                      // Individual item (not parent!)
    'statuses': 'contact_statuses',      // Individual item (not parent!)
    'lead_sources': 'lead_sources',      // Individual item (not parent!)
    'users': 'team_members',
    'permissions': 'team_roles',
    'organization': 'settings_account'
  };

  return moduleToLabelMenu[module] || module;
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
    'ticket_categories': 'Ticket Categories',
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
    // Use label key to find the individual menu item (not parent!)
    const menuKey = mapModuleToLabelMenuKey(module);
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
 * Build a map of menu items to their top-level parents
 * Traverses the menu hierarchy to find root parent for each item
 * @param {Array} menuItems - Array of menu items from database
 * @returns {Object} Map of menuKey → topLevelParentKey
 */
function buildParentMap(menuItems) {
  const parentMap = {};
  const itemsByKey = {};

  // Index all items by key for quick lookup
  menuItems.forEach(item => {
    itemsByKey[item.key] = item;
  });

  // For each item, walk up the tree to find top-level parent
  menuItems.forEach(item => {
    let current = item;

    // Walk up the tree until we find root (parent_key = NULL or doesn't exist)
    while (current.parent_key && itemsByKey[current.parent_key]) {
      current = itemsByKey[current.parent_key];
    }

    // Current is now the top-level parent (root)
    parentMap[item.key] = current.key;
  });

  return parentMap;
}

/**
 * Discover all permissions from database roles and organize them by menu hierarchy
 * 100% Database-Driven - No hardcoded categorization arrays!
 *
 * @param {Array} roles - Array of role objects with permissions property
 * @param {Array} menuItems - Array of menu items from database (required for hierarchy)
 * @returns {Object} Permission groups organized by top-level menu parents with bilingual labels
 */
export function discoverPermissionsFromRoles(roles, menuItems = []) {
  // Collect all unique permissions from all roles
  const allPermissions = new Set();

  roles.forEach(role => {
    const perms = role.permissions || [];
    perms.forEach(perm => allPermissions.add(perm));
  });

  console.log('🔍 [Permission Discovery] Total unique permissions:', allPermissions.size);

  // Build parent map from menu hierarchy
  const parentMap = buildParentMap(menuItems);
  const itemsByKey = {};
  menuItems.forEach(item => itemsByKey[item.key] = item);

  console.log('🌳 [Permission Discovery] Menu hierarchy map built:', Object.keys(parentMap).length, 'items');

  // Group permissions by top-level parent (automatic categorization!)
  const categories = {};

  allPermissions.forEach(permKey => {
    const [module, action] = permKey.split('.');

    if (!module || !action) return; // Skip invalid permission keys

    // Map permission module to menu key (e.g., 'contacts' → 'crm_contacts')
    const menuKey = mapModuleToMenuKey(module);

    // Find top-level parent via hierarchy traversal
    const topParentKey = parentMap[menuKey] || menuKey; // Fallback to menuKey if not found
    const topParent = itemsByKey[topParentKey];

    console.log(`  📍 Permission ${permKey}: module="${module}" → menu="${menuKey}" → parent="${topParentKey}"`);

    // Create category if doesn't exist (using top-level parent)
    if (!categories[topParentKey]) {
      categories[topParentKey] = {
        key: topParentKey,
        label: topParent?.name_en || formatModuleName(module),
        label_en: topParent?.name_en || formatModuleName(module),
        label_ar: topParent?.name_ar || formatModuleName(module),
        icon: topParent?.icon || null, // Icon from top-level menu item
        permissions: []
      };

      console.log(`  ✨ Created category "${topParentKey}":`, categories[topParentKey].label_en);
    }

    // Get bilingual labels for this specific permission
    const bilingualLabels = formatPermissionLabel(permKey, menuItems);

    // Add permission to its category
    categories[topParentKey].permissions.push({
      key: permKey,
      label: bilingualLabels.label_en, // Keep for backward compatibility
      label_en: bilingualLabels.label_en,
      label_ar: bilingualLabels.label_ar
    });
  });

  // Remove empty categories
  Object.keys(categories).forEach(key => {
    if (categories[key].permissions.length === 0) {
      delete categories[key];
    }
  });

  // Final summary
  console.log('📦 [Permission Discovery] Final categories (100% dynamic):', Object.keys(categories));
  Object.keys(categories).forEach(key => {
    console.log(`  - ${key}: ${categories[key].permissions.length} permissions (${categories[key].label_en})`);
  });

  return categories;
}

export default {
  formatModuleName,
  formatPermissionLabel,
  discoverPermissionsFromRoles
};
