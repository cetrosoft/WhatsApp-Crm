/**
 * Countries Routes
 * Provides lookup data for countries with bilingual support
 */

import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/countries
 * Get all active countries
 * Public endpoint (no auth required for lookup data)
 */
router.get('/', async (req, res) => {
  try {
    const { data: countries, error } = await supabase
      .from('countries')
      .select('id, code, name_en, name_ar, phone_code, flag_emoji')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Get countries error:', error);
      return res.status(500).json({ error: 'Failed to fetch countries' });
    }

    res.json({ success: true, data: countries });
  } catch (error) {
    console.error('Get countries error:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

/**
 * GET /api/countries/:code
 * Get single country by ISO code
 */
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const { data: country, error } = await supabase
      .from('countries')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !country) {
      return res.status(404).json({ error: 'Country not found' });
    }

    res.json({ success: true, data: country });
  } catch (error) {
    console.error('Get country error:', error);
    res.status(500).json({ error: 'Failed to fetch country' });
  }
});

export default router;
