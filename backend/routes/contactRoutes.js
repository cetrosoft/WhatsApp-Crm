/**
 * Contact Routes
 *
 * RESTful API endpoints for CRM contacts management
 * Includes: CRUD operations, search, filtering, tagging, assignment
 *
 * All routes protected by auth middleware
 * Multi-tenant isolation enforced via organizationId from JWT
 */

import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../constants/permissions.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * GET /api/crm/contacts
 * List all contacts with filtering, search, and pagination
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * - search: Search in name, phone, email
 * - status: Filter by status (lead, prospect, customer, inactive)
 * - tags: Filter by tags (comma-separated)
 * - assigned_to: Filter by assigned user
 * - company_id: Filter by company
 * - lead_source: Filter by lead source
 */
router.get('/', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const {
      page = 1,
      limit = 20,
      search,
      status,
      tags,
      assigned_to,
      company_id,
      lead_source
    } = req.query;

    // Build query
    let query = supabase
      .from('contacts')
      .select(`
        *,
        companies(id, name),
        country:countries(id, code, name_en, name_ar, phone_code, flag_emoji),
        status:contact_statuses(id, slug, name_en, name_ar, color),
        assigned_user:users!contacts_assigned_to_fkey(id, full_name),
        contact_tags(tag_id, tags(id, name_en, name_ar, color))
      `, { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (status) {
      // Status can be either slug or UUID
      // If it's a slug, find the status_id first
      if (status.length < 36) {
        // It's a slug (e.g., 'lead', 'prospect')
        const { data: statusData } = await supabase
          .from('contact_statuses')
          .select('id')
          .eq('slug', status)
          .single();
        if (statusData) {
          query = query.eq('status_id', statusData.id);
        }
      } else {
        // It's a UUID
        query = query.eq('status_id', status);
      }
    }

    if (tags) {
      const tagIds = tags.split(',');

      // First, get contact IDs that have ANY of the specified tags
      const { data: contactTagData } = await supabase
        .from('contact_tags')
        .select('contact_id')
        .in('tag_id', tagIds);

      if (contactTagData && contactTagData.length > 0) {
        const contactIds = contactTagData.map(ct => ct.contact_id);
        query = query.in('id', contactIds);
      } else {
        // No contacts found with these tags, return empty result
        query = query.eq('id', '00000000-0000-0000-0000-000000000000'); // No match
      }
    }

    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }

    if (company_id) {
      query = query.eq('company_id', company_id);
    }

    if (lead_source) {
      query = query.eq('lead_source', lead_source);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts',
      error: error.message
    });
  }
});

/**
 * GET /api/crm/contacts/stats
 * Get contact statistics for the organization
 */
router.get('/stats', async (req, res) => {
  try {
    const { organizationId } = req.user;

    const { data, error } = await supabase
      .rpc('get_contact_stats', { org_id: organizationId });

    if (error) throw error;

    res.json({
      success: true,
      data: data[0] || {
        total_contacts: 0,
        leads: 0,
        prospects: 0,
        customers: 0,
        inactive: 0
      }
    });
  } catch (error) {
    console.error('Error fetching contact stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact statistics',
      error: error.message
    });
  }
});

/**
 * GET /api/crm/contacts/:id
 * Get single contact by ID with full details
 */
router.get('/:id', async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        companies(id, name, industry, website),
        country:countries(id, code, name_en, name_ar, phone_code, flag_emoji),
        status:contact_statuses(id, slug, name_en, name_ar, color, description_en, description_ar),
        assigned_user:users!contacts_assigned_to_fkey(id, full_name, email),
        created_by_user:users!contacts_created_by_fkey(id, full_name)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Contact not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact',
      error: error.message
    });
  }
});

/**
 * POST /api/crm/contacts
 * Create new contact
 *
 * Body:
 * - name: string (required)
 * - phone: string (required, unique per org)
 * - phone_country_code: string (optional, default: '+966')
 * - email: string (optional)
 * - company_id: uuid (optional)
 * - position: string (optional)
 * - status_id: uuid (optional, default: 'lead' status ID)
 * - country_id: uuid (optional)
 * - lead_source: enum (optional)
 * - tags: array (optional)
 * - address, city: string (optional)
 * - notes: string (optional)
 * - assigned_to: uuid (optional)
 */
router.post('/', requirePermission(PERMISSIONS.CONTACTS_CREATE), async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const {
      name,
      phone,
      phone_country_code = '+966',
      email,
      company_id,
      position,
      status_id,
      country_id,
      lead_source,
      tag_ids = [],
      address,
      city,
      notes,
      assigned_to
    } = req.body;

    // Validation
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required'
      });
    }

    // Check subscription limit
    const { data: limits } = await supabase.rpc('get_organization_limits', {
      org_id: organizationId
    });

    const { count: contactCount } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if (contactCount >= limits.max_customers) {
      return res.status(403).json({
        success: false,
        error: 'Contact limit reached',
        message: `Your plan allows ${limits.max_customers} contacts. Please upgrade to add more.`,
        upgrade_required: true,
        current: contactCount,
        limit: limits.max_customers
      });
    }

    // Check for duplicate phone in same organization
    const { data: existing, error: checkError } = await supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('phone', phone)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A contact with this phone number already exists'
      });
    }

    // Get default status_id if not provided (lead)
    let finalStatusId = status_id;
    if (!finalStatusId) {
      const { data: defaultStatus } = await supabase
        .from('contact_statuses')
        .select('id')
        .eq('slug', 'lead')
        .single();
      finalStatusId = defaultStatus?.id;
    }

    // Create contact
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        organization_id: organizationId,
        created_by: userId,
        name,
        phone,
        phone_country_code,
        email,
        company_id,
        position,
        status_id: finalStatusId,
        country_id,
        lead_source,
        address,
        city,
        notes,
        assigned_to: assigned_to || userId // Auto-assign to creator if not specified
      })
      .select(`
        *,
        companies(id, name),
        country:countries(id, code, name_en, name_ar, phone_code, flag_emoji),
        status:contact_statuses(id, slug, name_en, name_ar, color),
        assigned_user:users!contacts_assigned_to_fkey(id, full_name)
      `)
      .single();

    if (error) throw error;

    // Create contact-tag relationships
    if (tag_ids && tag_ids.length > 0) {
      const tagRelations = tag_ids.map(tag_id => ({
        contact_id: data.id,
        tag_id
      }));

      const { error: tagError } = await supabase
        .from('contact_tags')
        .insert(tagRelations);

      if (tagError) console.error('Error creating tag relations:', tagError);
    }

    // Fetch contact with tags
    const { data: contactWithTags } = await supabase
      .from('contacts')
      .select(`
        *,
        companies(id, name),
        country:countries(id, code, name_en, name_ar, phone_code, flag_emoji),
        status:contact_statuses(id, slug, name_en, name_ar, color),
        assigned_user:users!contacts_assigned_to_fkey(id, full_name),
        contact_tags(tag_id, tags(id, name_en, name_ar, color))
      `)
      .eq('id', data.id)
      .single();

    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      data: contactWithTags || data
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create contact',
      error: error.message
    });
  }
});

/**
 * PUT /api/crm/contacts/:id
 * Update contact
 */
router.put('/:id', requirePermission(PERMISSIONS.CONTACTS_EDIT), async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const {
      name,
      phone,
      phone_country_code,
      email,
      company_id,
      position,
      status_id,
      country_id,
      lead_source,
      tag_ids,
      address,
      city,
      notes,
      assigned_to
    } = req.body;

    // Check if contact exists and belongs to organization
    const { data: existing, error: checkError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // If phone is being changed, check for duplicates
    if (phone) {
      const { data: duplicate, error: dupError } = await supabase
        .from('contacts')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('phone', phone)
        .neq('id', id)
        .maybeSingle();

      if (dupError) throw dupError;

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: 'Another contact with this phone number already exists'
        });
      }
    }

    // Update contact
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (phone_country_code !== undefined) updateData.phone_country_code = phone_country_code;
    if (email !== undefined) updateData.email = email;
    if (company_id !== undefined) updateData.company_id = company_id;
    if (position !== undefined) updateData.position = position;
    if (status_id !== undefined) updateData.status_id = status_id;
    if (country_id !== undefined) updateData.country_id = country_id;
    if (lead_source !== undefined) updateData.lead_source = lead_source;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (notes !== undefined) updateData.notes = notes;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;

    const { data, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select(`
        *,
        companies(id, name),
        country:countries(id, code, name_en, name_ar, phone_code, flag_emoji),
        status:contact_statuses(id, slug, name_en, name_ar, color),
        assigned_user:users!contacts_assigned_to_fkey(id, full_name)
      `)
      .single();

    if (error) throw error;

    // Update contact-tag relationships if tag_ids provided
    if (tag_ids !== undefined) {
      // Delete existing tag relations
      await supabase
        .from('contact_tags')
        .delete()
        .eq('contact_id', id);

      // Create new tag relations
      if (tag_ids.length > 0) {
        const tagRelations = tag_ids.map(tag_id => ({
          contact_id: id,
          tag_id
        }));

        const { error: tagError } = await supabase
          .from('contact_tags')
          .insert(tagRelations);

        if (tagError) console.error('Error updating tag relations:', tagError);
      }
    }

    // Fetch contact with tags
    const { data: contactWithTags } = await supabase
      .from('contacts')
      .select(`
        *,
        companies(id, name),
        country:countries(id, code, name_en, name_ar, phone_code, flag_emoji),
        status:contact_statuses(id, slug, name_en, name_ar, color),
        assigned_user:users!contacts_assigned_to_fkey(id, full_name),
        contact_tags(tag_id, tags(id, name_en, name_ar, color))
      `)
      .eq('id', id)
      .single();

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: contactWithTags || data
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact',
      error: error.message
    });
  }
});

/**
 * DELETE /api/crm/contacts/:id
 * Delete contact (soft delete by setting status to inactive)
 * Only admin/manager can permanently delete (Permission: contacts.delete)
 */
router.delete('/:id', requirePermission(PERMISSIONS.CONTACTS_DELETE), async (req, res) => {
  try {
    const { organizationId, role } = req.user;
    const { id } = req.params;
    const { permanent = false } = req.query;

    // Check if contact exists
    const { data: existing, error: checkError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Permanent delete (only admin/manager)
    if (permanent && ['admin', 'manager'].includes(role)) {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId);

      if (error) throw error;

      return res.json({
        success: true,
        message: 'Contact permanently deleted'
      });
    }

    // Soft delete (set to inactive)
    // Get inactive status ID
    const { data: inactiveStatus } = await supabase
      .from('contact_statuses')
      .select('id')
      .eq('slug', 'inactive')
      .single();

    const { error } = await supabase
      .from('contacts')
      .update({ status_id: inactiveStatus?.id })
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Contact marked as inactive'
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact',
      error: error.message
    });
  }
});

/**
 * PATCH /api/crm/contacts/:id/tags
 * Add or remove tags from contact
 *
 * Body:
 * - action: 'add' | 'remove'
 * - tags: array of tag strings
 */
router.patch('/:id/tags', requirePermission(PERMISSIONS.CONTACTS_EDIT), async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const { action, tags } = req.body;

    if (!action || !tags || !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        message: 'Action and tags array are required'
      });
    }

    // Get current contact
    const { data: contact, error: fetchError } = await supabase
      .from('contacts')
      .select('tags')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError) throw fetchError;

    let newTags = contact.tags || [];

    if (action === 'add') {
      // Add tags (avoid duplicates)
      newTags = [...new Set([...newTags, ...tags])];
    } else if (action === 'remove') {
      // Remove tags
      newTags = newTags.filter(tag => !tags.includes(tag));
    } else {
      return res.status(400).json({
        success: false,
        message: 'Action must be "add" or "remove"'
      });
    }

    // Update contact
    const { data, error } = await supabase
      .from('contacts')
      .update({ tags: newTags })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `Tags ${action}ed successfully`,
      data
    });
  } catch (error) {
    console.error('Error updating contact tags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact tags',
      error: error.message
    });
  }
});

/**
 * PATCH /api/crm/contacts/:id/assign
 * Assign contact to user
 *
 * Body:
 * - assigned_to: user UUID
 */
router.patch('/:id/assign', requirePermission(PERMISSIONS.CONTACTS_EDIT), async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const { assigned_to } = req.body;

    if (!assigned_to) {
      return res.status(400).json({
        success: false,
        message: 'assigned_to is required'
      });
    }

    // Verify user belongs to same organization
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', assigned_to)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (userError) throw userError;

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found in your organization'
      });
    }

    // Update contact
    const { data, error } = await supabase
      .from('contacts')
      .update({ assigned_to })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select(`
        *,
        assigned_user:users!contacts_assigned_to_fkey(id, full_name, email)
      `)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Contact assigned successfully',
      data
    });
  } catch (error) {
    console.error('Error assigning contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign contact',
      error: error.message
    });
  }
});

/**
 * GET /api/crm/contacts/:id/interactions
 * Get all interactions for a contact
 */
router.get('/:id/interactions', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('interactions')
      .select(`
        *,
        user:users!interactions_user_id_fkey(id, full_name)
      `)
      .eq('contact_id', id)
      .eq('organization_id', organizationId)
      .order('interaction_date', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching contact interactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact interactions',
      error: error.message
    });
  }
});

/**
 * GET /api/crm/contacts/:id/deals
 * Get all deals for a contact
 */
router.get('/:id/deals', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        pipeline:pipelines(id, name),
        stage:pipeline_stages(id, name, color)
      `)
      .eq('contact_id', id)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching contact deals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact deals',
      error: error.message
    });
  }
});

/**
 * POST /api/crm/contacts/:id/avatar
 * Upload contact avatar image
 */
router.post('/:id/avatar', requirePermission(PERMISSIONS.CONTACTS_EDIT), async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    // Check if contact exists
    const { data: contact, error: checkError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Check if file was uploaded
    if (!req.files || !req.files.avatar) {
      return res.status(400).json({
        success: false,
        message: 'No avatar file provided'
      });
    }

    const avatarFile = req.files.avatar;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(avatarFile.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only JPG, PNG, and WEBP are allowed.'
      });
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (avatarFile.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 2MB.'
      });
    }

    // Generate unique filename with organization folder
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${id}-${Date.now()}.${fileExt}`;
    const filePath = `${organizationId}/contact-avatars/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('crmimage')
      .upload(filePath, avatarFile.data, {
        contentType: avatarFile.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload avatar'
      });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('crmimage')
      .getPublicUrl(filePath);

    const avatarUrl = publicUrlData.publicUrl;

    // Update contact with avatar URL
    const { data: updatedContact, error: updateError } = await supabase
      .from('contacts')
      .update({ avatar_url: avatarUrl })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select('id, name, avatar_url')
      .single();

    if (updateError) {
      console.error('Update avatar URL error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update avatar URL'
      });
    }

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar_url: updatedContact.avatar_url
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload avatar',
      error: error.message
    });
  }
});

export default router;
