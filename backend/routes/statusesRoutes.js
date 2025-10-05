/**
 * Statuses Routes
 * Provides lookup data for contact and company statuses with bilingual support
 */

import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/statuses/contacts
 * Get all active contact statuses
 */
router.get('/contacts', async (req, res) => {
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

    res.json({ statuses });
  } catch (error) {
    console.error('Get contact statuses error:', error);
    res.status(500).json({ error: 'Failed to fetch contact statuses' });
  }
});

/**
 * GET /api/statuses/companies
 * Get all active company statuses
 */
router.get('/companies', async (req, res) => {
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

    res.json({ statuses });
  } catch (error) {
    console.error('Get company statuses error:', error);
    res.status(500).json({ error: 'Failed to fetch company statuses' });
  }
});

export default router;
