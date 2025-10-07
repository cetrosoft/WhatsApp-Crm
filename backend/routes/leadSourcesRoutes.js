/**
 * Lead Sources Routes
 * Provides lookup data for lead sources with bilingual support
 * Includes CRUD operations for managing lead sources
 */

import express from 'express';
import supabase from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../constants/permissions.js';

const router = express.Router();

/**
 * GET /api/lead-sources
 * Get all active lead sources
 */
router.get('/', authenticateToken, requirePermission(PERMISSIONS.LEAD_SOURCES_VIEW), async (req, res) => {
  try {
    const { data: leadSources, error } = await supabase
      .from('lead_sources')
      .select('id, slug, name_en, name_ar, color, description_en, description_ar')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Get lead sources error:', error);
      return res.status(500).json({ error: 'Failed to fetch lead sources' });
    }

    res.json({ leadSources });
  } catch (error) {
    console.error('Get lead sources error:', error);
    res.status(500).json({ error: 'Failed to fetch lead sources' });
  }
});

/**
 * POST /api/lead-sources
 * Create new lead source (Permission: lead_sources.create)
 */
router.post('/', authenticateToken, requirePermission(PERMISSIONS.LEAD_SOURCES_CREATE), async (req, res) => {
  try {
    const { slug, name_en, name_ar, color, description_en, description_ar, display_order } = req.body;

    // Validation
    if (!slug || !name_en || !name_ar || !color) {
      return res.status(400).json({
        success: false,
        message: 'Slug, English name, Arabic name, and color are required'
      });
    }

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('lead_sources')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Lead source with this slug already exists'
      });
    }

    // Create lead source
    const { data: leadSource, error } = await supabase
      .from('lead_sources')
      .insert({
        slug,
        name_en,
        name_ar,
        color,
        description_en,
        description_ar,
        display_order: display_order || 999
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      leadSource
    });
  } catch (error) {
    console.error('Error creating lead source:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create lead source',
      error: error.message
    });
  }
});

/**
 * PUT /api/lead-sources/:id
 * Update lead source (Permission: lead_sources.edit)
 */
router.put('/:id', authenticateToken, requirePermission(PERMISSIONS.LEAD_SOURCES_EDIT), async (req, res) => {
  try {
    const { id } = req.params;
    const { name_en, name_ar, color, description_en, description_ar, display_order } = req.body;

    const { data: leadSource, error } = await supabase
      .from('lead_sources')
      .update({
        name_en,
        name_ar,
        color,
        description_en,
        description_ar,
        display_order
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!leadSource) {
      return res.status(404).json({
        success: false,
        message: 'Lead source not found'
      });
    }

    res.json({
      success: true,
      leadSource
    });
  } catch (error) {
    console.error('Error updating lead source:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lead source',
      error: error.message
    });
  }
});

/**
 * DELETE /api/lead-sources/:id
 * Soft delete lead source (Permission: lead_sources.delete)
 */
router.delete('/:id', authenticateToken, requirePermission(PERMISSIONS.LEAD_SOURCES_DELETE), async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('lead_sources')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Lead source deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lead source:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete lead source',
      error: error.message
    });
  }
});

export default router;
