import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, TrendingUp, AlertTriangle, Zap } from 'lucide-react';

/**
 * TicketPriorityBadge Component
 *
 * Displays ticket priority with color-coded badge and icon
 * Supports 4 priority values: low, medium, high, urgent
 * Bilingual support (EN/AR)
 *
 * @param {string} priority - Ticket priority value
 * @param {string} size - Badge size: 'sm' | 'md' | 'lg' (default: 'md')
 * @param {boolean} showIcon - Show icon (default: true)
 */
const TicketPriorityBadge = ({ priority, size = 'md', showIcon = true }) => {
  const { t } = useTranslation();

  // Priority configuration with colors and icons
  const priorityConfig = {
    low: {
      label: t('priorityLow'),
      bgColor: 'rgba(34, 197, 94, 0.15)', // green-500
      textColor: '#22c55e',
      borderColor: '#22c55e',
      icon: AlertCircle
    },
    medium: {
      label: t('priorityMedium'),
      bgColor: 'rgba(234, 179, 8, 0.15)', // yellow-500
      textColor: '#eab308',
      borderColor: '#eab308',
      icon: TrendingUp
    },
    high: {
      label: t('priorityHigh'),
      bgColor: 'rgba(249, 115, 22, 0.15)', // orange-500
      textColor: '#f97316',
      borderColor: '#f97316',
      icon: AlertTriangle
    },
    urgent: {
      label: t('priorityUrgent'),
      bgColor: 'rgba(239, 68, 68, 0.15)', // red-500
      textColor: '#ef4444',
      borderColor: '#ef4444',
      icon: Zap
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

  const config = priorityConfig[priority] || priorityConfig.medium;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]}`}
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
        border: `1px solid ${config.borderColor}`
      }}
    >
      {showIcon && <Icon size={iconSizes[size]} />}
      {config.label}
    </span>
  );
};

export default TicketPriorityBadge;
