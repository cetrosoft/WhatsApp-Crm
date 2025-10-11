/**
 * API Service
 * Centralized HTTP client with authentication and error handling
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Get auth token from localStorage
 */
const getToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * Set auth token to localStorage
 */
const setToken = (token) => {
  localStorage.setItem('authToken', token);
};

/**
 * Remove auth token from localStorage
 */
const removeToken = () => {
  localStorage.removeItem('authToken');
};

/**
 * Generic fetch wrapper with authentication
 */
const apiCall = async (endpoint, options = {}) => {
  const token = getToken();

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
        data: { message: 'Network error' }
      };
    }
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Authentication API
 */
export const authAPI = {
  /**
   * Register new organization and admin user
   */
  register: async (data) => {
    const response = await apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.token) {
      setToken(response.token);
    }

    return response;
  },

  /**
   * Login existing user
   */
  login: async (email, password) => {
    const response = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.token) {
      setToken(response.token);
    }

    return response;
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await apiCall('/api/auth/logout', {
        method: 'POST',
      });
    } finally {
      removeToken();
    }
  },

  /**
   * Get current user info
   */
  getMe: async () => {
    return await apiCall('/api/auth/me');
  },

  /**
   * Change password (self-service)
   */
  changePassword: async (currentPassword, newPassword) => {
    return await apiCall('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

/**
 * User Management API
 */
export const userAPI = {
  /**
   * Get all users in organization
   */
  getUsers: async () => {
    return await apiCall('/api/users');
  },

  /**
   * Invite user to organization
   */
  inviteUser: async (email, role = null, roleId = null) => {
    return await apiCall('/api/users/invite', {
      method: 'POST',
      body: JSON.stringify({ email, role, roleId }),
    });
  },

  /**
   * Verify invitation token
   */
  verifyInvitation: async (token) => {
    return await apiCall(`/api/users/verify-invitation/${token}`);
  },

  /**
   * Accept invitation and create account
   */
  acceptInvitation: async (token, password, fullName) => {
    const response = await apiCall('/api/users/accept-invitation', {
      method: 'POST',
      body: JSON.stringify({ token, password, fullName }),
    });

    if (response.token) {
      setToken(response.token);
    }

    return response;
  },

  /**
   * Update user
   */
  updateUser: async (userId, data) => {
    return await apiCall(`/api/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete/deactivate user
   */
  deleteUser: async (userId) => {
    return await apiCall(`/api/users/${userId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Update own profile (self-service)
   */
  updateProfile: async (data) => {
    return await apiCall('/api/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

/**
 * Package Management API
 */
export const packageAPI = {
  /**
   * Get all active packages
   */
  getPackages: async () => {
    return await apiCall('/api/packages');
  },

  /**
   * Get package by slug
   */
  getPackage: async (slug) => {
    return await apiCall(`/api/packages/${slug}`);
  },

  /**
   * Get current organization's package
   */
  getCurrentPackage: async () => {
    return await apiCall('/api/packages/organization/current');
  },

  /**
   * Upgrade/downgrade package
   */
  upgradePackage: async (packageSlug) => {
    return await apiCall('/api/packages/organization/upgrade', {
      method: 'POST',
      body: JSON.stringify({ package_slug: packageSlug }),
    });
  },

  /**
   * Check if organization has a feature
   */
  hasFeature: async (featureName) => {
    return await apiCall(`/api/packages/organization/check-feature/${featureName}`);
  },
};

/**
 * Organization Management API
 */
export const organizationAPI = {
  /**
   * Get current organization details
   */
  getCurrent: async () => {
    return await apiCall('/api/organization');
  },

  /**
   * Update organization details
   */
  update: async (data) => {
    return await apiCall('/api/organization', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Upload organization logo
   */
  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append('logo', file);

    const token = getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}/api/organization/logo`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload logo');
      }

      return data;
    } catch (error) {
      console.error('Upload logo error:', error);
      throw error;
    }
  },
};

/**
 * Permission Management API
 */
export const permissionAPI = {
  /**
   * Get all available permissions grouped by category
   */
  getAvailablePermissions: async () => {
    return await apiCall('/api/users/permissions/available');
  },

  /**
   * Get user's effective permissions
   */
  getUserPermissions: async (userId) => {
    return await apiCall(`/api/users/${userId}/permissions`);
  },

  /**
   * Update user's custom permissions
   */
  updateUserPermissions: async (userId, grant = [], revoke = []) => {
    return await apiCall(`/api/users/${userId}/permissions`, {
      method: 'PATCH',
      body: JSON.stringify({ grant, revoke }),
    });
  },
};

/**
 * Role Management API
 */
export const roleAPI = {
  /**
   * Get all roles in organization (system + custom)
   */
  getRoles: async () => {
    return await apiCall('/api/roles');
  },

  /**
   * Get single role by ID
   */
  getRole: async (roleId) => {
    return await apiCall(`/api/roles/${roleId}`);
  },

  /**
   * Create a new custom role
   */
  createRole: async (roleData) => {
    return await apiCall('/api/roles', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  },

  /**
   * Update a custom role
   */
  updateRole: async (roleId, roleData) => {
    return await apiCall(`/api/roles/${roleId}`, {
      method: 'PATCH',
      body: JSON.stringify(roleData),
    });
  },

  /**
   * Delete a custom role
   */
  deleteRole: async (roleId) => {
    return await apiCall(`/api/roles/${roleId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get users assigned to a role
   */
  getRoleUsers: async (roleId) => {
    return await apiCall(`/api/roles/${roleId}/users`);
  },
};

/**
 * Token management utilities
 */
/**
 * Contact Management API
 */
export const contactAPI = {
  /**
   * Get all contacts with pagination and filters
   */
  getContacts: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return await apiCall(`/api/crm/contacts?${queryParams}`);
  },

  /**
   * Get single contact by ID
   */
  getContact: async (id) => {
    return await apiCall(`/api/crm/contacts/${id}`);
  },

  /**
   * Create new contact
   */
  createContact: async (data) => {
    return await apiCall('/api/crm/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update contact
   */
  updateContact: async (id, data) => {
    return await apiCall(`/api/crm/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete contact
   */
  deleteContact: async (id, permanent = false) => {
    return await apiCall(`/api/crm/contacts/${id}?permanent=${permanent}`, {
      method: 'DELETE',
    });
  },

  /**
   * Upload contact avatar
   */
  uploadAvatar: async (id, file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}/api/crm/contacts/${id}/avatar`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload avatar');
      }

      return data;
    } catch (error) {
      console.error('Upload avatar error:', error);
      throw error;
    }
  },

  /**
   * Get contact statistics
   */
  getStats: async () => {
    return await apiCall('/api/crm/contacts/stats');
  },
};

/**
 * Country Lookup API
 */
export const countryAPI = {
  /**
   * Get all countries
   */
  getCountries: async () => {
    return await apiCall('/api/countries');
  },

  /**
   * Get single country by code
   */
  getCountry: async (code) => {
    return await apiCall(`/api/countries/${code}`);
  },
};

/**
 * Status Lookup API
 */
export const statusAPI = {
  /**
   * Get contact statuses
   */
  getContactStatuses: async () => {
    return await apiCall('/api/statuses/contacts');
  },

  /**
   * Get company statuses
   */
  getCompanyStatuses: async () => {
    return await apiCall('/api/statuses/companies');
  },

  /**
   * Create a new contact status
   */
  createContactStatus: async (data) => {
    return await apiCall('/api/statuses/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a contact status
   */
  updateContactStatus: async (id, data) => {
    return await apiCall(`/api/statuses/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a contact status (soft delete)
   */
  deleteContactStatus: async (id) => {
    return await apiCall(`/api/statuses/contacts/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Tags API
 */
export const tagAPI = {
  /**
   * Get all tags for organization
   */
  getTags: async () => {
    return await apiCall('/api/tags');
  },

  /**
   * Create a new tag
   */
  createTag: async (data) => {
    return await apiCall('/api/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a tag
   */
  updateTag: async (id, data) => {
    return await apiCall(`/api/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a tag
   */
  deleteTag: async (id) => {
    return await apiCall(`/api/tags/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Lead Sources API
 */
export const leadSourceAPI = {
  /**
   * Get all lead sources
   */
  getLeadSources: async () => {
    return await apiCall('/api/lead-sources');
  },

  /**
   * Create a new lead source
   */
  createLeadSource: async (data) => {
    return await apiCall('/api/lead-sources', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a lead source
   */
  updateLeadSource: async (id, data) => {
    return await apiCall(`/api/lead-sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a lead source (soft delete)
   */
  deleteLeadSource: async (id) => {
    return await apiCall(`/api/lead-sources/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Segments API
 */
export const segmentAPI = {
  /**
   * Get all segments
   */
  getSegments: async () => {
    return await apiCall('/api/segments');
  },

  /**
   * Get single segment
   */
  getSegment: async (id) => {
    return await apiCall(`/api/segments/${id}`);
  },

  /**
   * Get contacts in segment
   */
  getSegmentContacts: async (id, page = 1, limit = 20) => {
    return await apiCall(`/api/segments/${id}/contacts?page=${page}&limit=${limit}`);
  },

  /**
   * Create new segment
   */
  createSegment: async (data) => {
    return await apiCall('/api/segments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update segment
   */
  updateSegment: async (id, data) => {
    return await apiCall(`/api/segments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete segment
   */
  deleteSegment: async (id) => {
    return await apiCall(`/api/segments/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Recalculate segment contact count
   */
  calculateSegment: async (id) => {
    return await apiCall(`/api/segments/${id}/calculate`, {
      method: 'POST',
    });
  },
};

/**
 * Company Management API
 */
export const companyAPI = {
  /**
   * Get all companies with pagination and filters
   */
  getCompanies: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return await apiCall(`/api/crm/companies?${queryParams}`);
  },

  /**
   * Get single company by ID
   */
  getCompany: async (id) => {
    return await apiCall(`/api/crm/companies/${id}`);
  },

  /**
   * Create new company
   */
  createCompany: async (data) => {
    return await apiCall('/api/crm/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update company
   */
  updateCompany: async (id, data) => {
    return await apiCall(`/api/crm/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete company
   */
  deleteCompany: async (id, permanent = false) => {
    return await apiCall(`/api/crm/companies/${id}?permanent=${permanent}`, {
      method: 'DELETE',
    });
  },

  /**
   * Upload company logo
   */
  uploadLogo: async (id, file) => {
    const formData = new FormData();
    formData.append('logo', file);

    const token = getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}/api/crm/companies/${id}/logo`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload logo');
      }

      return data;
    } catch (error) {
      console.error('Upload logo error:', error);
      throw error;
    }
  },

  /**
   * Upload legal document
   */
  uploadDocument: async (id, file) => {
    const formData = new FormData();
    formData.append('document', file);

    const token = getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}/api/crm/companies/${id}/document`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload document');
      }

      return data;
    } catch (error) {
      console.error('Upload document error:', error);
      throw error;
    }
  },

  /**
   * Delete legal document
   */
  deleteDocument: async (id, documentId) => {
    return await apiCall(`/api/crm/companies/${id}/document/${documentId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get company statistics
   */
  getStats: async () => {
    return await apiCall('/api/crm/companies/stats');
  },
};

/**
 * Deal API
 * Endpoints for managing sales deals
 */
export const dealAPI = {
  /**
   * Get all deals with optional filters
   */
  getDeals: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiCall(`/api/crm/deals${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get deal statistics
   */
  getDealStats: async () => {
    return await apiCall('/api/crm/deals/stats');
  },

  /**
   * Get single deal by ID
   */
  getDeal: async (id) => {
    return await apiCall(`/api/crm/deals/${id}`);
  },

  /**
   * Create new deal
   */
  createDeal: async (data) => {
    return await apiCall('/api/crm/deals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update deal
   */
  updateDeal: async (id, data) => {
    return await apiCall(`/api/crm/deals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete deal
   */
  deleteDeal: async (id) => {
    return await apiCall(`/api/crm/deals/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Move deal to different stage
   */
  moveDealToStage: async (id, stageId) => {
    return await apiCall(`/api/crm/deals/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage_id: stageId }),
    });
  },

  /**
   * Assign deal to user
   */
  assignDeal: async (id, userId) => {
    return await apiCall(`/api/crm/deals/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assigned_to: userId }),
    });
  },

  /**
   * Get deal activities/history
   */
  getDealActivities: async (id) => {
    return await apiCall(`/api/crm/deals/${id}/activities`);
  },

  /**
   * Add note to deal
   */
  addNote: async (id, note) => {
    return await apiCall(`/api/crm/deals/${id}/note`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },
};

/**
 * Pipeline API
 * Endpoints for managing sales pipelines
 */
export const pipelineAPI = {
  /**
   * Get all pipelines
   */
  getPipelines: async () => {
    return await apiCall('/api/crm/pipelines');
  },

  /**
   * Get single pipeline by ID
   */
  getPipeline: async (id) => {
    return await apiCall(`/api/crm/pipelines/${id}`);
  },

  /**
   * Create new pipeline
   */
  createPipeline: async (data) => {
    return await apiCall('/api/crm/pipelines', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update pipeline
   */
  updatePipeline: async (id, data) => {
    return await apiCall(`/api/crm/pipelines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete pipeline
   */
  deletePipeline: async (id) => {
    return await apiCall(`/api/crm/pipelines/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get all deals for a pipeline (Kanban data)
   */
  getPipelineDeals: async (id) => {
    return await apiCall(`/api/crm/pipelines/${id}/deals`);
  },

  /**
   * Create new stage in pipeline
   */
  createStage: async (pipelineId, data) => {
    return await apiCall(`/api/crm/pipelines/${pipelineId}/stages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update stage
   */
  updateStage: async (pipelineId, stageId, data) => {
    return await apiCall(`/api/crm/pipelines/${pipelineId}/stages/${stageId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete stage
   */
  deleteStage: async (pipelineId, stageId) => {
    return await apiCall(`/api/crm/pipelines/${pipelineId}/stages/${stageId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Reorder stages
   */
  reorderStages: async (pipelineId, stages) => {
    return await apiCall(`/api/crm/pipelines/${pipelineId}/stages/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ stages }),
    });
  },
};

/**
 * Menu API
 * Endpoints for dynamic menu management
 */
export const menuAPI = {
  /**
   * Get menu structure for authenticated user
   * Filters based on package features and user permissions
   */
  getMenu: async (lang = 'en') => {
    return await apiCall(`/api/menu?lang=${lang}`);
  },

  /**
   * Get all menu items (Admin only)
   */
  getAllMenuItems: async () => {
    return await apiCall('/api/menu/all');
  },

  /**
   * Create new menu item (Admin only)
   */
  createMenuItem: async (data) => {
    return await apiCall('/api/menu', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update menu item (Admin only)
   */
  updateMenuItem: async (key, data) => {
    return await apiCall(`/api/menu/${key}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete menu item (Admin only, non-system items only)
   */
  deleteMenuItem: async (key) => {
    return await apiCall(`/api/menu/${key}`, {
      method: 'DELETE',
    });
  },
};

export const tokenUtils = {
  getToken,
  setToken,
  removeToken,
  isAuthenticated: () => !!getToken(),
};

export default {
  authAPI,
  userAPI,
  packageAPI,
  organizationAPI,
  contactAPI,
  countryAPI,
  statusAPI,
  tagAPI,
  leadSourceAPI,
  segmentAPI,
  companyAPI,
  dealAPI,
  pipelineAPI,
  permissionAPI,
  menuAPI,
  tokenUtils,
};
