/**
 * Deal Routes
 *
 * RESTful API endpoints for deals/opportunities management
 * Includes: CRUD operations, stage movement, Kanban board data
 *
 * All routes protected by auth middleware
 * Multi-tenant isolation enforced via organizationId from JWT
 */

import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * GET /api/crm/deals
 * List all deals with filtering and pagination
 * Optimized for Kanban board view
 *
 * Query params:
 * - pipeline_id: Filter by pipeline (required for Kanban)
 * - stage_id: Filter by stage
 * - status: Filter by status (open, won, lost)
 * - assigned_to: Filter by assigned user
 * - contact_id: Filter by contact
 * - company_id: Filter by company
 */
router.get('/', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const {
      pipeline_id,
      stage_id,
      status = 'open',
      assigned_to,
      contact_id,
      company_id
    } = req.query;

    // Build query
    let query = supabase
      .from('deals')
      .select(`
        *,
        contact:contacts(id, name, phone, avatar_url),
        company:companies(id, name, industry),
        pipeline:pipelines(id, name),
        stage:pipeline_stages(id, name, color, display_order),
        assigned_user:users!deals_assigned_to_fkey(id, full_name)
      `)
      .eq('organization_id', organizationId)
      .order('stage_order', { ascending: true });

    // Apply filters
    if (pipeline_id) {
      query = query.eq('pipeline_id', pipeline_id);
    }

    if (stage_id) {
      query = query.eq('stage_id', stage_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }

    if (contact_id) {
      query = query.eq('contact_id', contact_id);
    }

    if (company_id) {
      query = query.eq('company_id', company_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deals',
      error: error.message
    });
  }
});

/**
 * GET /api/crm/deals/kanban/:pipelineId
 * Get deals organized by stages for Kanban board
 */
router.get('/kanban/:pipelineId', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { pipelineId } = req.params;

    // Get pipeline with stages
    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .select(`
        *,
        stages:pipeline_stages(*)
      `)
      .eq('id', pipelineId)
      .eq('organization_id', organizationId)
      .single();

    if (pipelineError) throw pipelineError;

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        message: 'Pipeline not found'
      });
    }

    // Get all deals in this pipeline
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select(`
        *,
        contact:contacts(id, name, phone, avatar_url),
        company:companies(id, name),
        assigned_user:users!deals_assigned_to_fkey(id, full_name, avatar_url)
      `)
      .eq('pipeline_id', pipelineId)
      .eq('organization_id', organizationId)
      .eq('status', 'open')
      .order('stage_order', { ascending: true });

    if (dealsError) throw dealsError;

    // Organize deals by stage
    const stages = pipeline.stages.sort((a, b) => a.display_order - b.display_order);
    const kanbanData = stages.map(stage => ({
      ...stage,
      deals: deals.filter(deal => deal.stage_id === stage.id),
      deal_count: deals.filter(deal => deal.stage_id === stage.id).length,
      total_value: deals
        .filter(deal => deal.stage_id === stage.id)
        .reduce((sum, deal) => sum + parseFloat(deal.value || 0), 0)
    }));

    res.json({
      success: true,
      data: {
        pipeline,
        stages: kanbanData
      }
    });
  } catch (error) {
    console.error('Error fetching Kanban data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Kanban data',
      error: error.message
    });
  }
});

/**
 * GET /api/crm/deals/:id
 * Get single deal by ID with full details
 */
router.get('/:id', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        contact:contacts(id, name, phone, email, company_id),
        company:companies(id, name, industry, website),
        pipeline:pipelines(id, name),
        stage:pipeline_stages(id, name, color, probability),
        assigned_user:users!deals_assigned_to_fkey(id, full_name, email),
        created_by_user:users!deals_created_by_fkey(id, full_name)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Deal not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching deal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deal',
      error: error.message
    });
  }
});

/**
 * POST /api/crm/deals
 * Create new deal
 *
 * Body:
 * - title: string (required)
 * - pipeline_id: uuid (required)
 * - stage_id: uuid (required)
 * - value: number (required)
 * - currency: string (optional, default: 'USD')
 * - contact_id: uuid (optional)
 * - company_id: uuid (optional)
 * - probability: number (optional, auto-set from stage)
 * - expected_close_date: date (optional)
 * - tags: array (optional)
 * - notes: string (optional)
 * - assigned_to: uuid (optional)
 */
router.post('/', async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const {
      title,
      pipeline_id,
      stage_id,
      value,
      currency = 'USD',
      contact_id,
      company_id,
      probability,
      expected_close_date,
      tags = [],
      notes,
      assigned_to
    } = req.body;

    // Validation
    if (!title || !pipeline_id || !stage_id || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Title, pipeline, stage, and value are required'
      });
    }

    // Get stage to auto-set probability if not provided
    const { data: stage, error: stageError } = await supabase
      .from('pipeline_stages')
      .select('probability')
      .eq('id', stage_id)
      .single();

    if (stageError) throw stageError;

    // Get current max stage_order for this stage
    const { data: maxOrder, error: orderError } = await supabase
      .from('deals')
      .select('stage_order')
      .eq('stage_id', stage_id)
      .order('stage_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (orderError) throw orderError;

    const stage_order = (maxOrder?.stage_order || 0) + 1;

    // Create deal
    const { data, error } = await supabase
      .from('deals')
      .insert({
        organization_id: organizationId,
        created_by: userId,
        title,
        pipeline_id,
        stage_id,
        value,
        currency,
        contact_id,
        company_id,
        probability: probability !== undefined ? probability : stage.probability,
        expected_close_date,
        tags,
        notes,
        assigned_to: assigned_to || userId,
        stage_order
      })
      .select(`
        *,
        contact:contacts(id, name),
        company:companies(id, name),
        pipeline:pipelines(id, name),
        stage:pipeline_stages(id, name, color),
        assigned_user:users!deals_assigned_to_fkey(id, full_name)
      `)
      .single();

    if (error) throw error;

    // Log stage history
    await supabase
      .from('deal_stage_history')
      .insert({
        deal_id: data.id,
        from_stage_id: null,
        to_stage_id: stage_id,
        changed_by: userId,
        notes: 'Deal created'
      });

    res.status(201).json({
      success: true,
      message: 'Deal created successfully',
      data
    });
  } catch (error) {
    console.error('Error creating deal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create deal',
      error: error.message
    });
  }
});

/**
 * PUT /api/crm/deals/:id
 * Update deal
 */
router.put('/:id', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const {
      title,
      value,
      currency,
      contact_id,
      company_id,
      probability,
      expected_close_date,
      tags,
      notes,
      assigned_to
    } = req.body;

    // Check if deal exists
    const { data: existing, error: checkError } = await supabase
      .from('deals')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    // Update deal
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (value !== undefined) updateData.value = value;
    if (currency !== undefined) updateData.currency = currency;
    if (contact_id !== undefined) updateData.contact_id = contact_id;
    if (company_id !== undefined) updateData.company_id = company_id;
    if (probability !== undefined) updateData.probability = probability;
    if (expected_close_date !== undefined) updateData.expected_close_date = expected_close_date;
    if (tags !== undefined) updateData.tags = tags;
    if (notes !== undefined) updateData.notes = notes;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;

    const { data, error } = await supabase
      .from('deals')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select(`
        *,
        contact:contacts(id, name),
        company:companies(id, name),
        pipeline:pipelines(id, name),
        stage:pipeline_stages(id, name, color)
      `)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Deal updated successfully',
      data
    });
  } catch (error) {
    console.error('Error updating deal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update deal',
      error: error.message
    });
  }
});

/**
 * PATCH /api/crm/deals/:id/stage
 * Move deal to different stage
 *
 * Body:
 * - stage_id: uuid (required)
 * - stage_order: number (optional, position within stage)
 * - notes: string (optional, reason for change)
 */
router.patch('/:id/stage', async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const { id } = req.params;
    const { stage_id, stage_order, notes } = req.body;

    if (!stage_id) {
      return res.status(400).json({
        success: false,
        message: 'stage_id is required'
      });
    }

    // Get current deal
    const { data: currentDeal, error: dealError } = await supabase
      .from('deals')
      .select('stage_id, created_at')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (dealError) throw dealError;

    // Get new stage info
    const { data: newStage, error: stageError } = await supabase
      .from('pipeline_stages')
      .select('probability, is_closed_won, is_closed_lost')
      .eq('id', stage_id)
      .single();

    if (stageError) throw stageError;

    // Calculate duration in previous stage
    const now = new Date();
    const durationInPreviousStage = now - new Date(currentDeal.created_at);

    // Determine new status based on stage
    let newStatus = 'open';
    if (newStage.is_closed_won) newStatus = 'won';
    if (newStage.is_closed_lost) newStatus = 'lost';

    // Update deal
    const updateData = {
      stage_id,
      probability: newStage.probability,
      status: newStatus
    };

    if (newStatus === 'won' || newStatus === 'lost') {
      updateData.actual_close_date = new Date().toISOString().split('T')[0];
    }

    if (stage_order !== undefined) {
      updateData.stage_order = stage_order;
    } else {
      // Auto-assign to end of new stage
      const { data: maxOrder } = await supabase
        .from('deals')
        .select('stage_order')
        .eq('stage_id', stage_id)
        .order('stage_order', { ascending: false })
        .limit(1)
        .maybeSingle();

      updateData.stage_order = (maxOrder?.stage_order || 0) + 1;
    }

    const { data, error } = await supabase
      .from('deals')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select(`
        *,
        stage:pipeline_stages(id, name, color)
      `)
      .single();

    if (error) throw error;

    // Log stage history
    await supabase
      .from('deal_stage_history')
      .insert({
        deal_id: id,
        from_stage_id: currentDeal.stage_id,
        to_stage_id: stage_id,
        changed_by: userId,
        duration_in_previous_stage: `${Math.floor(durationInPreviousStage / (1000 * 60 * 60 * 24))} days`,
        notes
      });

    res.json({
      success: true,
      message: 'Deal stage updated successfully',
      data
    });
  } catch (error) {
    console.error('Error updating deal stage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update deal stage',
      error: error.message
    });
  }
});

/**
 * PATCH /api/crm/deals/:id/close-won
 * Mark deal as won
 */
router.patch('/:id/close-won', async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const { id } = req.params;
    const { notes } = req.body;

    // Get deal's pipeline to find the "Closed Won" stage
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('pipeline_id, stage_id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (dealError) throw dealError;

    // Find "Closed Won" stage in this pipeline
    const { data: wonStage, error: stageError } = await supabase
      .from('pipeline_stages')
      .select('id')
      .eq('pipeline_id', deal.pipeline_id)
      .eq('is_closed_won', true)
      .maybeSingle();

    if (stageError) throw stageError;

    if (!wonStage) {
      return res.status(400).json({
        success: false,
        message: 'No "Closed Won" stage found in this pipeline'
      });
    }

    // Update deal
    const { data, error } = await supabase
      .from('deals')
      .update({
        stage_id: wonStage.id,
        status: 'won',
        probability: 100,
        actual_close_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;

    // Log stage history
    await supabase
      .from('deal_stage_history')
      .insert({
        deal_id: id,
        from_stage_id: deal.stage_id,
        to_stage_id: wonStage.id,
        changed_by: userId,
        notes: notes || 'Deal marked as won'
      });

    res.json({
      success: true,
      message: 'Deal marked as won',
      data
    });
  } catch (error) {
    console.error('Error closing deal as won:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark deal as won',
      error: error.message
    });
  }
});

/**
 * PATCH /api/crm/deals/:id/close-lost
 * Mark deal as lost
 *
 * Body:
 * - lost_reason: string (optional)
 */
router.patch('/:id/close-lost', async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const { id } = req.params;
    const { lost_reason, notes } = req.body;

    // Get deal's pipeline to find the "Closed Lost" stage
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('pipeline_id, stage_id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (dealError) throw dealError;

    // Find "Closed Lost" stage in this pipeline
    const { data: lostStage, error: stageError } = await supabase
      .from('pipeline_stages')
      .select('id')
      .eq('pipeline_id', deal.pipeline_id)
      .eq('is_closed_lost', true)
      .maybeSingle();

    if (stageError) throw stageError;

    if (!lostStage) {
      return res.status(400).json({
        success: false,
        message: 'No "Closed Lost" stage found in this pipeline'
      });
    }

    // Update deal
    const { data, error } = await supabase
      .from('deals')
      .update({
        stage_id: lostStage.id,
        status: 'lost',
        probability: 0,
        actual_close_date: new Date().toISOString().split('T')[0],
        lost_reason
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;

    // Log stage history
    await supabase
      .from('deal_stage_history')
      .insert({
        deal_id: id,
        from_stage_id: deal.stage_id,
        to_stage_id: lostStage.id,
        changed_by: userId,
        notes: notes || `Deal marked as lost${lost_reason ? `: ${lost_reason}` : ''}`
      });

    res.json({
      success: true,
      message: 'Deal marked as lost',
      data
    });
  } catch (error) {
    console.error('Error closing deal as lost:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark deal as lost',
      error: error.message
    });
  }
});

/**
 * DELETE /api/crm/deals/:id
 * Delete deal
 */
router.delete('/:id', async (req, res) => {
  try {
    const { organizationId, role } = req.user;
    const { id } = req.params;

    // Only admin/manager can delete deals
    if (!['admin', 'manager'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and managers can delete deals'
      });
    }

    // Check if deal exists
    const { data: existing, error: checkError } = await supabase
      .from('deals')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    // Delete deal
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Deal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting deal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete deal',
      error: error.message
    });
  }
});

/**
 * GET /api/crm/deals/:id/history
 * Get stage change history for a deal
 */
router.get('/:id/history', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('deal_stage_history')
      .select(`
        *,
        from_stage:pipeline_stages!deal_stage_history_from_stage_id_fkey(id, name, color),
        to_stage:pipeline_stages!deal_stage_history_to_stage_id_fkey(id, name, color),
        changed_by_user:users(id, full_name)
      `)
      .eq('deal_id', id)
      .order('changed_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching deal history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deal history',
      error: error.message
    });
  }
});

export default router;
