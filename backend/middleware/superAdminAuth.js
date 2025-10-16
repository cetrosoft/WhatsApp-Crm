/**
 * Super Admin Authentication Middleware
 * Separate authentication system for platform administrators
 *
 * Key Differences from Organization Auth:
 * - Uses super_admins table (not users table)
 * - Validates superAdminId in JWT (not userId/organizationId)
 * - Shorter token expiry (1 hour vs 7 days)
 * - All actions are audit logged
 *
 * Related: docs/SUPER_ADMIN_IMPLEMENTATION_PLAN.md
 */

import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';

/**
 * Authenticate Super Admin Middleware
 * Validates JWT token and checks super_admins table
 * Attaches req.superAdmin to request for downstream use
 */
export const authenticateSuperAdmin = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No authentication token provided',
        message: 'Please login as super admin'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expired',
          message: 'Your session has expired. Please login again.'
        });
      }
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Authentication failed'
      });
    }

    // Check if this is a super admin token (not organization token)
    if (!decoded.superAdminId || decoded.type !== 'super_admin') {
      return res.status(403).json({
        error: 'Invalid token type',
        message: 'This endpoint requires super admin authentication'
      });
    }

    // Get super admin from database
    const { data: superAdmin, error } = await supabase
      .from('super_admins')
      .select('*')
      .eq('id', decoded.superAdminId)
      .single();

    if (error || !superAdmin) {
      return res.status(403).json({
        error: 'Super admin not found',
        message: 'Authentication failed'
      });
    }

    // Check if account is active
    if (!superAdmin.is_active) {
      return res.status(403).json({
        error: 'Account deactivated',
        message: 'Your super admin account has been deactivated'
      });
    }

    // Attach super admin to request object
    req.superAdmin = {
      id: superAdmin.id,
      email: superAdmin.email,
      fullName: superAdmin.full_name,
      isActive: superAdmin.is_active
    };

    next();
  } catch (error) {
    console.error('Super admin authentication error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal server error'
    });
  }
};

/**
 * Log Super Admin Action
 * Helper function to create audit log entries
 *
 * @param {string} superAdminId - Super admin UUID
 * @param {string} action - Action performed (e.g., 'organization.suspend')
 * @param {string} resourceType - Type of resource (e.g., 'organization')
 * @param {string} resourceId - UUID of affected resource
 * @param {object} details - Additional context as JSON
 * @param {string} ipAddress - IP address of super admin
 * @param {string} userAgent - Browser user agent
 */
export const logSuperAdminAction = async (
  superAdminId,
  action,
  resourceType = null,
  resourceId = null,
  details = {},
  ipAddress = null,
  userAgent = null
) => {
  try {
    const { error } = await supabase
      .from('super_admin_audit_logs')
      .insert({
        super_admin_id: superAdminId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        ip_address: ipAddress,
        user_agent: userAgent
      });

    if (error) {
      console.error('Audit log error:', error);
      // Don't fail the request if logging fails
      // Just log the error for monitoring
    }
  } catch (error) {
    console.error('Audit log exception:', error);
    // Don't fail the request if logging fails
  }
};

/**
 * Get Client IP Address
 * Helper to extract IP address from request
 * Handles proxies and load balancers
 *
 * @param {object} req - Express request object
 * @returns {string} IP address
 */
export const getClientIp = (req) => {
  // Check for proxy headers first
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for may contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  // Check other common proxy headers
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return realIp;
  }

  // Fallback to direct connection IP
  return req.ip || req.connection?.remoteAddress || 'unknown';
};

/**
 * Middleware to Log Action (Wrapper)
 * Automatically logs action after route handler completes
 * Usage: Add as middleware after authenticateSuperAdmin
 *
 * @param {string} actionTemplate - Action name template (can use {method})
 * @param {string} resourceType - Resource type
 *
 * Example:
 * router.patch('/:id',
 *   authenticateSuperAdmin,
 *   logAction('organization.update', 'organization'),
 *   handler
 * );
 */
export const logAction = (actionTemplate, resourceType) => {
  return async (req, res, next) => {
    // Store original res.json to intercept successful responses
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      // Only log on successful responses (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Extract resource ID from params or body
        const resourceId = req.params.id || req.body?.id || null;

        // Build action name (replace {method} with HTTP method)
        const action = actionTemplate.replace('{method}', req.method.toLowerCase());

        // Log the action asynchronously (don't wait)
        logSuperAdminAction(
          req.superAdmin.id,
          action,
          resourceType,
          resourceId,
          {
            method: req.method,
            path: req.path,
            params: req.params,
            query: req.query,
            // Don't log sensitive data like passwords
            body: sanitizeBody(req.body)
          },
          getClientIp(req),
          req.headers['user-agent']
        ).catch(err => console.error('Log action error:', err));
      }

      // Call original res.json
      return originalJson(data);
    };

    next();
  };
};

/**
 * Sanitize Request Body
 * Remove sensitive fields before logging
 *
 * @param {object} body - Request body
 * @returns {object} Sanitized body
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };

  // Remove sensitive fields
  const sensitiveFields = ['password', 'password_hash', 'token', 'secret', 'api_key'];

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

export default {
  authenticateSuperAdmin,
  logSuperAdminAction,
  getClientIp,
  logAction
};
