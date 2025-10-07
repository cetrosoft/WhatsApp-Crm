/**
 * Authentication Middleware
 * Validates JWT tokens and attaches user info to request
 */

import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';
import { hasPermission } from '../utils/permissions.js';

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    // Extract token (format: "Bearer <token>")
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({ error: 'Invalid authorization format' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      organizationId: decoded.organizationId,
      role: decoded.role, // Legacy: role slug
      roleSlug: decoded.roleSlug || decoded.role, // New: role slug from DB
      rolePermissions: decoded.rolePermissions, // New: permissions array from DB
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Check if user has required role
 * Usage: authorize(['admin', 'manager'])
 */
export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRole = req.user.roleSlug || req.user.role;

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: userRole,
      });
    }

    next();
  };
};

/**
 * Convenience middleware for common role checks
 */
export const requireAdmin = authorize(['admin']);
export const requireAdminOrManager = authorize(['admin', 'manager']);

/**
 * Enrich user with permissions from database
 * This middleware fetches the user's permissions JSONB from the database
 * and attaches it to req.user so permission checks can use it
 */
export const enrichUserPermissions = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId) {
      return next(); // Skip if no user
    }

    // Fetch user permissions from database
    const { data: user, error } = await supabase
      .from('users')
      .select('permissions')
      .eq('id', req.user.userId)
      .single();

    if (error) {
      console.error('Error fetching user permissions:', error);
      // Continue without permissions rather than failing the request
      req.user.permissions = {};
      return next();
    }

    // Attach permissions to req.user
    req.user.permissions = user?.permissions || {};
    next();
  } catch (error) {
    console.error('enrichUserPermissions error:', error);
    req.user.permissions = {};
    next();
  }
};

/**
 * Check if user has required permission
 * Usage: requirePermission('contacts.create')
 * Note: Must be used AFTER enrichUserPermissions middleware
 */
export const requirePermission = (permission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // If permissions not yet loaded, load them
    if (req.user.permissions === undefined) {
      try {
        const { data: user, error } = await supabase
          .from('users')
          .select('permissions')
          .eq('id', req.user.userId)
          .single();

        if (!error && user) {
          req.user.permissions = user.permissions || {};
        } else {
          req.user.permissions = {};
        }
      } catch (error) {
        console.error('Error loading permissions:', error);
        req.user.permissions = {};
      }
    }

    // Check permission
    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: permission,
        role: req.user.role,
      });
    }

    next();
  };
};

/**
 * Check if user has ANY of the required permissions
 * Usage: requireAnyPermission(['contacts.create', 'contacts.edit'])
 */
export const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // If permissions not yet loaded, load them
    if (req.user.permissions === undefined) {
      try {
        const { data: user, error } = await supabase
          .from('users')
          .select('permissions')
          .eq('id', req.user.userId)
          .single();

        if (!error && user) {
          req.user.permissions = user.permissions || {};
        } else {
          req.user.permissions = {};
        }
      } catch (error) {
        console.error('Error loading permissions:', error);
        req.user.permissions = {};
      }
    }

    // Check if user has at least one permission
    const hasAny = permissions.some(perm => hasPermission(req.user, perm));

    if (!hasAny) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: permissions,
        role: req.user.role,
      });
    }

    next();
  };
};

/**
 * Optional authentication - attaches user if token exists but doesn't fail
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : authHeader;

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
          userId: decoded.userId,
          organizationId: decoded.organizationId,
          role: decoded.role, // Legacy
          roleSlug: decoded.roleSlug || decoded.role, // New
          rolePermissions: decoded.rolePermissions, // New
        };
      }
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
};

// Alias for backward compatibility
export const authenticateToken = authenticate;
