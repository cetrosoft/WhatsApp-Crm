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
 * Helper function: Fetch and attach tags to deals
 * Queries deal_tags junction table and tags lookup table
 * Attaches both tag IDs array and tag_details array to each deal
 *
 * @param {Array} deals - Array of deal objects
 * @returns {Array} Deals with tags and tag_details attached
 */
async function attachTagsToDeals(deals) {
  if (!deals || deals.length === 0) return deals;

  const dealIds = deals.map(d => d.id);
  console.log('🔍 [ATTACH TAGS] Fetching tags for deals:', dealIds);

  // Get all deal_tags for these deals with tag details
  const { data: dealTagsData, error } = await supabase
    .from('deal_tags')
    .select(`
      deal_id,
      tag:tags(id, name_en, name_ar, color)
    `)
    .in('deal_id', dealIds);

  if (error) {
    console.error('❌ [ATTACH TAGS] Error fetching deal tags:', error);
    // Return deals without tags rather than failing entirely
    return deals.map(deal => ({
      ...deal,
      tags: [],
      tag_details: []
    }));
  }

  console.log('✅ [ATTACH TAGS] Fetched deal tags:', dealTagsData?.length || 0, 'records');

  // Group tags by deal_id
  const tagsByDeal = {};
  dealTagsData?.forEach(dt => {
    if (!tagsByDeal[dt.deal_id]) {
      tagsByDeal[dt.deal_id] = [];
    }
    if (dt.tag) {
      tagsByDeal[dt.deal_id].push(dt.tag);
    }
  });

  console.log('📋 [ATTACH TAGS] Tags grouped by deal:', Object.keys(tagsByDeal).length, 'deals have tags');

  // Attach tag_details to each deal
  const result = deals.map(deal => ({
    ...deal,
    tags: tagsByDeal[deal.id]?.map(t => t.id) || [], // Array of tag IDs for compatibility
    tag_details: tagsByDeal[deal.id] || [] // Array of full tag objects
  }));

  console.log('🏁 [ATTACH TAGS] Final result sample:', result[0]?.tag_details);

  return result;
}

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

    // Attach tags to deals
    const dealsWithTags = await attachTagsToDeals(data || []);

    res.json({
      success: true,
      data: dealsWithTags
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

    // Attach tags to deals
    const dealsWithTags = await attachTagsToDeals(deals || []);

    // Organize deals by stage
    const stages = pipeline.stages.sort((a, b) => a.display_order - b.display_order);
    const kanbanData = stages.map(stage => ({
      ...stage,
      deals: dealsWithTags.filter(deal => deal.stage_id === stage.id),
      deal_count: dealsWithTags.filter(deal => deal.stage_id === stage.id).length,
      total_value: dealsWithTags
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
 * GET /api/crm/deals/stats
 * Get deal statistics for dashboard
 * MUST be before /:id route to avoid UUID parsing error
 */
router.get('/stats', async (req, res) => {
  try {
    const { organizationId } = req.user;

    // Get counts and revenue
    const { data: deals, error } = await supabase
      .from('deals')
      .select('status, value')
      .eq('organization_id', organizationId);

    if (error) throw error;

    // Calculate statistics
    const stats = {
      total_count: deals.length,
      open_count: deals.filter(d => d.status === 'open').length,
      won_count: deals.filter(d => d.status === 'won').length,
      lost_count: deals.filter(d => d.status === 'lost').length,
      total_revenue: deals
        .filter(d => d.status === 'won')
        .reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0),
      total_pipeline_value: deals
        .filter(d => d.status === 'open')
        .reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0),
      average_deal_size: 0,
      conversion_rate: 0
    };

    // Calculate average deal size
    if (stats.won_count > 0) {
      stats.average_deal_size = stats.total_revenue / stats.won_count;
    }

    // Calculate conversion rate
    const closedCount = stats.won_count + stats.lost_count;
    if (closedCount > 0) {
      stats.conversion_rate = (stats.won_count / closedCount) * 100;
    }

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching deal stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deal statistics',
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

    // Attach tags to deal
    const [dealWithTags] = await attachTagsToDeals([data]);

    res.json({
      success: true,
      data: dealWithTags
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

    // Create deal (without tags - they'll be added via junction table)
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

    // Insert tags into junction table
    if (tags && tags.length > 0) {
      console.log('📌 [CREATE DEAL] Inserting tags:', tags);
      const dealTagsData = tags.map(tagId => ({
        deal_id: data.id,
        tag_id: tagId
      }));

      console.log('📌 [CREATE DEAL] Deal tags data:', dealTagsData);

      const { error: tagsError } = await supabase
        .from('deal_tags')
        .insert(dealTagsData);

      if (tagsError) {
        console.error('❌ [CREATE DEAL] Error inserting deal tags:', tagsError);
        // Don't fail the whole request if tags fail - just log it
      } else {
        console.log('✅ [CREATE DEAL] Tags inserted successfully');
      }
    } else {
      console.log('⚠️ [CREATE DEAL] No tags to insert');
    }

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

    // Attach tags to response
    const [dealWithTags] = await attachTagsToDeals([data]);

    res.status(201).json({
      success: true,
      message: 'Deal created successfully',
      data: dealWithTags
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
      pipeline_id,
      stage_id,
      contact_id,
      company_id,
      probability,
      expected_close_date,
      tags,
      notes,
      assigned_to,
      stage_order
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

    // Update deal (excluding tags - they'll be handled via junction table)
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (value !== undefined) updateData.value = value;
    if (currency !== undefined) updateData.currency = currency;
    if (pipeline_id !== undefined) updateData.pipeline_id = pipeline_id;
    if (stage_id !== undefined) updateData.stage_id = stage_id;
    if (contact_id !== undefined) updateData.contact_id = contact_id;
    if (company_id !== undefined) updateData.company_id = company_id;
    if (probability !== undefined) updateData.probability = probability;
    if (expected_close_date !== undefined) updateData.expected_close_date = expected_close_date;
    if (notes !== undefined) updateData.notes = notes;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
    if (stage_order !== undefined) updateData.stage_order = stage_order;

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

    // Handle tags update via junction table
    if (tags !== undefined) {
      console.log('📌 [UPDATE DEAL] Updating tags for deal:', id);
      console.log('📌 [UPDATE DEAL] New tags:', tags);

      // Delete existing tags
      const { error: deleteError } = await supabase
        .from('deal_tags')
        .delete()
        .eq('deal_id', id);

      if (deleteError) {
        console.error('❌ [UPDATE DEAL] Error deleting old deal tags:', deleteError);
      } else {
        console.log('✅ [UPDATE DEAL] Old tags deleted');
      }

      // Insert new tags
      if (tags && tags.length > 0) {
        const dealTagsData = tags.map(tagId => ({
          deal_id: id,
          tag_id: tagId
        }));

        console.log('📌 [UPDATE DEAL] Inserting tags data:', dealTagsData);

        const { error: insertError } = await supabase
          .from('deal_tags')
          .insert(dealTagsData);

        if (insertError) {
          console.error('❌ [UPDATE DEAL] Error inserting new deal tags:', insertError);
        } else {
          console.log('✅ [UPDATE DEAL] New tags inserted successfully');
        }
      } else {
        console.log('⚠️ [UPDATE DEAL] No new tags to insert');
      }
    }

    // Attach tags to response
    const [dealWithTags] = await attachTagsToDeals([data]);

    res.json({
      success: true,
      message: 'Deal updated successfully',
      data: dealWithTags
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
