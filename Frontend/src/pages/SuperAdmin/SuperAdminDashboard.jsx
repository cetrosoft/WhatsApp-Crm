/**
 * Super Admin Dashboard
 * Platform-wide statistics and quick management actions
 *
 * Features:
 * - Platform overview stats (orgs, users, subscriptions, CRM data)
 * - Organization status breakdown
 * - Package distribution
 * - Recent activity logs
 * - Quick actions for common tasks
 *
 * Related: docs/SUPER_ADMIN_IMPLEMENTATION_PLAN.md
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { superAdminStatsAPI } from '../../services/superAdminAPI';
import {
  Building2,
  Users,
  TrendingUp,
  Contact,
  Package,
  Activity,
  Plus,
  Eye,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [orgStats, setOrgStats] = useState(null);
  const [packageStats, setPackageStats] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Debug logging
      console.log('🔍 SuperAdmin Dashboard: Fetching data...');
      console.log('🔑 Token:', localStorage.getItem('superAdminToken') ? 'Present' : 'Missing');
      console.log('🌐 API URL:', import.meta.env.VITE_API_URL || 'http://localhost:5000');

      // Fetch all data in parallel
      const [overviewRes, orgRes, pkgRes, activityRes] = await Promise.all([
        superAdminStatsAPI.getOverview(),
        superAdminStatsAPI.getOrganizationStats(),
        superAdminStatsAPI.getPackageStats(),
        superAdminStatsAPI.getActivityLogs(10),
      ]);

      console.log('✅ Overview data received:', overviewRes);
      console.log('✅ Org stats received:', orgRes);
      console.log('✅ Package stats received:', pkgRes);
      console.log('✅ Activity logs received:', activityRes);

      setStats(overviewRes);
      setOrgStats(orgRes);
      setPackageStats(pkgRes);
      setActivityLogs(activityRes.activities);

      console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error response:', error.response);
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));
      toast.error(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load dashboard data</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, Super Admin</p>
        </div>
        <Link
          to="/super-admin/organizations/new"
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Organization
        </Link>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Organizations */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Organizations</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.organizations.total}
              </p>
              <p className="text-sm text-green-600 mt-1">
                {stats.organizations.active} active
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.users.total}
              </p>
              <p className="text-sm text-green-600 mt-1">
                {stats.users.active} active
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Total Deals */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Deals</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.crm.totalDeals}
              </p>
              <p className="text-sm text-gray-500 mt-1">Across all orgs</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Contacts */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Contacts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.crm.totalContacts}
              </p>
              <p className="text-sm text-gray-500 mt-1">Across all orgs</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Contact className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Organization Status & Package Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organization Status Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Organizations by Status
          </h2>
          <div className="space-y-3">
            {orgStats.byStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      item.status === 'active'
                        ? 'bg-green-500'
                        : item.status === 'trialing'
                        ? 'bg-blue-500'
                        : item.status === 'suspended'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                  ></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-bold text-gray-900">{item.count}</span>
                  <span className="text-xs text-gray-500">
                    {((item.count / stats.organizations.total) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Package Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Package Distribution
          </h2>
          <div className="space-y-3">
            {packageStats.packages.map((pkg) => (
              <div key={pkg.id} className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">{pkg.name}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    ${pkg.priceMonthly}/mo
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-bold text-gray-900">
                    {pkg.organizationsCount}
                  </span>
                  <span className="text-xs text-gray-500">orgs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity & Top Organizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Logs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {activityLogs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {log.action.replace(/_/g, ' ').replace(/\./g, ' > ')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      by {log.superAdmin.email} • {log.ipAddress}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Organizations */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Top Organizations (by users)
          </h2>
          <div className="space-y-3">
            {orgStats.topByUsers.map((org, index) => (
              <div
                key={org.id}
                className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{org.name}</p>
                    <p className="text-xs text-gray-500">{org.slug}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-bold text-gray-900">
                    {org.usersCount} users
                  </span>
                  <Link
                    to={`/super-admin/organizations/${org.id}`}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/super-admin/organizations"
            className="flex items-center justify-center px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors"
          >
            <Building2 className="w-5 h-5 mr-2 text-gray-600" />
            <span className="font-medium text-gray-700">Manage Organizations</span>
          </Link>
          <Link
            to="/super-admin/packages"
            className="flex items-center justify-center px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors"
          >
            <Package className="w-5 h-5 mr-2 text-gray-600" />
            <span className="font-medium text-gray-700">Manage Packages</span>
          </Link>
          <Link
            to="/super-admin/activity"
            className="flex items-center justify-center px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors"
          >
            <Activity className="w-5 h-5 mr-2 text-gray-600" />
            <span className="font-medium text-gray-700">View All Activity</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
