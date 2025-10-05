/**
 * Tag Routes
 * Shared tags system for contacts, companies, deals, etc.
 */

import express from 'express';
import supabase from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';
import { setTenantContext } from '../middleware/tenant.js';

const router = express.Router();

// Apply authentication and tenant context to all routes
router.use(authenticateToken);
router.use(setTenantContext);

/**
 * GET /api/tags
 * Get all tags for the organization
 */
router.get('/', async (req, res) => {
  try {
    const { data: tags, error } = await supabase
      .from('tags')
      .select('*')
      .eq('organization_id', req.organizationId)
      .order('name_en', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      tags: tags || []
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tags',
      error: error.message
    });
  }
});

/**
 * POST /api/tags
 * Create a new tag
 */
router.post('/', async (req, res) => {
  try {
    const { name_en, name_ar, color } = req.body;

    // Validation
    if (!name_en) {
      return res.status(400).json({
        success: false,
        message: 'Tag name (English) is required'
      });
    }

    // Check if tag already exists
    const { data: existing } = await supabase
      .from('tags')
      .select('id')
      .eq('organization_id', req.organizationId)
      .eq('name_en', name_en)
      .single();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Tag already exists'
      });
    }

    // Create tag
    const { data: tag, error } = await supabase
      .from('tags')
      .insert({
        organization_id: req.organizationId,
        name_en,
        name_ar: name_ar || name_en,
        color: color || '#6366f1',
        created_by: req.userId
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      tag
    });
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tag',
      error: error.message
    });
  }
});

/**
 * PUT /api/tags/:id
 * Update a tag
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name_en, name_ar, color } = req.body;

    const { data: tag, error } = await supabase
      .from('tags')
      .update({
        name_en,
        name_ar,
        color
      })
      .eq('id', id)
      .eq('organization_id', req.organizationId)
      .select()
      .single();

    if (error) throw error;

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    res.json({
      success: true,
      tag
    });
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tag',
      error: error.message
    });
  }
});

/**
 * DELETE /api/tags/:id
 * Delete a tag
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id)
      .eq('organization_id', req.organizationId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Tag deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tag',
      error: error.message
    });
  }
});

export default router;
