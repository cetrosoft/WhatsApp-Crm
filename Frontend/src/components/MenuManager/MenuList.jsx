/**
 * MenuList Component
 * Displays menu items in hierarchical tree structure
 *
 * Features:
 * - Tree view with expand/collapse
 * - Loading state
 * - Empty state
 * - Manages expanded state
 */

import React, { useState } from 'react';
import { Menu as MenuIcon } from 'lucide-react';
import MenuTreeItem from './MenuTreeItem';

const MenuList = ({ menus, loading, onEdit, onDelete, onReorder }) => {
  const [expandedKeys, setExpandedKeys] = useState(new Set());

  const toggleExpand = (key) => {
    const newExpanded = new Set(expandedKeys);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedKeys(newExpanded);
  };

  // Expand all menus
  const expandAll = () => {
    const allKeys = new Set();
    const collectKeys = (items) => {
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          allKeys.add(item.key);
          collectKeys(item.children);
        }
      });
    };
    collectKeys(menus);
    setExpandedKeys(allKeys);
  };

  // Collapse all menus
  const collapseAll = () => {
    setExpandedKeys(new Set());
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-12">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
          <p className="text-gray-600">Loading menu items...</p>
        </div>
      </div>
    );
  }

  if (!menus || menus.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <MenuIcon className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Menu Items Found
          </h3>
          <p className="text-gray-600 mb-4">
            Get started by creating your first menu item
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {menus.length} top-level menu{menus.length !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={expandAll}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Expand All
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={collapseAll}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Tree */}
      <div>
        {menus.map((menu) => (
          <MenuTreeItem
            key={menu.id}
            menu={menu}
            level={0}
            expanded={expandedKeys.has(menu.key)}
            onToggle={() => toggleExpand(menu.key)}
            onEdit={onEdit}
            onDelete={onDelete}
            onReorder={onReorder}
          />
        ))}
      </div>
    </div>
  );
};

export default MenuList;
