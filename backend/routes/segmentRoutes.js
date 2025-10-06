/**
 * Segment Routes
 *
 * RESTful API endpoints for contact segmentation
 * Dynamic filtering with automatic contact count calculation
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
 * GET /api/segments
 * List all segments for the organization
 */
router.get('/', async (req, res) => {
  try {
    const { organizationId } = req.user;

    const { data, error } = await supabase
      .from('segments')
      .select(`
        *,
        created_by_user:users!segments_created_by_fkey(id, full_name)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      segments: data
    });
  } catch (error) {
    console.error('Error fetching segments:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch segments'
    });
  }
});

/**
 * GET /api/segments/:id
 * Get single segment by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('segments')
      .select(`
        *,
        created_by_user:users!segments_created_by_fkey(id, full_name)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Segment not found'
      });
    }

    res.json({
      success: true,
      segment: data
    });
  } catch (error) {
    console.error('Error fetching segment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch segment'
    });
  }
});

/**
 * Helper function to calculate contact count with tag handling
 */
async function calculateContactCount(organizationId, filter_rules) {
  let contactCount = 0;

  try {
    let countQuery = supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    countQuery = buildSegmentQuery(countQuery, filter_rules);

    // Handle tags filtering for count
    const tagConditions = filter_rules.conditions?.filter(c => c.field === 'tags') || [];
    const hasTagCondition = tagConditions.length > 0;
    const isOROperator = filter_rules.operator === 'OR';

    if (hasTagCondition && isOROperator) {
      // OR logic with tags: need to union results
      const tagCondition = tagConditions[0];
      if (tagCondition.operator === 'contains_any' && tagCondition.value && tagCondition.value.length > 0) {
        // Get contacts matching tags
        const { data: contactTagData } = await supabase
          .from('contact_tags')
          .select('contact_id, contacts!inner(organization_id)')
          .in('tag_id', tagCondition.value)
          .eq('contacts.organization_id', organizationId);

        const tagContactIds = contactTagData ? contactTagData.map(ct => ct.contact_id) : [];

        // Get contacts matching other conditions (need data query, not count query)
        let dataQuery = supabase
          .from('contacts')
          .select('id')
          .eq('organization_id', organizationId);

        dataQuery = buildSegmentQuery(dataQuery, filter_rules);

        const { data: otherContacts } = await dataQuery;
        const otherContactIds = otherContacts ? otherContacts.map(c => c.id) : [];

        // Union (combine unique IDs)
        const allContactIds = [...new Set([...tagContactIds, ...otherContactIds])];
        contactCount = allContactIds.length;
      } else {
        const { count } = await countQuery;
        contactCount = count || 0;
      }
    } else if (hasTagCondition) {
      // AND logic with tags
      const tagCondition = tagConditions[0];
      if (tagCondition.operator === 'contains_any' && tagCondition.value && tagCondition.value.length > 0) {
        const { data: contactTagData } = await supabase
          .from('contact_tags')
          .select('contact_id, contacts!inner(organization_id)')
          .in('tag_id', tagCondition.value)
          .eq('contacts.organization_id', organizationId);

        if (contactTagData && contactTagData.length > 0) {
          const contactIds = contactTagData.map(ct => ct.contact_id);
          countQuery = countQuery.in('id', contactIds);
          const { count } = await countQuery;
          contactCount = count || 0;
        }
      }
    } else {
      // No tags
      const { count } = await countQuery;
      contactCount = count || 0;
    }
  } catch (error) {
    console.error('Error calculating contact count:', error);
  }

  return contactCount;
}

/**
 * Helper function to build dynamic query based on filter rules
 */
function buildSegmentQuery(baseQuery, filterRules) {
  if (!filterRules || !filterRules.conditions || filterRules.conditions.length === 0) {
    return baseQuery;
  }

  const { operator, conditions } = filterRules;

  // Filter out tag conditions (handled separately)
  const nonTagConditions = conditions.filter(c => c.field !== 'tags');

  if (nonTagConditions.length === 0) {
    return baseQuery;
  }

  if (operator === 'OR') {
    // Build OR filter string
    const orFilters = [];

    nonTagConditions.forEach(condition => {
      const { field, operator: condOp, value } = condition;

      switch (field) {
        case 'status_id':
          if (condOp === 'equals' && value) {
            orFilters.push(`status_id.eq.${value}`);
          } else if (condOp === 'not_equals' && value) {
            orFilters.push(`status_id.neq.${value}`);
          }
          break;

        case 'country_id':
          if (condOp === 'equals' && value) {
            orFilters.push(`country_id.eq.${value}`);
          } else if (condOp === 'not_equals' && value) {
            orFilters.push(`country_id.neq.${value}`);
          }
          break;

        case 'lead_source':
          if (condOp === 'equals' && value) {
            orFilters.push(`lead_source.eq.${value}`);
          } else if (condOp === 'not_equals' && value) {
            orFilters.push(`lead_source.neq.${value}`);
          }
          break;

        case 'assigned_to':
          if (condOp === 'equals' && value) {
            orFilters.push(`assigned_to.eq.${value}`);
          } else if (condOp === 'is_null') {
            orFilters.push(`assigned_to.is.null`);
          } else if (condOp === 'is_not_null') {
            orFilters.push(`assigned_to.not.is.null`);
          }
          break;

        case 'created_at':
          if (condOp === 'after' && value) {
            orFilters.push(`created_at.gte.${value}`);
          } else if (condOp === 'before' && value) {
            orFilters.push(`created_at.lte.${value}`);
          }
          break;

        default:
          break;
      }
    });

    if (orFilters.length > 0) {
      baseQuery = baseQuery.or(orFilters.join(','));
    }
  } else {
    // AND logic (default) - chain filters
    nonTagConditions.forEach(condition => {
      const { field, operator: condOp, value } = condition;

      switch (field) {
        case 'status_id':
          if (condOp === 'equals' && value) {
            baseQuery = baseQuery.eq('status_id', value);
          } else if (condOp === 'not_equals' && value) {
            baseQuery = baseQuery.neq('status_id', value);
          }
          break;

        case 'country_id':
          if (condOp === 'equals' && value) {
            baseQuery = baseQuery.eq('country_id', value);
          } else if (condOp === 'not_equals' && value) {
            baseQuery = baseQuery.neq('country_id', value);
          }
          break;

        case 'lead_source':
          if (condOp === 'equals' && value) {
            baseQuery = baseQuery.eq('lead_source', value);
          } else if (condOp === 'not_equals' && value) {
            baseQuery = baseQuery.neq('lead_source', value);
          }
          break;

        case 'assigned_to':
          if (condOp === 'equals' && value) {
            baseQuery = baseQuery.eq('assigned_to', value);
          } else if (condOp === 'is_null') {
            baseQuery = baseQuery.is('assigned_to', null);
          } else if (condOp === 'is_not_null') {
            baseQuery = baseQuery.not('assigned_to', 'is', null);
          }
          break;

        case 'created_at':
          if (condOp === 'after' && value) {
            baseQuery = baseQuery.gte('created_at', value);
          } else if (condOp === 'before' && value) {
            baseQuery = baseQuery.lte('created_at', value);
          } else if (condOp === 'between' && value && value.start && value.end) {
            baseQuery = baseQuery.gte('created_at', value.start).lte('created_at', value.end);
          }
          break;

        default:
          break;
      }
    });
  }

  return baseQuery;
}

/**
 * GET /api/segments/:id/contacts
 * Get contacts that match the segment's filter rules
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 */
router.get('/:id/contacts', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // First, get the segment
    const { data: segment, error: segmentError } = await supabase
      .from('segments')
      .select('filter_rules')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (segmentError) throw segmentError;

    if (!segment) {
      return res.status(404).json({
        success: false,
        error: 'Segment not found'
      });
    }

    // Build base query
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
      .eq('organization_id', organizationId);

    // Apply filter rules
    query = buildSegmentQuery(query, segment.filter_rules);

    // Handle tags filtering separately (if present in conditions)
    const tagConditions = segment.filter_rules.conditions?.filter(c => c.field === 'tags') || [];
    if (tagConditions.length > 0) {
      const tagCondition = tagConditions[0];
      if (tagCondition.operator === 'contains_any' && tagCondition.value && tagCondition.value.length > 0) {
        // Get contacts with any of these tags, filtered by organization
        const { data: contactTagData } = await supabase
          .from('contact_tags')
          .select('contact_id, contacts!inner(organization_id)')
          .in('tag_id', tagCondition.value)
          .eq('contacts.organization_id', organizationId);

        if (contactTagData && contactTagData.length > 0) {
          const contactIds = contactTagData.map(ct => ct.contact_id);
          query = query.in('id', contactIds);
        } else {
          // No contacts with these tags
          query = query.eq('id', '00000000-0000-0000-0000-000000000000');
        }
      }
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    const { data, count, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      contacts: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching segment contacts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch segment contacts'
    });
  }
});

/**
 * POST /api/segments
 * Create new segment
 */
router.post('/', async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const {
      name_en,
      name_ar,
      description_en,
      description_ar,
      filter_rules
    } = req.body;

    // Validate required fields
    if (!name_en || !name_en.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Segment name (English) is required'
      });
    }

    if (!filter_rules || !filter_rules.conditions) {
      return res.status(400).json({
        success: false,
        error: 'Filter rules are required'
      });
    }

    // Calculate initial contact count
    const contactCount = await calculateContactCount(organizationId, filter_rules);

    // Create segment
    const { data, error } = await supabase
      .from('segments')
      .insert({
        organization_id: organizationId,
        name_en: name_en.trim(),
        name_ar: name_ar?.trim() || null,
        description_en: description_en?.trim() || null,
        description_ar: description_ar?.trim() || null,
        filter_rules,
        contact_count: contactCount,
        last_calculated_at: new Date().toISOString(),
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Segment created successfully',
      segment: data
    });
  } catch (error) {
    console.error('Error creating segment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create segment'
    });
  }
});

/**
 * PUT /api/segments/:id
 * Update segment
 */
router.put('/:id', async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const { id } = req.params;
    const {
      name_en,
      name_ar,
      description_en,
      description_ar,
      filter_rules
    } = req.body;

    // Validate
    if (!name_en || !name_en.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Segment name (English) is required'
      });
    }

    // Recalculate contact count if filter_rules changed
    let contactCount = undefined;
    if (filter_rules) {
      contactCount = await calculateContactCount(organizationId, filter_rules);
    }

    // Update segment
    const updateData = {
      name_en: name_en.trim(),
      name_ar: name_ar?.trim() || null,
      description_en: description_en?.trim() || null,
      description_ar: description_ar?.trim() || null,
    };

    if (filter_rules) {
      updateData.filter_rules = filter_rules;
      updateData.contact_count = contactCount;
      updateData.last_calculated_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('segments')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Segment not found'
      });
    }

    res.json({
      success: true,
      message: 'Segment updated successfully',
      segment: data
    });
  } catch (error) {
    console.error('Error updating segment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update segment'
    });
  }
});

/**
 * DELETE /api/segments/:id
 * Delete segment
 */
router.delete('/:id', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const { error } = await supabase
      .from('segments')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Segment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting segment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete segment'
    });
  }
});

/**
 * POST /api/segments/:id/calculate
 * Recalculate segment contact count
 */
router.post('/:id/calculate', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    // Get segment
    const { data: segment, error: segmentError } = await supabase
      .from('segments')
      .select('filter_rules')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (segmentError) throw segmentError;

    if (!segment) {
      return res.status(404).json({
        success: false,
        error: 'Segment not found'
      });
    }

    // Calculate count
    const contactCount = await calculateContactCount(organizationId, segment.filter_rules);

    // Update segment
    const { data, error } = await supabase
      .from('segments')
      .update({
        contact_count: contactCount,
        last_calculated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Contact count recalculated successfully',
      segment: data
    });
  } catch (error) {
    console.error('Error calculating segment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate segment'
    });
  }
});

export default router;
