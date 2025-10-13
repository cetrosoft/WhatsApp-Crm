import React from 'react';
import { useTranslation } from 'react-i18next';
import { FolderOpen, Headphones, Bug, Lightbulb } from 'lucide-react';

/**
 * TicketCategoryBadge Component
 *
 * Displays ticket category with color-coded badge and icon
 * Supports database categories + 4 default types
 * Bilingual support (EN/AR)
 *
 * @param {string} slug - Category slug (general, support, bug_report, feature_request)
 * @param {string} nameEn - Category name in English (optional, from database)
 * @param {string} nameAr - Category name in Arabic (optional, from database)
 * @param {string} color - Category color (optional, from database)
 * @param {string} size - Badge size: 'sm' | 'md' | 'lg' (default: 'md')
 * @param {boolean} showIcon - Show icon (default: true)
 */
const TicketCategoryBadge = ({
  slug,
  nameEn,
  nameAr,
  color,
  size = 'md',
  showIcon = true
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Default category configuration (fallback if not from database)
  const defaultCategories = {
    general: {
      label: t('categoryGeneral'),
      bgColor: 'rgba(107, 114, 128, 0.15)', // gray-500
      textColor: '#6b7280',
      borderColor: '#6b7280',
      icon: FolderOpen
    },
    support: {
      label: t('categorySupport'),
      bgColor: 'rgba(59, 130, 246, 0.15)', // blue-500
      textColor: '#3b82f6',
      borderColor: '#3b82f6',
      icon: Headphones
    },
    bug_report: {
      label: t('categoryBugReport'),
      bgColor: 'rgba(239, 68, 68, 0.15)', // red-500
      textColor: '#ef4444',
      borderColor: '#ef4444',
      icon: Bug
    },
    feature_request: {
      label: t('categoryFeatureRequest'),
      bgColor: 'rgba(168, 85, 247, 0.15)', // purple-500
      textColor: '#a855f7',
      borderColor: '#a855f7',
      icon: Lightbulb
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };

  // Helper to convert hex color to rgba
  const hexToRgba = (hex, opacity) => {
    if (!hex) return 'rgba(107, 114, 128, 0.15)'; // gray-500 fallback
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Determine configuration (database category or default)
  let config;
  let Icon;

  if (color && (nameEn || nameAr)) {
    // Database category
    config = {
      label: isRTL && nameAr ? nameAr : nameEn || slug,
      bgColor: hexToRgba(color, 0.15),
      textColor: color,
      borderColor: color
    };
    Icon = FolderOpen; // Default icon for custom categories
  } else {
    // Default category
    config = defaultCategories[slug] || defaultCategories.general;
    Icon = config.icon;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]}`}
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
        border: `1px solid ${config.borderColor}`
      }}
    >
      {showIcon && Icon && <Icon size={iconSizes[size]} />}
      {config.label}
    </span>
  );
};

export default TicketCategoryBadge;
