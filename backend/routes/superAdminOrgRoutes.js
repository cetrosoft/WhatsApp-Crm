/**
 * Super Admin Organization Management Routes
 * Platform-level CRUD operations for organizations
 *
 * Features:
 * - List all organizations with pagination, search, and filters
 * - View organization details with subscription info
 * - Create new organizations
 * - Update organization details
 * - Suspend/activate organizations
 * - Change organization packages
 * - Delete organizations (soft delete)
 *
 * All actions are audit logged with super admin context
 *
 * Related: docs/SUPER_ADMIN_IMPLEMENTATION_PLAN.md
 */

import express from 'express';
import supabase from '../config/supabase.js';
import bcrypt from 'bcrypt';
import {
  authenticateSuperAdmin,
  logSuperAdminAction,
  getClientIp
} from '../middleware/superAdminAuth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateSuperAdmin);

/**
 * GET /api/super-admin/organizations
 * List all organizations with pagination, search, and filters
 *
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - search: string (search in name, slug, email)
 * - status: string (active, suspended, cancelled)
 * - package: string (package slug filter)
 * - sortBy: string (created_at, name, users_count)
 * - sortOrder: string (asc, desc)
 *
 * Response:
 * - organizations: array of organization objects
 * - pagination: { page, limit, total, totalPages }
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      package: packageFilter = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    // Parse and validate pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Build base query
    let query = supabase
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        created_at,
        updated_at,
        subscription_status,
        package:packages(id, name, slug),
        subscription:subscriptions(
          id,
          status,
          current_period_end,
          trial_ends_at,
          billing_cycle
        ),
        users:users(count)
      `, { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    // Apply status filter
    if (status) {
      query = query.eq('subscription_status', status);
    }

    // Apply package filter (if provided)
    // Note: This requires joining, handled in separate query below

    // Apply sorting
    const validSortFields = ['created_at', 'name', 'updated_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder === 'asc';

    query = query.order(sortField, { ascending: sortDirection });

    // Apply pagination
    query = query.range(offset, offset + limitNum - 1);

    // Execute query
    const { data: organizations, error, count } = await query;

    if (error) {
      console.error('Error fetching organizations:', error);
      return res.status(500).json({
        error: 'Failed to fetch organizations'
      });
    }

    // Calculate user counts (aggregate from users array)
    const enrichedOrgs = organizations.map(org => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      createdAt: org.created_at,
      updatedAt: org.updated_at,
      subscriptionStatus: org.subscription_status,
      package: org.package,
      subscription: org.subscription?.[0] || null,
      usersCount: org.users?.[0]?.count || 0
    }));

    // Calculate pagination
    const totalPages = Math.ceil(count / limitNum);

    res.json({
      organizations: enrichedOrgs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages
      }
    });

  } catch (error) {
    console.error('List organizations error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/super-admin/organizations/:id
 * Get single organization details with full subscription info
 *
 * Response:
 * - organization: Full organization object with relations
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get organization with all related data
    const { data: organization, error } = await supabase
      .from('organizations')
      .select(`
        *,
        package:packages(*),
        subscription:subscriptions(
          id,
          status,
          billing_cycle,
          current_period_start,
          current_period_end,
          trial_ends_at,
          created_at
        ),
        users:users(
          id,
          email,
          full_name,
          is_active,
          created_at,
          last_login_at,
          role:roles(name, slug)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !organization) {
      return res.status(404).json({
        error: 'Organization not found'
      });
    }

    // Log view action
    await logSuperAdminAction(
      req.superAdmin.id,
      'organization.view',
      'organization',
      id,
      {
        organizationName: organization.name
      },
      getClientIp(req),
      req.headers['user-agent']
    );

    res.json({
      organization: {
        ...organization,
        subscription: organization.subscription?.[0] || null
      }
    });

  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/super-admin/organizations
 * Create new organization (with admin user)
 *
 * Request Body:
 * - name: string (required)
 * - slug: string (optional, auto-generated if not provided)
 * - packageId: UUID (required)
 * - adminEmail: string (required)
 * - adminPassword: string (required)
 * - adminFullName: string (optional)
 * - subscriptionStatus: string (default: 'trialing')
 *
 * Response:
 * - organization: Created organization object
 * - adminUser: Created admin user object
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      slug: providedSlug,
      packageId,
      adminEmail,
      adminPassword,
      adminFullName,
      subscriptionStatus = 'trialing'
    } = req.body;

    // Validation
    if (!name || !packageId || !adminEmail || !adminPassword) {
      return res.status(400).json({
        error: 'Organization name, package, admin email, and password are required'
      });
    }

    // Generate slug if not provided
    const slug = providedSlug || name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug already exists
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingOrg) {
      return res.status(409).json({
        error: 'Organization slug already exists'
      });
    }

    // Verify package exists
    const { data: packageData, error: packageError } = await supabase
      .from('packages')
      .select('id, name, slug')
      .eq('id', packageId)
      .single();

    if (packageError || !packageData) {
      return res.status(404).json({
        error: 'Package not found'
      });
    }

    // Create Supabase auth user for admin
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      return res.status(400).json({
        error: authError.message
      });
    }

    const userId = authData.user.id;

    // Create organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
        slug,
        package_id: packageId,
        subscription_status: subscriptionStatus,
        default_language: 'en'
      })
      .select()
      .single();

    if (orgError) {
      console.error('Organization creation error:', orgError);
      // Cleanup: delete auth user
      await supabase.auth.admin.deleteUser(userId);
      return res.status(500).json({
        error: 'Failed to create organization'
      });
    }

    // Get admin role for this organization
    const { data: adminRole } = await supabase
      .from('roles')
      .select('id')
      .eq('organization_id', organization.id)
      .eq('slug', 'admin')
      .eq('is_system', true)
      .single();

    if (!adminRole) {
      // Cleanup
      await supabase.from('organizations').delete().eq('id', organization.id);
      await supabase.auth.admin.deleteUser(userId);
      return res.status(500).json({
        error: 'Failed to initialize roles'
      });
    }

    // Create admin user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        organization_id: organization.id,
        email: adminEmail,
        full_name: adminFullName || null,
        role_id: adminRole.id,
        is_active: true
      })
      .select()
      .single();

    if (userError) {
      console.error('User profile creation error:', userError);
      // Cleanup
      await supabase.from('organizations').delete().eq('id', organization.id);
      await supabase.auth.admin.deleteUser(userId);
      return res.status(500).json({
        error: 'Failed to create admin user'
      });
    }

    // Create subscription record
    const { error: subError } = await supabase
      .from('subscriptions')
      .insert({
        organization_id: organization.id,
        package_id: packageId,
        status: subscriptionStatus,
        trial_ends_at: subscriptionStatus === 'trialing'
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : null,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

    if (subError) {
      console.error('Subscription creation error:', subError);
      // Not critical, log but continue
    }

    // Log creation action
    await logSuperAdminAction(
      req.superAdmin.id,
      'organization.create',
      'organization',
      organization.id,
      {
        organizationName: name,
        organizationSlug: slug,
        packageName: packageData.name,
        adminEmail
      },
      getClientIp(req),
      req.headers['user-agent']
    );

    res.status(201).json({
      message: 'Organization created successfully',
      organization,
      adminUser: {
        id: user.id,
        email: user.email,
        fullName: user.full_name
      }
    });

  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * PATCH /api/super-admin/organizations/:id
 * Update organization details
 *
 * Request Body:
 * - name: string
 * - slug: string
 * - defaultLanguage: string
 *
 * Response:
 * - organization: Updated organization object
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, defaultLanguage } = req.body;

    // Build update object
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (defaultLanguage !== undefined) updates.default_language = defaultLanguage;
    updates.updated_at = new Date().toISOString();

    // Check if slug is already taken (if changing slug)
    if (slug) {
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .single();

      if (existingOrg) {
        return res.status(409).json({
          error: 'Slug already exists'
        });
      }
    }

    // Update organization
    const { data: organization, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !organization) {
      console.error('Update error:', error);
      return res.status(404).json({
        error: 'Organization not found'
      });
    }

    // Log update action
    await logSuperAdminAction(
      req.superAdmin.id,
      'organization.update',
      'organization',
      id,
      {
        organizationName: organization.name,
        updates
      },
      getClientIp(req),
      req.headers['user-agent']
    );

    res.json({
      message: 'Organization updated successfully',
      organization
    });

  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * PATCH /api/super-admin/organizations/:id/status
 * Suspend or activate organization
 *
 * Request Body:
 * - status: string (active, suspended, cancelled)
 *
 * Response:
 * - organization: Updated organization object
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validation
    const validStatuses = ['active', 'suspended', 'cancelled', 'trialing'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Update organization status
    const { data: organization, error } = await supabase
      .from('organizations')
      .update({
        subscription_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !organization) {
      return res.status(404).json({
        error: 'Organization not found'
      });
    }

    // Update subscription status as well
    await supabase
      .from('subscriptions')
      .update({ status })
      .eq('organization_id', id);

    // Log status change action
    await logSuperAdminAction(
      req.superAdmin.id,
      `organization.${status}`,
      'organization',
      id,
      {
        organizationName: organization.name,
        oldStatus: organization.subscription_status,
        newStatus: status
      },
      getClientIp(req),
      req.headers['user-agent']
    );

    res.json({
      message: `Organization ${status} successfully`,
      organization
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * PATCH /api/super-admin/organizations/:id/package
 * Change organization package/subscription
 *
 * Request Body:
 * - packageId: UUID (required)
 *
 * Response:
 * - organization: Updated organization object
 */
router.patch('/:id/package', async (req, res) => {
  try {
    const { id } = req.params;
    const { packageId } = req.body;

    if (!packageId) {
      return res.status(400).json({
        error: 'Package ID is required'
      });
    }

    // Verify package exists
    const { data: packageData, error: packageError } = await supabase
      .from('packages')
      .select('id, name, slug')
      .eq('id', packageId)
      .single();

    if (packageError || !packageData) {
      return res.status(404).json({
        error: 'Package not found'
      });
    }

    // Get current organization
    const { data: currentOrg } = await supabase
      .from('organizations')
      .select('name, package_id')
      .eq('id', id)
      .single();

    if (!currentOrg) {
      return res.status(404).json({
        error: 'Organization not found'
      });
    }

    // Update organization package
    const { data: organization, error } = await supabase
      .from('organizations')
      .update({
        package_id: packageId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Package update error:', error);
      return res.status(500).json({
        error: 'Failed to update package'
      });
    }

    // Update subscription record
    await supabase
      .from('subscriptions')
      .update({ package_id: packageId })
      .eq('organization_id', id);

    // Log package change action
    await logSuperAdminAction(
      req.superAdmin.id,
      'organization.package_change',
      'organization',
      id,
      {
        organizationName: currentOrg.name,
        oldPackageId: currentOrg.package_id,
        newPackageId: packageId,
        newPackageName: packageData.name
      },
      getClientIp(req),
      req.headers['user-agent']
    );

    res.json({
      message: 'Package updated successfully',
      organization
    });

  } catch (error) {
    console.error('Update package error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/super-admin/organizations/:id
 * Delete organization (soft delete by default)
 *
 * Query Parameters:
 * - hard: boolean (true for permanent deletion, false for soft delete)
 *
 * Response:
 * - message: Success message
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hard = false } = req.query;

    // Get organization details before deletion
    const { data: organization } = await supabase
      .from('organizations')
      .select('name, slug')
      .eq('id', id)
      .single();

    if (!organization) {
      return res.status(404).json({
        error: 'Organization not found'
      });
    }

    if (hard === 'true') {
      // Hard delete: permanently remove organization and all related data
      // Supabase CASCADE will handle related records
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Hard delete error:', error);
        return res.status(500).json({
          error: 'Failed to delete organization'
        });
      }

      // Log hard delete action
      await logSuperAdminAction(
        req.superAdmin.id,
        'organization.delete_permanent',
        'organization',
        id,
        {
          organizationName: organization.name,
          organizationSlug: organization.slug
        },
        getClientIp(req),
        req.headers['user-agent']
      );

      res.json({
        message: 'Organization permanently deleted'
      });

    } else {
      // Soft delete: mark as cancelled and deactivate all users
      const { error: orgError } = await supabase
        .from('organizations')
        .update({
          subscription_status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (orgError) {
        console.error('Soft delete error:', orgError);
        return res.status(500).json({
          error: 'Failed to deactivate organization'
        });
      }

      // Deactivate all users
      await supabase
        .from('users')
        .update({ is_active: false })
        .eq('organization_id', id);

      // Update subscription status
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('organization_id', id);

      // Log soft delete action
      await logSuperAdminAction(
        req.superAdmin.id,
        'organization.delete_soft',
        'organization',
        id,
        {
          organizationName: organization.name,
          organizationSlug: organization.slug
        },
        getClientIp(req),
        req.headers['user-agent']
      );

      res.json({
        message: 'Organization deactivated successfully'
      });
    }

  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;
