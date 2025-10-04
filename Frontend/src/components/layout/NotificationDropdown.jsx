/**
 * Notification Dropdown Component
 * Shows notifications with unread count badge
 * RTL/LTR aware positioning
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { Bell, Check, X } from 'lucide-react';

const NotificationDropdown = () => {
  const { t } = useTranslation(['common', 'navigation']);
  const { isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Mock notifications - Replace with real data from backend
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'New team member joined',
      message: 'Ahmed Hassan joined your organization',
      time: '5 minutes ago',
      read: false,
      type: 'info'
    },
    {
      id: 2,
      title: 'Campaign completed',
      message: 'WhatsApp campaign "Summer Sale" sent to 150 customers',
      time: '1 hour ago',
      read: false,
      type: 'success'
    },
    {
      id: 3,
      title: 'Subscription expiring soon',
      message: 'Your trial period ends in 5 days',
      time: '2 hours ago',
      read: true,
      type: 'warning'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = (id) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 end-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 w-80 md:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 ${
            isRTL ? 'left-0' : 'right-0'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">
              {t('navigation:notifications', { defaultValue: 'Notifications' })}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {t('navigation:markAllRead', { defaultValue: 'Mark all as read' })}
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                {t('navigation:noNotifications', { defaultValue: 'No notifications' })}
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.time}
                      </p>
                    </div>

                    {/* Mark as read button */}
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="p-1 rounded hover:bg-indigo-100 text-indigo-600"
                        title={t('navigation:markAsRead', { defaultValue: 'Mark as read' })}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {t('navigation:viewAll', { defaultValue: 'View all notifications' })}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
