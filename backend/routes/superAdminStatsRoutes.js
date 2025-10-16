/**
 * Super Admin Platform Statistics Routes
 * Provides aggregated analytics for the super admin dashboard
 *
 * Endpoints:
 * - GET /api/super-admin/stats/overview - Platform overview stats
 * - GET /api/super-admin/stats/organizations - Organization analytics
 * - GET /api/super-admin/stats/packages - Package distribution
 * - GET /api/super-admin/stats/growth - Growth metrics over time
 * - GET /api/super-admin/stats/activity - Recent audit log activity
 *
 * Related: docs/SUPER_ADMIN_IMPLEMENTATION_PLAN.md
 */

import express from 'express';
import supabase from '../config/supabase.js';
import { authenticateSuperAdmin } from '../middleware/superAdminAuth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateSuperAdmin);

/**
 * GET /api/super-admin/stats/overview
 * Platform overview statistics
 *
 * Response:
 * - totalOrganizations: number
 * - activeOrganizations: number
 * - suspendedOrganizations: number
 * - totalUsers: number
 * - activeUsers: number
 * - totalDeals: number (from CRM)
 * - totalContacts: number (from CRM)
 */
router.get('/overview', async (req, res) => {
  try {
    // Get organization counts by status
    const { data: orgStats, error: orgError } = await supabase
      .from('organizations')
      .select('subscription_status', { count: 'exact' });

    if (orgError) {
      console.error('Error fetching org stats:', orgError);
      return res.status(500).json({ error: 'Failed to fetch organization stats' });
    }

    // Calculate organization counts
    const totalOrganizations = orgStats.length;
    const activeOrganizations = orgStats.filter(o => o.subscription_status === 'active').length;
    const trialingOrganizations = orgStats.filter(o => o.subscription_status === 'trialing').length;
    const suspendedOrganizations = orgStats.filter(o => o.subscription_status === 'suspended').length;
    const cancelledOrganizations = orgStats.filter(o => o.subscription_status === 'cancelled').length;

    // Get user counts
    const { count: totalUsers, error: userError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: activeUsers, error: activeUserError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get CRM stats (total deals and contacts across all organizations)
    const { count: totalDeals } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true });

    const { count: totalContacts } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true });

    // Get subscription stats
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('status, trial_ends_at');

    const activeSubscriptions = subscriptions?.filter(s => s.status === 'active').length || 0;
    const trialSubscriptions = subscriptions?.filter(s =>
      s.status === 'trialing' && s.trial_ends_at && new Date(s.trial_ends_at) > new Date()
    ).length || 0;

    res.json({
      organizations: {
        total: totalOrganizations,
        active: activeOrganizations,
        trialing: trialingOrganizations,
        suspended: suspendedOrganizations,
        cancelled: cancelledOrganizations
      },
      users: {
        total: totalUsers || 0,
        active: activeUsers || 0,
        inactive: (totalUsers || 0) - (activeUsers || 0)
      },
      subscriptions: {
        active: activeSubscriptions,
        trial: trialSubscriptions
      },
      crm: {
        totalDeals: totalDeals || 0,
        totalContacts: totalContacts || 0
      }
    });

  } catch (error) {
    console.error('Overview stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/super-admin/stats/organizations
 * Detailed organization analytics
 *
 * Response:
 * - byStatus: Array of { status, count }
 * - byPackage: Array of { packageName, count }
 * - recentSignups: Array of recent organizations (last 10)
 * - topByUsers: Array of organizations with most users (top 5)
 */
router.get('/organizations', async (req, res) => {
  try {
    // Get organizations with package info
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        subscription_status,
        created_at,
        package:packages(name, slug),
        users(count)
      `);

    if (error) {
      console.error('Error fetching organizations:', error);
      return res.status(500).json({ error: 'Failed to fetch organizations' });
    }

    // Group by status
    const byStatus = {};
    organizations.forEach(org => {
      const status = org.subscription_status || 'unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    // Group by package
    const byPackage = {};
    organizations.forEach(org => {
      const packageName = org.package?.name || 'Unknown';
      byPackage[packageName] = (byPackage[packageName] || 0) + 1;
    });

    // Recent signups (last 10)
    const recentSignups = organizations
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
      .map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        package: org.package?.name,
        status: org.subscription_status,
        createdAt: org.created_at
      }));

    // Top by users (top 5)
    const topByUsers = organizations
      .map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        usersCount: org.users?.[0]?.count || 0
      }))
      .sort((a, b) => b.usersCount - a.usersCount)
      .slice(0, 5);

    res.json({
      byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
      byPackage: Object.entries(byPackage).map(([packageName, count]) => ({ packageName, count })),
      recentSignups,
      topByUsers
    });

  } catch (error) {
    console.error('Organization stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/super-admin/stats/packages
 * Package distribution and usage analytics
 *
 * Response:
 * - packages: Array of package stats
 */
router.get('/packages', async (req, res) => {
  try {
    // Get all packages with organization counts
    const { data: packages, error } = await supabase
      .from('packages')
      .select(`
        id,
        name,
        slug,
        price_monthly,
        price_yearly,
        is_active,
        organizations:organizations(count),
        subscriptions:subscriptions(count)
      `)
      .order('price_monthly', { ascending: true });

    if (error) {
      console.error('Error fetching packages:', error);
      return res.status(500).json({ error: 'Failed to fetch packages' });
    }

    // Format response
    const packageStats = packages.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      slug: pkg.slug,
      priceMonthly: pkg.price_monthly,
      priceYearly: pkg.price_yearly,
      isActive: pkg.is_active,
      organizationsCount: pkg.organizations?.[0]?.count || 0,
      subscriptionsCount: pkg.subscriptions?.[0]?.count || 0
    }));

    res.json({
      packages: packageStats
    });

  } catch (error) {
    console.error('Package stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/super-admin/stats/growth
 * Growth metrics over time
 *
 * Query Parameters:
 * - period: string (7d, 30d, 90d, 1y) - default: 30d
 *
 * Response:
 * - period: string
 * - signups: Array of { date, count }
 * - churn: Array of { date, count }
 */
router.get('/growth', async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case '30d':
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get organizations created in period
    const { data: newOrgs, error: newError } = await supabase
      .from('organizations')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (newError) {
      console.error('Error fetching growth data:', newError);
      return res.status(500).json({ error: 'Failed to fetch growth data' });
    }

    // Get organizations cancelled in period
    const { data: churned, error: churnError } = await supabase
      .from('organizations')
      .select('updated_at')
      .eq('subscription_status', 'cancelled')
      .gte('updated_at', startDate.toISOString())
      .order('updated_at', { ascending: true });

    // Group by date
    const signupsByDate = {};
    newOrgs?.forEach(org => {
      const date = new Date(org.created_at).toISOString().split('T')[0];
      signupsByDate[date] = (signupsByDate[date] || 0) + 1;
    });

    const churnByDate = {};
    churned?.forEach(org => {
      const date = new Date(org.updated_at).toISOString().split('T')[0];
      churnByDate[date] = (churnByDate[date] || 0) + 1;
    });

    res.json({
      period,
      signups: Object.entries(signupsByDate).map(([date, count]) => ({ date, count })),
      churn: Object.entries(churnByDate).map(([date, count]) => ({ date, count }))
    });

  } catch (error) {
    console.error('Growth stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/super-admin/stats/activity
 * Recent audit log activity
 *
 * Query Parameters:
 * - limit: number (default: 20, max: 100)
 *
 * Response:
 * - activities: Array of recent audit log entries
 */
router.get('/activity', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    // Get recent audit logs
    const { data: activities, error } = await supabase
      .from('super_admin_audit_logs')
      .select(`
        id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        created_at,
        super_admin:super_admins(id, email, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limitNum);

    if (error) {
      console.error('Error fetching activity:', error);
      return res.status(500).json({ error: 'Failed to fetch activity' });
    }

    // Format response
    const formattedActivities = activities.map(log => ({
      id: log.id,
      action: log.action,
      resourceType: log.resource_type,
      resourceId: log.resource_id,
      details: log.details,
      ipAddress: log.ip_address,
      createdAt: log.created_at,
      superAdmin: {
        id: log.super_admin?.id,
        email: log.super_admin?.email,
        fullName: log.super_admin?.full_name
      }
    }));

    res.json({
      activities: formattedActivities
    });

  } catch (error) {
    console.error('Activity stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
