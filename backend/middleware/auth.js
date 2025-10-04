/**
 * Authentication Middleware
 * Validates JWT tokens and attaches user info to request
 */

import jwt from 'jsonwebtoken';

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
      role: decoded.role,
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

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role,
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
          role: decoded.role,
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
