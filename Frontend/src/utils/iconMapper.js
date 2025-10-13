/**
 * Icon Mapper Utility
 * Converts icon name strings from database to Lucide React components
 *
 * Usage:
 * const IconComponent = getIconComponent('Shield');
 * <IconComponent className="w-4 h-4" />
 */

import * as LucideIcons from 'lucide-react';

/**
 * Get Lucide icon component by name
 * @param {string} iconName - Icon name (e.g., 'Shield', 'Users', 'Ticket')
 * @returns {React.Component} Lucide icon component
 */
export const getIconComponent = (iconName) => {
  // Return Shield as default fallback if no icon name provided
  if (!iconName) {
    return LucideIcons.Shield;
  }

  // Check if icon exists in Lucide icons
  const IconComponent = LucideIcons[iconName];

  // Return the icon component or fallback to Shield
  return IconComponent || LucideIcons.Shield;
};

/**
 * Default icon mapping for legacy support
 * (Can be removed once all modules have icons in database)
 */
export const DEFAULT_MODULE_ICONS = {
  crm: 'Shield',
  settings: 'Settings',
  team: 'Users',
  organization: 'Building',
  tickets: 'Ticket',
  conversations: 'MessagesSquare',
  campaigns: 'Megaphone',
  analytics: 'BarChart3',
};

/**
 * Get icon component for a module with fallback to defaults
 * @param {string} moduleKey - Module key (e.g., 'tickets', 'crm')
 * @param {string|null} iconFromAPI - Icon name from API response
 * @returns {React.Component} Lucide icon component
 */
export const getModuleIcon = (moduleKey, iconFromAPI = null) => {
  // Priority: API icon > default mapping > Shield fallback
  const iconName = iconFromAPI || DEFAULT_MODULE_ICONS[moduleKey] || 'Shield';
  return getIconComponent(iconName);
};

export default getIconComponent;
