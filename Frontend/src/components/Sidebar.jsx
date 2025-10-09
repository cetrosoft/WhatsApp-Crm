import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import menuConfig from "../menuConfig";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  User as UserIcon,
  Settings,
  ChevronDown,
  // Menu icons
  LayoutDashboard,
  Users,
  Contact,
  Building,
  Target,
  TrendingUp,
  Megaphone,
  MessageCircle,
  Mail,
  MessageSquare,
  FileText,
  MessagesSquare,
  Inbox,
  UserX,
  Smartphone,
  Zap,
  Ticket,
  ListChecks,
  UserCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  UsersRound,
  Shield,
  Activity,
  UserCog,
  Plug,
  Bell,
  Sliders,
  Lock
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { hasPermission } from "../utils/permissionUtils";
import LanguageSwitcher from "./LanguageSwitcher";

// Icon mapping
const iconMap = {
  LayoutDashboard,
  Users,
  Contact,
  Building,
  Target,
  TrendingUp,
  Settings,
  Megaphone,
  MessageCircle,
  Mail,
  MessageSquare,
  FileText,
  MessagesSquare,
  Inbox,
  UserX,
  Smartphone,
  Zap,
  Ticket,
  ListChecks,
  UserCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  UsersRound,
  Shield,
  Activity,
  UserCog,
  Plug,
  Bell,
  Sliders,
  Lock
};

export default function Sidebar({ isOpen, toggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { t } = useTranslation('common');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const userMenuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Check if user can access organization settings (requires organization.edit permission)
  const canAccessOrgSettings = hasPermission(user, 'organization.edit');

  /**
   * Filter menu items based on user permissions
   */
  const filterMenuByPermissions = (items) => {
    return items.filter(item => {
      // Check if item is active (defaults to true if not specified)
      if (item.isActive === false) return false;

      // Check if user has required permission
      if (item.requiredPermission && !hasPermission(user, item.requiredPermission)) {
        return false;
      }

      // Recursively filter children
      if (item.children) {
        item.children = filterMenuByPermissions(item.children);
        // Hide parent if no children visible
        if (item.children.length === 0) return false;
      }

      return true;
    });
  };

  const filteredMenu = filterMenuByPermissions(JSON.parse(JSON.stringify(menuConfig)));

  // Toggle parent menu item
  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Check if any child is active
  const isChildActive = (children) => {
    if (!children) return false;
    return children.some(child =>
      child.path === location.pathname ||
      (child.children && isChildActive(child.children))
    );
  };

  // Render menu item (recursive for nested children)
  const renderMenuItem = (item, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems[item.id];
    const isActive = item.path === location.pathname;
    const hasActiveChild = isChildActive(item.children);

    // Get icon component from mapping
    const IconComponent = iconMap[item.icon];

    // Item with children (parent)
    if (hasChildren) {
      return (
        <div key={item.id} className={level > 0 ? "ms-4" : ""}>
          <button
            onClick={() => toggleExpanded(item.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
              hasActiveChild
                ? "bg-[#6264a7] text-white font-semibold"
                : "hover:bg-[#5a5d8a] hover:text-white"
            }`}
          >
            {IconComponent && <IconComponent size={20} />}
            {isOpen && (
              <>
                <span className="text-sm flex-1 text-start">{t(item.labelKey) || item.label}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </>
            )}
          </button>

          {/* Children */}
          {isOpen && isExpanded && (
            <div className="ms-4 mt-1 space-y-1">
              {item.children.map(child => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    // Item with direct path (leaf)
    return (
      <Link
        key={item.id}
        to={item.path}
        className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
          isActive
            ? "bg-[#6264a7] text-white font-semibold shadow-sm"
            : "hover:bg-[#5a5d8a] hover:text-white"
        } ${level > 0 ? "ms-4" : ""}`}
      >
        {IconComponent && <IconComponent size={20} />}
        {isOpen && <span className="text-sm">{t(item.labelKey) || item.label}</span>}
      </Link>
    );
  };

  return (
    <div
      className={`h-screen bg-[#464775] text-white flex flex-col transition-all duration-300 font-cairo shadow-lg
        ${isOpen ? "w-64" : "w-20"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#5a5d8a]">
        {isOpen && <h1 className="text-xl font-bold">💬 WhatsApp CRM</h1>}
        <button
          className="p-2 rounded hover:bg-[#5a5d8a] transition-colors"
          onClick={toggleSidebar}
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Links */}
      <nav className="flex-1 flex flex-col space-y-1 p-3 overflow-y-auto">
        {filteredMenu.map(item => renderMenuItem(item))}
      </nav>

      {/* Footer: User Menu, Language Switcher & Logout */}
      <div className="p-3 border-t border-[#5a5d8a] space-y-2">
        {/* User Menu */}
        {isOpen && user && (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#5a5d8a] transition-colors"
            >
              {/* Avatar */}
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-indigo-600">
                  {user.fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>

              {/* User Info */}
              <div className="flex-1 text-start min-w-0">
                <div className="text-sm font-medium truncate">
                  {user.fullName || t('user')}
                </div>
                <div className="text-xs text-gray-300 truncate">
                  {user.email}
                </div>
              </div>

              {/* Dropdown Icon */}
              <ChevronDown size={16} className={`transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute bottom-full start-0 w-full mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                {/* My Profile */}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/profile');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-start"
                >
                  <UserIcon className="w-4 h-4" />
                  {t('myProfile')}
                </button>

                {/* Account Settings (Admin or users with organization.edit permission) */}
                {canAccessOrgSettings && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/account-settings');
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-start"
                  >
                    <Settings className="w-4 h-4" />
                    {t('accountSettings')}
                  </button>
                )}

                {/* Divider */}
                <div className="my-1 border-t border-gray-200" />

                {/* Logout */}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-start"
                >
                  <LogOut className="w-4 h-4" />
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Collapsed User Icon */}
        {!isOpen && user && (
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center justify-center p-3 rounded-lg hover:bg-[#5a5d8a] transition-colors"
            title={user.fullName || user.email}
          >
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-indigo-600">
                {user.fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          </button>
        )}

        {/* Language Switcher */}
        <div className="flex items-center justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
