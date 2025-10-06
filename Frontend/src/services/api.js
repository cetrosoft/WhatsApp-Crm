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
      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (error) {
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
  inviteUser: async (email, role) => {
    return await apiCall('/api/users/invite', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
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
  tokenUtils,
};
