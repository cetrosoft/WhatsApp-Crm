/**
 * Super Admin Packages Management Page
 * CRUD operations for subscription packages
 *
 * Features:
 * - List all packages with search and filters
 * - Create new packages
 * - Edit existing packages
 * - Delete packages (with safety checks)
 * - View organizations using each package
 *
 * Related: docs/SUPER_ADMIN_IMPLEMENTATION_PLAN.md
 */

import React, { useState, useEffect } from 'react';
import { superAdminPackageAPI } from '../../services/superAdminAPI';
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  Filter,
  Eye,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PackageForm from './PackageForm';

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [viewingOrgs, setViewingOrgs] = useState(null);

  useEffect(() => {
    loadPackages();
  }, [searchTerm, statusFilter]);

  const loadPackages = async () => {
    try {
      setLoading(true);

      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await superAdminPackageAPI.getPackages(params);
      setPackages(response.packages || []);
    } catch (error) {
      console.error('Error loading packages:', error);
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPackage(null);
    setShowForm(true);
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setShowForm(true);
  };

  const handleDelete = async (pkg) => {
    if (pkg.organizationsCount > 0) {
      toast.error(
        `Cannot delete package - ${pkg.organizationsCount} organization(s) are using it`,
        { duration: 5000 }
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete "${pkg.name}" package? This action cannot be undone.`)) {
      return;
    }

    try {
      await superAdminPackageAPI.deletePackage(pkg.id);
      toast.success('Package deleted successfully');
      loadPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error(error.response?.data?.error || 'Failed to delete package');
    }
  };

  const handleFormClose = (shouldReload) => {
    setShowForm(false);
    setEditingPackage(null);
    if (shouldReload) {
      loadPackages();
    }
  };

  const handleViewOrganizations = async (pkg) => {
    try {
      const response = await superAdminPackageAPI.getPackageOrganizations(pkg.id);
      setViewingOrgs({
        packageName: pkg.name,
        organizations: response.organizations || []
      });
    } catch (error) {
      console.error('Error loading organizations:', error);
      toast.error('Failed to load organizations');
    }
  };

  const formatPrice = (monthly, yearly) => {
    if (monthly === null && yearly === null) {
      return <span className="text-gray-500 italic">Custom</span>;
    }
    return (
      <div>
        {monthly !== null && (
          <div className="font-medium text-gray-900">${monthly}/mo</div>
        )}
        {yearly !== null && (
          <div className="text-sm text-gray-500">${yearly}/yr</div>
        )}
      </div>
    );
  };

  const getFeatureBadges = (features) => {
    const activeFeatures = Object.entries(features || {})
      .filter(([_, value]) => value === true)
      .map(([key]) => key);

    const featureLabels = {
      crm: 'CRM',
      ticketing: 'Tickets',
      bulk_sender: 'Bulk',
      analytics: 'Analytics',
      api_access: 'API',
      white_label: 'White Label',
      priority_support: 'Priority',
      custom_branding: 'Branding'
    };

    return activeFeatures.slice(0, 3).map((feature) => (
      <span
        key={feature}
        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-1"
      >
        {featureLabels[feature] || feature}
      </span>
    ));
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Package className="w-8 h-8 mr-3" />
            Packages
          </h1>
          <p className="text-gray-600 mt-1">
            Manage subscription packages and pricing
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Package
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search packages..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Filter className="w-5 h-5 text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Packages Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Features
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Limits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organizations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    </div>
                  </td>
                </tr>
              ) : packages.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No packages found</p>
                  </td>
                </tr>
              ) : (
                packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                        <div className="text-sm text-gray-500">{pkg.slug}</div>
                        {pkg.description && (
                          <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                            {pkg.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {formatPrice(pkg.price_monthly, pkg.price_yearly)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {getFeatureBadges(pkg.features)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="space-y-1">
                        {pkg.max_users && (
                          <div className="flex items-center text-xs">
                            <Users className="w-3 h-3 mr-1 text-gray-400" />
                            {pkg.max_users} users
                          </div>
                        )}
                        {pkg.max_customers && (
                          <div className="text-xs text-gray-500">
                            {pkg.max_customers} contacts
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <button
                        onClick={() => handleViewOrganizations(pkg)}
                        className={`font-medium ${
                          pkg.organizationsCount > 0
                            ? 'text-blue-600 hover:text-blue-900'
                            : 'text-gray-400'
                        }`}
                        disabled={pkg.organizationsCount === 0}
                      >
                        {pkg.organizationsCount}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(pkg.is_active)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(pkg)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit package"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(pkg)}
                          className={`${
                            pkg.organizationsCount > 0
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-900'
                          }`}
                          disabled={pkg.organizationsCount > 0}
                          title={
                            pkg.organizationsCount > 0
                              ? 'Cannot delete - organizations are using this package'
                              : 'Delete package'
                          }
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Package Form Modal */}
      {showForm && (
        <PackageForm
          package={editingPackage}
          onClose={handleFormClose}
        />
      )}

      {/* Organizations Modal */}
      {viewingOrgs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Organizations using "{viewingOrgs.packageName}"
              </h3>
              <button
                onClick={() => setViewingOrgs(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {viewingOrgs.organizations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No organizations are using this package</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {viewingOrgs.organizations.map((org) => (
                    <div
                      key={org.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{org.name}</div>
                        <div className="text-sm text-gray-500">{org.slug}</div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">
                          <Users className="w-4 h-4 inline mr-1" />
                          {org.usersCount} users
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            org.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : org.status === 'trialing'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {org.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Packages;
