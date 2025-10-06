/**
 * Company Routes
 *
 * RESTful API endpoints for CRM companies management
 * Includes: CRUD operations, contact linking, search, filtering
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
 * GET /api/crm/companies
 * List all companies with filtering, search, and pagination
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * - search: Search in name, industry, website
 * - status: Filter by status
 * - industry: Filter by industry
 * - company_size: Filter by size
 * - assigned_to: Filter by assigned user
 */
router.get('/', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const {
      page = 1,
      limit = 20,
      search,
      status,
      industry,
      company_size,
      assigned_to,
      tags
    } = req.query;

    // Build query
    let query = supabase
      .from('companies')
      .select('*, assigned_user:users!companies_assigned_to_fkey(id, full_name)', { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,industry.ilike.%${search}%,website.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (industry) {
      query = query.eq('industry', industry);
    }

    if (company_size) {
      query = query.eq('company_size', company_size);
    }

    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }

    if (tags) {
      const tagArray = tags.split(',');
      query = query.contains('tags', tagArray);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Get contact counts for each company
    const companyIds = data.map(c => c.id);
    const { data: contactCounts, error: countError } = await supabase
      .from('contacts')
      .select('company_id')
      .in('company_id', companyIds)
      .eq('organization_id', organizationId);

    if (countError) console.error('Error fetching contact counts:', countError);

    // Add contact count to each company
    const contactCountMap = {};
    contactCounts?.forEach(c => {
      contactCountMap[c.company_id] = (contactCountMap[c.company_id] || 0) + 1;
    });

    const companiesWithCounts = data.map(company => ({
      ...company,
      contact_count: contactCountMap[company.id] || 0
    }));

    res.json({
      success: true,
      companies: companiesWithCounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies',
      error: error.message
    });
  }
});

/**
 * GET /api/crm/companies/:id
 * Get single company by ID with full details
 */
router.get('/:id', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('companies')
      .select(`
        *,
        assigned_user:users!companies_assigned_to_fkey(id, full_name, email),
        created_by_user:users!companies_created_by_fkey(id, full_name)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }
      throw error;
    }

    // Get contact count
    const { count: contactCount } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', id)
      .eq('organization_id', organizationId);

    // Get deal count and total value
    const { data: dealData, error: dealError } = await supabase
      .from('deals')
      .select('value, status')
      .eq('company_id', id)
      .eq('organization_id', organizationId);

    if (dealError) console.error('Error fetching deal stats:', dealError);

    const dealStats = {
      total_deals: dealData?.length || 0,
      total_value: dealData?.reduce((sum, d) => sum + parseFloat(d.value || 0), 0) || 0,
      open_deals: dealData?.filter(d => d.status === 'open').length || 0,
      won_deals: dealData?.filter(d => d.status === 'won').length || 0
    };

    res.json({
      success: true,
      data: {
        ...data,
        contact_count: contactCount || 0,
        ...dealStats
      }
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company',
      error: error.message
    });
  }
});

/**
 * POST /api/crm/companies
 * Create new company
 *
 * Body:
 * - name: string (required)
 * - industry: string (optional)
 * - company_size: enum (optional)
 * - website, phone, email: string (optional)
 * - address, city, country: string (optional)
 * - status: enum (optional, default: 'active')
 * - tags: array (optional)
 * - notes: string (optional)
 * - assigned_to: uuid (optional)
 */
router.post('/', async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const {
      name,
      industry,
      company_size,
      website,
      phone,
      email,
      address,
      city,
      country,
      status = 'active',
      tags = [],
      notes,
      assigned_to
    } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }

    // Create company
    const { data, error } = await supabase
      .from('companies')
      .insert({
        organization_id: organizationId,
        created_by: userId,
        name,
        industry,
        company_size,
        website,
        phone,
        email,
        address,
        city,
        country,
        status,
        tags,
        notes,
        assigned_to: assigned_to || userId
      })
      .select(`
        *,
        assigned_user:users!companies_assigned_to_fkey(id, full_name)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data
    });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create company',
      error: error.message
    });
  }
});

/**
 * PUT /api/crm/companies/:id
 * Update company
 */
router.put('/:id', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const {
      name,
      industry,
      employee_size,
      website,
      phone,
      email,
      address,
      city,
      country_id,
      status_id,
      tags,
      notes,
      assigned_to,
      tax_id,
      commercial_id,
      legal_docs
    } = req.body;

    // Check if company exists
    const { data: existing, error: checkError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Update company
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (industry !== undefined) updateData.industry = industry;
    if (employee_size !== undefined) updateData.employee_size = employee_size;
    if (website !== undefined) updateData.website = website;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (country_id !== undefined) updateData.country_id = country_id;
    if (status_id !== undefined) updateData.status_id = status_id;
    if (tags !== undefined) updateData.tags = tags;
    if (notes !== undefined) updateData.notes = notes;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
    if (tax_id !== undefined) updateData.tax_id = tax_id;
    if (commercial_id !== undefined) updateData.commercial_id = commercial_id;
    if (legal_docs !== undefined) updateData.legal_docs = legal_docs;

    const { data, error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select(`
        *,
        assigned_user:users!companies_assigned_to_fkey(id, full_name)
      `)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Company updated successfully',
      data
    });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update company',
      error: error.message
    });
  }
});

/**
 * POST /api/crm/companies/:id/logo
 * Upload company logo
 */
router.post('/:id/logo', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    // Check if company exists
    const { data: existing, error: checkError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if file was uploaded
    if (!req.files || !req.files.logo) {
      return res.status(400).json({
        success: false,
        message: 'No logo file provided'
      });
    }

    const logoFile = req.files.logo;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(logoFile.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only images are allowed.'
      });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (logoFile.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }

    // Upload to Supabase Storage with organization folder
    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${id}-${Date.now()}.${fileExt}`;
    const filePath = `${organizationId}/company-logos/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('crmimage')
      .upload(filePath, logoFile.data, {
        contentType: logoFile.mimetype,
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('crmimage')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // Update company with logo URL
    const { data: updatedCompany, error: updateError } = await supabase
      .from('companies')
      .update({ logo_url: publicUrl })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      logo_url: publicUrl,
      data: updatedCompany
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload logo',
      error: error.message
    });
  }
});

/**
 * POST /api/crm/companies/:id/document
 * Upload legal document
 */
router.post('/:id/document', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    // Check if company exists
    const { data: existing, error: checkError } = await supabase
      .from('companies')
      .select('id, legal_docs')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if file was uploaded
    if (!req.files || !req.files.document) {
      return res.status(400).json({
        success: false,
        message: 'No document file provided'
      });
    }

    const docFile = req.files.document;

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (docFile.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }

    // Upload to Supabase Storage with organization folder
    const fileExt = docFile.name.split('.').pop();
    const fileName = `${id}-${Date.now()}.${fileExt}`;
    const filePath = `${organizationId}/company-documents/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('crmimage')
      .upload(filePath, docFile.data, {
        contentType: docFile.mimetype,
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('crmimage')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // Create document object
    const newDocument = {
      id: uploadData.path,
      name: docFile.name,
      url: publicUrl,
      uploaded_at: new Date().toISOString()
    };

    // Update company with new document
    const currentDocs = existing.legal_docs || [];
    const updatedDocs = [...currentDocs, newDocument];

    const { data: updatedCompany, error: updateError } = await supabase
      .from('companies')
      .update({ legal_docs: updatedDocs })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      document: newDocument,
      data: updatedCompany
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
});

/**
 * DELETE /api/crm/companies/:id/document/:documentId
 * Delete legal document
 */
router.delete('/:id/document/:documentId', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id, documentId } = req.params;

    // Check if company exists
    const { data: existing, error: checkError } = await supabase
      .from('companies')
      .select('id, legal_docs')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Remove document from array
    const currentDocs = existing.legal_docs || [];
    const updatedDocs = currentDocs.filter(doc => doc.id !== documentId);

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('crmimage')
      .remove([documentId]);

    if (deleteError) console.error('Error deleting file from storage:', deleteError);

    // Update company
    const { data: updatedCompany, error: updateError } = await supabase
      .from('companies')
      .update({ legal_docs: updatedDocs })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: 'Document deleted successfully',
      data: updatedCompany
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  }
});

/**
 * DELETE /api/crm/companies/:id
 * Delete company
 */
router.delete('/:id', async (req, res) => {
  try {
    const { organizationId, role } = req.user;
    const { id } = req.params;

    // Only admin/manager can delete companies
    if (!['admin', 'manager'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and managers can delete companies'
      });
    }

    // Check if company exists
    const { data: existing, error: checkError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Delete company (contacts will be unlinked via ON DELETE SET NULL)
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete company',
      error: error.message
    });
  }
});

/**
 * GET /api/crm/companies/:id/contacts
 * Get all contacts for a company
 */
router.get('/:id/contacts', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        assigned_user:users!contacts_assigned_to_fkey(id, full_name)
      `)
      .eq('company_id', id)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching company contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company contacts',
      error: error.message
    });
  }
});

/**
 * GET /api/crm/companies/:id/deals
 * Get all deals for a company
 */
router.get('/:id/deals', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        contact:contacts(id, name, phone),
        pipeline:pipelines(id, name),
        stage:pipeline_stages(id, name, color)
      `)
      .eq('company_id', id)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching company deals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company deals',
      error: error.message
    });
  }
});

export default router;
