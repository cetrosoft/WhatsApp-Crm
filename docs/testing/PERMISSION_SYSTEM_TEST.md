# Permission System Testing Guide

## Backend API Endpoints to Test

### 1. Get Available Permissions (Admin Only)
```bash
GET http://localhost:5000/api/users/permissions/available
Headers:
  Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Expected Response:**
```json
{
  "groups": {
    "crm": { "label": "CRM", "permissions": [...] },
    "settings": { "label": "Settings", "permissions": [...] },
    "team": { "label": "Team Management", "permissions": [...] },
    "organization": { "label": "Organization", "permissions": [...] }
  },
  "roles": {
    "admin": ["contacts.view", "contacts.create", ...],
    "manager": ["contacts.view", "contacts.create", ...],
    "agent": ["contacts.view", "contacts.create", ...],
    "member": ["contacts.view", ...]
  }
}
```

---

### 2. Get User's Permissions
```bash
GET http://localhost:5000/api/users/:userId/permissions
Headers:
  Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Expected Response:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "fullName": "User Name",
  "role": "agent",
  "rolePermissions": ["contacts.view", "contacts.create", ...],
  "customPermissions": {},
  "effectivePermissions": ["contacts.view", "contacts.create", ...],
  "hasCustomOverrides": false
}
```

---

### 3. Update User's Custom Permissions
```bash
PATCH http://localhost:5000/api/users/:userId/permissions
Headers:
  Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

Body:
{
  "grant": ["contacts.delete", "companies.delete"],
  "revoke": ["contacts.create"]
}
```

**Expected Response:**
```json
{
  "message": "Permissions updated successfully",
  "user": {
    "id": "uuid",
    "email": "agent@example.com",
    "fullName": "Agent User",
    "role": "agent",
    "customPermissions": {
      "grant": ["contacts.delete", "companies.delete"],
      "revoke": ["contacts.create"]
    },
    "effectivePermissions": [...],
    "hasCustomOverrides": true
  }
}
```

---

### 4. Test Permission-Based Route Protection

#### Test Tags API (Admin Only)
```bash
# Should FAIL for agent role
POST http://localhost:5000/api/tags
Headers:
  Authorization: Bearer AGENT_TOKEN
Content-Type: application/json

Body:
{
  "name_en": "VIP Customer",
  "color": "#6366f1"
}
```

**Expected Response (403):**
```json
{
  "error": "Insufficient permissions",
  "required": "tags.create",
  "role": "agent"
}
```

#### Test with Permission Grant
```bash
# 1. Grant agent user tags.create permission
PATCH http://localhost:5000/api/users/{agentUserId}/permissions
Body: { "grant": ["tags.create"], "revoke": [] }

# 2. Try again - Should SUCCEED now
POST http://localhost:5000/api/tags
Headers:
  Authorization: Bearer AGENT_TOKEN
Content-Type: application/json

Body:
{
  "name_en": "VIP Customer",
  "color": "#6366f1"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "tag": {
    "id": "uuid",
    "name_en": "VIP Customer",
    "color": "#6366f1",
    ...
  }
}
```

---

## Test Scenarios

### Scenario 1: Agent Role Default Permissions
1. Login as agent
2. Try to create tag → Should FAIL (403)
3. Try to view contacts → Should SUCCEED (200)
4. Try to delete contact → Should FAIL (403)

### Scenario 2: Custom Permission Override
1. Admin grants agent "tags.create" permission
2. Agent tries to create tag → Should SUCCEED (201)
3. Admin revokes agent "contacts.create" permission
4. Agent tries to create contact → Should FAIL (403)

### Scenario 3: Manager Role
1. Login as manager
2. Try to delete contact → Should SUCCEED (200)
3. Try to create tag → Should FAIL (403)
4. Try to create segment → Should SUCCEED (201)

### Scenario 4: Admin Always Has Access
1. Login as admin
2. All operations should SUCCEED regardless of custom permissions

---

## Quick Test Commands (PowerShell)

### Get your auth token first
```powershell
$adminToken = "YOUR_ADMIN_TOKEN_HERE"
$agentToken = "YOUR_AGENT_TOKEN_HERE"
```

### Test 1: Get available permissions
```powershell
$headers = @{
    "Authorization" = "Bearer $adminToken"
}
Invoke-RestMethod -Uri "http://localhost:5000/api/users/permissions/available" -Headers $headers -Method Get | ConvertTo-Json -Depth 5
```

### Test 2: Get agent user permissions
```powershell
$agentUserId = "AGENT_USER_ID_HERE"
Invoke-RestMethod -Uri "http://localhost:5000/api/users/$agentUserId/permissions" -Headers $headers -Method Get | ConvertTo-Json -Depth 5
```

### Test 3: Grant agent permission to create tags
```powershell
$body = @{
    grant = @("tags.create")
    revoke = @()
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/users/$agentUserId/permissions" -Headers $headers -Method Patch -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 5
```

### Test 4: Try to create tag as agent (should work after grant)
```powershell
$agentHeaders = @{
    "Authorization" = "Bearer $agentToken"
}
$tagBody = @{
    name_en = "Test Tag"
    color = "#6366f1"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/tags" -Headers $agentHeaders -Method Post -Body $tagBody -ContentType "application/json" | ConvertTo-Json
```

---

## Expected Behavior Summary

| Role    | Default Permissions                          | Can Be Overridden? |
|---------|---------------------------------------------|-------------------|
| Admin   | Full access to everything                   | No (always admin) |
| Manager | CRM full, Settings view, Team view/invite   | Yes               |
| Agent   | CRM view/create/edit, Settings view         | Yes               |
| Member  | View-only access                            | Yes               |

## Database Check

You can verify permissions in the database:

```sql
-- Check user's current permissions
SELECT id, email, role, permissions
FROM users
WHERE email = 'agent@example.com';

-- Result should show:
-- permissions: {"grant": ["tags.create"], "revoke": []}
```

---

## Notes

- **Permission format**: `resource.action` (e.g., `contacts.create`, `tags.delete`)
- **Custom permissions** use grant/revoke arrays
- **Effective permissions** = Role defaults + Grants - Revokes
- **Admin role** always bypasses permission checks
- Permission checks happen on EVERY protected route

