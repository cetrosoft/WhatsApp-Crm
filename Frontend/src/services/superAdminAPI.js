/**
 * Super Admin API Service
 * Centralized HTTP client for super admin operations
 *
 * Key Differences from Organization API:
 * - Separate token storage (superAdminToken)
 * - All endpoints use /api/super-admin prefix
 * - No organization context
 * - Shorter token expiry (1 hour vs 7 days)
 *
 * Related: docs/SUPER_ADMIN_IMPLEMENTATION_PLAN.md
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Get super admin token from localStorage
 */
const getSuperAdminToken = () => {
  return localStorage.getItem('superAdminToken');
};

/**
 * Set super admin token to localStorage
 */
const setSuperAdminToken = (token) => {
  localStorage.setItem('superAdminToken', token);
};

/**
 * Remove super admin token from localStorage
 */
const removeSuperAdminToken = () => {
  localStorage.removeItem('superAdminToken');
};

/**
 * Generic fetch wrapper with super admin authentication
 */
const superAdminApiCall = async (endpoint, options = {}) => {
  const token = getSuperAdminToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const error = new Error(
        `Expected JSON but got ${contentType || 'unknown content type'}. ` +
        `Is the backend running on ${API_URL}?`
      );
      error.response = {
        status: response.status,
        data: { message: 'Backend server not responding with JSON' }
      };
      throw error;
    }

    const data = await response.json();

    if (!response.ok) {
      // Create error with response information (axios-like structure)
      const error = new Error(data.message || data.error || 'Request failed');
      error.response = {
        status: response.status,
        data: data
      };
      throw error;
    }

    return data;
  } catch (error) {
    // If error doesn't have response (network error), add basic info
    if (!error.response && error instanceof TypeError) {
      error.response = {
        status: 0,
        data: { message: 'Network error - Cannot connect to backend server' }
      };
    }
    console.error('Super Admin API Error:', error);
    throw error;
  }
};

/**
 * Super Admin Authentication API
 */
export const superAdminAuthAPI = {
  /**
   * Login super admin with email and password
   */
  login: async (email, password) => {
    const response = await superAdminApiCall('/api/super-admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.token) {
      setSuperAdminToken(response.token);
    }

    return response;
  },

  /**
   * Get current super admin info
   */
  getMe: async () => {
    return await superAdminApiCall('/api/super-admin/me');
  },

  /**
   * Logout super admin
   */
  logout: async () => {
    try {
      await superAdminApiCall('/api/super-admin/logout', {
        method: 'POST',
      });
    } finally {
      removeSuperAdminToken();
    }
  },

  /**
   * Change password (self-service)
   */
  changePassword: async (currentPassword, newPassword) => {
    return await superAdminApiCall('/api/super-admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

/**
 * Organization Management API
 */
export const superAdminOrgAPI = {
  /**
   * Get all organizations with pagination and filters
   */
  getOrganizations: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return await superAdminApiCall(`/api/super-admin/organizations?${queryParams}`);
  },

  /**
   * Get single organization by ID
   */
  getOrganization: async (id) => {
    return await superAdminApiCall(`/api/super-admin/organizations/${id}`);
  },

  /**
   * Create new organization
   */
  createOrganization: async (data) => {
    return await superAdminApiCall('/api/super-admin/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update organization details
   */
  updateOrganization: async (id, data) => {
    return await superAdminApiCall(`/api/super-admin/organizations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Change organization status (suspend/activate)
   */
  changeStatus: async (id, status) => {
    return await superAdminApiCall(`/api/super-admin/organizations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  /**
   * Change organization package
   */
  changePackage: async (id, packageId) => {
    return await superAdminApiCall(`/api/super-admin/organizations/${id}/package`, {
      method: 'PATCH',
      body: JSON.stringify({ packageId }),
    });
  },

  /**
   * Delete organization (soft or hard delete)
   */
  deleteOrganization: async (id, hard = false) => {
    return await superAdminApiCall(`/api/super-admin/organizations/${id}?hard=${hard}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Platform Statistics API
 */
export const superAdminStatsAPI = {
  /**
   * Get platform overview statistics
   */
  getOverview: async () => {
    return await superAdminApiCall('/api/super-admin/stats/overview');
  },

  /**
   * Get organization analytics
   */
  getOrganizationStats: async () => {
    return await superAdminApiCall('/api/super-admin/stats/organizations');
  },

  /**
   * Get package distribution
   */
  getPackageStats: async () => {
    return await superAdminApiCall('/api/super-admin/stats/packages');
  },

  /**
   * Get growth metrics
   */
  getGrowthStats: async (period = '30d') => {
    return await superAdminApiCall(`/api/super-admin/stats/growth?period=${period}`);
  },

  /**
   * Get recent activity logs
   */
  getActivityLogs: async (limit = 20) => {
    return await superAdminApiCall(`/api/super-admin/stats/activity?limit=${limit}`);
  },
};

/**
 * Package Management API
 */
export const superAdminPackageAPI = {
  /**
   * Get all packages with optional filters
   */
  getPackages: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return await superAdminApiCall(`/api/super-admin/packages?${queryParams}`);
  },

  /**
   * Get single package by ID
   */
  getPackage: async (id) => {
    return await superAdminApiCall(`/api/super-admin/packages/${id}`);
  },

  /**
   * Create new package
   */
  createPackage: async (data) => {
    return await superAdminApiCall('/api/super-admin/packages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update existing package
   */
  updatePackage: async (id, data) => {
    return await superAdminApiCall(`/api/super-admin/packages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete package
   */
  deletePackage: async (id) => {
    return await superAdminApiCall(`/api/super-admin/packages/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get organizations using a package
   */
  getPackageOrganizations: async (id) => {
    return await superAdminApiCall(`/api/super-admin/packages/${id}/organizations`);
  },
};

/**
 * Menu Management API
 */
export const superAdminMenuAPI = {
  /**
   * Get all menu items with hierarchy
   */
  getMenus: async () => {
    return await superAdminApiCall('/api/super-admin/menus');
  },

  /**
   * Get single menu item by ID
   */
  getMenu: async (id) => {
    return await superAdminApiCall(`/api/super-admin/menus/${id}`);
  },

  /**
   * Create new menu item
   */
  createMenu: async (data) => {
    return await superAdminApiCall('/api/super-admin/menus', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update menu item
   */
  updateMenu: async (id, data) => {
    return await superAdminApiCall(`/api/super-admin/menus/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete menu item
   */
  deleteMenu: async (id) => {
    return await superAdminApiCall(`/api/super-admin/menus/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Reorder menu item by swapping with adjacent sibling
   */
  reorderMenu: async (id, direction) => {
    return await superAdminApiCall(`/api/super-admin/menus/${id}/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ direction }),
    });
  },

  /**
   * Get available permission modules
   */
  getModules: async () => {
    return await superAdminApiCall('/api/super-admin/menus/modules/list');
  },
};

/**
 * Token management utilities
 */
export const superAdminTokenUtils = {
  getToken: getSuperAdminToken,
  setToken: setSuperAdminToken,
  removeToken: removeSuperAdminToken,
  isAuthenticated: () => !!getSuperAdminToken(),
};

export default {
  superAdminAuthAPI,
  superAdminOrgAPI,
  superAdminStatsAPI,
  superAdminPackageAPI,
  superAdminMenuAPI,
  superAdminTokenUtils,
};
