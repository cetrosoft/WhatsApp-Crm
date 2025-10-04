/**
 * Tenant Middleware
 * Sets organization context for multi-tenant data isolation
 * Works with Supabase RLS policies
 */

import supabase from '../config/supabase.js';

/**
 * Set organization context for the request
 * This is used by Supabase RLS policies to filter data
 *
 * IMPORTANT: This middleware must be used AFTER authentication middleware
 */
export const setTenantContext = async (req, res, next) => {
  try {
    if (!req.user || !req.user.organizationId) {
      return res.status(401).json({ error: 'Organization context not found' });
    }

    // Set organization context for this request
    // This will be used by RLS policies in Supabase
    req.organizationId = req.user.organizationId;

    // Note: With Supabase service role, we bypass RLS
    // So we need to manually filter by organization_id in our queries
    // Example: .eq('organization_id', req.organizationId)

    next();
  } catch (error) {
    console.error('Tenant context error:', error);
    res.status(500).json({ error: 'Failed to set tenant context' });
  }
};

/**
 * Verify the requested resource belongs to the user's organization
 * Usage in routes:
 *
 * const { data } = await supabase
 *   .from('conversations')
 *   .select('*')
 *   .eq('id', conversationId)
 *   .eq('organization_id', req.organizationId)  // Enforce tenant isolation
 *   .single();
 */
export const verifyTenantOwnership = (resource, organizationIdField = 'organization_id') => {
  return (req, res, next) => {
    if (!resource || resource[organizationIdField] !== req.organizationId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'This resource belongs to another organization'
      });
    }
    next();
  };
};

/**
 * Helper function to add organization filter to Supabase queries
 * This ensures all queries are scoped to the current organization
 */
export const addOrgFilter = (query, req) => {
  return query.eq('organization_id', req.organizationId);
};
