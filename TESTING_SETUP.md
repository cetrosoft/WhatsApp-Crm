# Testing Setup - Quick Instructions

## ✅ What Was Fixed

The backend test framework now works with your ES module setup and tests against your **running server**.

## 🚀 How to Run Tests

### Step 1: Configure JWT Secret

**IMPORTANT**: Edit `backend/tests/permissions.test.js` line 18:

```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
```

Replace `'your-secret-key-here'` with the **actual JWT_SECRET from your `backend/.env` file**.

### Step 2: Start Backend Server

```bash
cd backend
npm start
```

Keep this running.

### Step 3: Run Tests (in new terminal)

```bash
# From root folder
npm run test:permissions contacts agent

# Or just backend tests
cd backend
npm test -- --testNamePattern="contacts"
```

## 📊 Expected Results

If everything is configured correctly:

```
PASS  tests/permissions.test.js
  CONTACTS - Permission Enforcement Tests
    Role: admin
      ✓ GET list should ALLOW access
      ✓ POST create should ALLOW access
      ✓ PUT update should ALLOW access
      ✓ DELETE delete should ALLOW access
    Role: agent
      ✓ GET list should ALLOW access
      ✓ POST create should ALLOW access
      ✓ PUT update should ALLOW access
      ✓ DELETE delete should DENY access (returns 403)
    ...
```

## ❌ Common Issues

### 1. "connect ECONNREFUSED"
**Problem**: Backend not running
**Solution**: Start backend with `cd backend && npm start`

### 2. "jwt malformed" or "invalid token"
**Problem**: JWT_SECRET mismatch
**Solution**: Copy exact JWT_SECRET from `backend/.env` to test file line 18

### 3. All tests failing with 403
**Problem**: Wrong JWT_SECRET - backend can't validate test tokens
**Solution**: Double-check JWT_SECRET matches exactly

## 📝 What Tests Verify

For each role (admin, manager, agent, member, POS):

✅ **GET routes** - Accessible without permission checks (for dropdowns)
✅ **POST routes** - Require CREATE permission
✅ **PUT routes** - Require EDIT permission
✅ **DELETE routes** - Require DELETE permission
✅ **Error format** - Returns `INSUFFICIENT_PERMISSIONS` code (not English text)

## 🎯 Quick Test

To verify everything works:

```bash
# 1. Start backend
cd backend && npm start

# 2. In new terminal, run one simple test
cd backend
npm test -- --testNamePattern="contacts"
```

If tests pass ✅ - Your permission system is working correctly!
If tests fail ❌ - Check error messages and JWT_SECRET configuration

## 📚 Full Documentation

See `docs/testing/AUTOMATED_TESTING_GUIDE.md` for complete guide.
