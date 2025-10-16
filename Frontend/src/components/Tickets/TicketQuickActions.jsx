/**
 * Ticket Quick Actions Component
 * In-line dropdowns for quick status and priority changes
 *
 * @reusable
 * @category Tickets
 * @example
 * <TicketQuickActions
 *   ticket={ticket}
 *   onStatusChange={handleStatusChange}
 *   onPriorityChange={handlePriorityChange}
 *   canEdit={canEdit}
 * />
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, AlertCircle, Zap, Check } from 'lucide-react';
import { TicketStatusBadge, TicketPriorityBadge } from './index';

const TicketQuickActions = ({ ticket, onStatusChange, onPriorityChange, canEdit }) => {
  const { t } = useTranslation(['common']);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const statusRef = useRef(null);
  const priorityRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusRef.current && !statusRef.current.contains(event.target)) {
        setShowStatusMenu(false);
      }
      if (priorityRef.current && !priorityRef.current.contains(event.target)) {
        setShowPriorityMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statusOptions = [
    { value: 'open', label: t('statusOpen'), color: '#3b82f6', icon: '●' },
    { value: 'in_progress', label: t('statusInProgress'), color: '#eab308', icon: '◐' },
    { value: 'waiting', label: t('statusWaiting'), color: '#a855f7', icon: '⏸' },
    { value: 'resolved', label: t('statusResolved'), color: '#22c55e', icon: '✓' },
    { value: 'closed', label: t('statusClosed'), color: '#6b7280', icon: '✕' }
  ];

  const priorityOptions = [
    { value: 'low', label: t('priorityLow'), color: '#22c55e', icon: '▼' },
    { value: 'medium', label: t('priorityMedium'), color: '#eab308', icon: '▬' },
    { value: 'high', label: t('priorityHigh'), color: '#f97316', icon: '▲' },
    { value: 'urgent', label: t('priorityUrgent'), color: '#ef4444', icon: '▲▲' }
  ];

  const handleStatusClick = (status) => {
    if (status !== ticket.status) {
      onStatusChange(ticket, status);
    }
    setShowStatusMenu(false);
  };

  const handlePriorityClick = (priority) => {
    if (priority !== ticket.priority) {
      onPriorityChange(ticket, priority);
    }
    setShowPriorityMenu(false);
  };

  if (!canEdit) {
    // Read-only badges if no edit permission
    return (
      <div className="flex items-center gap-2">
        <TicketStatusBadge status={ticket.status} size="sm" />
        <TicketPriorityBadge priority={ticket.priority} size="sm" showIcon={false} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Status Dropdown */}
      <div className="relative" ref={statusRef}>
        <button
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          className="flex items-center gap-1 hover:bg-gray-100 rounded px-1 py-0.5 transition-colors"
          title={t('changeStatus')}
        >
          <TicketStatusBadge status={ticket.status} size="sm" />
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>

        {showStatusMenu && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-1">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusClick(option.value)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-gray-50 transition-colors ${
                    ticket.status === option.value ? 'bg-gray-100' : ''
                  }`}
                >
                  <span style={{ color: option.color }}>{option.icon}</span>
                  <span className="flex-1 text-left">{option.label}</span>
                  {ticket.status === option.value && (
                    <Check className="w-4 h-4 text-indigo-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Priority Dropdown */}
      <div className="relative" ref={priorityRef}>
        <button
          onClick={() => setShowPriorityMenu(!showPriorityMenu)}
          className="flex items-center gap-1 hover:bg-gray-100 rounded px-1 py-0.5 transition-colors"
          title={t('changePriority')}
        >
          <TicketPriorityBadge priority={ticket.priority} size="sm" showIcon={false} />
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>

        {showPriorityMenu && (
          <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-1">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handlePriorityClick(option.value)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-gray-50 transition-colors ${
                    ticket.priority === option.value ? 'bg-gray-100' : ''
                  }`}
                >
                  <span style={{ color: option.color }}>{option.icon}</span>
                  <span className="flex-1 text-left">{option.label}</span>
                  {ticket.priority === option.value && (
                    <Check className="w-4 h-4 text-indigo-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketQuickActions;
