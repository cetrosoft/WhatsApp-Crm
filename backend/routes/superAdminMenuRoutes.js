/**
 * Super Admin Menu Routes
 * CRUD operations for managing organization menu system
 *
 * Features:
 * - List all menu items with hierarchy
 * - Create/update/delete menu items
 * - Reorder menu items
 * - System menu protection
 * - Audit logging
 *
 * Target Table: menu_items
 * Related: docs/DATABASE_DRIVEN_ARCHITECTURE.md, docs/PERMISSION_MODULE_ARCHITECTURE_v3.md
 */

import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateSuperAdmin } from '../middleware/superAdminAuth.js';

const router = express.Router();

// All routes require super admin authentication
router.use(authenticateSuperAdmin);

/**
 * Helper: Build hierarchical tree structure from flat menu items
 */
function buildMenuTree(flatItems) {
  const itemsMap = new Map();
  const rootItems = [];

  // Create map of all items
  flatItems.forEach(item => {
    itemsMap.set(item.key, { ...item, children: [] });
  });

  // Build hierarchy
  flatItems.forEach(item => {
    if (item.parent_key) {
      const parent = itemsMap.get(item.parent_key);
      if (parent) {
        parent.children.push(itemsMap.get(item.key));
      }
    } else {
      rootItems.push(itemsMap.get(item.key));
    }
  });

  return rootItems;
}

/**
 * Helper: Log action to super_admin_audit_logs
 */
async function logAudit(superAdminId, action, resourceType, resourceId, details, req) {
  try {
    await supabase
      .from('super_admin_audit_logs')
      .insert({
        super_admin_id: superAdminId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.headers['user-agent']
      });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}

/**
 * GET /api/super-admin/menus
 * List all menu items with hierarchical structure
 */
router.get('/', async (req, res) => {
  try {
    const { data: menus, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;

    // Build tree structure
    const tree = buildMenuTree(menus);

    res.json({
      success: true,
      menus: tree,
      total: menus.length
    });
  } catch (error) {
    console.error('Error fetching menus:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch menu items',
      message: error.message
    });
  }
});

/**
 * GET /api/super-admin/menus/:id
 * Get single menu item by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: menu, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Menu item not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      menu
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch menu item',
      message: error.message
    });
  }
});

/**
 * POST /api/super-admin/menus
 * Create new menu item
 */
router.post('/', async (req, res) => {
  try {
    const {
      key,
      parent_key,
      name_en,
      name_ar,
      icon,
      path,
      display_order,
      permission_module,
      required_permission,
      required_feature,
      is_system,
      is_active,
      show_in_menu
    } = req.body;

    // Validation
    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'Menu key is required'
      });
    }

    if (!name_en || !name_ar) {
      return res.status(400).json({
        success: false,
        error: 'Both English and Arabic names are required'
      });
    }

    if (!icon) {
      return res.status(400).json({
        success: false,
        error: 'Icon is required'
      });
    }

    // Check key uniqueness
    const { data: existing } = await supabase
      .from('menu_items')
      .select('id')
      .eq('key', key)
      .single();

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Menu key already exists'
      });
    }

    // Check parent exists if provided
    if (parent_key) {
      const { data: parent } = await supabase
        .from('menu_items')
        .select('id')
        .eq('key', parent_key)
        .single();

      if (!parent) {
        return res.status(400).json({
          success: false,
          error: 'Parent menu item not found'
        });
      }
    }

    // Circular reference check
    if (parent_key === key) {
      return res.status(400).json({
        success: false,
        error: 'Menu item cannot be its own parent'
      });
    }

    // Create menu item
    const { data: newMenu, error } = await supabase
      .from('menu_items')
      .insert({
        key,
        parent_key: parent_key || null,
        name_en,
        name_ar,
        icon,
        path: path || null,
        display_order: display_order || 0,
        permission_module: permission_module || null,
        required_permission: required_permission || null,
        required_feature: required_feature || null,
        is_system: is_system || false,
        is_active: is_active !== undefined ? is_active : true,
        show_in_menu: show_in_menu !== undefined ? show_in_menu : true
      })
      .select()
      .single();

    if (error) throw error;

    // Log action
    await logAudit(
      req.superAdminId,
      'menu.create',
      'menu_item',
      newMenu.id,
      { key, name_en, name_ar },
      req
    );

    res.status(201).json({
      success: true,
      menu: newMenu,
      message: 'Menu item created successfully'
    });
  } catch (error) {
    console.error('Error creating menu:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create menu item',
      message: error.message
    });
  }
});

/**
 * PATCH /api/super-admin/menus/:id
 * Update existing menu item
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      key,
      parent_key,
      name_en,
      name_ar,
      icon,
      path,
      display_order,
      permission_module,
      required_permission,
      required_feature,
      is_system,
      is_active,
      show_in_menu
    } = req.body;

    // Check menu exists
    const { data: existingMenu } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingMenu) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    // Cannot edit system menus (optional - remove if you want full control)
    // if (existingMenu.is_system) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Cannot edit system menu items'
    //   });
    // }

    // Check key uniqueness if changed
    if (key && key !== existingMenu.key) {
      const { data: duplicate } = await supabase
        .from('menu_items')
        .select('id')
        .eq('key', key)
        .neq('id', id)
        .single();

      if (duplicate) {
        return res.status(400).json({
          success: false,
          error: 'Menu key already exists'
        });
      }
    }

    // Check parent exists if changed
    if (parent_key && parent_key !== existingMenu.parent_key) {
      const { data: parent } = await supabase
        .from('menu_items')
        .select('id')
        .eq('key', parent_key)
        .single();

      if (!parent) {
        return res.status(400).json({
          success: false,
          error: 'Parent menu item not found'
        });
      }
    }

    // Circular reference check
    if (parent_key === (key || existingMenu.key)) {
      return res.status(400).json({
        success: false,
        error: 'Menu item cannot be its own parent'
      });
    }

    // Build update object
    const updateData = {};
    if (key !== undefined) updateData.key = key;
    if (parent_key !== undefined) updateData.parent_key = parent_key || null;
    if (name_en !== undefined) updateData.name_en = name_en;
    if (name_ar !== undefined) updateData.name_ar = name_ar;
    if (icon !== undefined) updateData.icon = icon;
    if (path !== undefined) updateData.path = path || null;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (permission_module !== undefined) updateData.permission_module = permission_module || null;
    if (required_permission !== undefined) updateData.required_permission = required_permission || null;
    if (required_feature !== undefined) updateData.required_feature = required_feature || null;
    if (is_system !== undefined) updateData.is_system = is_system;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (show_in_menu !== undefined) updateData.show_in_menu = show_in_menu;
    updateData.updated_at = new Date().toISOString();

    // Update menu
    const { data: updatedMenu, error } = await supabase
      .from('menu_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log action
    await logAudit(
      req.superAdminId,
      'menu.update',
      'menu_item',
      id,
      { changes: updateData },
      req
    );

    res.json({
      success: true,
      menu: updatedMenu,
      message: 'Menu item updated successfully'
    });
  } catch (error) {
    console.error('Error updating menu:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update menu item',
      message: error.message
    });
  }
});

/**
 * DELETE /api/super-admin/menus/:id
 * Delete menu item (only non-system items)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check menu exists
    const { data: menu } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', id)
      .single();

    if (!menu) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    // Prevent deletion of system menus
    if (menu.is_system) {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete system menu items'
      });
    }

    // Check if menu has children
    const { data: children } = await supabase
      .from('menu_items')
      .select('id')
      .eq('parent_key', menu.key);

    if (children && children.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete menu item - ${children.length} child item(s) depend on it`
      });
    }

    // Delete menu
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log action
    await logAudit(
      req.superAdminId,
      'menu.delete',
      'menu_item',
      id,
      { key: menu.key, name_en: menu.name_en },
      req
    );

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting menu:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete menu item',
      message: error.message
    });
  }
});

/**
 * PATCH /api/super-admin/menus/:id/reorder
 * Reorder menu item by swapping with adjacent sibling
 */
router.patch('/:id/reorder', async (req, res) => {
  try {
    const { id } = req.params;
    const { direction } = req.body;

    if (!direction || !['up', 'down'].includes(direction)) {
      return res.status(400).json({
        success: false,
        error: 'direction is required (must be "up" or "down")'
      });
    }

    // Get current menu item
    const { data: currentMenu, error: currentError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', id)
      .single();

    if (currentError || !currentMenu) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    // Get all siblings (same parent_key) ordered by display_order
    let siblingsQuery = supabase
      .from('menu_items')
      .select('*')
      .order('display_order', { ascending: true });

    // Filter by parent_key (handle both null and actual parent)
    if (currentMenu.parent_key) {
      siblingsQuery = siblingsQuery.eq('parent_key', currentMenu.parent_key);
    } else {
      siblingsQuery = siblingsQuery.is('parent_key', null);
    }

    const { data: siblings, error: siblingsError } = await siblingsQuery;

    if (siblingsError) throw siblingsError;

    // Find current item index in siblings
    const currentIndex = siblings.findIndex(s => s.id === id);

    if (currentIndex === -1) {
      return res.status(500).json({
        success: false,
        error: 'Menu item not found in siblings list'
      });
    }

    // Calculate target index
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    // Check boundaries
    if (targetIndex < 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot move up - already at top'
      });
    }

    if (targetIndex >= siblings.length) {
      return res.status(400).json({
        success: false,
        error: 'Cannot move down - already at bottom'
      });
    }

    const targetMenu = siblings[targetIndex];

    // Swap display_order values
    const tempOrder = currentMenu.display_order;
    const now = new Date().toISOString();

    // Update current item with target's order
    const { error: updateCurrentError } = await supabase
      .from('menu_items')
      .update({
        display_order: targetMenu.display_order,
        updated_at: now
      })
      .eq('id', currentMenu.id);

    if (updateCurrentError) throw updateCurrentError;

    // Update target item with current's order
    const { error: updateTargetError } = await supabase
      .from('menu_items')
      .update({
        display_order: tempOrder,
        updated_at: now
      })
      .eq('id', targetMenu.id);

    if (updateTargetError) throw updateTargetError;

    // Log action
    await logAudit(
      req.superAdminId,
      'menu.reorder',
      'menu_item',
      id,
      {
        direction,
        old_order: currentMenu.display_order,
        new_order: targetMenu.display_order,
        swapped_with: targetMenu.key
      },
      req
    );

    res.json({
      success: true,
      message: 'Menu order updated successfully'
    });
  } catch (error) {
    console.error('Error reordering menu:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reorder menu item',
      message: error.message
    });
  }
});

/**
 * GET /api/super-admin/menus/modules/list
 * Get list of available permission modules
 */
router.get('/modules/list', async (req, res) => {
  try {
    // Get unique permission modules from existing menu items
    const { data: menus } = await supabase
      .from('menu_items')
      .select('permission_module')
      .not('permission_module', 'is', null);

    const modules = [...new Set(menus.map(m => m.permission_module))].sort();

    res.json({
      success: true,
      modules
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch modules',
      message: error.message
    });
  }
});

export default router;
