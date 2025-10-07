/**
 * User Management Routes
 * Handles user CRUD operations and invitations
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';
import { authenticate, authorize, requirePermission } from '../middleware/auth.js';
import { setTenantContext } from '../middleware/tenant.js';
import { createInvitation, acceptInvitation, verifyInvitation } from '../services/invitationService.js';
import { getUserPermissionsSummary, getEffectivePermissions } from '../utils/permissions.js';
import { PERMISSION_GROUPS, ROLE_PERMISSIONS } from '../constants/permissions.js';

const router = express.Router();

/**
 * GET /api/users
 * Get all users in organization
 */
router.get('/', authenticate, setTenantContext, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        avatar_url,
        is_active,
        created_at,
        last_login_at,
        permissions,
        role:roles(id, name, slug, permissions)
      `)
      .eq('organization_id', req.organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Format response for backward compatibility
    const formattedUsers = users.map(user => {
      // Parse role permissions if they're a string
      let rolePermissions = user.role?.permissions || [];
      if (typeof rolePermissions === 'string') {
        try {
          rolePermissions = JSON.parse(rolePermissions);
        } catch (e) {
          rolePermissions = [];
        }
      }

      return {
        ...user,
        roleId: user.role?.id,
        roleName: user.role?.name,
        roleSlug: user.role?.slug,
        rolePermissions: rolePermissions, // Add role's default permissions
        // Keep legacy 'role' field for backward compatibility
        role: user.role?.slug || 'member',
      };
    });

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * POST /api/users/invite
 * Invite a new user to organization (admin/manager only)
 */
router.post('/invite', authenticate, setTenantContext, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const { email, role = 'member', roleId } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Get role_id - accept either roleId directly or role slug
    let targetRoleId = roleId;

    if (!targetRoleId && role) {
      // Convert role slug to role_id
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('organization_id', req.organizationId)
        .eq('slug', role)
        .eq('is_system', true)
        .single();

      if (roleError || !roleData) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      targetRoleId = roleData.id;
    }

    if (!targetRoleId) {
      return res.status(400).json({ error: 'Role is required' });
    }

    // Get organization with package limits
    const { data: organization } = await supabase
      .from('organizations')
      .select('name, package:packages(max_users)')
      .eq('id', req.organizationId)
      .single();

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Check user limit
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', req.organizationId);

    const maxUsers = organization.package?.max_users;

    if (maxUsers && userCount >= maxUsers) {
      return res.status(403).json({
        error: 'User limit reached',
        message: `Your plan allows ${maxUsers} users. Upgrade to add more.`
      });
    }

    // Create invitation
    const invitation = await createInvitation({
      organizationId: req.organizationId,
      email,
      roleId: targetRoleId,
      role, // Keep for backward compatibility in email template
      invitedBy: req.user.userId,
      organizationName: organization.name,
    });

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expires_at,
      }
    });

  } catch (error) {
    console.error('Invite user error:', error);
    res.status(400).json({ error: error.message || 'Failed to send invitation' });
  }
});

/**
 * GET /api/users/invitations
 * Get all pending invitations (admin/manager only)
 */
router.get('/invitations', authenticate, setTenantContext, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const { data: invitations, error } = await supabase
      .from('invitations')
      .select(`
        id,
        email,
        role,
        created_at,
        expires_at,
        accepted_at,
        invited_by:users!invitations_invited_by_fkey(full_name, email)
      `)
      .eq('organization_id', req.organizationId)
      .is('accepted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({ invitations });
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

/**
 * POST /api/users/accept-invitation
 * Accept invitation and create account (public route)
 */
router.post('/accept-invitation', async (req, res) => {
  try {
    const { token, password, fullName } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Accept invitation
    const { user, organization } = await acceptInvitation({
      token,
      password,
      fullName,
    });

    // Generate JWT
    const jwtToken = jwt.sign(
      {
        userId: user.id,
        organizationId: user.organization_id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
    });

  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(400).json({ error: error.message || 'Failed to accept invitation' });
  }
});

/**
 * GET /api/users/verify-invitation/:token
 * Verify invitation token (public route)
 */
router.get('/verify-invitation/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await verifyInvitation(token);

    res.json({
      valid: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        organizationName: invitation.organization.name,
        expiresAt: invitation.expires_at,
      }
    });

  } catch (error) {
    res.status(400).json({
      valid: false,
      error: error.message || 'Invalid invitation'
    });
  }
});

/**
 * PATCH /api/users/:userId
 * Update user (admin only)
 */
router.patch('/:userId', authenticate, setTenantContext, authorize(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, roleId, isActive } = req.body;

    const updates = {};

    // Accept either roleId (new) or role slug (legacy)
    if (roleId) {
      // Verify roleId belongs to this organization
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('id', roleId)
        .eq('organization_id', req.organizationId)
        .single();

      if (roleError || !roleData) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      updates.role_id = roleId;
      // role column will be synced automatically by trigger
    } else if (role) {
      // Legacy: accept role slug
      updates.role = role;
    }

    if (typeof isActive === 'boolean') updates.is_active = isActive;

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .eq('organization_id', req.organizationId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isActive: user.is_active,
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/users/:userId
 * Delete/deactivate user (admin only)
 */
router.delete('/:userId', authenticate, setTenantContext, authorize(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent self-deletion
    if (userId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Soft delete - just deactivate
    const { data: user, error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', userId)
      .eq('organization_id', req.organizationId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deactivated successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * GET /api/users/:userId/permissions
 * Get user's effective permissions (admin only)
 */
router.get('/:userId/permissions', authenticate, setTenantContext, requirePermission('permissions.manage'), async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user with permissions
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, permissions')
      .eq('id', userId)
      .eq('organization_id', req.organizationId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get permission summary
    const summary = getUserPermissionsSummary(user);

    res.json({
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      ...summary,
    });

  } catch (error) {
    console.error('Get user permissions error:', error);
    res.status(500).json({ error: 'Failed to get user permissions' });
  }
});

/**
 * PATCH /api/users/:userId/permissions
 * Update user's custom permissions (admin only)
 * Body: { grant: ['permission1'], revoke: ['permission2'] }
 */
router.patch('/:userId/permissions', authenticate, setTenantContext, requirePermission('permissions.manage'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { grant = [], revoke = [] } = req.body;

    // Validate arrays
    if (!Array.isArray(grant) || !Array.isArray(revoke)) {
      return res.status(400).json({ error: 'Grant and revoke must be arrays' });
    }

    // Prevent self-modification
    if (userId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot modify your own permissions' });
    }

    // Get current user
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, role, permissions')
      .eq('id', userId)
      .eq('organization_id', req.organizationId)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update permissions
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        permissions: {
          grant,
          revoke,
        }
      })
      .eq('id', userId)
      .eq('organization_id', req.organizationId)
      .select('id, email, full_name, role, permissions')
      .single();

    if (updateError) {
      throw updateError;
    }

    // Get permission summary
    const summary = getUserPermissionsSummary(updatedUser);

    res.json({
      message: 'Permissions updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.full_name,
        ...summary,
      }
    });

  } catch (error) {
    console.error('Update user permissions error:', error);
    res.status(500).json({ error: 'Failed to update user permissions' });
  }
});

/**
 * GET /api/users/permissions/available
 * Get all available permissions grouped by category (admin only)
 */
router.get('/permissions/available', authenticate, setTenantContext, authorize(['admin']), async (req, res) => {
  try {
    // Return PERMISSION_GROUPS as-is (object format expected by frontend utils)
    res.json({
      groups: PERMISSION_GROUPS,
      roles: {
        admin: ROLE_PERMISSIONS.admin,
        manager: ROLE_PERMISSIONS.manager,
        agent: ROLE_PERMISSIONS.agent,
        member: ROLE_PERMISSIONS.member,
      }
    });
  } catch (error) {
    console.error('Get available permissions error:', error);
    res.status(500).json({ error: 'Failed to get available permissions' });
  }
});

export default router;
