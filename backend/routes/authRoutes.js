/**
 * Authentication Routes
 * Handles user registration, login, logout, and password management
 */

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';
import supabaseAuth from '../config/supabaseAuth.js';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new organization with admin user
 */
router.post('/register', async (req, res) => {
  try {
    const { organizationName, email, password, fullName } = req.body;

    // Validation
    if (!organizationName || !email || !password) {
      return res.status(400).json({
        error: 'Organization name, email, and password are required'
      });
    }

    // Create slug from organization name
    const slug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if organization slug already exists
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingOrg) {
      return res.status(409).json({
        error: 'Organization name already taken'
      });
    }

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for now
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user.id;

    // Get default "Free" package
    const { data: freePackage } = await supabase
      .from('packages')
      .select('id')
      .eq('slug', 'free')
      .single();

    if (!freePackage) {
      await supabase.auth.admin.deleteUser(userId);
      return res.status(500).json({ error: 'Default package not found. Please run migrations.' });
    }

    // Create organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: organizationName,
        slug,
        package_id: freePackage.id,
        subscription_status: 'trialing',
        default_language: req.body.language || 'ar',
      })
      .select()
      .single();

    if (orgError) {
      console.error('Organization creation error:', orgError);
      // Cleanup: delete auth user if org creation fails
      await supabase.auth.admin.deleteUser(userId);
      return res.status(500).json({ error: 'Failed to create organization' });
    }

    // Get admin role for this organization
    const { data: adminRole, error: roleError } = await supabase
      .from('roles')
      .select('id, slug, permissions')
      .eq('organization_id', organization.id)
      .eq('slug', 'admin')
      .eq('is_system', true)
      .single();

    if (roleError || !adminRole) {
      console.error('Admin role not found:', roleError);
      // Cleanup
      await supabase.from('organizations').delete().eq('id', organization.id);
      await supabase.auth.admin.deleteUser(userId);
      return res.status(500).json({ error: 'Failed to initialize roles. Please contact support.' });
    }

    // Create user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        organization_id: organization.id,
        email,
        full_name: fullName || null,
        role_id: adminRole.id,
        is_active: true,
      })
      .select(`
        *,
        role:roles(id, name, slug, permissions)
      `)
      .single();

    if (userError) {
      console.error('User profile creation error:', userError);
      // Cleanup
      await supabase.from('organizations').delete().eq('id', organization.id);
      await supabase.auth.admin.deleteUser(userId);
      return res.status(500).json({ error: 'Failed to create user profile' });
    }

    // Generate JWT token with role information
    const token = jwt.sign(
      {
        userId: user.id,
        organizationId: organization.id,
        role: user.role?.slug || 'admin',
        roleSlug: user.role?.slug || 'admin',
        rolePermissions: user.role?.permissions || [],
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role?.slug || 'admin',
        roleId: user.role?.id,
        roleName: user.role?.name,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 * Login existing user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Sign in with Supabase auth (using anon key client)
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userId = authData.user.id;

    // Get user profile with role information
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        organization:organizations(*),
        role:roles(id, name, slug, permissions)
      `)
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId);

    // Generate JWT token with role information
    const token = jwt.sign(
      {
        userId: user.id,
        organizationId: user.organization_id,
        role: user.role?.slug || 'member', // Legacy compatibility
        roleSlug: user.role?.slug || 'member',
        rolePermissions: user.role?.permissions || [],
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        role: user.role?.slug || 'member',
        roleId: user.role?.id,
        roleName: user.role?.name,
        rolePermissions: user.role?.permissions || [],
        permissions: user.permissions || { grant: [], revoke: [] },
        avatarUrl: user.avatar_url,
      },
      organization: user.organization,
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client should delete token)
 */
router.post('/logout', async (req, res) => {
  try {
    // Note: JWT tokens are stateless, so we can't invalidate them server-side
    // The client should delete the token from storage
    // In production, consider using a token blacklist with Redis

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/change-password
 * Change password for authenticated user (self-service)
 */
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId; // From JWT token

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    // Get user email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password using Supabase Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(400).json({ error: 'Failed to update password' });
    }

    res.json({
      message: 'Password changed successfully',
      success: true
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info (requires auth middleware)
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        organization:organizations(*),
        role:roles(id, name, slug, permissions)
      `)
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        role: user.role?.slug || 'member',
        roleId: user.role?.id,
        roleName: user.role?.name,
        rolePermissions: user.role?.permissions || [],
        permissions: user.permissions || { grant: [], revoke: [] },
        avatarUrl: user.avatar_url,
      },
      organization: user.organization,
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/request-password-reset
 * Generate and send verification code to email (Step 1 → Step 2)
 */
router.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('🔄 [PASSWORD RESET] Request received for:', email);

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const userExists = authUsers?.users?.find(u => u.email === email);

    console.log('✅ [PASSWORD RESET] Using CUSTOM verification code flow (NOT Supabase email)');

    if (!userExists) {
      // Don't reveal if email exists or not (security best practice)
      return res.json({
        message: 'If an account exists with this email, you will receive a verification code.',
      });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code in database with expiry (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: dbError } = await supabase
      .from('password_reset_codes')
      .upsert({
        email,
        code: verificationCode,
        expires_at: expiresAt,
        used: false,
      }, {
        onConflict: 'email'
      });

    if (dbError) {
      console.error('Error storing verification code:', dbError);
      return res.status(500).json({ error: 'Failed to generate verification code' });
    }

    // TODO: Send email with verification code using SMTP
    // For now, log it to console for development
    console.log(`\n========================================`);
    console.log(`Password Reset Code for ${email}: ${verificationCode}`);
    console.log(`Expires at: ${expiresAt}`);
    console.log(`========================================\n`);

    res.json({
      message: 'Verification code sent to your email.',
      // Remove this in production - only for development:
      devCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
    });

  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/verify-reset-code
 * Verify the 6-digit code (Step 3 → Step 4)
 */
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    // Get code from database
    const { data: resetCode, error: dbError } = await supabase
      .from('password_reset_codes')
      .select('*')
      .eq('email', email)
      .single();

    if (dbError || !resetCode) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    // Check if code matches
    if (resetCode.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Check if code is expired
    if (new Date(resetCode.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Check if code was already used
    if (resetCode.used) {
      return res.status(400).json({ error: 'Verification code has already been used' });
    }

    // Generate temporary token for password reset (valid for 5 minutes)
    const tempToken = jwt.sign(
      { email, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    res.json({
      message: 'Code verified successfully',
      tempToken
    });

  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with verified token (Step 5)
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { password, tempToken } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (!tempToken) {
      return res.status(401).json({ error: 'Verification token is required' });
    }

    // Verify temporary token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (decoded.purpose !== 'password-reset') {
      return res.status(401).json({ error: 'Invalid token purpose' });
    }

    const email = decoded.email;

    // Get user by email
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const user = authUsers?.users?.find(u => u.email === email);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update password using Supabase
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(400).json({ error: 'Failed to reset password' });
    }

    // Mark code as used
    await supabase
      .from('password_reset_codes')
      .update({ used: true })
      .eq('email', email);

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
