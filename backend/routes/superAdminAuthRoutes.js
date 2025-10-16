/**
 * Super Admin Authentication Routes
 * Separate authentication system for platform administrators
 *
 * Key Differences from Organization Auth:
 * - Authenticates against super_admins table (not users/Supabase auth)
 * - Returns JWT with superAdminId and type='super_admin'
 * - Shorter token expiry (1 hour vs 7 days)
 * - All actions are audit logged
 * - No organization context
 *
 * Related: docs/SUPER_ADMIN_IMPLEMENTATION_PLAN.md
 */

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';
import {
  authenticateSuperAdmin,
  logSuperAdminAction,
  getClientIp
} from '../middleware/superAdminAuth.js';

const router = express.Router();

/**
 * POST /api/super-admin/login
 * Login super admin with email and password
 *
 * Request Body:
 * - email: string
 * - password: string
 *
 * Response:
 * - token: JWT with 1-hour expiry
 * - superAdmin: { id, email, fullName, isActive }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Get super admin from database
    const { data: superAdmin, error } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !superAdmin) {
      // Generic error message (don't reveal if email exists)
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!superAdmin.is_active) {
      return res.status(403).json({
        error: 'Account deactivated',
        message: 'Your super admin account has been deactivated. Please contact support.'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, superAdmin.password_hash);

    if (!passwordMatch) {
      // Log failed login attempt
      await logSuperAdminAction(
        superAdmin.id,
        'auth.login_failed',
        'super_admin',
        superAdmin.id,
        { reason: 'invalid_password' },
        getClientIp(req),
        req.headers['user-agent']
      );

      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Update last login timestamp
    await supabase
      .from('super_admins')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', superAdmin.id);

    // Generate JWT token (1 hour expiry)
    const token = jwt.sign(
      {
        superAdminId: superAdmin.id,
        email: superAdmin.email,
        type: 'super_admin' // Critical: distinguishes from organization tokens
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Log successful login
    await logSuperAdminAction(
      superAdmin.id,
      'auth.login',
      'super_admin',
      superAdmin.id,
      {
        email: superAdmin.email,
        timestamp: new Date().toISOString()
      },
      getClientIp(req),
      req.headers['user-agent']
    );

    // Return success response
    res.json({
      message: 'Login successful',
      token,
      superAdmin: {
        id: superAdmin.id,
        email: superAdmin.email,
        fullName: superAdmin.full_name,
        isActive: superAdmin.is_active
      }
    });

  } catch (error) {
    console.error('Super admin login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to authenticate. Please try again.'
    });
  }
});

/**
 * GET /api/super-admin/me
 * Get current super admin info
 * Protected route - requires authenticateSuperAdmin middleware
 *
 * Response:
 * - superAdmin: { id, email, fullName, isActive, lastLoginAt }
 */
router.get('/me', authenticateSuperAdmin, async (req, res) => {
  try {
    const superAdminId = req.superAdmin.id;

    // Get fresh super admin data from database
    const { data: superAdmin, error } = await supabase
      .from('super_admins')
      .select('*')
      .eq('id', superAdminId)
      .single();

    if (error || !superAdmin) {
      return res.status(404).json({
        error: 'Super admin not found'
      });
    }

    // Check if still active (in case status changed)
    if (!superAdmin.is_active) {
      return res.status(403).json({
        error: 'Account deactivated',
        message: 'Your account has been deactivated'
      });
    }

    // Return super admin info
    res.json({
      superAdmin: {
        id: superAdmin.id,
        email: superAdmin.email,
        fullName: superAdmin.full_name,
        isActive: superAdmin.is_active,
        lastLoginAt: superAdmin.last_login_at,
        createdAt: superAdmin.created_at
      }
    });

  } catch (error) {
    console.error('Get super admin error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/super-admin/logout
 * Logout super admin
 * Protected route - requires authenticateSuperAdmin middleware
 *
 * Note: JWT tokens are stateless, so we can't invalidate them server-side.
 * The client should delete the token from storage.
 * This endpoint mainly serves to log the logout action for audit purposes.
 *
 * Response:
 * - message: Success message
 */
router.post('/logout', authenticateSuperAdmin, async (req, res) => {
  try {
    const superAdminId = req.superAdmin.id;

    // Log logout action
    await logSuperAdminAction(
      superAdminId,
      'auth.logout',
      'super_admin',
      superAdminId,
      {
        email: req.superAdmin.email,
        timestamp: new Date().toISOString()
      },
      getClientIp(req),
      req.headers['user-agent']
    );

    res.json({
      message: 'Logout successful',
      success: true
    });

  } catch (error) {
    console.error('Super admin logout error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/super-admin/change-password
 * Change password for authenticated super admin
 * Protected route - requires authenticateSuperAdmin middleware
 *
 * Request Body:
 * - currentPassword: string
 * - newPassword: string
 *
 * Response:
 * - message: Success message
 */
router.post('/change-password', authenticateSuperAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const superAdminId = req.superAdmin.id;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 12) {
      return res.status(400).json({
        error: 'New password must be at least 12 characters'
      });
    }

    // Get super admin with password hash
    const { data: superAdmin, error } = await supabase
      .from('super_admins')
      .select('password_hash')
      .eq('id', superAdminId)
      .single();

    if (error || !superAdmin) {
      return res.status(404).json({
        error: 'Super admin not found'
      });
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, superAdmin.password_hash);

    if (!passwordMatch) {
      // Log failed password change attempt
      await logSuperAdminAction(
        superAdminId,
        'auth.password_change_failed',
        'super_admin',
        superAdminId,
        { reason: 'invalid_current_password' },
        getClientIp(req),
        req.headers['user-agent']
      );

      return res.status(401).json({
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    const { error: updateError } = await supabase
      .from('super_admins')
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', superAdminId);

    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({
        error: 'Failed to update password'
      });
    }

    // Log successful password change
    await logSuperAdminAction(
      superAdminId,
      'auth.password_changed',
      'super_admin',
      superAdminId,
      {
        timestamp: new Date().toISOString()
      },
      getClientIp(req),
      req.headers['user-agent']
    );

    res.json({
      message: 'Password changed successfully',
      success: true
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Failed to change password'
    });
  }
});

export default router;
