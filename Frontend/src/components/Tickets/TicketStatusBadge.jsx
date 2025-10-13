import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * TicketStatusBadge Component
 *
 * Displays ticket status with color-coded badge
 * Supports 5 status values: open, in_progress, waiting, resolved, closed
 * Bilingual support (EN/AR)
 *
 * @param {string} status - Ticket status value
 * @param {string} size - Badge size: 'sm' | 'md' | 'lg' (default: 'md')
 */
const TicketStatusBadge = ({ status, size = 'md' }) => {
  const { t } = useTranslation();

  // Status configuration with colors (15% opacity background, solid text)
  const statusConfig = {
    open: {
      label: t('statusOpen'),
      bgColor: 'rgba(59, 130, 246, 0.15)', // blue-500
      textColor: '#3b82f6',
      borderColor: '#3b82f6'
    },
    in_progress: {
      label: t('statusInProgress'),
      bgColor: 'rgba(234, 179, 8, 0.15)', // yellow-500
      textColor: '#eab308',
      borderColor: '#eab308'
    },
    waiting: {
      label: t('statusWaiting'),
      bgColor: 'rgba(168, 85, 247, 0.15)', // purple-500
      textColor: '#a855f7',
      borderColor: '#a855f7'
    },
    resolved: {
      label: t('statusResolved'),
      bgColor: 'rgba(34, 197, 94, 0.15)', // green-500
      textColor: '#22c55e',
      borderColor: '#22c55e'
    },
    closed: {
      label: t('statusClosed'),
      bgColor: 'rgba(107, 114, 128, 0.15)', // gray-500
      textColor: '#6b7280',
      borderColor: '#6b7280'
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  const config = statusConfig[status] || statusConfig.open;

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]}`}
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
        border: `1px solid ${config.borderColor}`
      }}
    >
      {config.label}
    </span>
  );
};

export default TicketStatusBadge;
