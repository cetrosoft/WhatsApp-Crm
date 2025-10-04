/**
 * User Menu Component
 * Dropdown menu with user profile, settings, and logout
 * RTL/LTR aware positioning
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronDown, User, Settings, CreditCard, LogOut, Languages, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const UserMenu = () => {
  const { t, i18n } = useTranslation(['common', 'navigation']);
  const { isRTL, changeLanguage, currentLanguage } = useLanguage();
  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLanguageChange = (lang) => {
    const langName = lang === 'ar' ? 'العربية' : 'English';

    // Show confirmation toast
    toast((toastInfo) => (
      <div className="flex flex-col gap-2">
        <p className="font-medium">
          {currentLanguage === 'ar'
            ? `تغيير اللغة إلى ${langName}؟`
            : `Switch language to ${langName}?`
          }
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              changeLanguage(lang);
              toast.dismiss(toastInfo.id);
              toast.success(
                lang === 'ar'
                  ? 'تم تغيير اللغة إلى العربية'
                  : 'Language changed to English'
              );
              setIsOpen(false);
            }}
            className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
          >
            {currentLanguage === 'ar' ? 'تأكيد' : 'Confirm'}
          </button>
          <button
            onClick={() => toast.dismiss(toastInfo.id)}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
          >
            {currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: 'top-center',
    });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
          ) : (
            getInitials(user?.fullName)
          )}
        </div>

        {/* User Info - Hidden on mobile */}
        <div className="hidden md:block text-start">
          <p className="text-sm font-medium text-gray-700">{user?.fullName || 'User'}</p>
          <p className="text-xs text-gray-500">{organization?.name}</p>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 ${
            isRTL ? 'left-0' : 'right-0'
          }`}
        >
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
            <p className="text-xs text-indigo-600 mt-1">{organization?.name}</p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>{t('navigation:myProfile', { defaultValue: 'My Profile' })}</span>
            </Link>

            <Link
              to="/account-settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>{t('navigation:accountSettings', { defaultValue: 'Account Settings' })}</span>
            </Link>

            <Link
              to="/account-settings?tab=subscription"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              <span>{t('navigation:billing', { defaultValue: 'Billing' })}</span>
            </Link>
          </div>

          {/* Language Switcher */}
          <div className="border-t border-gray-100 py-1">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
              {t('common:language')}
            </div>

            <button
              onClick={() => handleLanguageChange('en')}
              className="w-full flex items-center justify-between gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Languages className="w-4 h-4" />
                <span>English</span>
              </div>
              {currentLanguage === 'en' && (
                <Check className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            <button
              onClick={() => handleLanguageChange('ar')}
              className="w-full flex items-center justify-between gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Languages className="w-4 h-4" />
                <span>العربية</span>
              </div>
              {currentLanguage === 'ar' && (
                <Check className="w-4 h-4 text-indigo-600" />
              )}
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 pt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('common:logout')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
