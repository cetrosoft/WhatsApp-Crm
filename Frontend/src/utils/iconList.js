/**
 * Icon List Utility
 * Maps icon names to Lucide React components
 * Used by Menu Manager for icon selection
 */

import * as Icons from 'lucide-react';

/**
 * Available icons for menu items
 * Curated list of commonly used Lucide icons
 */
export const AVAILABLE_ICONS = [
  // Dashboard & Analytics
  'LayoutDashboard',
  'BarChart',
  'BarChart2',
  'BarChart3',
  'PieChart',
  'LineChart',
  'TrendingUp',
  'TrendingDown',
  'Activity',

  // User & Team
  'Users',
  'User',
  'UserCircle',
  'UserPlus',
  'UserCheck',
  'Shield',
  'ShieldCheck',

  // Business & CRM
  'Building2',
  'Briefcase',
  'Target',
  'Award',
  'Star',
  'Heart',
  'Flag',
  'Bookmark',

  // Communication
  'MessageSquare',
  'MessageCircle',
  'Mail',
  'Phone',
  'PhoneCall',
  'Headphones',
  'Mic',

  // Documents & Files
  'FileText',
  'File',
  'Files',
  'Folder',
  'FolderOpen',
  'FolderPlus',
  'Archive',
  'Paperclip',

  // Settings & Tools
  'Settings',
  'Sliders',
  'Tool',
  'Wrench',
  'Cog',
  'Filter',
  'SlidersHorizontal',

  // Commerce
  'ShoppingCart',
  'ShoppingBag',
  'Package',
  'Box',
  'DollarSign',
  'CreditCard',
  'Receipt',
  'Wallet',

  // Navigation
  'Home',
  'Menu',
  'Grid',
  'List',
  'Layers',
  'Sidebar',
  'PanelLeft',

  // Actions
  'Plus',
  'Minus',
  'Edit',
  'Trash2',
  'Save',
  'Download',
  'Upload',
  'Search',

  // Time & Calendar
  'Calendar',
  'Clock',
  'Timer',
  'History',
  'CalendarDays',

  // Status & Indicators
  'CheckCircle',
  'XCircle',
  'AlertCircle',
  'AlertTriangle',
  'Info',
  'Bell',
  'BellRing',

  // Media
  'Image',
  'Video',
  'Music',
  'Camera',
  'Film',

  // Location & Map
  'MapPin',
  'Map',
  'Globe',
  'Navigation',
  'Compass',

  // Tickets & Support
  'Ticket',
  'TicketCheck',
  'HelpCircle',
  'MessageCircleQuestion',
  'Headset',

  // Social & Network
  'Share2',
  'ThumbsUp',
  'ThumbsDown',
  'Eye',
  'EyeOff',

  // Tags & Labels
  'Tag',
  'Tags',
  'Hash',
  'AtSign',

  // Directional
  'ChevronRight',
  'ChevronLeft',
  'ChevronUp',
  'ChevronDown',
  'ArrowRight',
  'ArrowLeft',

  // Miscellaneous
  'Zap',
  'Sparkles',
  'Rocket',
  'Gift',
  'Truck',
  'Link',
  'ExternalLink',
  'Newspaper',
  'BookOpen',
  'Lightbulb',
  'Key',
  'Lock',
  'Unlock',
];

/**
 * Get Lucide icon component by name
 * @param {string} iconName - Name of the icon (e.g., 'Users', 'Settings')
 * @returns {React.Component} Lucide icon component
 */
export const getIconComponent = (iconName) => {
  // Return the icon component if it exists, otherwise return Box as fallback
  return Icons[iconName] || Icons.Box;
};

/**
 * Check if icon name is valid
 * @param {string} iconName - Name of the icon to validate
 * @returns {boolean} True if icon exists
 */
export const isValidIcon = (iconName) => {
  return AVAILABLE_ICONS.includes(iconName);
};

/**
 * Search icons by name
 * @param {string} searchTerm - Search term
 * @returns {Array<string>} Filtered icon names
 */
export const searchIcons = (searchTerm) => {
  if (!searchTerm) return AVAILABLE_ICONS;

  const term = searchTerm.toLowerCase();
  return AVAILABLE_ICONS.filter(iconName =>
    iconName.toLowerCase().includes(term)
  );
};

/**
 * Format icon name for display (add spaces before capital letters)
 * @param {string} iconName - CamelCase icon name
 * @returns {string} Formatted name with spaces
 */
export const formatIconName = (iconName) => {
  return iconName
    .replace(/([A-Z])/g, ' $1')
    .trim();
};
