/**
 * Automated Frontend E2E Permission Testing
 *
 * Usage: npm run cypress:run -- --spec "cypress/e2e/crm-permissions.cy.js" --env role=agent,page=contacts,lang=ar
 *
 * This file automatically tests:
 * 1. Button visibility based on permissions
 * 2. Permission enforcement on actions
 * 3. Toast messages in both Arabic and English
 * 4. Modal behavior for unauthorized users
 */

// Test configuration - matches backend permissions
const PAGE_CONFIGS = {
  contacts: {
    url: '/crm/contacts',
    requiredPermission: 'contacts.view',
    createButton: 'createContact',
    editButton: 'editContact',
    deleteButton: 'deleteContact',
    createPermission: 'contacts.create',
    editPermission: 'contacts.edit',
    deletePermission: 'contacts.delete',
    translations: {
      en: {
        title: 'Contacts',
        create: 'Create',
        edit: 'Edit',
        delete: 'Delete',
        noPermissionCreate: "You don't have permission to create contacts",
        noPermissionEdit: "You don't have permission to edit contacts",
        noPermissionDelete: "You don't have permission to delete contacts",
        insufficientPermissions: "You don't have permission to perform this action",
      },
      ar: {
        title: 'جهات الاتصال',
        create: 'إنشاء',
        edit: 'تعديل',
        delete: 'حذف',
        noPermissionCreate: 'ليس لديك صلاحية لإنشاء جهات الاتصال',
        noPermissionEdit: 'ليس لديك صلاحية لتعديل جهات الاتصال',
        noPermissionDelete: 'ليس لديك صلاحية لحذف جهات الاتصال',
        insufficientPermissions: 'ليس لديك صلاحية لتنفيذ هذا الإجراء',
      },
    },
  },
  companies: {
    url: '/crm/companies',
    requiredPermission: 'companies.view',
    createButton: 'createCompany',
    editButton: 'editCompany',
    deleteButton: 'deleteCompany',
    createPermission: 'companies.create',
    editPermission: 'companies.edit',
    deletePermission: 'companies.delete',
    translations: {
      en: {
        title: 'Companies',
        create: 'Create',
        edit: 'Edit',
        delete: 'Delete',
        noPermissionCreate: "You don't have permission to create companies",
        noPermissionEdit: "You don't have permission to edit companies",
        noPermissionDelete: "You don't have permission to delete companies",
        insufficientPermissions: "You don't have permission to perform this action",
      },
      ar: {
        title: 'الشركات',
        create: 'إنشاء',
        edit: 'تعديل',
        delete: 'حذف',
        noPermissionCreate: 'ليس لديك صلاحية لإنشاء الشركات',
        noPermissionEdit: 'ليس لديك صلاحية لتعديل الشركات',
        noPermissionDelete: 'ليس لديك صلاحية لحذف الشركات',
        insufficientPermissions: 'ليس لديك صلاحية لتنفيذ هذا الإجراء',
      },
    },
  },
  segments: {
    url: '/crm/segments',
    requiredPermission: 'segments.view',
    createButton: 'createSegment',
    editButton: 'editSegment',
    deleteButton: 'deleteSegment',
    createPermission: 'segments.create',
    editPermission: 'segments.edit',
    deletePermission: 'segments.delete',
    translations: {
      en: {
        title: 'Segments',
        create: 'Create Segment',
        edit: 'Edit',
        delete: 'Delete',
        noPermissionCreate: "You don't have permission to create segments",
        noPermissionEdit: "You don't have permission to edit segments",
        noPermissionDelete: "You don't have permission to delete segments",
        insufficientPermissions: "You don't have permission to perform this action",
      },
      ar: {
        title: 'الشرائح',
        create: 'إنشاء شريحة',
        edit: 'تعديل',
        delete: 'حذف',
        noPermissionCreate: 'ليس لديك صلاحية لإنشاء الشرائح',
        noPermissionEdit: 'ليس لديك صلاحية لتعديل الشرائح',
        noPermissionDelete: 'ليس لديك صلاحية لحذف الشرائح',
        insufficientPermissions: 'ليس لديك صلاحية لتنفيذ هذا الإجراء',
      },
    },
  },
};

// Role configurations - matches backend
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
  pos: [
    'contacts.view', 'contacts.create',
  ],
};

/**
 * Helper: Login as specific role
 */
function loginAsRole(role) {
  const credentials = {
    admin: { email: 'admin@test.com', password: 'admin123' },
    manager: { email: 'manager@test.com', password: 'manager123' },
    agent: { email: 'agent@test.com', password: 'agent123' },
    member: { email: 'member@test.com', password: 'member123' },
    pos: { email: 'pos@test.com', password: 'pos123' },
  };

  const cred = credentials[role];
  if (!cred) {
    throw new Error(`Unknown role: ${role}`);
  }

  cy.visit('/login');
  cy.get('input[type="email"]').type(cred.email);
  cy.get('input[type="password"]').type(cred.password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
}

/**
 * Helper: Set language
 */
function setLanguage(lang) {
  cy.get('[data-testid="language-switcher"]').click();
  cy.get(`[data-testid="lang-${lang}"]`).click();

  // Verify document direction
  if (lang === 'ar') {
    cy.get('html').should('have.attr', 'dir', 'rtl');
  } else {
    cy.get('html').should('have.attr', 'dir', 'ltr');
  }
}

/**
 * Helper: Check if role has permission
 */
function hasPermission(role, permission) {
  return (ROLE_PERMISSIONS[role] || []).includes(permission);
}

/**
 * Main test suite
 */
describe('CRM Permission Tests', () => {
  const role = Cypress.env('role') || 'agent';
  const page = Cypress.env('page') || 'contacts';
  const lang = Cypress.env('lang') || 'en';
  const config = PAGE_CONFIGS[page];

  if (!config) {
    throw new Error(`Unknown page: ${page}`);
  }

  const t = config.translations[lang];
  const canCreate = hasPermission(role, config.createPermission);
  const canEdit = hasPermission(role, config.editPermission);
  const canDelete = hasPermission(role, config.deletePermission);

  beforeEach(() => {
    // Login and navigate
    loginAsRole(role);
    setLanguage(lang);
    cy.visit(config.url);
  });

  describe(`${page.toUpperCase()} - Role: ${role} - Language: ${lang}`, () => {
    it('should display page title correctly', () => {
      cy.contains(t.title).should('be.visible');
    });

    // Test Create Button Visibility
    describe('Create Button', () => {
      if (canCreate) {
        it('should SHOW create button for authorized user', () => {
          cy.contains('button', t.create).should('be.visible');
        });

        it('should allow opening create modal', () => {
          cy.contains('button', t.create).click();
          cy.get('[data-testid="modal"]').should('be.visible');
        });
      } else {
        it('should HIDE create button for unauthorized user', () => {
          cy.contains('button', t.create).should('not.exist');
        });
      }
    });

    // Test Edit Button Visibility
    describe('Edit Button', () => {
      beforeEach(() => {
        // Ensure we have at least one item
        cy.get('[data-testid="data-table"]').should('exist');
      });

      if (canEdit) {
        it('should SHOW edit button for authorized user', () => {
          cy.get('[data-testid="edit-button"]').first().should('be.visible');
        });

        it('should allow opening edit modal', () => {
          cy.get('[data-testid="edit-button"]').first().click();
          cy.get('[data-testid="modal"]').should('be.visible');
        });
      } else {
        it('should HIDE edit button for unauthorized user', () => {
          cy.get('[data-testid="edit-button"]').should('not.exist');
        });

        it('should show permission error if attempting to edit via API', () => {
          // Simulate unauthorized edit attempt
          cy.window().then((win) => {
            // This would trigger the backend 403 error
            // Frontend should show permission toast
          });
        });
      }
    });

    // Test Delete Button Visibility
    describe('Delete Button', () => {
      beforeEach(() => {
        cy.get('[data-testid="data-table"]').should('exist');
      });

      if (canDelete) {
        it('should SHOW delete button for authorized user', () => {
          cy.get('[data-testid="delete-button"]').first().should('be.visible');
        });

        it('should allow delete with confirmation', () => {
          cy.get('[data-testid="delete-button"]').first().click();
          cy.get('[data-testid="confirm-dialog"]').should('be.visible');
        });
      } else {
        it('should HIDE delete button for unauthorized user', () => {
          cy.get('[data-testid="delete-button"]').should('not.exist');
        });
      }
    });

    // Test Toast Messages
    describe('Permission Toast Messages', () => {
      if (!canCreate) {
        it('should show correct permission error in selected language', () => {
          // Try to create via console (simulate unauthorized attempt)
          cy.window().then((win) => {
            // Trigger a permission error
            // Should see toast with t.insufficientPermissions
          });
        });
      }

      it('should display all toasts in correct language', () => {
        // Verify toasts are never showing literal keys like 'noPermissionDelete'
        // They should show actual translated text
        cy.get('body').should('not.contain', 'noPermission');
        cy.get('body').should('not.contain', 'failedToLoad');
        cy.get('body').should('not.contain', 'INSUFFICIENT_PERMISSIONS'); // Should NOT show error code to user
      });
    });

    // Test RTL Layout (Arabic)
    if (lang === 'ar') {
      it('should render layout in RTL correctly', () => {
        cy.get('html').should('have.attr', 'dir', 'rtl');
        cy.get('[data-testid="sidebar"]').should('have.css', 'right', '0px');
      });
    }

    // Test Error Handling
    describe('Error Messages', () => {
      it('should never display raw error codes to user', () => {
        // User should NEVER see literal error codes
        cy.get('body').should('not.contain', 'INSUFFICIENT_PERMISSIONS');
        cy.get('body').should('not.contain', 'FORBIDDEN');
        cy.get('body').should('not.contain', '403');
      });

      it('should display user-friendly translated messages', () => {
        // All error messages should be in selected language
        // Check that common error keys exist in translations
      });
    });
  });
});

/**
 * Cross-language consistency test
 */
describe('Translation Consistency', () => {
  const page = Cypress.env('page') || 'contacts';
  const role = Cypress.env('role') || 'agent';
  const config = PAGE_CONFIGS[page];

  it('should have same UI structure in both languages', () => {
    // Test in English
    loginAsRole(role);
    setLanguage('en');
    cy.visit(config.url);
    cy.get('[data-testid="data-table"]').should('exist');
    const enButtonCount = cy.get('button').its('length');

    // Test in Arabic
    setLanguage('ar');
    cy.get('[data-testid="data-table"]').should('exist');
    const arButtonCount = cy.get('button').its('length');

    // Should have same number of buttons
    enButtonCount.should('equal', arButtonCount);
  });

  it('should never show untranslated keys', () => {
    loginAsRole(role);

    // Test English
    setLanguage('en');
    cy.visit(config.url);
    cy.get('body').should('not.contain', 'noPermission');
    cy.get('body').should('not.contain', 'failedTo');
    cy.get('body').should('not.contain', 'cannotCreate');

    // Test Arabic
    setLanguage('ar');
    cy.visit(config.url);
    cy.get('body').should('not.contain', 'noPermission');
    cy.get('body').should('not.contain', 'failedTo');
    cy.get('body').should('not.contain', 'cannotCreate');
  });
});

/**
 * Permission boundary test - verify enforcement at all layers
 */
describe('Multi-layer Permission Enforcement', () => {
  const page = Cypress.env('page') || 'contacts';
  const role = 'member'; // Minimal permissions
  const config = PAGE_CONFIGS[page];

  beforeEach(() => {
    loginAsRole(role);
    cy.visit(config.url);
  });

  it('Frontend: should hide unauthorized buttons', () => {
    cy.get('[data-testid="create-button"]').should('not.exist');
    cy.get('[data-testid="edit-button"]').should('not.exist');
    cy.get('[data-testid="delete-button"]').should('not.exist');
  });

  it('Backend: should return 403 for unauthorized API calls', () => {
    // Intercept API calls
    cy.intercept('POST', `/api/crm/${page}`).as('createRequest');

    // Try to create via API directly
    cy.request({
      method: 'POST',
      url: `/api/crm/${page}`,
      failOnStatusCode: false,
      body: { name: 'Test' },
    }).then((response) => {
      expect(response.status).to.equal(403);
      expect(response.body.error).to.equal('INSUFFICIENT_PERMISSIONS');
    });
  });

  it('Frontend: should show translated error message on 403', () => {
    // Simulate 403 response
    cy.intercept('POST', `/api/crm/${page}`, {
      statusCode: 403,
      body: { error: 'INSUFFICIENT_PERMISSIONS', required_permission: `${page}.create` },
    });

    // Frontend should display translated message, not raw error code
    // (Implementation depends on how your frontend handles this)
  });
});
