/**
 * MenuTreeItem Component
 * Single menu row in the tree view with actions
 *
 * Features:
 * - Hierarchical display with indentation
 * - Expandable/collapsible for parent menus
 * - Action buttons (Edit, Delete, Reorder)
 * - Visual indicators (System badge, status)
 * - Recursive rendering for children
 */

import React from 'react';
import {
  ChevronRight,
  ChevronDown,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown as MoveDown,
} from 'lucide-react';
import { getIconComponent } from '../../utils/iconList';

const MenuTreeItem = ({
  menu,
  level = 0,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onReorder,
}) => {
  const hasChildren = menu.children && menu.children.length > 0;
  const Icon = getIconComponent(menu.icon);
  const indent = level * 32; // 32px per level

  return (
    <>
      {/* Main Row */}
      <div className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
        <div className="p-4">
          <div className="flex items-center justify-between">
            {/* Left: Icon, Name, Info */}
            <div className="flex items-center space-x-3 flex-1" style={{ marginLeft: `${indent}px` }}>
              {/* Expand/Collapse Button */}
              {hasChildren ? (
                <button
                  onClick={onToggle}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title={expanded ? 'Collapse' : 'Expand'}
                >
                  {expanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              ) : (
                <div className="w-6"></div>
              )}

              {/* Icon */}
              <div className="flex-shrink-0">
                <Icon className="w-5 h-5 text-gray-600" />
              </div>

              {/* Name and Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{menu.name_en}</span>
                  <span className="text-sm text-gray-500">({menu.key})</span>
                  {menu.is_system && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      System
                    </span>
                  )}
                  {!menu.is_active && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                      Hidden
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1 flex items-center space-x-3">
                  {menu.permission_module && (
                    <span>Module: <span className="font-mono text-gray-700">{menu.permission_module}</span></span>
                  )}
                  {menu.required_permission && (
                    <span>Permission: <span className="font-mono text-gray-700">{menu.required_permission}</span></span>
                  )}
                  {menu.required_feature && (
                    <span>Feature: <span className="font-mono text-gray-700">{menu.required_feature}</span></span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center space-x-1 ml-4">
              <button
                onClick={() => onEdit(menu)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Edit menu item"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onReorder(menu, 'up')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Move up"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => onReorder(menu, 'down')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Move down"
              >
                <MoveDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(menu)}
                disabled={menu.is_system}
                className={`p-2 rounded transition-colors ${
                  menu.is_system
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-red-600 hover:bg-red-50'
                }`}
                title={menu.is_system ? 'System menu cannot be deleted' : 'Delete menu item'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Children (Recursive) */}
      {expanded && hasChildren && (
        <>
          {menu.children.map((child) => (
            <MenuTreeItem
              key={child.id}
              menu={child}
              level={level + 1}
              expanded={expanded}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onReorder={onReorder}
            />
          ))}
        </>
      )}
    </>
  );
};

export default MenuTreeItem;
