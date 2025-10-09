# Agent Permissions Fix - Implementation Guide

**Date:** October 8, 2025
**Status:** Ready for Testing

---

## 🐛 Issues Fixed

### 1. **Critical: Sidebar Menu Not Rendering Properly**
**Problem:** Menu items with children (CRM, Team, Campaigns, etc.) were NOT displaying their child pages at all. The menu was completely flat.

**Solution:** Completely rewrote Sidebar component to:
- ✅ Render hierarchical menus with expandable/collapsible sections
- ✅ Properly map Lucide React icon components
- ✅ Filter child items based on user permissions
- ✅ Show visual indicators for active parent items
- ✅ Auto-expand parent when child is active

**Files Modified:**
- `Frontend/src/components/Sidebar.jsx` (complete rewrite of menu rendering)

---

### 2. **Duplicate Permissions in Database**
**Problem:** Migration 015 was run multiple times, causing massive duplicate permissions:
- Admin: 63 duplicates
- Manager: 60 duplicates
- Agent: 24 duplicates
- Member: 9 duplicates

**Solution:** Created migration to clean up all duplicates using PostgreSQL function.

**Files Created:**
- `supabase/migrations/016_cleanup_duplicate_permissions.sql`

---

### 3. **Agent Permission Scope Unclear**
**Problem:** Confusion about what agent role should/shouldn't see in the menu.

**Solution:** Created optional migration with 3 permission models to choose from.

**Files Created:**
- `supabase/migrations/017_adjust_agent_permissions_OPTIONAL.sql`

---

## 📋 Current Agent Permissions (20 total)

Based on the system design, agent role currently has:

### ✅ **CRM Access:**
- Contacts: view, create, edit (no delete)
- Companies: view, create, edit (no delete)
- Segments: view only
- Deals: view, create, edit (no delete)

### ✅ **Communication:**
- Conversations: view, reply (no assign/manage)
- Tickets: view, create, edit (no delete/assign)

### ✅ **Reference Data:**
- Tags: view only
- Statuses: view only
- Lead Sources: view only

### ✅ **Team & Organization:**
- Users: view only (can see team members)
- Organization: view only (cannot edit settings)

### ❌ **Agent Does NOT Have:**
- Delete permissions (contacts, companies, deals, tickets)
- Permission management (cannot access Roles page)
- Organization edit (cannot access Settings)
- User management (cannot invite/edit/delete users)
- Campaign creation
- Analytics access

---

## 🔧 How to Apply Fixes

### **Step 1: Clean Up Duplicate Permissions (REQUIRED)**

Run this in Supabase SQL Editor:

```sql
-- Navigate to: Supabase Dashboard → SQL Editor → New Query

-- Paste and run this migration:
```

Copy the entire content from:
📁 `supabase/migrations/016_cleanup_duplicate_permissions.sql`

**Expected Result:**
```
✅ Function created: jsonb_array_unique
✅ Roles updated (no more duplicates)
```

**Verify:**
```sql
SELECT
  organization_id,
  slug,
  jsonb_array_length(permissions) as permission_count
FROM roles
WHERE is_system = true
ORDER BY organization_id, slug;
```

You should see:
- admin: 55 permissions
- manager: 40 permissions
- agent: 20 permissions
- member: 11 permissions

---

### **Step 2: Adjust Agent Permissions (OPTIONAL)**

**Only run this if** you want to change what agent role can see.

📁 Open: `supabase/migrations/017_adjust_agent_permissions_OPTIONAL.sql`

**Choose ONE option:**

#### **Option 1: Restrictive Agent (Recommended)**
Agent will ONLY see: Dashboard, Contacts, Segments, Deals, Conversations, Tickets

Agent will NOT see: Companies, Team

```sql
-- Uncomment Option 1 block in the migration file
-- This removes companies.view and users.view permissions
```

#### **Option 2: Standard Agent (Current Design)**
Agent sees: Dashboard, Contacts, Companies, Segments, Deals, Conversations, Tickets, Team (view only)

```sql
-- No action needed - this is the current state
```

#### **Option 3: Custom**
Modify the permission array to match your exact requirements.

---

### **Step 3: Frontend Updates (AUTOMATIC)**

No manual action needed - frontend changes are already in place:

✅ Sidebar now renders hierarchical menus properly
✅ Permission-based filtering works for all menu items
✅ Icons display correctly from Lucide React
✅ Expandable/collapsible parent menus
✅ Auto-expand when child page is active

---

## 🧪 Testing Instructions

### **Test 1: Admin Role**

1. **Login as Admin**
   ```
   Email: admin@test.com
   Password: [your password]
   ```

2. **Expected Menu Items (when expanded):**
   - ✅ Dashboard
   - ✅ CRM
     - Contacts
     - Companies
     - Segmentation
     - Deals
     - CRM Settings
   - ✅ Campaigns (all sub-items)
   - ✅ Conversations (all sub-items)
   - ✅ Team
     - Members
     - Roles & Permissions ← Admin should see this
   - ✅ Settings
     - Account Settings

3. **Verify:**
   - All menu items visible
   - Can access all pages
   - Roles page shows 55 permissions for admin

---

### **Test 2: Agent Role**

1. **Logout and Login as Agent**
   ```
   Email: agents@test.com
   Password: [your password]
   ```

2. **IMPORTANT: Clear Browser Cache**
   - Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
   - Or: DevTools → Application → Clear Storage → Clear site data

3. **Expected Menu Items:**

   **If using CURRENT design (Option 2):**
   - ✅ Dashboard
   - ✅ CRM
     - Contacts ✅
     - Companies ✅
     - Segmentation ✅
     - Deals ✅
     - ❌ CRM Settings (requires statuses.create, not just statuses.view)
   - ✅ Conversations
     - Inbox → My Messages ✅
     - Inbox → Unassigned ✅
     - Inbox → All Conversations ✅
     - Quick Replies ✅
     - ❌ WhatsApp Profiles (requires conversations.manage)
     - ❌ Settings (requires conversations.manage)
   - ✅ Tickets
     - All Tickets ✅
     - My Tickets ✅
     - Urgent ✅
   - ✅ Team
     - Members ✅
     - ❌ Roles & Permissions (requires permissions.manage)
   - ❌ Campaigns (requires campaigns.view)
   - ❌ Analytics (requires analytics.view)
   - ❌ Settings (requires organization.edit)

   **If using RESTRICTIVE design (Option 1):**
   - ✅ Dashboard
   - ✅ CRM
     - Contacts ✅
     - ❌ Companies (removed)
     - Segmentation ✅
     - Deals ✅
   - ✅ Conversations (same as above)
   - ✅ Tickets (same as above)
   - ❌ Team (removed - no users.view permission)

4. **Verify:**
   - Agent cannot navigate to `/team/roles` (should redirect or show 403)
   - Agent cannot navigate to `/account-settings` (should redirect or show 403)
   - Roles & Permissions link does NOT appear in Team menu
   - Account Settings does NOT appear in user dropdown menu

---

### **Test 3: Permission Filtering**

1. **As Agent, try to access restricted pages directly:**
   ```
   Navigate to: http://localhost:5173/team/roles
   ```
   **Expected:** Should be redirected to dashboard or show "No permission" message

2. **Check User Dropdown Menu (top-left when sidebar open):**
   - ✅ My Profile (should be visible)
   - ❌ Account Settings (should NOT be visible for agent)
   - ✅ Logout (should be visible)

---

### **Test 4: CRM Functionality**

1. **As Agent, go to Contacts page:**
   - ✅ Can view contacts list
   - ✅ Can create new contact
   - ✅ Can edit existing contact
   - ❌ Delete button should be hidden or disabled

2. **Go to Companies page (if using Option 2):**
   - ✅ Can view companies
   - ✅ Can create new company
   - ✅ Can edit existing company
   - ❌ Delete button should be hidden or disabled

---

## 🔍 Troubleshooting

### **Issue:** "Agent still sees pages they shouldn't"

**Solutions:**

1. **Clear JWT Token:**
   ```javascript
   // In browser console:
   localStorage.clear();
   sessionStorage.clear();
   // Then login again
   ```

2. **Verify migration ran successfully:**
   ```sql
   -- In Supabase SQL Editor:
   SELECT slug, permissions
   FROM roles
   WHERE slug = 'agent' AND is_system = true;
   ```

3. **Check user's actual permissions:**
   ```sql
   SELECT
     u.email,
     u.role,
     r.permissions
   FROM users u
   LEFT JOIN roles r ON u.role_id = r.id
   WHERE u.email = 'agents@test.com';
   ```

---

### **Issue:** "Menu items not showing at all"

**Solutions:**

1. **Check browser console for errors:**
   - Press F12 → Console tab
   - Look for icon import errors or React errors

2. **Verify menuConfig has required fields:**
   - All items must have `id`, `labelKey`, `icon`, `requiredPermission`
   - Items with children must not have `path`
   - Child items must have `path`

3. **Check user object has rolePermissions:**
   ```javascript
   // In browser console:
   console.log(JSON.parse(localStorage.getItem('user')));
   // Should show: rolePermissions: ["contacts.view", ...]
   ```

---

### **Issue:** "Icons not displaying"

**Solution:**

Check that all icon names in `menuConfig.jsx` match the icon mapping in `Sidebar.jsx`.

Missing icons? Add them:

1. Import from lucide-react:
   ```javascript
   import { YourIcon } from 'lucide-react';
   ```

2. Add to iconMap:
   ```javascript
   const iconMap = {
     // ... existing icons
     YourIcon
   };
   ```

---

## 📊 Permission Matrix Reference

| Permission | Admin | Manager | Agent | Member |
|------------|-------|---------|-------|--------|
| **Contacts** |
| contacts.view | ✅ | ✅ | ✅ | ✅ |
| contacts.create | ✅ | ✅ | ✅ | ❌ |
| contacts.edit | ✅ | ✅ | ✅ | ❌ |
| contacts.delete | ✅ | ✅ | ❌ | ❌ |
| contacts.export | ✅ | ✅ | ❌ | ❌ |
| **Companies** |
| companies.view | ✅ | ✅ | ✅* | ✅ |
| companies.create | ✅ | ✅ | ✅* | ❌ |
| companies.edit | ✅ | ✅ | ✅* | ❌ |
| companies.delete | ✅ | ✅ | ❌ | ❌ |
| **Team** |
| users.view | ✅ | ✅ | ✅* | ✅ |
| users.invite | ✅ | ✅ | ❌ | ❌ |
| users.edit | ✅ | ❌ | ❌ | ❌ |
| users.delete | ✅ | ❌ | ❌ | ❌ |
| permissions.manage | ✅ | ❌ | ❌ | ❌ |
| **Organization** |
| organization.view | ✅ | ✅ | ✅ | ✅ |
| organization.edit | ✅ | ❌ | ❌ | ❌ |

\* = Only if using Option 2 (Standard Agent). Removed in Option 1 (Restrictive Agent).

---

## ✅ Final Checklist

Before marking this as complete:

- [ ] Run migration 016 (cleanup duplicates)
- [ ] Choose and run migration 017 option (if needed)
- [ ] Logout all users
- [ ] Clear browser cache
- [ ] Test admin login - verify all menus visible
- [ ] Test agent login - verify restricted menus hidden
- [ ] Test direct URL access to restricted pages
- [ ] Verify CRM functionality (contacts, companies)
- [ ] Verify Team menu shows/hides correctly
- [ ] Check user dropdown menu permissions

---

## 📚 Related Documentation

- `docs/ADD_NEW_MODULE.md` - How to add new modules with permissions
- `backend/constants/permissions.js` - All available permissions
- `Frontend/src/menuConfig.jsx` - Menu configuration
- `Frontend/src/utils/permissionUtils.js` - Permission checking utilities

---

## 🎯 Next Steps After Testing

Once testing is complete:

1. **Update other roles if needed** (create custom roles)
2. **Add more modules** following the guide in `docs/ADD_NEW_MODULE.md`
3. **Implement protected routes** in App.jsx for additional security
4. **Add permission checks** in individual page components
5. **Create audit logging** for permission changes

---

**Questions or Issues?**

Check the troubleshooting section above or review the permission system architecture in `CLAUDE.md`.
