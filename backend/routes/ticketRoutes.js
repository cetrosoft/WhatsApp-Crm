/**
 * Ticket Routes
 *
 * RESTful API endpoints for ticket management system
 * Includes: CRUD operations, comments, attachments, categories, assignments
 *
 * All routes protected by auth middleware
 * Multi-tenant isolation enforced via organizationId from JWT
 * Dynamic permissions from roles table
 */

import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// =====================================================
// TICKETS CRUD
// =====================================================

/**
 * GET /api/tickets
 * List all tickets with filtering, search, and pagination
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * - search: Search in title, ticket_number, description
 * - status: Filter by status (open, in_progress, waiting, resolved, closed)
 * - priority: Filter by priority (low, medium, high, urgent)
 * - assigned_to: Filter by assigned user
 * - created_by: Filter by creator
 * - category_id: Filter by category
 * - tags: Filter by tags (comma-separated)
 * - contact_id: Filter by linked contact
 * - company_id: Filter by linked company
 * - deal_id: Filter by linked deal
 * - overdue: Filter overdue tickets (true/false)
 */
router.get('/', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const {
      page = 1,
      limit = 20,
      search,
      status,
      priority,
      assigned_to,
      created_by,
      category_id,
      tags,
      contact_id,
      company_id,
      deal_id,
      overdue
    } = req.query;

    // Build query
    let query = supabase
      .from('tickets')
      .select(`
        *,
        category:ticket_categories(id, name_en, name_ar, color, icon),
        contact:contacts(id, name, phone, email),
        company:companies(id, name),
        deal:deals(id, title, value),
        assigned_user:users!tickets_assigned_to_fkey(id, full_name, email, avatar_url),
        creator:users!tickets_created_by_fkey(id, full_name, email),
        ticket_tags(tag_id, tags(id, name_en, name_ar, color))
      `, { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,ticket_number.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (status) {
      const statuses = status.split(',');
      query = query.in('status', statuses);
    }

    if (priority) {
      const priorities = priority.split(',');
      query = query.in('priority', priorities);
    }

    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }

    if (created_by) {
      query = query.eq('created_by', created_by);
    }

    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    if (contact_id) {
      query = query.eq('contact_id', contact_id);
    }

    if (company_id) {
      query = query.eq('company_id', company_id);
    }

    if (deal_id) {
      query = query.eq('deal_id', deal_id);
    }

    if (overdue === 'true') {
      query = query.lt('due_date', new Date().toISOString()).in('status', ['open', 'in_progress', 'waiting']);
    }

    if (tags) {
      const tagIds = tags.split(',');

      const { data: ticketTagData } = await supabase
        .from('ticket_tags')
        .select('ticket_id')
        .in('tag_id', tagIds);

      if (ticketTagData && ticketTagData.length > 0) {
        const ticketIds = ticketTagData.map(tt => tt.ticket_id);
        query = query.in('id', ticketIds);
      } else {
        query = query.eq('id', '00000000-0000-0000-0000-000000000000');
      }
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
    console.error('Error fetching tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message
    });
  }
});

/**
 * GET /api/tickets/stats
 * Get ticket statistics for the organization
 */
router.get('/stats', async (req, res) => {
  try {
    const { organizationId } = req.user;

    const { data: allTickets, error } = await supabase
      .from('tickets')
      .select('status, priority')
      .eq('organization_id', organizationId);

    if (error) throw error;

    const stats = {
      total: allTickets.length,
      by_status: {
        open: allTickets.filter(t => t.status === 'open').length,
        in_progress: allTickets.filter(t => t.status === 'in_progress').length,
        waiting: allTickets.filter(t => t.status === 'waiting').length,
        resolved: allTickets.filter(t => t.status === 'resolved').length,
        closed: allTickets.filter(t => t.status === 'closed').length
      },
      by_priority: {
        low: allTickets.filter(t => t.priority === 'low').length,
        medium: allTickets.filter(t => t.priority === 'medium').length,
        high: allTickets.filter(t => t.priority === 'high').length,
        urgent: allTickets.filter(t => t.priority === 'urgent').length
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket statistics',
      error: error.message
    });
  }
});

/**
 * GET /api/tickets/my-tickets
 * Get current user's assigned tickets
 */
router.get('/my-tickets', async (req, res) => {
  try {
    const { organizationId, userId } = req.user;

    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        category:ticket_categories(id, name_en, name_ar, color, icon),
        contact:contacts(id, name, phone),
        company:companies(id, name),
        ticket_tags(tag_id, tags(id, name_en, name_ar, color))
      `)
      .eq('organization_id', organizationId)
      .eq('assigned_to', userId)
      .in('status', ['open', 'in_progress', 'waiting'])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching my tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your tickets',
      error: error.message
    });
  }
});

// =====================================================
// TICKET CATEGORIES (Must be before /:id routes)
// =====================================================

/**
 * GET /api/tickets/categories
 * Get all ticket categories for organization
 */
router.get('/categories', async (req, res) => {
  try {
    const { organizationId } = req.user;

    const { data, error } = await supabase
      .from('ticket_categories')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

/**
 * POST /api/tickets/categories
 * Create ticket category (admin only)
 */
router.post('/categories', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { name_en, name_ar, color, icon, sort_order } = req.body;

    if (!name_en || !name_ar) {
      return res.status(400).json({
        success: false,
        message: 'English and Arabic names are required'
      });
    }

    const { data, error } = await supabase
      .from('ticket_categories')
      .insert({
        organization_id: organizationId,
        name_en,
        name_ar,
        color: color || '#6366f1',
        icon: icon || 'Folder',
        sort_order: sort_order || 0
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
});

/**
 * PATCH /api/tickets/categories/:id
 * Update ticket category
 */
router.patch('/categories/:id', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const { name_en, name_ar, color, icon, sort_order, is_active } = req.body;

    const updateData = {};
    if (name_en !== undefined) updateData.name_en = name_en;
    if (name_ar !== undefined) updateData.name_ar = name_ar;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('ticket_categories')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Category updated successfully',
      data
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
});

/**
 * DELETE /api/tickets/categories/:id
 * Delete ticket category
 */
router.delete('/categories/:id', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    // Check if category is in use
    const { count } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)
      .eq('organization_id', organizationId);

    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It is used by ${count} ticket(s).`
      });
    }

    const { error } = await supabase
      .from('ticket_categories')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
});

// =====================================================
// TICKETS BY ID (Generic :id routes must come AFTER specific routes)
// =====================================================

/**
 * GET /api/tickets/:id
 * Get single ticket by ID with full details
 */
router.get('/:id', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        category:ticket_categories(id, name_en, name_ar, color, icon),
        contact:contacts(id, name, phone, email, company:companies(id, name)),
        company:companies(id, name, industry, website),
        deal:deals(id, title, value, stage:pipeline_stages(id, name)),
        assigned_user:users!tickets_assigned_to_fkey(id, full_name, email, avatar_url),
        creator:users!tickets_created_by_fkey(id, full_name, email, avatar_url),
        ticket_tags(tag_id, tags(id, name_en, name_ar, color))
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket',
      error: error.message
    });
  }
});

/**
 * POST /api/tickets
 * Create new ticket
 *
 * Body:
 * - title: string (required)
 * - description: text (optional)
 * - category_id: uuid (required)
 * - priority: enum (default: medium)
 * - status: enum (default: open)
 * - assigned_to: uuid (optional)
 * - contact_id: uuid (optional)
 * - company_id: uuid (optional)
 * - deal_id: uuid (optional)
 * - due_date: timestamp (optional)
 * - tag_ids: array (optional)
 */
router.post('/', async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const {
      title,
      description,
      category_id,
      priority = 'medium',
      status = 'open',
      assigned_to,
      contact_id,
      company_id,
      deal_id,
      due_date,
      tag_ids = []
    } = req.body;

    // Validation
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    if (!category_id) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    // Create ticket (ticket_number will be auto-generated by trigger)
    const { data, error } = await supabase
      .from('tickets')
      .insert({
        organization_id: organizationId,
        created_by: userId,
        title,
        description,
        category_id,
        priority,
        status,
        assigned_to: assigned_to || userId, // Auto-assign to creator if not specified
        contact_id,
        company_id,
        deal_id,
        due_date
      })
      .select(`
        *,
        category:ticket_categories(id, name_en, name_ar, color, icon),
        contact:contacts(id, name),
        company:companies(id, name),
        deal:deals(id, title),
        assigned_user:users!tickets_assigned_to_fkey(id, full_name, email),
        creator:users!tickets_created_by_fkey(id, full_name, email)
      `)
      .single();

    if (error) throw error;

    // Create ticket-tag relationships
    if (tag_ids && tag_ids.length > 0) {
      const tagRelations = tag_ids.map(tag_id => ({
        ticket_id: data.id,
        tag_id
      }));

      const { error: tagError } = await supabase
        .from('ticket_tags')
        .insert(tagRelations);

      if (tagError) console.error('Error creating tag relations:', tagError);
    }

    // Fetch ticket with tags
    const { data: ticketWithTags } = await supabase
      .from('tickets')
      .select(`
        *,
        category:ticket_categories(id, name_en, name_ar, color, icon),
        contact:contacts(id, name),
        company:companies(id, name),
        deal:deals(id, title),
        assigned_user:users!tickets_assigned_to_fkey(id, full_name, email),
        creator:users!tickets_created_by_fkey(id, full_name, email),
        ticket_tags(tag_id, tags(id, name_en, name_ar, color))
      `)
      .eq('id', data.id)
      .single();

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: ticketWithTags || data
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ticket',
      error: error.message
    });
  }
});

/**
 * PATCH /api/tickets/:id
 * Update ticket
 */
router.patch('/:id', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const {
      title,
      description,
      category_id,
      priority,
      status,
      assigned_to,
      contact_id,
      company_id,
      deal_id,
      due_date,
      tag_ids
    } = req.body;

    // Check if ticket exists
    const { data: existing, error: checkError } = await supabase
      .from('tickets')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Build update object
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
    if (contact_id !== undefined) updateData.contact_id = contact_id;
    if (company_id !== undefined) updateData.company_id = company_id;
    if (deal_id !== undefined) updateData.deal_id = deal_id;
    if (due_date !== undefined) updateData.due_date = due_date;

    // Update ticket
    const { data, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select(`
        *,
        category:ticket_categories(id, name_en, name_ar, color, icon),
        contact:contacts(id, name),
        company:companies(id, name),
        deal:deals(id, title),
        assigned_user:users!tickets_assigned_to_fkey(id, full_name, email),
        creator:users!tickets_created_by_fkey(id, full_name, email)
      `)
      .single();

    if (error) throw error;

    // Update ticket-tag relationships if tag_ids provided
    if (tag_ids !== undefined) {
      await supabase
        .from('ticket_tags')
        .delete()
        .eq('ticket_id', id);

      if (tag_ids.length > 0) {
        const tagRelations = tag_ids.map(tag_id => ({
          ticket_id: id,
          tag_id
        }));

        const { error: tagError } = await supabase
          .from('ticket_tags')
          .insert(tagRelations);

        if (tagError) console.error('Error updating tag relations:', tagError);
      }
    }

    // Fetch ticket with tags
    const { data: ticketWithTags } = await supabase
      .from('tickets')
      .select(`
        *,
        category:ticket_categories(id, name_en, name_ar, color, icon),
        contact:contacts(id, name),
        company:companies(id, name),
        deal:deals(id, title),
        assigned_user:users!tickets_assigned_to_fkey(id, full_name, email),
        creator:users!tickets_created_by_fkey(id, full_name, email),
        ticket_tags(tag_id, tags(id, name_en, name_ar, color))
      `)
      .eq('id', id)
      .single();

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: ticketWithTags || data
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket',
      error: error.message
    });
  }
});

/**
 * DELETE /api/tickets/:id
 * Delete ticket
 */
router.delete('/:id', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    // Check if ticket exists
    const { data: existing, error: checkError } = await supabase
      .from('tickets')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Delete ticket (CASCADE will delete related comments, attachments, tags, history)
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Ticket deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete ticket',
      error: error.message
    });
  }
});

// =====================================================
// TICKET ACTIONS
// =====================================================

/**
 * PATCH /api/tickets/:id/status
 * Change ticket status
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['open', 'in_progress', 'waiting', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (open, in_progress, waiting, resolved, closed)'
      });
    }

    const { data, error } = await supabase
      .from('tickets')
      .update({ status })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Ticket status updated successfully',
      data
    });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket status',
      error: error.message
    });
  }
});

/**
 * PATCH /api/tickets/:id/assign
 * Assign ticket to user
 */
router.patch('/:id/assign', async (req, res) => {
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

    const { data, error } = await supabase
      .from('tickets')
      .update({ assigned_to })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select(`
        *,
        assigned_user:users!tickets_assigned_to_fkey(id, full_name, email)
      `)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Ticket assigned successfully',
      data
    });
  } catch (error) {
    console.error('Error assigning ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign ticket',
      error: error.message
    });
  }
});

/**
 * PATCH /api/tickets/:id/priority
 * Change ticket priority
 */
router.patch('/:id/priority', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const { priority } = req.body;

    if (!priority || !['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Valid priority is required (low, medium, high, urgent)'
      });
    }

    const { data, error } = await supabase
      .from('tickets')
      .update({ priority })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Ticket priority updated successfully',
      data
    });
  } catch (error) {
    console.error('Error updating ticket priority:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket priority',
      error: error.message
    });
  }
});

// =====================================================
// COMMENTS
// =====================================================

/**
 * GET /api/tickets/:id/comments
 * Get all comments for a ticket
 */
router.get('/:id/comments', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    // Verify ticket exists
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (ticketError) throw ticketError;

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const { data, error } = await supabase
      .from('ticket_comments')
      .select(`
        *,
        user:users(id, full_name, email, avatar_url)
      `)
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: error.message
    });
  }
});

/**
 * POST /api/tickets/:id/comments
 * Add comment to ticket
 *
 * Body:
 * - comment: text (required)
 * - is_internal: boolean (default: false)
 */
router.post('/:id/comments', async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const { id } = req.params;
    const { comment, is_internal = false } = req.body;

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required'
      });
    }

    // Verify ticket exists
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (ticketError) throw ticketError;

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const { data, error } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id: id,
        user_id: userId,
        comment,
        is_internal
      })
      .select(`
        *,
        user:users(id, full_name, email, avatar_url)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
});

/**
 * PATCH /api/tickets/:id/comments/:commentId
 * Update comment
 */
router.patch('/:id/comments/:commentId', async (req, res) => {
  try {
    const { userId } = req.user;
    const { commentId } = req.params;
    const { comment, is_internal } = req.body;

    // Build update object
    const updateData = {};
    if (comment !== undefined) updateData.comment = comment;
    if (is_internal !== undefined) updateData.is_internal = is_internal;

    const { data, error } = await supabase
      .from('ticket_comments')
      .update(updateData)
      .eq('id', commentId)
      .eq('user_id', userId) // Only allow updating own comments
      .select(`
        *,
        user:users(id, full_name, email, avatar_url)
      `)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: error.message
    });
  }
});

/**
 * DELETE /api/tickets/:id/comments/:commentId
 * Delete comment
 */
router.delete('/:id/comments/:commentId', async (req, res) => {
  try {
    const { userId } = req.user;
    const { commentId } = req.params;

    const { error } = await supabase
      .from('ticket_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId); // Only allow deleting own comments

    if (error) throw error;

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
});

// =====================================================
// ATTACHMENTS
// =====================================================

/**
 * GET /api/tickets/:id/attachments
 * Get all attachments for a ticket
 */
router.get('/:id/attachments', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    // Verify ticket exists
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (ticketError) throw ticketError;

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const { data, error } = await supabase
      .from('ticket_attachments')
      .select(`
        *,
        uploader:users!ticket_attachments_uploaded_by_fkey(id, full_name)
      `)
      .eq('ticket_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attachments',
      error: error.message
    });
  }
});

/**
 * POST /api/tickets/:id/attachments
 * Upload attachment to ticket
 */
router.post('/:id/attachments', async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const { id } = req.params;

    // Verify ticket exists
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (ticketError) throw ticketError;

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check if file was uploaded
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    const file = req.files.file;

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Allowed: Images, PDF, Word, Excel, Text files.'
      });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${id}-${Date.now()}.${fileExt}`;
    const filePath = `${organizationId}/ticket-attachments/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('crmimage')
      .upload(filePath, file.data, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload file'
      });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('crmimage')
      .getPublicUrl(filePath);

    const fileUrl = publicUrlData.publicUrl;

    // Save attachment record
    const { data: attachment, error: insertError } = await supabase
      .from('ticket_attachments')
      .insert({
        ticket_id: id,
        file_name: file.name,
        file_url: fileUrl,
        file_size: file.size,
        file_type: file.mimetype,
        uploaded_by: userId
      })
      .select(`
        *,
        uploader:users!ticket_attachments_uploaded_by_fkey(id, full_name)
      `)
      .single();

    if (insertError) throw insertError;

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: attachment
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload attachment',
      error: error.message
    });
  }
});

/**
 * DELETE /api/tickets/:id/attachments/:attachmentId
 * Delete attachment
 */
router.delete('/:id/attachments/:attachmentId', async (req, res) => {
  try {
    const { userId } = req.user;
    const { attachmentId } = req.params;

    // Get attachment details
    const { data: attachment, error: fetchError } = await supabase
      .from('ticket_attachments')
      .select('file_url, uploaded_by')
      .eq('id', attachmentId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    // Only allow deleting own attachments
    if (attachment.uploaded_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own attachments'
      });
    }

    // Extract file path from URL
    const urlParts = attachment.file_url.split('/crmimage/');
    if (urlParts.length === 2) {
      const filePath = urlParts[1].split('?')[0]; // Remove query params

      // Delete from storage
      await supabase.storage
        .from('crmimage')
        .remove([filePath]);
    }

    // Delete attachment record
    const { error } = await supabase
      .from('ticket_attachments')
      .delete()
      .eq('id', attachmentId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attachment',
      error: error.message
    });
  }
});

// =====================================================
// TICKET HISTORY
// =====================================================

/**
 * GET /api/tickets/:id/history
 * Get ticket history (audit trail)
 */
router.get('/:id/history', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    // Verify ticket exists
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (ticketError) throw ticketError;

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const { data, error } = await supabase
      .from('ticket_history')
      .select(`
        *,
        user:users(id, full_name, email)
      `)
      .eq('ticket_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching ticket history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket history',
      error: error.message
    });
  }
});

// =====================================================
// TICKET CATEGORIES
// =====================================================

/**
 * GET /api/ticket-categories
 * Get all ticket categories for organization
 */
router.get('/categories', async (req, res) => {
  try {
    const { organizationId } = req.user;

    const { data, error } = await supabase
      .from('ticket_categories')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

/**
 * POST /api/ticket-categories
 * Create ticket category (admin only)
 */
router.post('/categories', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { name_en, name_ar, color, icon, sort_order } = req.body;

    if (!name_en || !name_ar) {
      return res.status(400).json({
        success: false,
        message: 'English and Arabic names are required'
      });
    }

    const { data, error } = await supabase
      .from('ticket_categories')
      .insert({
        organization_id: organizationId,
        name_en,
        name_ar,
        color: color || '#6366f1',
        icon: icon || 'Folder',
        sort_order: sort_order || 0
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
});

/**
 * PATCH /api/ticket-categories/:id
 * Update ticket category
 */
router.patch('/categories/:id', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const { name_en, name_ar, color, icon, sort_order, is_active } = req.body;

    const updateData = {};
    if (name_en !== undefined) updateData.name_en = name_en;
    if (name_ar !== undefined) updateData.name_ar = name_ar;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('ticket_categories')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Category updated successfully',
      data
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
});

/**
 * DELETE /api/ticket-categories/:id
 * Delete ticket category
 */
router.delete('/categories/:id', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    // Check if category is in use
    const { count } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)
      .eq('organization_id', organizationId);

    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It is used by ${count} ticket(s).`
      });
    }

    const { error } = await supabase
      .from('ticket_categories')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
});

export default router;
