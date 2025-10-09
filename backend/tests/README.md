# Backend Permission Tests

## Quick Start

### 1. Make sure backend is running
```bash
cd backend
npm start
```

Backend should be running on `http://localhost:5000`

### 2. Configure JWT Secret

**IMPORTANT**: The test file must use the **same JWT_SECRET** as your backend server.

Edit `backend/tests/permissions.test.js` line 18:
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
```

Replace `'your-secret-key-here'` with the actual JWT_SECRET from your `.env` file.

### 3. Run tests

```bash
# From backend folder
npm test -- --testNamePattern="contacts"

# Or from root folder
cd backend && npm test -- --testNamePattern="contacts"
```

## What Gets Tested

### For each role (admin, manager, agent, member, pos):
- ✅ GET endpoints are accessible (no permission check)
- ✅ POST endpoints require CREATE permission
- ✅ PUT endpoints require EDIT permission
- ✅ DELETE endpoints require DELETE permission
- ✅ Authorized users get 200/201 responses
- ✅ Unauthorized users get 403 with `INSUFFICIENT_PERMISSIONS` error code

### Resources tested:
- `contacts` - Contact management
- `companies` - Company management
- `segments` - Customer segmentation

## Test Results

**All tests pass**: ✅ Permission system working correctly

**Some tests fail**: ❌ Check which endpoint/role combination failed:
- If authorized user gets 403 → Permission check is too strict (might be missing permission in ROLE_PERMISSIONS)
- If unauthorized user gets 200 → Missing `requirePermission()` middleware on route

## Adding New Resources

Edit `backend/tests/permissions.test.js` and add to `TEST_CONFIGS`:

```javascript
const TEST_CONFIGS = {
  // ... existing configs ...

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

## Troubleshooting

### "connect ECONNREFUSED"
- Backend server is not running
- Solution: Start backend with `npm start`

### "Invalid token"
- JWT_SECRET in test file doesn't match backend .env
- Solution: Update JWT_SECRET constant in test file

### Tests timeout
- Backend server is slow or not responding
- Solution: Increase timeout in package.json jest config

### Import errors
- ES module syntax issues
- Solution: Make sure you ran `npm install` after adding test dependencies
