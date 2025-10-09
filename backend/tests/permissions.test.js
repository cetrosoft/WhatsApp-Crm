/**
 * Automated Permission Testing Framework
 *
 * Prerequisites: Backend server must be running on http://localhost:5000
 *
 * Usage: npm test -- --testNamePattern="contacts"
 *
 * This file automatically tests:
 * 1. Backend CRUD operations work for authorized roles
 * 2. Backend returns 403 with 'INSUFFICIENT_PERMISSIONS' for unauthorized roles
 * 3. All endpoints properly enforce permissions
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || '7K8mPnQ2vX9wB4cF6hJ1kL3mN5pR8sT0uV2xY4zA6bC9dE1fG3hI5jK7lM9nO0pQ';

// Test configuration - Add your resources here
const TEST_CONFIGS = {
  contacts: {
    baseUrl: '/api/crm/contacts',
    endpoints: {
      list: { method: 'get', path: '', permission: null }, // GET routes have NO permission check
      getById: { method: 'get', path: '/:id', permission: null },
      create: { method: 'post', path: '', permission: 'contacts.create' },
      update: { method: 'put', path: '/:id', permission: 'contacts.edit' },
      delete: { method: 'delete', path: '/:id', permission: 'contacts.delete' },
      updateTags: { method: 'patch', path: '/:id/tags', permission: 'contacts.edit' },
      assign: { method: 'patch', path: '/:id/assign', permission: 'contacts.edit' },
    },
    testData: {
      create: {
        first_name: 'Test',
        last_name: 'Contact',
        email: 'test@example.com',
        phone: '+1234567890',
      },
      update: {
        first_name: 'Updated',
        last_name: 'Contact',
      },
    },
  },
  companies: {
    baseUrl: '/api/crm/companies',
    endpoints: {
      list: { method: 'get', path: '', permission: null },
      getById: { method: 'get', path: '/:id', permission: null },
      create: { method: 'post', path: '', permission: 'companies.create' },
      update: { method: 'put', path: '/:id', permission: 'companies.edit' },
      delete: { method: 'delete', path: '/:id', permission: 'companies.delete' },
    },
    testData: {
      create: {
        name_en: 'Test Company',
        name_ar: 'شركة تجريبية',
      },
      update: {
        name_en: 'Updated Company',
      },
    },
  },
  segments: {
    baseUrl: '/api/crm/segments',
    endpoints: {
      list: { method: 'get', path: '', permission: null },
      getById: { method: 'get', path: '/:id', permission: null },
      create: { method: 'post', path: '', permission: 'segments.create' },
      update: { method: 'put', path: '/:id', permission: 'segments.edit' },
      delete: { method: 'delete', path: '/:id', permission: 'segments.delete' },
      calculate: { method: 'post', path: '/:id/calculate', permission: 'segments.edit' },
    },
    testData: {
      create: {
        name_en: 'Test Segment',
        name_ar: 'شريحة تجريبية',
        filter_rules: {
          operator: 'AND',
          conditions: [],
        },
      },
      update: {
        name_en: 'Updated Segment',
      },
    },
  },
};

// Role configurations from database
const ROLE_PERMISSIONS = {
  admin: [
    'contacts.view', 'contacts.create', 'contacts.edit', 'contacts.delete',
    'companies.view', 'companies.create', 'companies.edit', 'companies.delete',
    'segments.view', 'segments.create', 'segments.edit', 'segments.delete',
  ],
  manager: [
    'contacts.view', 'contacts.create', 'contacts.edit', 'contacts.delete',
    'companies.view', 'companies.create', 'companies.edit',
    'segments.view', 'segments.create', 'segments.edit',
  ],
  agent: [
    'contacts.view', 'contacts.create', 'contacts.edit',
    'companies.view',
    'segments.view',
  ],
  member: [
    'contacts.view',
    'companies.view',
    'segments.view',
  ],
  // Custom role example - POS (Point of Sale)
  pos: [
    'contacts.view', 'contacts.create',
  ],
};

// Mock JWT token generator
function generateToken(role, permissions = null) {
  const payload = {
    userId: 'test-user-id',
    organizationId: 'test-org-id',
    role: role,
    rolePermissions: permissions || ROLE_PERMISSIONS[role] || [],
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

// Helper function to check if role has permission
function hasPermission(role, permission) {
  if (!permission) return true; // No permission check required
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Main test suite generator
 * Run specific resource: npm test -- --testNamePattern="contacts"
 * Run all: npm test
 */
Object.keys(TEST_CONFIGS).forEach(resourceName => {
  const config = TEST_CONFIGS[resourceName];

  describe(`${resourceName.toUpperCase()} - Permission Enforcement Tests`, () => {
    let testResourceId;

    // Test each role against each endpoint
    Object.keys(ROLE_PERMISSIONS).forEach(role => {
      describe(`Role: ${role}`, () => {
        const token = generateToken(role);

        // Test each endpoint
        Object.keys(config.endpoints).forEach(endpointName => {
          const endpoint = config.endpoints[endpointName];
          const requiredPermission = endpoint.permission;
          const shouldHaveAccess = hasPermission(role, requiredPermission);

          describe(`${endpoint.method.toUpperCase()} ${endpointName}`, () => {
            it(`should ${shouldHaveAccess ? 'ALLOW' : 'DENY'} access`, async () => {
              // Build endpoint path
              let path = config.baseUrl + endpoint.path;

              // Replace :id with test ID if needed
              if (path.includes(':id')) {
                // For GET/DELETE, we need a valid ID
                // For now, use a mock UUID
                testResourceId = testResourceId || '123e4567-e89b-12d3-a456-426614174000';
                path = path.replace(':id', testResourceId);
              }

              // Prepare request
              let req = request(BASE_URL)[endpoint.method](path)
                .set('Authorization', `Bearer ${token}`);

              // Add body for POST/PUT/PATCH
              if (['post', 'put', 'patch'].includes(endpoint.method)) {
                const data = endpointName === 'update'
                  ? config.testData.update
                  : config.testData.create;
                req = req.send(data);
              }

              // Execute request
              const res = await req;

              if (shouldHaveAccess) {
                // Should succeed (200, 201) or fail for valid reasons (404, 400)
                // But NOT 403
                expect(res.status).not.toBe(403);

                // If it's a create operation and succeeded, save the ID
                if (endpointName === 'create' && res.status === 201 && res.body.success) {
                  testResourceId = res.body[resourceName.slice(0, -1)]?.id;
                }
              } else {
                // Should be denied with 403 and proper error code
                expect(res.status).toBe(403);
                expect(res.body.error).toBe('INSUFFICIENT_PERMISSIONS');
                expect(res.body.required_permission).toBe(requiredPermission);
              }
            });
          });
        });
      });
    });

    // Test GET routes are accessible without permission checks
    describe('GET Routes - No Permission Required', () => {
      const guestToken = generateToken('guest', []); // User with no permissions

      it('GET list should be accessible without permissions', async () => {
        const res = await request(BASE_URL)
          .get(config.baseUrl)
          .set('Authorization', `Bearer ${guestToken}`);

        // Should NOT return 403 (might return 200 or 500 depending on data)
        expect(res.status).not.toBe(403);
      });

      it('GET by ID should be accessible without permissions', async () => {
        const testId = '123e4567-e89b-12d3-a456-426614174000';
        const res = await request(BASE_URL)
          .get(`${config.baseUrl}/${testId}`)
          .set('Authorization', `Bearer ${guestToken}`);

        // Should NOT return 403 (might return 404 if not found)
        expect(res.status).not.toBe(403);
      });
    });
  });
});

/**
 * Test custom role with specific permissions
 * This tests the permission override system (grant/revoke)
 */
describe('Custom Permission Overrides', () => {
  it('should allow custom grants', async () => {
    // Create a member role but grant contacts.create
    const customPermissions = [
      ...ROLE_PERMISSIONS.member,
      'contacts.create', // Grant
    ];
    const token = generateToken('member', customPermissions);

    const res = await request(BASE_URL)
      .post('/api/crm/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        first_name: 'Custom',
        last_name: 'Permission',
        email: 'custom@test.com',
      });

    // Should succeed because of custom grant
    expect(res.status).not.toBe(403);
  });

  it('should respect custom revokes', async () => {
    // Create an admin but revoke contacts.delete
    const customPermissions = ROLE_PERMISSIONS.admin.filter(
      p => p !== 'contacts.delete'
    );
    const token = generateToken('admin', customPermissions);

    const testId = '123e4567-e89b-12d3-a456-426614174000';
    const res = await request(BASE_URL)
      .delete(`/api/crm/contacts/${testId}`)
      .set('Authorization', `Bearer ${token}`);

    // Should be denied because of custom revoke
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('INSUFFICIENT_PERMISSIONS');
  });
});

/**
 * Test error response format
 */
describe('Error Response Format', () => {
  it('should return error code, not text message', async () => {
    const memberToken = generateToken('member'); // No create permission

    const res = await request(BASE_URL)
      .post('/api/crm/contacts')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        first_name: 'Test',
        last_name: 'User',
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('INSUFFICIENT_PERMISSIONS');
    expect(res.body.error).not.toMatch(/insufficient|permissions/i); // Should NOT be English text
    expect(typeof res.body.error).toBe('string');
    expect(res.body.error).toBe(res.body.error.toUpperCase()); // Should be uppercase constant
  });
});
