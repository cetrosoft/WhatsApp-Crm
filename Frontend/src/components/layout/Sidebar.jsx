/**
 * Sidebar Component - Redesigned
 * Collapsible multi-level menu with full RTL/LTR support
 * Icons, nested menus, active state highlighting
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react';
import * as Icons from 'lucide-react';
import menuConfig from '../../menuConfig';

const Sidebar = ({ isOpen, mobileOpen, closeMobile }) => {
  const location = useLocation();
  const { t } = useTranslation('navigation');
  const { isRTL } = useLanguage();
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const getIcon = (iconName) => {
    const Icon = Icons[iconName];
    return Icon ? <Icon className="w-5 h-5" /> : null;
  };

  const isPathActive = (path) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const hasActiveChild = (children) => {
    if (!children) return false;
    return children.some(child =>
      isPathActive(child.path) || (child.children && hasActiveChild(child.children))
    );
  };

  const renderMenuItem = (item, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus[item.id];
    const isActive = isPathActive(item.path);
    const hasActiveSubMenu = hasActiveChild(item.children);

    // Determine if this menu or its children are active
    const shouldHighlight = isActive || hasActiveSubMenu;

    const paddingClass = level === 0 ? 'ps-4 pe-3' : `ps-${4 + level * 4} pe-3`;

    if (hasChildren) {
      return (
        <div key={item.id}>
          {/* Parent Menu Item */}
          <button
            onClick={() => toggleMenu(item.id)}
            className={`w-full flex items-center justify-between gap-3 py-3 px-4 rounded-lg transition-all duration-200 ${
              shouldHighlight
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            } ${!isOpen ? 'justify-center' : ''}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Icon */}
              <span className={`flex-shrink-0 ${shouldHighlight ? 'text-indigo-600' : 'text-gray-500'}`}>
                {getIcon(item.icon)}
              </span>

              {/* Label */}
              {isOpen && (
                <span className={`text-sm truncate ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t(item.labelKey, { defaultValue: item.label })}
                </span>
              )}
            </div>

            {/* Chevron */}
            {isOpen && (
              <span className={isRTL ? 'scale-x-[-1]' : ''}>
                <ChevronDown
                  className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </span>
            )}
          </button>

          {/* Submenu */}
          {isOpen && isExpanded && (
            <div className="mt-1 space-y-1">
              {item.children.map(child => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    // Leaf Menu Item (with link)
    return (
      <Link
        key={item.id}
        to={item.path}
        onClick={closeMobile}
        className={`flex items-center gap-3 py-3 px-4 rounded-lg transition-all duration-200 ${
          isActive
            ? 'bg-indigo-600 text-white font-semibold shadow-sm'
            : 'text-gray-700 hover:bg-gray-100'
        } ${!isOpen ? 'justify-center' : ''} ${paddingClass}`}
      >
        {/* Icon */}
        <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`}>
          {getIcon(item.icon)}
        </span>

        {/* Label */}
        {isOpen && (
          <span className={`text-sm truncate ${isRTL ? 'text-right' : 'text-left'}`}>
            {t(item.labelKey, { defaultValue: item.label })}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block fixed top-16 bottom-0 ${isRTL ? 'right-0 border-l' : 'left-0 border-r'} bg-white border-gray-200 transition-all duration-300 z-30 ${
          isOpen ? 'w-64' : 'w-20'
        }`}
      >
        <nav className="h-full overflow-y-auto p-3 space-y-1">
          {menuConfig.map(item => renderMenuItem(item))}
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-16 bottom-0 w-64 bg-white ${isRTL ? 'right-0 border-l' : 'left-0 border-r'} border-gray-200 z-40 transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'
        }`}
      >
        <nav className="h-full overflow-y-auto p-3 space-y-1">
          {menuConfig.map(item => renderMenuItem(item))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
