# Debug Guide: Permission Modal 4/8 Tabs Issue

## The Problem

Permission modal receives 8 module groups from backend but only renders 4 tabs.

**Visible Tabs:** crm, settings, team, organization
**Missing Tabs:** conversations, tickets, campaigns, analytics

## Quick Diagnosis Steps

### Step 1: Check Backend Response (5 min)

Open browser DevTools → Network tab:

1. Login to application
2. Open Team → Members page
3. Click any user's "Manage Permissions" button
4. Find request: `GET /api/users/permissions/available`
5. Check Response JSON structure:

```json
{
  "groups": {
    "crm": { "key": "crm", "label": "CRM", "permissions": [...] },
    "settings": { "key": "settings", "label": "Settings", "permissions": [...] },
    "team": { "key": "team", "label": "Team", "permissions": [...] },
    "organization": { "key": "organization", "label": "Organization", "permissions": [...] },
    "conversations": { "key": "conversations", "label": "Conversations", "permissions": [] },  // ← CHECK THIS
    "tickets": { "key": "tickets", "label": "Tickets", "permissions": [] },                    // ← CHECK THIS
    "campaigns": { "key": "campaigns", "label": "Campaigns", "permissions": [] },              // ← CHECK THIS
    "analytics": { "key": "analytics", "label": "Analytics", "permissions": [] }               // ← CHECK THIS
  }
}
```

**If permissions arrays are EMPTY** → Backend issue (Step 2)
**If permissions arrays have data** → Frontend issue (Step 3)

---

### Step 2: Fix Backend Empty Permissions (If Needed)

**Problem:** Modules exist but have no permissions assigned in database

**Check database roles table:**
```sql
-- Check which permissions exist in roles
SELECT
  name,
  jsonb_array_length(permissions) as perm_count,
  permissions
FROM roles
WHERE organization_id = 'YOUR_ORG_ID';
```

**If conversations/tickets/campaigns/analytics permissions missing:**

1. Add permissions to database roles
2. Or update `backend/utils/permissionDiscovery.js` to include them
3. Verify `discoverPermissionsFromRoles()` includes all modules

**Files to check:**
- `backend/utils/permissionDiscovery.js` - Line 125-228 (discovery logic)
- Database `roles` table - Check permissions JSONB arrays

---

### Step 3: Fix Frontend Filtering (If Backend OK)

**Problem:** Frontend receives data but filters it out

**Add debug logging to matrixUtils.js:**

```javascript
// File: Frontend/src/utils/matrixUtils.js
// Line 103 - Add at start of function

export const groupPermissionsByModule = (availablePermissions) => {
  console.log('🔍 [matrixUtils] Input:', availablePermissions);
  console.log('🔍 [matrixUtils] Groups:', Object.keys(availablePermissions?.groups || {}));

  if (!availablePermissions || !availablePermissions.groups) return {};

  const modules = {};

  // ... rest of function ...

  console.log('🔍 [matrixUtils] Output modules:', Object.keys(modules));
  return modules;
};
```

**Check console:**
- If input has 8, output has 4 → Function is filtering (check lines 111-146)
- If input has 8, output has 8 → Rendering issue (Step 4)

---

### Step 4: Check React Rendering

**Add debug inside map function:**

```javascript
// File: Frontend/src/components/Permissions/PermissionModal.jsx
// Line 179-199

{availableModules.map((moduleKey, index) => {
  const IconComponent = MODULE_ICONS[moduleKey] || Shield;
  const moduleLabel = availablePermissions?.groups[moduleKey]?.label || moduleKey;

  console.log(`🏷️ Tab ${index + 1}:`, moduleKey); // ← ADD THIS
  console.log('  Icon:', IconComponent?.name);      // ← ADD THIS
  console.log('  Label:', moduleLabel);             // ← ADD THIS

  return (
    <button key={moduleKey} ...>
      <IconComponent className="w-4 h-4" />
      <span>{t(`common:${moduleKey}`, moduleLabel)}</span>
    </button>
  );
})}
```

**Check console:**
- If logs show 1-4 only → Array is sliced/filtered before map
- If logs show 1-8 → CSS hiding issue (Step 5)

---

### Step 5: Check CSS Hiding Tabs

**Inspect element on tab container:**

```javascript
// File: Frontend/src/components/Permissions/PermissionModal.jsx
// Line 177-178

<div className="border-b border-gray-200 bg-gray-50">
  <nav className="flex -mb-px px-6 overflow-x-auto">  // ← CHECK THIS
```

**Possible CSS issues:**
- `overflow-x-auto` should allow scrolling if tabs overflow
- Check if parent div has `max-width` or `width` constraint
- Check if tabs have `display: none` or `visibility: hidden`
- Use browser DevTools Elements tab to inspect all 8 buttons

**Fix:** If tabs are present but hidden:
- Add `flex-wrap: wrap` to allow wrapping
- Increase container width
- Remove width constraints

---

## Code Locations Reference

### Backend
- **Permission Discovery:** `backend/utils/permissionDiscovery.js`
  - `discoverPermissionsFromRoles()` - Line 125-228
  - `mapModuleToMenuKey()` - Line 29-50
- **API Endpoint:** `backend/routes/userRoutes.js`
  - `GET /api/users/permissions/available` - Line 557-606

### Frontend
- **Permission Modal:** `Frontend/src/components/Permissions/PermissionModal.jsx`
  - Tab rendering - Line 179-199
  - availableModules array - Line 40-42
- **Matrix Utils:** `Frontend/src/utils/matrixUtils.js`
  - `groupPermissionsByModule()` - Line 103-149
- **Hook:** `Frontend/src/hooks/usePermissions.js`
  - `useAvailablePermissions()` - Line 94-128

---

## Known Good State

**Backend should send:**
```javascript
{
  groups: {
    crm: { permissions: [ {key: "contacts.view", ...}, ... ] },
    settings: { permissions: [ {key: "tags.view", ...}, ... ] },
    team: { permissions: [ {key: "users.view", ...}, ... ] },
    organization: { permissions: [ {key: "organization.edit", ...}, ... ] },
    conversations: { permissions: [ {key: "conversations.view", ...}, ... ] },
    tickets: { permissions: [ {key: "tickets.view", ...}, ... ] },
    campaigns: { permissions: [ {key: "campaigns.view", ...}, ... ] },
    analytics: { permissions: [ {key: "analytics.view", ...}, ... ] }
  }
}
```

**Frontend should display:**
- 8 clickable tabs in a horizontal nav
- Each tab with icon + label
- Tabs should be scrollable if they overflow container

---

## Quick Fix Attempts

### Attempt 1: Force All Tabs Visible (Test)
```javascript
// Temporarily hardcode to verify rendering works
const availableModules = ['crm', 'settings', 'team', 'organization', 'conversations', 'tickets', 'campaigns', 'analytics'];
```

### Attempt 2: Remove CSS Constraints
```javascript
// Remove overflow-x-auto to see if tabs are hidden
<nav className="flex -mb-px px-6">  // No overflow-x-auto
```

### Attempt 3: Check Data Structure
```javascript
// Log full structure
console.log('Full data:', JSON.stringify(availablePermissions, null, 2));
```

---

**Last Updated:** January 13, 2025
**Status:** Unresolved - Awaiting diagnosis steps above
