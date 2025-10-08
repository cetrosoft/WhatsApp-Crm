# Frontend Permission System - Testing Guide

## Before You Start

**Important:** The "User Permissions" tab only shows users who have custom permission overrides. If all users are using default role permissions, the tab will be empty (this is correct behavior).

## Step-by-Step Testing

### Step 1: Open Browser DevTools
1. Open Chrome/Edge/Firefox
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Clear console (click 🚫 icon)

### Step 2: Navigate to Roles & Permissions Page
1. Go to: `http://localhost:5173/team/roles`
2. Look at console output - you should see:
   ```
   === ROLES & PERMISSIONS DEBUG ===
   Total users loaded: X
   Users with custom permissions: 0 (or more)
   User data sample: [...]
   ```

### Step 3: Check User Data Structure
In the console, expand "User data sample" and verify:
- Each user has an `email` field ✓
- Each user has a `role` field ✓
- Each user has a `permissions` field ✓
- `permissions` is either:
  - `{}` (empty object) - User has NO custom permissions
  - `{grant: [...], revoke: [...]}` - User HAS custom permissions

### Step 4: Test Granting Permissions
1. Go to: `http://localhost:5173/team/members`
2. Find any user (not yourself)
3. Click the **Shield icon** (🛡️) next to their name
4. A modal should open showing "Manage Permissions"
5. In the modal:
   - See their current role
   - See permission groups (CRM, Settings, Team, Organization)
   - Check a permission box (e.g., "Create Tags" under Settings)
   - Click **Save Changes**

6. Watch the console - you should see:
   ```
   === SAVING PERMISSIONS ===
   User: user@example.com
   Granting: ["tags.create"]
   Revoking: []
   Permission update result: {...}
   Users refreshed after permission update
   ```

### Step 5: Verify Permission Saved
1. Go back to: `http://localhost:5173/team/roles`
2. Click on **User Permissions** tab
3. The user you just modified should now appear!
4. You should see:
   - User's name and email
   - Their role
   - Green badge showing "Granted (1)" with "Create Tags" listed

### Step 6: Verify in Console
Look at console again:
```
=== ROLES & PERMISSIONS DEBUG ===
Total users loaded: 4
Users with custom permissions: 1  ← Should be 1 now!
User data sample: [
  {
    email: "user@example.com",
    role: "agent",
    permissions: {
      grant: ["tags.create"],
      revoke: []
    }
  }
]
```

## Common Issues & Solutions

### Issue 1: "User Permissions" Tab is Empty
**Cause:** No users have custom permissions yet (all using role defaults)

**Solution:** This is CORRECT behavior! Follow Step 4 above to grant permissions.

**How to verify it's working:**
- Console shows: `Users with custom permissions: 0`
- You see the helpful message with instructions
- No errors in console

### Issue 2: Console Shows Errors
**Possible errors:**
- `Failed to load team members` - Backend not running or auth issue
- `Failed to get user permissions` - Permission API endpoint issue
- `Network error` - Backend not accessible

**Solutions:**
1. Verify backend is running: `http://localhost:5000/api/users`
2. Check you're logged in (auth token exists)
3. Verify you have admin/manager role (only they can manage permissions)

### Issue 3: Permission Modal Doesn't Open
**Cause:** JavaScript error or missing component

**Solution:**
1. Check console for errors
2. Verify you're on `/team/members` page
3. Verify you clicked the Shield icon (not the dropdown)

### Issue 4: Permissions Not Saving
**Cause:** API error or permission issue

**Solution:**
1. Check console for error message
2. Verify you're not trying to modify your own permissions (blocked)
3. Verify you have `permissions.manage` permission

## Manual API Testing

### Get All Users (should include permissions field)
```bash
# Get your auth token from: DevTools → Application → Local Storage → authToken

curl http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Expected Response:**
```json
{
  "users": [
    {
      "id": "...",
      "email": "user@example.com",
      "role": "agent",
      "permissions": {},  ← Should be present
      ...
    }
  ]
}
```

### Grant Permission to User
```bash
curl -X PATCH http://localhost:5000/api/users/USER_ID/permissions \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"grant": ["tags.create"], "revoke": []}'
```

**Expected Response:**
```json
{
  "message": "Permissions updated successfully",
  "user": {
    "permissions": {
      "grant": ["tags.create"],
      "revoke": []
    },
    ...
  }
}
```

### Get User's Effective Permissions
```bash
curl http://localhost:5000/api/users/USER_ID/permissions \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "userId": "...",
  "email": "user@example.com",
  "role": "agent",
  "rolePermissions": ["contacts.view", ...],
  "customPermissions": {
    "grant": ["tags.create"],
    "revoke": []
  },
  "effectivePermissions": ["contacts.view", ..., "tags.create"],
  "effectivePermissionsCount": 13
}
```

## Expected Console Output (Full Flow)

### Initial Load (No Custom Permissions)
```
=== ROLES & PERMISSIONS DEBUG ===
Total users loaded: 4
Users with custom permissions: 0
User data sample: [
  { email: "admin@test.com", role: "admin", permissions: {} },
  { email: "agent@test.com", role: "agent", permissions: {} }
]
```

### After Granting Permission
```
=== SAVING PERMISSIONS ===
User: agent@test.com
Granting: ["tags.create"]
Revoking: []
Permission update result: {message: "Permissions updated successfully", ...}
Users refreshed after permission update
```

### Reload Roles Page
```
=== ROLES & PERMISSIONS DEBUG ===
Total users loaded: 4
Users with custom permissions: 1  ← Changed!
User data sample: [
  { email: "admin@test.com", role: "admin", permissions: {} },
  {
    email: "agent@test.com",
    role: "agent",
    permissions: {
      grant: ["tags.create"],
      revoke: []
    }
  }
]
```

## Success Criteria

✅ Console shows debug output without errors
✅ Backend returns `permissions` field for all users
✅ "User Permissions" tab shows empty state with instructions
✅ Clicking Shield icon opens permission modal
✅ Granting permission saves successfully
✅ User appears in "User Permissions" tab after grant
✅ Green/red badges show granted/revoked permissions
✅ Can open modal again and see changes reflected

## What to Report if Still Broken

1. **Full console output** (copy/paste)
2. **Network tab** showing API requests/responses
3. **Screenshot** of the User Permissions tab
4. **Backend response** when calling `/api/users` manually
5. **Your user role** (admin/manager/agent/member)
