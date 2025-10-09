/**
 * Role Management Routes
 * CRUD operations for custom roles
 */

import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { setTenantContext } from '../middleware/tenant.js';

const router = express.Router();

// Apply authentication and tenant context to all routes
router.use(authenticate);
router.use(setTenantContext);

/**
 * GET /api/roles
 * Get all roles for the organization (system + custom)
 */
router.get('/', async (req, res) => {
  try {
    // Get roles
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .eq('organization_id', req.organizationId)
      .order('is_system', { ascending: false }) // System roles first
      .order('created_at', { ascending: true });

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      return res.status(500).json({ error: 'Failed to fetch roles' });
    }

    // Get user counts for each role
    const { data: userCounts, error: countError } = await supabase
      .from('users')
      .select('role_id')
      .eq('organization_id', req.organizationId);

    if (countError) {
      console.error('Error fetching user counts:', countError);
    }

    // Count users per role
    const userCountMap = {};
    if (userCounts) {
      userCounts.forEach(u => {
        if (u.role_id) {
          userCountMap[u.role_id] = (userCountMap[u.role_id] || 0) + 1;
        }
      });
    }

    // Add counts to roles
    const rolesWithCounts = roles.map(role => {
      // Ensure permissions is always an array
      let permissions = role.permissions;
      if (typeof permissions === 'string') {
        try {
          permissions = JSON.parse(permissions);
        } catch (e) {
          permissions = [];
        }
      }
      if (!Array.isArray(permissions)) {
        permissions = [];
      }

      return {
        ...role,
        permissions,
        user_count: userCountMap[role.id] || 0,
        permission_count: permissions.length
      };
    });

    res.json({ roles: rolesWithCounts });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/roles/:roleId
 * Get single role by ID
 */
router.get('/:roleId', async (req, res) => {
  try {
    const { roleId } = req.params;

    const { data: role, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .eq('organization_id', req.organizationId)
      .single();

    if (error || !role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json({ role });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/roles
 * Create a new custom role
 * Requires: permissions.manage permission
 */
router.post('/', requirePermission('permissions.manage'), async (req, res) => {
  try {
    const { name, slug, description, permissions } = req.body;

    // Validation
    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions must be an array' });
    }

    // Check if slug already exists in organization
    const { data: existing } = await supabase
      .from('roles')
      .select('id')
      .eq('organization_id', req.organizationId)
      .eq('slug', slug)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Role slug already exists' });
    }

    // Create role
    const { data: role, error } = await supabase
      .from('roles')
      .insert({
        organization_id: req.organizationId,
        name,
        slug,
        description,
        permissions,
        is_system: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating role:', error);
      return res.status(500).json({ error: 'Failed to create role' });
    }

    res.status(201).json({
      message: 'Role created successfully',
      role,
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/roles/:roleId
 * Update a custom role
 * Requires: permissions.manage permission
 * Note: Cannot update system roles
 */
router.patch('/:roleId', requirePermission('permissions.manage'), async (req, res) => {
  try {
    const { roleId } = req.params;
    const { name, description, permissions } = req.body;

    // Check if role exists and is not admin role
    const { data: role, error: fetchError } = await supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .eq('organization_id', req.organizationId)
      .single();

    if (fetchError || !role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.slug === 'admin') {
      return res.status(403).json({ error: 'Cannot modify admin role' });
    }

    // Build update object
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (permissions !== undefined) {
      if (!Array.isArray(permissions)) {
        return res.status(400).json({ error: 'Permissions must be an array' });
      }
      updates.permissions = permissions;
    }
    updates.updated_at = new Date().toISOString();

    // Update role
    const { data: updatedRole, error } = await supabase
      .from('roles')
      .update(updates)
      .eq('id', roleId)
      .eq('organization_id', req.organizationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating role:', error);
      return res.status(500).json({ error: 'Failed to update role' });
    }

    res.json({
      message: 'Role updated successfully',
      role: updatedRole,
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/roles/:roleId
 * Delete a custom role
 * Requires: permissions.manage permission
 * Note: Cannot delete system roles or roles assigned to users
 */
router.delete('/:roleId', requirePermission('permissions.manage'), async (req, res) => {
  try {
    const { roleId } = req.params;

    // Check if role exists and is not a system role
    const { data: role, error: fetchError } = await supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .eq('organization_id', req.organizationId)
      .single();

    if (fetchError || !role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.is_system) {
      return res.status(403).json({ error: 'Cannot delete system roles' });
    }

    // Check if role is assigned to any users
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('role_id', roleId)
      .limit(1);

    if (userError) {
      console.error('Error checking role usage:', userError);
      return res.status(500).json({ error: 'Failed to check role usage' });
    }

    if (users && users.length > 0) {
      return res.status(409).json({
        error: 'Cannot delete role that is assigned to users',
        message: 'Please reassign users to another role before deleting',
      });
    }

    // Delete role
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', roleId)
      .eq('organization_id', req.organizationId);

    if (error) {
      console.error('Error deleting role:', error);
      return res.status(500).json({ error: 'Failed to delete role' });
    }

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/roles/:roleId/users
 * Get all users assigned to a specific role
 */
router.get('/:roleId/users', async (req, res) => {
  try {
    const { roleId } = req.params;

    // Verify role exists in organization
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('id', roleId)
      .eq('organization_id', req.organizationId)
      .single();

    if (roleError || !role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Get users with this role
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url, is_active, created_at')
      .eq('role_id', roleId)
      .eq('organization_id', req.organizationId);

    if (error) {
      console.error('Error fetching role users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    res.json({
      roleId,
      userCount: users.length,
      users,
    });
  } catch (error) {
    console.error('Get role users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
