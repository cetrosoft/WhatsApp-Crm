/**
 * Statuses Routes
 * Provides lookup data for contact and company statuses with bilingual support
 * Includes CRUD operations for managing statuses
 */

import express from 'express';
import supabase from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../constants/permissions.js';

const router = express.Router();

/**
 * GET /api/statuses/contacts
 * Get all active contact statuses
 * No specific permission required - all authenticated users can view lookup data
 */
router.get('/contacts', authenticateToken, async (req, res) => {
  try {
    const { data: statuses, error } = await supabase
      .from('contact_statuses')
      .select('id, slug, name_en, name_ar, color, description_en, description_ar')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Get contact statuses error:', error);
      return res.status(500).json({ error: 'Failed to fetch contact statuses' });
    }

    res.json({ success: true, data: statuses });
  } catch (error) {
    console.error('Get contact statuses error:', error);
    res.status(500).json({ error: 'Failed to fetch contact statuses' });
  }
});

/**
 * GET /api/statuses/companies
 * Get all active company statuses
 * No specific permission required - all authenticated users can view lookup data
 */
router.get('/companies', authenticateToken, async (req, res) => {
  try {
    const { data: statuses, error } = await supabase
      .from('company_statuses')
      .select('id, slug, name_en, name_ar, color, description_en, description_ar')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Get company statuses error:', error);
      return res.status(500).json({ error: 'Failed to fetch company statuses' });
    }

    res.json({ success: true, data: statuses });
  } catch (error) {
    console.error('Get company statuses error:', error);
    res.status(500).json({ error: 'Failed to fetch company statuses' });
  }
});

/**
 * POST /api/statuses/contacts
 * Create new contact status (Permission: statuses.create)
 */
router.post('/contacts', authenticateToken, requirePermission(PERMISSIONS.STATUSES_CREATE), async (req, res) => {
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
      .from('contact_statuses')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Status with this slug already exists'
      });
    }

    // Create status
    const { data: status, error } = await supabase
      .from('contact_statuses')
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
      status
    });
  } catch (error) {
    console.error('Error creating contact status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create contact status',
      error: error.message
    });
  }
});

/**
 * PUT /api/statuses/contacts/:id
 * Update contact status (Permission: statuses.edit)
 */
router.put('/contacts/:id', authenticateToken, requirePermission(PERMISSIONS.STATUSES_EDIT), async (req, res) => {
  try {
    const { id } = req.params;
    const { name_en, name_ar, color, description_en, description_ar, display_order } = req.body;

    const { data: status, error } = await supabase
      .from('contact_statuses')
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

    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'Status not found'
      });
    }

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact status',
      error: error.message
    });
  }
});

/**
 * DELETE /api/statuses/contacts/:id
 * Soft delete contact status (Permission: statuses.delete)
 */
router.delete('/contacts/:id', authenticateToken, requirePermission(PERMISSIONS.STATUSES_DELETE), async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('contact_statuses')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Contact status deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contact status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact status',
      error: error.message
    });
  }
});

export default router;
