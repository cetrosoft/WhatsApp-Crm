# Automated Testing Guide

## Overview

This guide explains the **fully automated testing framework** for the Omnichannel CRM platform. After implementing a new feature following the [Quick Start Guide](../guides/QUICK_START_NEW_FEATURE.md), you can run automated tests to verify everything works correctly.

## What Gets Tested Automatically

The testing framework validates **three critical areas**:

### 1. **Backend API Permission Enforcement**
- All CRUD endpoints (GET, POST, PUT, DELETE, PATCH)
- Permission checks for each role (admin, manager, agent, member, custom roles)
- Error responses return error codes (not hardcoded text)
- GET endpoints are accessible without permission checks (for dropdowns)
- Write operations (POST/PUT/DELETE) require proper permissions

### 2. **Frontend UI Permission Enforcement**
- Button visibility based on user permissions
- Modal opening/closing behavior
- Permission error handling
- Toast message display

### 3. **Translation Quality**
- All messages display in both English and Arabic
- No literal translation keys shown to users (e.g., "noPermissionDelete")
- No raw error codes shown to users (e.g., "INSUFFICIENT_PERMISSIONS")
- RTL layout works correctly for Arabic

---

## Quick Start

### Prerequisites

1. **Install dependencies**:
```bash
npm run install:all
```

This installs:
- Backend: Jest + Supertest for API testing
- Frontend: Cypress for E2E testing

2. **Configure JWT Secret** (IMPORTANT):

Edit `backend/tests/permissions.test.js` line 18:
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
```

Replace `'your-secret-key-here'` with your actual JWT_SECRET from `backend/.env`

3. **Start your servers** (in separate terminals):
```bash
# Terminal 1: Backend (port 5000)
npm run dev:backend

# Terminal 2: Frontend (port 5173)
npm run dev:frontend
```

4. **Ensure test users exist** in your database with these credentials:

| Role    | Email             | Password   | Permissions                            |
|---------|-------------------|------------|----------------------------------------|
| admin   | admin@test.com    | admin123   | All permissions                        |
| manager | manager@test.com  | manager123 | Most permissions (no delete)           |
| agent   | agent@test.com    | agent123   | View, create, edit only                |
| member  | member@test.com   | member123  | View only                              |
| pos     | pos@test.com      | pos123     | View + create contacts only            |

---

## Running Tests

### Option 1: **Automated Full Test Suite** (Recommended)

Run **all tests** (backend + frontend) with a single command:

```bash
npm run test:permissions <resource> <role> [options]
```

**Examples:**

```bash
# Test contacts for agent role (English only)
npm run test:permissions contacts agent

# Test companies for manager role (Arabic only)
npm run test:permissions companies manager --lang=ar

# Test segments for admin role (both English and Arabic)
npm run test:permissions segments admin --full
```

**What this does:**
1. Runs backend Jest tests for all roles against the resource
2. Runs frontend Cypress tests in English
3. Runs frontend Cypress tests in Arabic (if `--full` flag)
4. Generates an HTML report with results and screenshots

**Output:**
- Console: Real-time test progress with ✅/❌ indicators
- Report: `test-reports/permission-tests-<resource>-<role>-<timestamp>.html`

---

### Option 2: **Backend Tests Only**

Test API permission enforcement without running frontend tests:

```bash
cd backend
npm test -- --testNamePattern="contacts"
```

**What this tests:**
- ✅ Admin can create/edit/delete contacts
- ✅ Manager can create/edit contacts but NOT delete
- ✅ Agent can view/create/edit contacts
- ✅ Member can only view contacts
- ✅ POS can view/create contacts
- ✅ Unauthorized requests return `403` with `INSUFFICIENT_PERMISSIONS` error code
- ✅ GET endpoints work without permission checks

**Test Results:**
```
PASS  tests/permissions.test.js
  CONTACTS - Permission Enforcement Tests
    Role: admin
      ✓ GET list should ALLOW access (45ms)
      ✓ POST create should ALLOW access (89ms)
      ✓ PUT update should ALLOW access (67ms)
      ✓ DELETE delete should ALLOW access (54ms)
    Role: agent
      ✓ GET list should ALLOW access (32ms)
      ✓ POST create should ALLOW access (78ms)
      ✓ PUT update should ALLOW access (65ms)
      ✓ DELETE delete should DENY access (41ms) ✅ Returns 403
```

---

### Option 3: **Frontend Tests Only**

Test UI permission enforcement and translations:

```bash
cd Frontend
npm run cypress:run -- --env role=agent,page=contacts,lang=en
```

**Parameters:**
- `role`: admin, manager, agent, member, pos
- `page`: contacts, companies, segments
- `lang`: en, ar

**What this tests:**
- ✅ Create button hidden if user lacks `contacts.create` permission
- ✅ Edit button hidden if user lacks `contacts.edit` permission
- ✅ Delete button hidden if user lacks `contacts.delete` permission
- ✅ Clicking unauthorized actions shows translated error toast
- ✅ No literal translation keys visible (e.g., "noPermissionDelete")
- ✅ No raw error codes visible (e.g., "INSUFFICIENT_PERMISSIONS")
- ✅ RTL layout works for Arabic

**Test Results:**
```
  Running: crm-permissions.cy.js

  CONTACTS - Role: agent - Language: en
    ✓ should display page title correctly
    Create Button
      ✓ should SHOW create button for authorized user
    Edit Button
      ✓ should SHOW edit button for authorized user
    Delete Button
      ✓ should HIDE delete button for unauthorized user
    Permission Toast Messages
      ✓ should never show literal translation keys
```

---

## Understanding Test Results

### ✅ **All Tests Pass**

If all tests pass, you'll see:

```
==========================================================
  Test Suite Completed Successfully!
==========================================================
✅ All tests passed in 45.32s
ℹ️  View detailed report in test-reports/ directory
```

**Open the HTML report** to see:
- Total tests: 24
- Passed: 24 ✅
- Failed: 0
- Detailed breakdown by test category

### ❌ **Some Tests Fail**

If tests fail, the report shows exactly what went wrong:

**Example Failure:**

```
❌ Backend Permission Tests
   Role: agent
   DELETE /api/crm/contacts/:id should DENY access

   Expected: 403
   Received: 200

   ⚠️  Agent was able to delete contacts despite lacking permission!
```

**How to fix:**
1. Check `backend/routes/contactRoutes.js`
2. Ensure DELETE route has `requirePermission(PERMISSIONS.CONTACTS_DELETE)`
3. Re-run tests

---

## Test Configuration

### Adding a New Resource to Tests

Edit **backend/tests/permissions.test.js**:

```javascript
const TEST_CONFIGS = {
  // ... existing configs ...

  products: {
    baseUrl: '/api/crm/products',
    endpoints: {
      list: { method: 'get', path: '', permission: null },
      getById: { method: 'get', path: '/:id', permission: null },
      create: { method: 'post', path: '', permission: 'products.create' },
      update: { method: 'put', path: '/:id', permission: 'products.edit' },
      delete: { method: 'delete', path: '/:id', permission: 'products.delete' },
    },
    testData: {
      create: { name_en: 'Test Product', price: 99.99 },
      update: { name_en: 'Updated Product' },
    },
  },
};
```

Edit **Frontend/cypress/e2e/crm-permissions.cy.js**:

```javascript
const PAGE_CONFIGS = {
  // ... existing configs ...

  products: {
    url: '/crm/products',
    requiredPermission: 'products.view',
    createPermission: 'products.create',
    editPermission: 'products.edit',
    deletePermission: 'products.delete',
    translations: {
      en: {
        title: 'Products',
        create: 'Create Product',
        insufficientPermissions: "You don't have permission to perform this action",
      },
      ar: {
        title: 'المنتجات',
        create: 'إنشاء منتج',
        insufficientPermissions: 'ليس لديك صلاحية لتنفيذ هذا الإجراء',
      },
    },
  },
};
```

Now run:
```bash
npm run test:permissions products agent
```

---

## Common Test Failures and Fixes

### ❌ "GET endpoint returns 403"

**Problem:** GET routes have permission checks, breaking dropdowns.

**Fix:**
```javascript
// ❌ Wrong
router.get('/', requirePermission(PERMISSIONS.CONTACTS_VIEW), async (req, res) => {

// ✅ Correct
router.get('/', async (req, res) => {
```

---

### ❌ "Backend returns hardcoded error message"

**Problem:** Backend sends English text instead of error code.

**Fix in `middleware/auth.js`:**
```javascript
// ❌ Wrong
return res.status(403).json({ error: 'Insufficient permissions' });

// ✅ Correct
return res.status(403).json({ error: 'INSUFFICIENT_PERMISSIONS' });
```

---

### ❌ "Frontend shows literal translation key"

**Problem:** Toast uses wrong namespace.

**Fix:**
```javascript
// ❌ Wrong
const { t } = useTranslation('contacts');
toast.error(t('insufficientPermissions')); // Key not found in 'contacts' namespace

// ✅ Correct
const { t } = useTranslation(['contacts', 'common']);
toast.error(t('insufficientPermissions', { ns: 'common' }));
```

---

### ❌ "User can perform unauthorized action"

**Problem:** Missing `requirePermission()` middleware on route.

**Fix:**
```javascript
// ❌ Wrong - Anyone can update
router.put('/:id', async (req, res) => {

// ✅ Correct - Only users with permission can update
router.put('/:id', requirePermission(PERMISSIONS.CONTACTS_EDIT), async (req, res) => {
```

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/test-permissions.yml`:

```yaml
name: Permission Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm run install:all

      - name: Start backend
        run: npm run dev:backend &

      - name: Start frontend
        run: npm run dev:frontend &

      - name: Wait for servers
        run: npx wait-on http://localhost:5000 http://localhost:5173

      - name: Run permission tests
        run: npm run test:permissions contacts agent --full

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-report
          path: test-reports/
```

---

## Best Practices

### ✅ **DO:**
- Run tests after implementing each new feature
- Test with multiple roles (especially least-privileged roles like "member")
- Test in both English and Arabic (`--full` flag)
- Check the HTML report for detailed results
- Add new resources to test configs immediately

### ❌ **DON'T:**
- Skip tests because "it looks fine"
- Only test with admin role
- Ignore translation tests
- Commit code without running tests
- Hardcode role checks (`if (user.role === 'admin')`)

---

## Troubleshooting

### "Cannot find module 'jest'"

```bash
cd backend
npm install
```

### "Cypress not found"

```bash
cd Frontend
npm install
```

### "Test users don't exist"

Create test users in Supabase:
1. Go to Authentication → Users
2. Create users with emails: admin@test.com, agent@test.com, etc.
3. Assign appropriate roles in `users` table

### "Tests timeout"

Increase Cypress timeout in `Frontend/cypress.config.js`:
```javascript
defaultCommandTimeout: 20000, // 20 seconds
```

---

## Summary

1. **Quick Implementation**: Follow [Quick Start Guide](../guides/QUICK_START_NEW_FEATURE.md) (15 minutes)
2. **Automated Testing**: Run `npm run test:permissions <resource> <role>` (5 minutes)
3. **Review Report**: Open HTML report, fix any failures
4. **Deploy with Confidence**: All permissions tested, translations verified

**Total time: 20 minutes from feature to production-ready code.**

---

## Related Documentation

- [Quick Start: Add New Feature](../guides/QUICK_START_NEW_FEATURE.md)
- [Permission System Architecture](../implementation/PERMISSION_SYSTEM.md)
- [Translation Best Practices](../guides/TRANSLATION_GUIDE.md)
