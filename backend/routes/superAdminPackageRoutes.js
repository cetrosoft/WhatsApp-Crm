/**
 * Super Admin Package Management Routes
 * Full CRUD operations for subscription packages
 *
 * Features:
 * - List all packages (including inactive)
 * - Create new packages
 * - Update existing packages
 * - Delete packages (with safety checks)
 * - View organizations using each package
 *
 * Related: docs/SUPER_ADMIN_IMPLEMENTATION_PLAN.md
 */

import express from 'express';
import supabase from '../config/supabase.js';
import {
  authenticateSuperAdmin,
  logSuperAdminAction,
  getClientIp
} from '../middleware/superAdminAuth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateSuperAdmin);

/**
 * GET /api/super-admin/packages
 * List all packages (including inactive)
 *
 * Query Parameters:
 * - search: string (search in name, slug)
 * - status: string (active, inactive, all)
 * - sortBy: string (name, price_monthly, display_order)
 * - sortOrder: string (asc, desc)
 *
 * Response:
 * - packages: array of package objects with organization counts
 */
router.get('/', async (req, res) => {
  try {
    const {
      search = '',
      status = 'all',
      sortBy = 'display_order',
      sortOrder = 'asc'
    } = req.query;

    // Build base query
    let query = supabase
      .from('packages')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply status filter
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    // Apply sorting
    const validSortFields = ['name', 'price_monthly', 'display_order', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'display_order';
    const sortDirection = sortOrder === 'desc';

    query = query.order(sortField, { ascending: !sortDirection });

    // Execute query
    const { data: packages, error, count } = await query;

    if (error) {
      console.error('Error fetching packages:', error);
      return res.status(500).json({
        error: 'Failed to fetch packages'
      });
    }

    // Get organization count for each package
    const packagesWithCounts = await Promise.all(
      packages.map(async (pkg) => {
        const { count: orgCount } = await supabase
          .from('organizations')
          .select('*', { count: 'exact', head: true })
          .eq('package_id', pkg.id);

        return {
          ...pkg,
          organizationsCount: orgCount || 0
        };
      })
    );

    res.json({
      packages: packagesWithCounts,
      total: count
    });

  } catch (error) {
    console.error('List packages error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/super-admin/packages/:id
 * Get single package by ID with organization count
 *
 * Response:
 * - package: Package object with organizations count
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get package
    const { data: pkg, error } = await supabase
      .from('packages')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !pkg) {
      return res.status(404).json({
        error: 'Package not found'
      });
    }

    // Get organization count
    const { count: orgCount } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('package_id', id);

    // Log view action
    await logSuperAdminAction(
      req.superAdmin.id,
      'package.view',
      'package',
      id,
      {
        packageName: pkg.name
      },
      getClientIp(req),
      req.headers['user-agent']
    );

    res.json({
      package: {
        ...pkg,
        organizationsCount: orgCount || 0
      }
    });

  } catch (error) {
    console.error('Get package error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/super-admin/packages
 * Create new package
 *
 * Request Body:
 * - name: string (required)
 * - slug: string (required, unique, lowercase)
 * - description: string (optional)
 * - price_monthly: number (optional, >= 0)
 * - price_yearly: number (optional, >= 0)
 * - max_users: number (optional, > 0)
 * - max_whatsapp_profiles: number (optional, > 0)
 * - max_customers: number (optional, > 0)
 * - max_messages_per_day: number (optional, > 0)
 * - features: object (optional)
 * - is_active: boolean (default: true)
 * - display_order: number (default: 0)
 *
 * Response:
 * - package: Created package object
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      price_monthly,
      price_yearly,
      max_users,
      max_whatsapp_profiles,
      max_customers,
      max_messages_per_day,
      features,
      is_active = true,
      display_order = 0
    } = req.body;

    // Validation
    if (!name || !slug) {
      return res.status(400).json({
        error: 'Name and slug are required'
      });
    }

    if (name.length < 3 || name.length > 100) {
      return res.status(400).json({
        error: 'Name must be between 3 and 100 characters'
      });
    }

    if (slug.length < 3 || slug.length > 50) {
      return res.status(400).json({
        error: 'Slug must be between 3 and 50 characters'
      });
    }

    // Slug must be lowercase, alphanumeric + hyphens only
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({
        error: 'Slug must be lowercase letters, numbers, and hyphens only'
      });
    }

    // Check if slug already exists
    const { data: existingPackage } = await supabase
      .from('packages')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingPackage) {
      return res.status(409).json({
        error: 'Slug already exists'
      });
    }

    // Validate pricing (must be >= 0 or null)
    if (price_monthly !== null && price_monthly !== undefined && price_monthly < 0) {
      return res.status(400).json({
        error: 'Monthly price must be >= 0 or null'
      });
    }

    if (price_yearly !== null && price_yearly !== undefined && price_yearly < 0) {
      return res.status(400).json({
        error: 'Yearly price must be >= 0 or null'
      });
    }

    // Validate limits (must be > 0 or null)
    const limits = { max_users, max_whatsapp_profiles, max_customers, max_messages_per_day };
    for (const [key, value] of Object.entries(limits)) {
      if (value !== null && value !== undefined && value <= 0) {
        return res.status(400).json({
          error: `${key} must be > 0 or null (unlimited)`
        });
      }
    }

    // Build package object
    const packageData = {
      name,
      slug,
      description: description || null,
      price_monthly: price_monthly === undefined ? null : price_monthly,
      price_yearly: price_yearly === undefined ? null : price_yearly,
      max_users: max_users || null,
      max_whatsapp_profiles: max_whatsapp_profiles || null,
      max_customers: max_customers || null,
      max_messages_per_day: max_messages_per_day || null,
      features: features || {
        crm: true,
        ticketing: false,
        bulk_sender: false,
        analytics: false,
        api_access: false,
        white_label: false,
        priority_support: false,
        custom_branding: false
      },
      is_active,
      display_order,
      is_custom: true // Mark as custom (not system-seeded)
    };

    // Create package
    const { data: pkg, error } = await supabase
      .from('packages')
      .insert(packageData)
      .select()
      .single();

    if (error) {
      console.error('Package creation error:', error);
      return res.status(500).json({
        error: 'Failed to create package'
      });
    }

    // Log creation action
    await logSuperAdminAction(
      req.superAdmin.id,
      'package.create',
      'package',
      pkg.id,
      {
        packageName: name,
        packageSlug: slug
      },
      getClientIp(req),
      req.headers['user-agent']
    );

    res.status(201).json({
      message: 'Package created successfully',
      package: pkg
    });

  } catch (error) {
    console.error('Create package error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * PATCH /api/super-admin/packages/:id
 * Update existing package
 *
 * Request Body: Same as POST (all fields optional)
 *
 * Response:
 * - package: Updated package object
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      price_monthly,
      price_yearly,
      max_users,
      max_whatsapp_profiles,
      max_customers,
      max_messages_per_day,
      features,
      is_active,
      display_order
    } = req.body;

    // Check if package exists
    const { data: existingPackage, error: fetchError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingPackage) {
      return res.status(404).json({
        error: 'Package not found'
      });
    }

    // Build update object
    const updates = { updated_at: new Date().toISOString() };

    if (name !== undefined) {
      if (name.length < 3 || name.length > 100) {
        return res.status(400).json({
          error: 'Name must be between 3 and 100 characters'
        });
      }
      updates.name = name;
    }

    if (slug !== undefined) {
      if (slug.length < 3 || slug.length > 50) {
        return res.status(400).json({
          error: 'Slug must be between 3 and 50 characters'
        });
      }

      if (!/^[a-z0-9-]+$/.test(slug)) {
        return res.status(400).json({
          error: 'Slug must be lowercase letters, numbers, and hyphens only'
        });
      }

      // Check if slug is taken by another package
      if (slug !== existingPackage.slug) {
        const { data: slugExists } = await supabase
          .from('packages')
          .select('id')
          .eq('slug', slug)
          .neq('id', id)
          .single();

        if (slugExists) {
          return res.status(409).json({
            error: 'Slug already exists'
          });
        }
      }

      updates.slug = slug;
    }

    if (description !== undefined) updates.description = description;
    if (price_monthly !== undefined) {
      if (price_monthly !== null && price_monthly < 0) {
        return res.status(400).json({ error: 'Monthly price must be >= 0 or null' });
      }
      updates.price_monthly = price_monthly;
    }
    if (price_yearly !== undefined) {
      if (price_yearly !== null && price_yearly < 0) {
        return res.status(400).json({ error: 'Yearly price must be >= 0 or null' });
      }
      updates.price_yearly = price_yearly;
    }

    // Validate and update limits
    if (max_users !== undefined) {
      if (max_users !== null && max_users <= 0) {
        return res.status(400).json({ error: 'Max users must be > 0 or null' });
      }
      updates.max_users = max_users;
    }
    if (max_whatsapp_profiles !== undefined) {
      if (max_whatsapp_profiles !== null && max_whatsapp_profiles <= 0) {
        return res.status(400).json({ error: 'Max WhatsApp profiles must be > 0 or null' });
      }
      updates.max_whatsapp_profiles = max_whatsapp_profiles;
    }
    if (max_customers !== undefined) {
      if (max_customers !== null && max_customers <= 0) {
        return res.status(400).json({ error: 'Max customers must be > 0 or null' });
      }
      updates.max_customers = max_customers;
    }
    if (max_messages_per_day !== undefined) {
      if (max_messages_per_day !== null && max_messages_per_day <= 0) {
        return res.status(400).json({ error: 'Max messages per day must be > 0 or null' });
      }
      updates.max_messages_per_day = max_messages_per_day;
    }

    if (features !== undefined) updates.features = features;
    if (is_active !== undefined) updates.is_active = is_active;
    if (display_order !== undefined) updates.display_order = display_order;

    // Update package
    const { data: pkg, error } = await supabase
      .from('packages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return res.status(500).json({
        error: 'Failed to update package'
      });
    }

    // Log update action
    await logSuperAdminAction(
      req.superAdmin.id,
      'package.update',
      'package',
      id,
      {
        packageName: pkg.name,
        updates
      },
      getClientIp(req),
      req.headers['user-agent']
    );

    res.json({
      message: 'Package updated successfully',
      package: pkg
    });

  } catch (error) {
    console.error('Update package error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/super-admin/packages/:id
 * Delete package (only if no organizations are using it)
 *
 * Response:
 * - message: Success message
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get package details before deletion
    const { data: pkg } = await supabase
      .from('packages')
      .select('name, slug')
      .eq('id', id)
      .single();

    if (!pkg) {
      return res.status(404).json({
        error: 'Package not found'
      });
    }

    // Check if any organizations are using this package
    const { data: organizations, count } = await supabase
      .from('organizations')
      .select('id, name', { count: 'exact' })
      .eq('package_id', id);

    if (count > 0) {
      return res.status(400).json({
        error: `Cannot delete package - ${count} organization(s) are using it`,
        organizationsCount: count,
        organizations: organizations.map(o => o.name)
      });
    }

    // Delete package
    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete error:', error);
      return res.status(500).json({
        error: 'Failed to delete package'
      });
    }

    // Log delete action
    await logSuperAdminAction(
      req.superAdmin.id,
      'package.delete',
      'package',
      id,
      {
        packageName: pkg.name,
        packageSlug: pkg.slug
      },
      getClientIp(req),
      req.headers['user-agent']
    );

    res.json({
      message: 'Package deleted successfully'
    });

  } catch (error) {
    console.error('Delete package error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/super-admin/packages/:id/organizations
 * Get list of organizations using this package
 *
 * Response:
 * - organizations: Array of organizations with basic info
 */
router.get('/:id/organizations', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify package exists
    const { data: pkg, error: pkgError } = await supabase
      .from('packages')
      .select('name')
      .eq('id', id)
      .single();

    if (pkgError || !pkg) {
      return res.status(404).json({
        error: 'Package not found'
      });
    }

    // Get organizations using this package
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        subscription_status,
        created_at,
        users:users(count)
      `)
      .eq('package_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching organizations:', error);
      return res.status(500).json({
        error: 'Failed to fetch organizations'
      });
    }

    res.json({
      packageName: pkg.name,
      organizations: organizations.map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        status: org.subscription_status,
        createdAt: org.created_at,
        usersCount: org.users?.[0]?.count || 0
      })),
      total: organizations.length
    });

  } catch (error) {
    console.error('Get package organizations error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;
