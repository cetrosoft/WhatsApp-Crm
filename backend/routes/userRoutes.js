/**
 * User Management Routes
 * Handles user CRUD operations and invitations
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { setTenantContext } from '../middleware/tenant.js';
import { createInvitation, acceptInvitation, verifyInvitation } from '../services/invitationService.js';

const router = express.Router();

/**
 * GET /api/users
 * Get all users in organization
 */
router.get('/', authenticate, setTenantContext, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url, role, is_active, created_at, last_login_at')
      .eq('organization_id', req.organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({ users });
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
    const { email, role = 'member' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate role
    const validRoles = ['admin', 'manager', 'agent', 'member'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
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
      role,
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
    const { role, isActive } = req.body;

    const updates = {};
    if (role) updates.role = role;
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

export default router;
