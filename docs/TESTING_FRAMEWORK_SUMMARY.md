# Testing Framework Summary

## What Was Created

This document summarizes the **automated testing framework** created for the Omnichannel CRM platform. The framework ensures that all features are implemented correctly with proper permission enforcement and translations.

---

## 📁 Files Created

### 1. **Implementation Guide**
- **File**: `docs/guides/QUICK_START_NEW_FEATURE.md`
- **Purpose**: Step-by-step guide to add new features with permissions in 15 minutes
- **Includes**: Code templates, verification checklist, common mistakes

### 2. **Backend Test Framework**
- **File**: `backend/tests/permissions.test.js`
- **Purpose**: Automated Jest tests for API permission enforcement
- **Tests**:
  - All CRUD operations for each role
  - Permission checks on POST/PUT/DELETE endpoints
  - GET endpoints accessible without permissions
  - Error codes (not hardcoded text)
  - Custom permission overrides (grant/revoke)

### 3. **Frontend Test Framework**
- **Files**:
  - `Frontend/cypress/e2e/crm-permissions.cy.js` - Main E2E tests
  - `Frontend/cypress/support/e2e.js` - Cypress setup
  - `Frontend/cypress/support/commands.js` - Custom commands
  - `Frontend/cypress.config.js` - Cypress configuration
- **Purpose**: Automated Cypress tests for UI permission enforcement
- **Tests**:
  - Button visibility based on permissions
  - Modal behavior
  - Toast messages in English and Arabic
  - No literal translation keys shown
  - RTL layout for Arabic

### 4. **Master Test Runner**
- **File**: `scripts/test-permissions.js`
- **Purpose**: Single command to run all tests and generate reports
- **Features**:
  - Runs backend + frontend tests
  - Tests in multiple languages
  - Generates HTML reports with screenshots
  - Color-coded console output

### 5. **Package Configuration**
- **Files**:
  - `package.json` (root) - Master test scripts
  - `backend/package.json` - Jest configuration
  - `Frontend/package.json` - Cypress configuration
- **Purpose**: NPM scripts and dependencies

### 6. **Testing Guide**
- **File**: `docs/testing/AUTOMATED_TESTING_GUIDE.md`
- **Purpose**: Comprehensive guide on how to use the testing framework
- **Includes**: Examples, troubleshooting, CI/CD integration

---

## 🚀 How to Use

### Quick Test (English Only)
```bash
npm run test:permissions contacts agent
```

### Full Test (English + Arabic)
```bash
npm run test:permissions contacts agent --full
```

### Test Specific Language
```bash
npm run test:permissions companies manager --lang=ar
```

---

## ✅ What Gets Tested

### Backend API Layer
- ✅ Permission enforcement on all endpoints
- ✅ Correct HTTP status codes (403 for unauthorized)
- ✅ Error codes (not hardcoded text messages)
- ✅ GET routes accessible (for dropdowns)
- ✅ POST/PUT/DELETE routes protected
- ✅ Custom permission grants/revokes

### Frontend UI Layer
- ✅ Create button hidden without `resource.create` permission
- ✅ Edit button hidden without `resource.edit` permission
- ✅ Delete button hidden without `resource.delete` permission
- ✅ Unauthorized actions show permission error toast
- ✅ All toasts display in selected language

### Translation Layer
- ✅ No literal keys shown (e.g., "noPermissionDelete")
- ✅ No error codes shown (e.g., "INSUFFICIENT_PERMISSIONS")
- ✅ All messages translated to Arabic/English
- ✅ RTL layout works correctly
- ✅ Same UI structure in both languages

---

## 📊 Test Coverage

### Resources Configured
- ✅ Contacts
- ✅ Companies
- ✅ Segments

### Roles Tested
- ✅ Admin (all permissions)
- ✅ Manager (most permissions)
- ✅ Agent (limited permissions)
- ✅ Member (view only)
- ✅ POS (custom role - view + create contacts)

### Languages Tested
- ✅ English
- ✅ Arabic (RTL)

---

## 🛠️ Adding New Resource Tests

### Step 1: Add to Backend Test Config

Edit `backend/tests/permissions.test.js`:

```javascript
const TEST_CONFIGS = {
  // Add your resource
  products: {
    baseUrl: '/api/crm/products',
    endpoints: {
      list: { method: 'get', path: '', permission: null },
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

### Step 2: Add to Frontend Test Config

Edit `Frontend/cypress/e2e/crm-permissions.cy.js`:

```javascript
const PAGE_CONFIGS = {
  products: {
    url: '/crm/products',
    createPermission: 'products.create',
    editPermission: 'products.edit',
    deletePermission: 'products.delete',
    translations: {
      en: {
        title: 'Products',
        insufficientPermissions: "You don't have permission to perform this action",
      },
      ar: {
        title: 'المنتجات',
        insufficientPermissions: 'ليس لديك صلاحية لتنفيذ هذا الإجراء',
      },
    },
  },
};
```

### Step 3: Run Tests

```bash
npm run test:permissions products agent
```

**That's it!** The framework automatically tests your new resource.

---

## 📈 Test Reports

After running tests, open the HTML report:

```
test-reports/permission-tests-<resource>-<role>-<timestamp>.html
```

**Report includes:**
- Total tests / Passed / Failed counts
- Detailed results for each test
- Error messages and stack traces
- Screenshots (for frontend failures)

---

## 🐛 Common Issues and Fixes

### Issue 1: GET Endpoint Returns 403

**Problem**: GET routes have permission checks

**Fix**: Remove permission middleware from GET routes
```javascript
// ❌ Wrong
router.get('/', requirePermission(PERMISSIONS.CONTACTS_VIEW), ...);

// ✅ Correct
router.get('/', async (req, res) => { ... });
```

---

### Issue 2: Frontend Shows "noPermissionDelete"

**Problem**: Wrong translation namespace

**Fix**: Use dual namespace
```javascript
// ❌ Wrong
const { t } = useTranslation('contacts');
toast.error(t('insufficientPermissions'));

// ✅ Correct
const { t } = useTranslation(['contacts', 'common']);
toast.error(t('insufficientPermissions', { ns: 'common' }));
```

---

### Issue 3: Backend Returns English Error Message

**Problem**: Hardcoded error text

**Fix**: Return error code
```javascript
// ❌ Wrong
res.status(403).json({ error: 'Insufficient permissions' });

// ✅ Correct
res.status(403).json({ error: 'INSUFFICIENT_PERMISSIONS' });
```

---

### Issue 4: User Can Perform Unauthorized Action

**Problem**: Missing permission middleware

**Fix**: Add requirePermission()
```javascript
// ❌ Wrong
router.put('/:id', async (req, res) => { ... });

// ✅ Correct
router.put('/:id', requirePermission(PERMISSIONS.CONTACTS_EDIT), async (req, res) => { ... });
```

---

## 🎯 Best Practices

### DO ✅
- Run tests after implementing each feature
- Test with least-privileged roles (member, custom roles)
- Test in both languages (`--full` flag)
- Check HTML reports for detailed results
- Add new resources to test configs immediately
- Use error codes, not hardcoded text
- Use `hasPermission()`, not `if (user.role === 'admin')`

### DON'T ❌
- Skip tests because "it looks fine"
- Only test with admin role
- Ignore translation tests
- Commit code without running tests
- Hardcode role checks
- Add permission checks to GET endpoints
- Return English error messages from backend

---

## 📝 Workflow Summary

### For New Features (15 minutes)
1. Follow [Quick Start Guide](guides/QUICK_START_NEW_FEATURE.md)
2. Add permissions to backend constants
3. Create database migration
4. Create backend routes with `requirePermission()`
5. Create frontend page with `hasPermission()` checks
6. Add translations
7. Add to menu

### For Testing (5 minutes)
1. Run automated tests: `npm run test:permissions <resource> <role>`
2. Review HTML report
3. Fix any failures
4. Re-run tests
5. Commit with confidence

**Total: 20 minutes from feature to production-ready code**

---

## 📚 Related Documentation

- [Quick Start: Add New Feature](guides/QUICK_START_NEW_FEATURE.md) - 15-minute implementation guide
- [Automated Testing Guide](testing/AUTOMATED_TESTING_GUIDE.md) - Comprehensive testing documentation
- [Permission System](../CLAUDE.md#team-management--permissions-system-complete) - Architecture overview

---

## 🎉 Benefits

1. **Confidence**: Every feature fully tested before deployment
2. **Speed**: 5 minutes to test everything vs. hours of manual testing
3. **Quality**: Catch bugs early, prevent regressions
4. **Documentation**: Tests serve as living documentation
5. **Consistency**: Same patterns across all features
6. **Internationalization**: Arabic/English always tested
7. **Security**: Permission enforcement verified at all layers

---

## 🚦 Next Steps

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Create test users** (if not exist):
   - admin@test.com / admin123
   - agent@test.com / agent123
   - member@test.com / member123

3. **Run your first test**:
   ```bash
   npm run test:permissions contacts agent
   ```

4. **Review the report** and celebrate! 🎉

---

## Support

For issues or questions:
1. Check [Automated Testing Guide](testing/AUTOMATED_TESTING_GUIDE.md)
2. Review [Quick Start Guide](guides/QUICK_START_NEW_FEATURE.md)
3. Examine test failures in HTML reports
4. Check console output for detailed error messages
