/**
 * Topbar Component
 * Top navigation bar with search, notifications, language switcher, and user menu
 * Fully bilingual (RTL/LTR) support
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { Menu, Search, Bell, Sparkles } from 'lucide-react';
import UserMenu from './UserMenu';
import NotificationDropdown from './NotificationDropdown';

const Topbar = ({ sidebarOpen, toggleSidebar, toggleMobileSidebar }) => {
  const { t } = useTranslation(['common', 'navigation']);
  const { isRTL } = useLanguage();
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="fixed top-0 start-0 end-0 h-16 bg-white border-b border-gray-200 z-40 shadow-sm">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle mobile menu"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
            <span>💬</span>
            <span className="hidden sm:block">{t('common:appName')}</span>
          </Link>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:block relative">
            <div
              className={`flex items-center gap-2 px-4 py-2 bg-gray-50 border rounded-lg transition-all duration-200 ${
                searchFocused ? 'w-80 border-indigo-300 bg-white' : 'w-64 border-gray-200'
              }`}
            >
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('navigation:searchPlaceholder', { defaultValue: 'Search...' })}
                className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              <kbd className="hidden lg:inline-block px-2 py-0.5 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded">
                Ctrl+K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <NotificationDropdown />

          {/* Upgrade Button */}
          <Link
            to="/account-settings?tab=subscription"
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">{t('navigation:upgrade', { defaultValue: 'Upgrade' })}</span>
          </Link>

          {/* User Menu (includes language switcher) */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Topbar;
