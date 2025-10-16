/**
 * Menus Page
 * Manage organization menu system
 *
 * Features:
 * - View all menu items in tree structure
 * - Create/edit/delete menu items
 * - Reorder menu items
 * - Search and filter
 * - System menu protection
 */

import React, { useState, useEffect } from 'react';
import { Menu as MenuIcon, Plus } from 'lucide-react';
import { superAdminMenuAPI } from '../../services/superAdminAPI';
import toast from 'react-hot-toast';
import MenuFilters from '../../components/MenuManager/MenuFilters';
import MenuList from '../../components/MenuManager/MenuList';
import MenuForm from '../../components/MenuManager/MenuForm';

const Menus = () => {
  const [menus, setMenus] = useState([]);
  const [filteredMenus, setFilteredMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: 'all', system: 'all' });

  useEffect(() => {
    loadMenus();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [menus, searchTerm, filters]);

  const loadMenus = async () => {
    try {
      setLoading(true);
      const response = await superAdminMenuAPI.getMenus();
      setMenus(response.menus || []);
    } catch (error) {
      console.error('Error loading menus:', error);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...menus];

    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = filterMenusRecursive(result, (menu) =>
        menu.name_en.toLowerCase().includes(search) ||
        menu.key.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      const isActive = filters.status === 'active';
      result = filterMenusRecursive(result, (menu) => menu.is_active === isActive);
    }

    // Apply system filter
    if (filters.system !== 'all') {
      const isSystem = filters.system === 'system';
      result = filterMenusRecursive(result, (menu) => menu.is_system === isSystem);
    }

    setFilteredMenus(result);
  };

  // Recursive filter that preserves hierarchy
  const filterMenusRecursive = (menuList, predicate) => {
    return menuList.reduce((acc, menu) => {
      const matchesFilter = predicate(menu);
      const filteredChildren = menu.children
        ? filterMenusRecursive(menu.children, predicate)
        : [];

      if (matchesFilter || filteredChildren.length > 0) {
        acc.push({
          ...menu,
          children: filteredChildren,
        });
      }

      return acc;
    }, []);
  };

  const handleCreate = () => {
    setEditingMenu(null);
    setShowForm(true);
  };

  const handleEdit = (menu) => {
    setEditingMenu(menu);
    setShowForm(true);
  };

  const handleDelete = async (menu) => {
    if (menu.is_system) {
      toast.error('Cannot delete system menu items');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${menu.name_en}"?\nThis action cannot be undone.`)) {
      return;
    }

    try {
      await superAdminMenuAPI.deleteMenu(menu.id);
      toast.success('Menu item deleted successfully');
      loadMenus();
    } catch (error) {
      console.error('Error deleting menu:', error);
      toast.error(error.response?.data?.error || 'Failed to delete menu item');
    }
  };

  const handleReorder = async (menu, direction) => {
    try {
      await superAdminMenuAPI.reorderMenu(menu.id, direction);
      toast.success('Menu order updated');
      loadMenus();
    } catch (error) {
      console.error('Error reordering menu:', error);
      const errorMsg = error.response?.data?.error;
      if (errorMsg?.includes('already at')) {
        toast.error(errorMsg);
      } else {
        toast.error('Failed to reorder menu item');
      }
    }
  };

  const handleFormClose = (shouldReload) => {
    setShowForm(false);
    setEditingMenu(null);
    if (shouldReload) {
      loadMenus();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <MenuIcon className="w-8 h-8 mr-3 text-red-600" />
            Menu Manager
          </h1>
          <p className="text-gray-600 mt-1">
            Manage organization menu system and navigation structure
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Menu Item
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Menu Management</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Manage the navigation menu that appears for organization users. Changes are reflected immediately.
                System menus (blue badge) cannot be deleted but can be edited.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <MenuFilters
        onSearch={setSearchTerm}
        onFilter={setFilters}
      />

      {/* Menu List */}
      <MenuList
        menus={filteredMenus}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReorder={handleReorder}
      />

      {/* Form Modal */}
      {showForm && (
        <MenuForm
          menu={editingMenu}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default Menus;
