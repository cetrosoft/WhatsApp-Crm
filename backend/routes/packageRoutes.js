/**
 * Package Management Routes
 * Handles subscription packages/plans
 */

import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { setTenantContext } from '../middleware/tenant.js';

const router = express.Router();

/**
 * GET /api/packages
 * Get all active packages (public route for pricing page)
 */
router.get('/', async (req, res) => {
  try {
    const { data: packages, error } = await supabase
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({ packages });
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

/**
 * GET /api/packages/:slug
 * Get single package by slug (public)
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const { data: pkg, error } = await supabase
      .from('packages')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json({ package: pkg });
  } catch (error) {
    console.error('Get package error:', error);
    res.status(500).json({ error: 'Failed to fetch package' });
  }
});

/**
 * GET /api/packages/organization/current
 * Get current organization's package with limits
 */
router.get('/organization/current', authenticate, setTenantContext, async (req, res) => {
  try {
    // Get organization with package (single source of truth)
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select(`
        *,
        package:packages(*)
      `)
      .eq('id', req.organizationId)
      .single();

    if (orgError || !organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({
      package: organization.package,
      subscription_status: organization.subscription_status,
      trial_ends_at: organization.trial_ends_at,
    });
  } catch (error) {
    console.error('Get current package error:', error);
    res.status(500).json({ error: 'Failed to fetch current package' });
  }
});

/**
 * POST /api/packages/organization/upgrade
 * Upgrade/downgrade organization package
 */
router.post('/organization/upgrade', authenticate, setTenantContext, authorize(['admin']), async (req, res) => {
  try {
    const { package_slug } = req.body;

    if (!package_slug) {
      return res.status(400).json({ error: 'Package slug is required' });
    }

    // Get target package
    const { data: targetPackage, error: packageError } = await supabase
      .from('packages')
      .select('*')
      .eq('slug', package_slug)
      .eq('is_active', true)
      .single();

    if (packageError || !targetPackage) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Update organization
    const { data: organization, error: updateError } = await supabase
      .from('organizations')
      .update({
        package_id: targetPackage.id,
        // Keep subscription_status as is for now (billing module will handle this)
      })
      .eq('id', req.organizationId)
      .select(`
        *,
        package:packages(*)
      `)
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      message: 'Package updated successfully',
      package: organization.package,
    });
  } catch (error) {
    console.error('Upgrade package error:', error);
    res.status(500).json({ error: 'Failed to upgrade package' });
  }
});

/**
 * GET /api/packages/organization/check-feature/:feature
 * Check if organization has access to a feature
 */
router.get('/organization/check-feature/:feature', authenticate, setTenantContext, async (req, res) => {
  try {
    const { feature } = req.params;

    const { data, error } = await supabase
      .rpc('organization_has_feature', {
        org_id: req.organizationId,
        feature_name: feature,
      });

    if (error) {
      throw error;
    }

    res.json({ has_feature: data });
  } catch (error) {
    console.error('Check feature error:', error);
    res.status(500).json({ error: 'Failed to check feature access' });
  }
});

export default router;
