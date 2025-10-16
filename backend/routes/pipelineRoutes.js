/**
 * Pipeline Routes
 *
 * RESTful API endpoints for CRM pipelines and stages management
 * Includes: CRUD operations, stage management, reordering
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
 * Same as in dealRoutes.js
 */
async function attachTagsToDeals(deals) {
  if (!deals || deals.length === 0) return deals;

  const dealIds = deals.map(d => d.id);
  console.log('🔍 [PIPELINE - ATTACH TAGS] Fetching tags for deals:', dealIds);

  // Get all deal_tags for these deals with tag details
  const { data: dealTagsData, error } = await supabase
    .from('deal_tags')
    .select(`
      deal_id,
      tag:tags(id, name_en, name_ar, color)
    `)
    .in('deal_id', dealIds);

  if (error) {
    console.error('❌ [PIPELINE - ATTACH TAGS] Error fetching deal tags:', error);
    return deals.map(deal => ({
      ...deal,
      tags: [],
      tag_details: []
    }));
  }

  console.log('✅ [PIPELINE - ATTACH TAGS] Fetched deal tags:', dealTagsData?.length || 0, 'records');

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

  console.log('📋 [PIPELINE - ATTACH TAGS] Tags grouped by deal:', Object.keys(tagsByDeal).length, 'deals have tags');

  // Attach tag_details to each deal
  const result = deals.map(deal => ({
    ...deal,
    tags: tagsByDeal[deal.id]?.map(t => t.id) || [],
    tag_details: tagsByDeal[deal.id] || []
  }));

  console.log('🏁 [PIPELINE - ATTACH TAGS] Final result sample:', result[0]?.tag_details);

  return result;
}

/**
 * GET /api/crm/pipelines
 * List all pipelines with stage counts
 */
router.get('/', async (req, res) => {
  try {
    const { organizationId } = req.user;

    const { data, error } = await supabase
      .from('pipelines')
      .select(`
        *,
        created_by_user:users!pipelines_created_by_fkey(id, full_name),
        stages:pipeline_stages(id, name, display_order, color)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get stage counts for each pipeline
    const pipelineIds = data.map(p => p.id);
    const { data: stageCounts, error: countError } = await supabase
      .from('pipeline_stages')
      .select('pipeline_id')
      .in('pipeline_id', pipelineIds);

    if (countError) console.error('Error fetching stage counts:', countError);

    // Get deal counts for each pipeline
    const { data: dealCounts, error: dealError } = await supabase
      .from('deals')
      .select('pipeline_id')
      .in('pipeline_id', pipelineIds)
      .eq('organization_id', organizationId);

    if (dealError) console.error('Error fetching deal counts:', dealError);

    // Create count maps
    const stageCountMap = {};
    stageCounts?.forEach(s => {
      stageCountMap[s.pipeline_id] = (stageCountMap[s.pipeline_id] || 0) + 1;
    });

    const dealCountMap = {};
    dealCounts?.forEach(d => {
      dealCountMap[d.pipeline_id] = (dealCountMap[d.pipeline_id] || 0) + 1;
    });

    // Add counts to pipelines and sort stages
    const pipelinesWithCounts = data.map(pipeline => {
      // Sort stages by display order
      if (pipeline.stages) {
        pipeline.stages.sort((a, b) => a.display_order - b.display_order);
      }

      return {
        ...pipeline,
        stage_count: stageCountMap[pipeline.id] || 0,
        deal_count: dealCountMap[pipeline.id] || 0
      };
    });

    res.json({
      success: true,
      data: pipelinesWithCounts
    });
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pipelines',
      error: error.message
    });
  }
});

/**
 * GET /api/crm/pipelines/:id
 * Get single pipeline with all stages
 */
router.get('/:id', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('pipelines')
      .select(`
        *,
        created_by_user:users!pipelines_created_by_fkey(id, full_name),
        stages:pipeline_stages(*)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Pipeline not found'
        });
      }
      throw error;
    }

    // Sort stages by display order
    if (data.stages) {
      data.stages.sort((a, b) => a.display_order - b.display_order);
    }

    // Get deal count for this pipeline
    const { count: dealCount } = await supabase
      .from('deals')
      .select('id', { count: 'exact', head: true })
      .eq('pipeline_id', id)
      .eq('organization_id', organizationId);

    res.json({
      success: true,
      data: {
        ...data,
        deal_count: dealCount || 0
      }
    });
  } catch (error) {
    console.error('Error fetching pipeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pipeline',
      error: error.message
    });
  }
});

/**
 * POST /api/crm/pipelines
 * Create new pipeline with stages
 *
 * Body:
 * - name: string (required)
 * - description: string (optional)
 * - is_default: boolean (optional)
 * - stages: array of {name, color, display_order} (optional)
 */
router.post('/', async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const { name, description, is_default = false, stages } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Pipeline name is required'
      });
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await supabase
        .from('pipelines')
        .update({ is_default: false })
        .eq('organization_id', organizationId)
        .eq('is_default', true);
    }

    // Create pipeline
    const { data, error } = await supabase
      .from('pipelines')
      .insert({
        organization_id: organizationId,
        created_by: userId,
        name,
        description,
        is_default
      })
      .select(`
        *,
        created_by_user:users!pipelines_created_by_fkey(id, full_name)
      `)
      .single();

    if (error) throw error;

    // Create stages if provided
    if (stages && Array.isArray(stages) && stages.length > 0) {
      const stageInserts = stages.map(stage => ({
        pipeline_id: data.id,
        name: stage.name,
        color: stage.color || 'blue',
        display_order: stage.display_order
      }));

      await supabase
        .from('pipeline_stages')
        .insert(stageInserts);
    }

    // Fetch pipeline with stages
    const { data: pipelineWithStages } = await supabase
      .from('pipelines')
      .select(`
        *,
        created_by_user:users!pipelines_created_by_fkey(id, full_name),
        stages:pipeline_stages(*)
      `)
      .eq('id', data.id)
      .single();

    res.status(201).json({
      success: true,
      message: 'Pipeline created successfully',
      pipeline: pipelineWithStages
    });
  } catch (error) {
    console.error('Error creating pipeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create pipeline',
      error: error.message
    });
  }
});

/**
 * PUT /api/crm/pipelines/:id
 * Update pipeline and stages
 */
router.put('/:id', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const { name, description, is_default, stages } = req.body;

    // Check if pipeline exists
    const { data: existing, error: checkError } = await supabase
      .from('pipelines')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Pipeline not found'
      });
    }

    // If setting as default, unset other defaults
    if (is_default === true) {
      await supabase
        .from('pipelines')
        .update({ is_default: false })
        .eq('organization_id', organizationId)
        .eq('is_default', true)
        .neq('id', id);
    }

    // Update pipeline
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (is_default !== undefined) updateData.is_default = is_default;

    const { data, error } = await supabase
      .from('pipelines')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select(`
        *,
        created_by_user:users!pipelines_created_by_fkey(id, full_name)
      `)
      .single();

    if (error) throw error;

    // Handle stages if provided
    if (stages && Array.isArray(stages)) {
      console.log('💾 [BACKEND] Updating stages:', stages.map(s => ({ name: s.name, display_order: s.display_order, id: s.id })));

      // Get existing stages
      const { data: existingStages } = await supabase
        .from('pipeline_stages')
        .select('id')
        .eq('pipeline_id', id);

      const existingStageIds = existingStages?.map(s => s.id) || [];
      const providedStageIds = stages.filter(s => s.id).map(s => s.id);

      // Delete stages that are no longer in the list
      const stagesToDelete = existingStageIds.filter(sid => !providedStageIds.includes(sid));
      if (stagesToDelete.length > 0) {
        console.log('🗑️ [BACKEND] Deleting stages:', stagesToDelete);
        await supabase
          .from('pipeline_stages')
          .delete()
          .in('id', stagesToDelete);
      }

      // PHASE 1: Set all stages to temporary high values to avoid unique constraint conflicts
      console.log('🔄 [BACKEND] Phase 1: Setting temporary display_order values...');
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        if (stage.id) {
          await supabase
            .from('pipeline_stages')
            .update({ display_order: 1000 + i }) // Temporary high values
            .eq('id', stage.id)
            .eq('pipeline_id', id);
        }
      }

      // PHASE 2: Update or create stages with correct values
      console.log('🔄 [BACKEND] Phase 2: Setting final values...');
      for (const stage of stages) {
        if (stage.id) {
          // Update existing stage
          console.log('✏️ [BACKEND] Updating stage:', { id: stage.id, name: stage.name, display_order: stage.display_order });
          const { data: updateData, error: updateError } = await supabase
            .from('pipeline_stages')
            .update({
              name: stage.name,
              color: stage.color,
              display_order: stage.display_order
            })
            .eq('id', stage.id)
            .eq('pipeline_id', id)
            .select();

          if (updateError) {
            console.error('❌ [BACKEND] Update error:', updateError);
          } else {
            console.log('✅ [BACKEND] Updated successfully:', updateData);
          }
        } else {
          // Create new stage
          console.log('➕ [BACKEND] Creating stage:', { name: stage.name, display_order: stage.display_order });
          const { data: insertData, error: insertError } = await supabase
            .from('pipeline_stages')
            .insert({
              pipeline_id: id,
              name: stage.name,
              color: stage.color,
              display_order: stage.display_order
            })
            .select();

          if (insertError) {
            console.error('❌ [BACKEND] Insert error:', insertError);
          } else {
            console.log('✅ [BACKEND] Inserted successfully:', insertData);
          }
        }
      }
    }

    // Fetch updated pipeline with stages
    const { data: updatedPipeline } = await supabase
      .from('pipelines')
      .select(`
        *,
        created_by_user:users!pipelines_created_by_fkey(id, full_name),
        stages:pipeline_stages(*)
      `)
      .eq('id', id)
      .single();

    // Sort stages by display_order
    if (updatedPipeline?.stages) {
      updatedPipeline.stages.sort((a, b) => a.display_order - b.display_order);
      console.log('✅ [BACKEND] Returning sorted stages:', updatedPipeline.stages.map(s => ({ name: s.name, display_order: s.display_order })));
    }

    res.json({
      success: true,
      message: 'Pipeline updated successfully',
      pipeline: updatedPipeline
    });
  } catch (error) {
    console.error('Error updating pipeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pipeline',
      error: error.message
    });
  }
});

/**
 * DELETE /api/crm/pipelines/:id
 * Delete pipeline (admin/manager only)
 * Cannot delete if pipeline has deals
 */
router.delete('/:id', async (req, res) => {
  try {
    const { organizationId, role } = req.user;
    const { id } = req.params;

    // Only admin/manager can delete pipelines
    if (!['admin', 'manager'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and managers can delete pipelines'
      });
    }

    // Check if pipeline exists
    const { data: existing, error: checkError } = await supabase
      .from('pipelines')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Pipeline not found'
      });
    }

    // Check if pipeline has deals
    const { count: dealCount } = await supabase
      .from('deals')
      .select('id', { count: 'exact', head: true })
      .eq('pipeline_id', id)
      .eq('organization_id', organizationId);

    if (dealCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete pipeline with ${dealCount} active deals. Please move or delete deals first.`
      });
    }

    // Delete pipeline (stages will cascade delete)
    const { error } = await supabase
      .from('pipelines')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Pipeline deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pipeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete pipeline',
      error: error.message
    });
  }
});

/**
 * GET /api/crm/pipelines/:id/deals
 * Get all deals for a pipeline (Kanban board data)
 */
router.get('/:id/deals', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id: pipelineId } = req.params;

    // Verify pipeline belongs to organization
    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .select('id')
      .eq('id', pipelineId)
      .eq('organization_id', organizationId)
      .single();

    if (pipelineError || !pipeline) {
      return res.status(404).json({
        success: false,
        message: 'Pipeline not found'
      });
    }

    // Get deals with related data
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select(`
        *,
        contact:contacts(id, name, phone, avatar_url),
        company:companies(id, name, logo_url),
        assigned_user:users!deals_assigned_to_fkey(id, full_name, avatar_url)
      `)
      .eq('pipeline_id', pipelineId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (dealsError) throw dealsError;

    // Attach tags to deals
    const dealsWithTags = await attachTagsToDeals(deals || []);

    res.json({
      success: true,
      data: dealsWithTags
    });
  } catch (error) {
    console.error('Error fetching pipeline deals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pipeline deals',
      error: error.message
    });
  }
});

/**
 * POST /api/crm/pipelines/:id/stages
 * Add stage to pipeline
 *
 * Body:
 * - name: string (required)
 * - color: string (optional, default: 'blue')
 * - probability: number (optional, 0-100)
 * - display_order: number (optional, auto-calculated)
 */
router.post('/:id/stages', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id: pipelineId } = req.params;
    const { name, color = 'blue', probability = 0 } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Stage name is required'
      });
    }

    // Validate probability
    if (probability < 0 || probability > 100) {
      return res.status(400).json({
        success: false,
        message: 'Probability must be between 0 and 100'
      });
    }

    // Check if pipeline exists
    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .select('id')
      .eq('id', pipelineId)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (pipelineError) throw pipelineError;

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        message: 'Pipeline not found'
      });
    }

    // Get max display_order for this pipeline
    const { data: maxOrderStage } = await supabase
      .from('pipeline_stages')
      .select('display_order')
      .eq('pipeline_id', pipelineId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const display_order = (maxOrderStage?.display_order || 0) + 1;

    // Create stage
    const { data, error } = await supabase
      .from('pipeline_stages')
      .insert({
        pipeline_id: pipelineId,
        name,
        color,
        probability,
        display_order
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Stage created successfully',
      data
    });
  } catch (error) {
    console.error('Error creating stage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create stage',
      error: error.message
    });
  }
});

/**
 * PUT /api/crm/pipelines/stages/:stageId
 * Update stage
 */
router.put('/stages/:stageId', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { stageId } = req.params;
    const { name, color, probability } = req.body;

    // Check if stage exists and belongs to organization
    const { data: existing, error: checkError } = await supabase
      .from('pipeline_stages')
      .select('id, pipeline_id')
      .eq('id', stageId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Stage not found'
        });
      }
      throw checkError;
    }

    // Verify pipeline belongs to organization
    const { data: pipeline } = await supabase
      .from('pipelines')
      .select('id')
      .eq('id', existing.pipeline_id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        message: 'Stage not found'
      });
    }

    // Validate probability if provided
    if (probability !== undefined && (probability < 0 || probability > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Probability must be between 0 and 100'
      });
    }

    // Update stage
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (probability !== undefined) updateData.probability = probability;

    const { data, error } = await supabase
      .from('pipeline_stages')
      .update(updateData)
      .eq('id', stageId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Stage updated successfully',
      data
    });
  } catch (error) {
    console.error('Error updating stage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stage',
      error: error.message
    });
  }
});

/**
 * PATCH /api/crm/pipelines/stages/:stageId/reorder
 * Reorder stage within pipeline
 *
 * Body:
 * - new_order: number (required)
 */
router.patch('/stages/:stageId/reorder', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { stageId } = req.params;
    const { new_order } = req.body;

    if (new_order === undefined || new_order < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid new_order is required (starting from 1)'
      });
    }

    // Get stage and verify ownership
    const { data: stage, error: stageError } = await supabase
      .from('pipeline_stages')
      .select('id, pipeline_id, display_order')
      .eq('id', stageId)
      .single();

    if (stageError) {
      if (stageError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Stage not found'
        });
      }
      throw stageError;
    }

    // Verify pipeline belongs to organization
    const { data: pipeline } = await supabase
      .from('pipelines')
      .select('id')
      .eq('id', stage.pipeline_id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        message: 'Stage not found'
      });
    }

    const old_order = stage.display_order;

    // If order hasn't changed, return success
    if (old_order === new_order) {
      return res.json({
        success: true,
        message: 'Stage order unchanged'
      });
    }

    // Get all stages in pipeline
    const { data: allStages, error: allStagesError } = await supabase
      .from('pipeline_stages')
      .select('id, display_order')
      .eq('pipeline_id', stage.pipeline_id)
      .order('display_order', { ascending: true });

    if (allStagesError) throw allStagesError;

    // Reorder logic
    const updates = [];

    if (new_order > old_order) {
      // Moving down: shift stages between old and new position up
      allStages.forEach(s => {
        if (s.id === stageId) {
          updates.push({ id: s.id, display_order: new_order });
        } else if (s.display_order > old_order && s.display_order <= new_order) {
          updates.push({ id: s.id, display_order: s.display_order - 1 });
        }
      });
    } else {
      // Moving up: shift stages between new and old position down
      allStages.forEach(s => {
        if (s.id === stageId) {
          updates.push({ id: s.id, display_order: new_order });
        } else if (s.display_order >= new_order && s.display_order < old_order) {
          updates.push({ id: s.id, display_order: s.display_order + 1 });
        }
      });
    }

    // Apply all updates
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('pipeline_stages')
        .update({ display_order: update.display_order })
        .eq('id', update.id);

      if (updateError) throw updateError;
    }

    res.json({
      success: true,
      message: 'Stage reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering stage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder stage',
      error: error.message
    });
  }
});

/**
 * DELETE /api/crm/pipelines/stages/:stageId
 * Delete stage (admin/manager only)
 * Cannot delete if stage has deals
 */
router.delete('/stages/:stageId', async (req, res) => {
  try {
    const { organizationId, role } = req.user;
    const { stageId } = req.params;

    // Only admin/manager can delete stages
    if (!['admin', 'manager'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and managers can delete stages'
      });
    }

    // Get stage and verify ownership
    const { data: stage, error: stageError } = await supabase
      .from('pipeline_stages')
      .select('id, pipeline_id')
      .eq('id', stageId)
      .single();

    if (stageError) {
      if (stageError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Stage not found'
        });
      }
      throw stageError;
    }

    // Verify pipeline belongs to organization
    const { data: pipeline } = await supabase
      .from('pipelines')
      .select('id')
      .eq('id', stage.pipeline_id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        message: 'Stage not found'
      });
    }

    // Check if stage has deals
    const { count: dealCount } = await supabase
      .from('deals')
      .select('id', { count: 'exact', head: true })
      .eq('stage_id', stageId)
      .eq('organization_id', organizationId);

    if (dealCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete stage with ${dealCount} active deals. Please move deals to another stage first.`
      });
    }

    // Delete stage
    const { error } = await supabase
      .from('pipeline_stages')
      .delete()
      .eq('id', stageId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Stage deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting stage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete stage',
      error: error.message
    });
  }
});

export default router;
