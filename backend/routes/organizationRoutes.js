/**
 * Organization Management Routes
 * Handles organization profile CRUD operations
 */

import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { setTenantContext } from '../middleware/tenant.js';

const router = express.Router();

/**
 * GET /api/organization
 * Get current organization details
 */
router.get('/', authenticate, setTenantContext, async (req, res) => {
  try {
    const { data: organization, error } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        domain,
        phone,
        email,
        website,
        address,
        city,
        state,
        country,
        postal_code,
        tax_id,
        commercial_id,
        logo_url,
        subscription_status,
        trial_ends_at,
        default_language,
        settings,
        created_at,
        package:packages(
          id,
          name,
          slug,
          max_users,
          max_whatsapp_profiles,
          max_customers,
          max_messages_per_day,
          features
        )
      `)
      .eq('id', req.organizationId)
      .single();

    if (error || !organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({ organization });
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
});

/**
 * PATCH /api/organization
 * Update organization details (admin only)
 */
router.patch('/', authenticate, setTenantContext, authorize(['admin']), async (req, res) => {
  try {
    const {
      name,
      domain,
      phone,
      email,
      website,
      address,
      city,
      state,
      country,
      postal_code,
      tax_id,
      commercial_id,
      settings,
    } = req.body;

    // Build update object (only include provided fields)
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (domain !== undefined) updates.domain = domain;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (website !== undefined) updates.website = website;
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city;
    if (state !== undefined) updates.state = state;
    if (country !== undefined) updates.country = country;
    if (postal_code !== undefined) updates.postal_code = postal_code;
    if (tax_id !== undefined) updates.tax_id = tax_id;
    if (commercial_id !== undefined) updates.commercial_id = commercial_id;
    if (settings !== undefined) updates.settings = settings;

    // Validation
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Update organization
    const { data: organization, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', req.organizationId)
      .select(`
        id,
        name,
        slug,
        domain,
        phone,
        email,
        website,
        address,
        city,
        state,
        country,
        postal_code,
        tax_id,
        commercial_id,
        logo_url,
        settings
      `)
      .single();

    if (error) {
      console.error('Update organization error:', error);
      return res.status(500).json({ error: 'Failed to update organization' });
    }

    res.json({
      message: 'Organization updated successfully',
      organization,
    });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ error: 'Failed to update organization' });
  }
});

/**
 * POST /api/organization/logo
 * Upload organization logo (admin only)
 */
router.post('/logo', authenticate, setTenantContext, authorize(['admin']), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.files || !req.files.logo) {
      return res.status(400).json({ error: 'No logo file provided' });
    }

    const logoFile = req.files.logo;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(logoFile.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type. Only JPG, PNG, and WEBP are allowed.',
      });
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (logoFile.size > maxSize) {
      return res.status(400).json({
        error: 'File too large. Maximum size is 2MB.',
      });
    }

    // Generate unique filename
    const fileExt = logoFile.name.split('.').pop();
    const fileName = `organization-logo.${fileExt}`;
    const filePath = `${req.organizationId}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('crmimage')
      .upload(filePath, logoFile.data, {
        contentType: logoFile.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload logo' });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('crmimage')
      .getPublicUrl(filePath);

    const logoUrl = publicUrlData.publicUrl;

    // Update organization with logo URL
    const { data: organization, error: updateError } = await supabase
      .from('organizations')
      .update({ logo_url: logoUrl })
      .eq('id', req.organizationId)
      .select('id, name, logo_url')
      .single();

    if (updateError) {
      console.error('Update logo URL error:', updateError);
      return res.status(500).json({ error: 'Failed to update logo URL' });
    }

    res.json({
      message: 'Logo uploaded successfully',
      logo_url: organization.logo_url,
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

export default router;
