/**
 * Menu Routes
 * API endpoints for dynamic menu management
 */

import express from 'express';
import supabase from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/menu
 * Get menu structure for authenticated user
 * Filters based on permissions and language
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const lang = req.query.lang || 'en'; // Get language from query param

    console.log(`[Menu API] Fetching menu for user ${userId}, language: ${lang}`);

    // Call database function to get filtered menu
    const { data, error } = await supabase.rpc('get_user_menu', {
      user_id: userId,
      lang: lang
    });

    if (error) {
      console.error('[Menu API] Error fetching menu:', error);
      return res.status(500).json({ error: 'Failed to fetch menu', details: error.message });
    }

    // Filter out items user doesn't have permission for
    const filteredData = data.filter(item => item.has_permission);

    // Build hierarchical structure
    const menuTree = buildMenuTree(filteredData);

    res.json({
      success: true,
      menu: menuTree,
      language: lang
    });

  } catch (error) {
    console.error('[Menu API] Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/menu/all
 * Get all menu items (Admin only)
 * For menu management UI
 */
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;

    // Only admins can view all menus
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('[Menu API] Error fetching all menus:', error);
      return res.status(500).json({ error: 'Failed to fetch menus' });
    }

    res.json({
      success: true,
      items: data
    });

  } catch (error) {
    console.error('[Menu API] Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/menu
 * Create new menu item (Admin only)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      key,
      parent_key,
      name_en,
      name_ar,
      icon,
      path,
      display_order,
      required_permission,
      required_feature,
      is_active
    } = req.body;

    // Validate required fields
    if (!key || !name_en || !name_ar) {
      return res.status(400).json({ error: 'Missing required fields: key, name_en, name_ar' });
    }

    const { data, error } = await supabase
      .from('menu_items')
      .insert([{
        key,
        parent_key,
        name_en,
        name_ar,
        icon,
        path,
        display_order: display_order || 0,
        required_permission,
        required_feature,
        is_active: is_active !== undefined ? is_active : true,
        is_system: false
      }])
      .select()
      .single();

    if (error) {
      console.error('[Menu API] Error creating menu item:', error);
      return res.status(500).json({ error: 'Failed to create menu item', details: error.message });
    }

    res.status(201).json({
      success: true,
      item: data
    });

  } catch (error) {
    console.error('[Menu API] Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/menu/:key
 * Update menu item (Admin only)
 */
router.patch('/:key', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { key } = req.params;
    const updates = req.body;

    // Don't allow updating key or is_system
    delete updates.key;
    delete updates.id;
    delete updates.is_system;
    delete updates.created_at;

    const { data, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('key', key)
      .select()
      .single();

    if (error) {
      console.error('[Menu API] Error updating menu item:', error);
      return res.status(500).json({ error: 'Failed to update menu item', details: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json({
      success: true,
      item: data
    });

  } catch (error) {
    console.error('[Menu API] Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/menu/:key
 * Delete menu item (Admin only, non-system items only)
 */
router.delete('/:key', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { key } = req.params;

    // Check if it's a system menu
    const { data: existing } = await supabase
      .from('menu_items')
      .select('is_system')
      .eq('key', key)
      .single();

    if (existing?.is_system) {
      return res.status(403).json({ error: 'Cannot delete system menu items' });
    }

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('key', key);

    if (error) {
      console.error('[Menu API] Error deleting menu item:', error);
      return res.status(500).json({ error: 'Failed to delete menu item', details: error.message });
    }

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });

  } catch (error) {
    console.error('[Menu API] Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Helper: Build hierarchical menu tree from flat array
 */
function buildMenuTree(items) {
  const itemMap = {};
  const tree = [];

  // Create lookup map
  items.forEach(item => {
    itemMap[item.key] = { ...item, children: [] };
  });

  // Build tree
  items.forEach(item => {
    if (item.parent_key && itemMap[item.parent_key]) {
      itemMap[item.parent_key].children.push(itemMap[item.key]);
    } else {
      tree.push(itemMap[item.key]);
    }
  });

  // Remove empty children arrays
  const cleanTree = (node) => {
    if (node.children && node.children.length === 0) {
      delete node.children;
    } else if (node.children) {
      node.children.forEach(cleanTree);
    }
    return node;
  };

  return tree.map(cleanTree);
}

export default router;
