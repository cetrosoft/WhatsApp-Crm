# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Omnichannel CRM SaaS Platform** - A multi-tenant WhatsApp-based customer relationship management platform with bulk messaging, team collaboration, and subscription management.

**Current Status:** Foundation complete. Team management complete. **CRM 100% complete** (Contacts, Companies, Deals with dual view (Kanban + List), Pipelines, Segments - all with full frontend + tags system + default user filter). WhatsApp integration pending migration.

**Original:** Simple WhatsApp bulk sender → **Now:** Full-featured multi-tenant SaaS platform

## Development Commands

### Backend (Port 5000)
```bash
cd backend
npm install
npm start
```

### Frontend (Development - Port 5173)
```bash
cd Frontend
npm install
npm run dev
```

### Frontend (Production Build)
```bash
cd Frontend
npm run build
npm run preview
```

## Architecture Overview

### Backend Architecture
- **Express.js server** on port 5000 with CORS enabled
- **Supabase Cloud PostgreSQL** - Multi-tenant database with RLS policies
- **JWT Authentication** - Token-based auth with role-based access control
- **Multi-tenant Isolation** - Organization-based data separation
- **WhatsApp-web.js integration** (in progress) - LocalAuth strategy with session persistence
- **Socket.io** for real-time communication between frontend and backend
- **Two Supabase clients:**
  - Service role key (admin operations, bypasses RLS)
  - Anon key (authentication operations)

### Key Backend Components
```
backend/
├── config/
│   ├── supabase.js - Service role client
│   └── supabaseAuth.js - Anon key client for auth
├── routes/
│   ├── authRoutes.js - Registration, login, password reset
│   ├── userRoutes.js - User management, invitations, permissions
│   ├── roleRoutes.js - Custom roles management
│   ├── packageRoutes.js - Subscription packages
│   ├── menuRoutes.js - Dynamic menu system (Oct 11)
│   ├── contactRoutes.js - CRM contacts API
│   ├── companyRoutes.js - CRM companies API
│   ├── dealRoutes.js - CRM deals/pipeline API
│   └── messageRoutes.js - (Old WhatsApp code, needs migration)
├── middleware/
│   ├── auth.js - JWT validation, role authorization
│   └── tenant.js - Organization context setter
├── services/
│   └── invitationService.js - Team invitation logic
├── utils/
│   ├── permissions.js - Permission calculation helpers
│   └── permissionDiscovery.js - Dynamic permission discovery (Oct 11)
└── .env - Environment variables (Supabase, JWT, SMTP)
```

### Frontend Architecture
- **React 18** with Vite as build tool
- **TailwindCSS** with RTL plugin for Arabic support
- **React Router v6** for navigation with protected routes
- **react-i18next** for internationalization (Arabic/English)
- **Socket.io-client** for real-time communication (future use)
- **React Hot Toast** for notifications
- **Lucide React** for icons
- **Axios** for API calls with token management

### Key Frontend Structure
```
Frontend/src/
├── pages/
│   ├── Login.jsx - Bilingual login page
│   ├── Register.jsx - Organization registration
│   ├── ResetPassword.jsx - Password reset flow
│   ├── AcceptInvitation.jsx - Team invitation acceptance
│   ├── dashboard.jsx - Main dashboard with stats
│   ├── AccountSettings.jsx - Tab-based settings portal
│   ├── Team/
│   │   ├── TeamMembers.jsx - Team list + invite (tabs)
│   │   └── RolesPermissions.jsx - Custom roles management
│   ├── CreateRole.jsx - Create/edit custom role
│   ├── Contacts.jsx - ✅ CRM contacts (COMPLETE - 633 lines, full CRUD, filters, pagination)
│   ├── Companies.jsx - ✅ CRM companies (COMPLETE - 651 lines, card/list views, full CRUD)
│   ├── Segments.jsx - ✅ CRM segmentation (COMPLETE - 403 lines, visual filter builder, bilingual)
│   ├── CRMSettings.jsx - ✅ CRM settings (COMPLETE - tags, statuses, lead sources, pipelines)
│   ├── Campaigns.jsx - (Old code, needs update)
│   ├── Inbox.jsx - (Old code, needs update)
│   └── Settings.jsx - (Old code, to be deprecated)
├── components/
│   ├── Sidebar.jsx - Navigation with language switcher
│   ├── LanguageSwitcher.jsx - Globe icon toggle
│   ├── ProtectedRoute.jsx - Auth guard
│   ├── Team/
│   │   └── UserTable.jsx - Team members table with dynamic roles
│   ├── Permissions/
│   │   ├── PermissionModal.jsx - User permission editor
│   │   ├── PermissionMatrix.jsx - Permission grid by module
│   │   ├── PermissionSummary.jsx - Permission stats display
│   │   └── RoleBuilder.jsx - Custom role permission selector
│   └── AccountSettings/
│       ├── OrganizationTab.jsx
│       ├── TeamTab.jsx
│       ├── SubscriptionTab.jsx
│       └── PreferencesTab.jsx
├── hooks/
│   ├── useUsers.js - User management operations
│   ├── useRoles.js - Role fetching from database
│   └── usePermissions.js - Permission checking utilities
├── contexts/
│   ├── AuthContext.jsx - Authentication state
│   └── LanguageContext.jsx - Language state + direction
├── services/
│   └── api.js - HTTP client (authAPI, userAPI, roleAPI, permissionAPI, packageAPI, crmAPI)
├── utils/
│   └── permissionUtils.js - Permission calculation helpers
├── i18n.js - i18next configuration
└── menuConfig.jsx - Sidebar menu configuration
```

## Important Implementation Details

### Authentication System
- **Registration:** Creates organization + admin user, auto-assigns Free package
- **Login:** JWT tokens with 7-day expiry, includes organizationId and role
- **Password Reset:** Token-based flow via email (SMTP config needed)
- **Team Invitations:** Token-based invites with expiry
- **Protected Routes:** All dashboard pages require authentication
- **Multi-tenant Isolation:** RLS policies ensure data separation

### Database Schema (Supabase)
**Core Tables:**
- `organizations` - Company/tenant data, links to packages
- `users` - User profiles with role_id (FK to roles), legacy role (slug), custom permissions (JSONB: {grant: [], revoke: []})
- `roles` - System + custom roles with permissions (JSONB array), is_system flag, organization-scoped
- `packages` - 5 subscription tiers with features and limits
- `invitations` - Team invitation tokens with role_id

**CRM Tables:** (Backend + Frontend 100% complete)
- `contacts` - Lead/contact management ✅ Frontend complete
- `companies` - Company/account management ✅ Frontend complete
- `deals` - Sales opportunities ✅ Frontend complete (Dual view: Kanban board + List table, tags, default user filter)
- `pipelines` - Sales pipeline definitions ✅ Frontend complete
- `pipeline_stages` - Pipeline stages ✅ Frontend complete
- `deal_stage_history` - Deal movement audit log
- `tags` - Shared lookup table for contacts/companies/deals ✅ Complete (bilingual: name_en, name_ar)
- `deal_tags` - Junction table (deals ↔ tags) ✅ Complete
- `contact_tags` - Junction table (contacts ↔ tags) ✅ Complete
- `company_tags` - Junction table (companies ↔ tags) ✅ Complete
- `segments` - Customer segmentation ✅ Frontend complete (visual filter builder, AND/OR logic, bilingual)
- `interactions` - Communication history ⏳ Not started
- `activities` - Tasks and reminders ⏳ Not started

**Helper Functions:**
- `get_organization_limits(org_id)` - Returns effective limits
- `organization_has_feature(org_id, feature_name)` - Check feature access

### API Endpoints (Current)
**Auth:**
- `POST /api/auth/register` - Create organization + admin
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - Logout (client-side token removal)
- `POST /api/auth/request-password-reset` - Request reset email
- `POST /api/auth/reset-password` - Reset with token
- `GET /api/auth/me` - Get current user info

**Users:**
- `GET /api/users` - List organization users (includes role permissions)
- `POST /api/users/invite` - Invite team member (accepts roleId)
- `POST /api/users/accept-invitation` - Accept invite
- `PATCH /api/users/:userId` - Update user (roleId or role slug, status)
- `GET /api/users/:userId/permissions` - Get user effective permissions
- `PATCH /api/users/:userId/permissions` - Update custom permissions (grant/revoke)
- `GET /api/users/permissions/available` - Get all available permissions

**Roles:**
- `GET /api/roles` - List all roles (system + custom) for organization
- `POST /api/roles` - Create custom role
- `GET /api/roles/:roleId` - Get single role details
- `PATCH /api/roles/:roleId` - Update custom role
- `DELETE /api/roles/:roleId` - Delete custom role (cannot delete system roles)

**Packages:**
- `GET /api/packages` - List all active packages
- `GET /api/packages/:slug` - Get single package
- `GET /api/packages/organization/current` - Current org package
- `POST /api/packages/organization/upgrade` - Upgrade/downgrade
- `GET /api/packages/organization/check-feature/:feature` - Check access

**CRM:** (Backend + Frontend 100% complete) - **58+ endpoints**
- Contacts: 10 endpoints ✅ Frontend complete (CRUD, search, filter, tagging, pagination)
- Companies: 7 endpoints ✅ Frontend complete (CRUD, contact linking, card/list views)
- Deals: 9 endpoints ✅ Frontend complete (CRUD, dual view toggle, Kanban board, List table, stage movement, drag-drop, tags, default user filter)
- Pipelines: 11 endpoints ✅ Frontend complete (CRUD, stage management, reordering, deals with tags)
- Tags: 5 endpoints ✅ Frontend complete (bilingual support, color-coded badges)
- Contact Statuses: 5 endpoints ✅ Frontend complete
- Lead Sources: 5 endpoints ✅ Frontend complete
- Segments: 6 endpoints ✅ Frontend complete (visual filter builder, segment cards, contact counts, bilingual)

### Internationalization (i18n)
- **Languages:** Arabic (RTL) and English (LTR)
- **Translation Files:** `Frontend/public/locales/{ar,en}/{common,auth,settings}.json`
- **70+ Translation Keys** covering all UI text
- **TailwindCSS RTL Plugin** for proper right-to-left layout
- **Logical Properties:** Use `ms`/`me` instead of `ml`/`mr`, `ps`/`pe` instead of `pl`/`pr`
- **Language Switcher:** Globe icon in sidebar footer
- **Direction Auto-Switch:** Document.dir changes based on language

### Team Management & Permissions System (COMPLETE)

**Architecture Overview:**
- **Database-Driven Roles:** All roles (system + custom) stored in `roles` table
- **Dual Column Strategy:** `users.role` (VARCHAR slug, legacy) + `users.role_id` (UUID, new)
- **Permission Calculation:** `Effective = (Role Permissions + Custom Grants) - Custom Revokes`
- **Multi-tenant Isolation:** Roles scoped to organization, system roles seeded per org

**Key Components:**

1. **Roles Table:**
   - `id` (UUID), `organization_id` (FK), `name`, `slug`, `description`
   - `permissions` (JSONB array) - e.g., `["contacts.view", "deals.edit"]`
   - `is_system` (boolean) - true for admin/manager/agent/member
   - `is_default` (boolean) - auto-assign to new users

2. **Users Table:**
   - `role_id` (UUID FK to roles) - primary role assignment
   - `role` (VARCHAR) - legacy slug, synced via trigger
   - `permissions` (JSONB) - custom overrides: `{grant: [], revoke: []}`

3. **Permission System:**
   - **Role Defaults:** Immutable permissions from role
   - **Custom Grants:** Additional permissions for user
   - **Custom Revokes:** Removed permissions for user
   - **Effective Formula:** `[...rolePerms, ...grants].filter(p => !revokes.includes(p))`

**Frontend Flow:**
1. `useRoles` hook fetches all roles from database
2. All dropdowns (invite, role change) populated from database
3. `PermissionModal` uses `user.rolePermissions` directly (no hardcoded lookups)
4. Role changes send `roleId` (UUID) to backend
5. Permission changes send `{grant: [], revoke: []}` arrays

**Backend Flow:**
1. `GET /api/users` includes role permissions in response
2. `POST /api/roles` creates custom role (admin only)
3. `PATCH /api/users/:id/permissions` updates custom overrides
4. Middleware checks permissions using effective calculation

**Pages:**
- `/team/members` - List + invite tabs, dynamic role dropdowns
- `/team/roles` - Role cards (system + custom), create/edit/delete
- `/team/roles/create` - RoleBuilder with permission matrix
- `/team/roles/edit/:id` - Edit custom role (system roles readonly)

**Status:** Production-ready, no hardcoded role dependencies

---

### Dynamic Menu & Permission Systems (COMPLETE - Oct 11, 2025)

**Architecture Philosophy:** Database-driven, bilingual, zero-maintenance

#### 1. **Dynamic Menu System**

**Before:** Hardcoded menu in `menuConfig.jsx` with translation keys
**After:** Fully database-driven from `menu_items` table

**Key Features:**
- **Two-Layer Filtering:**
  1. **Package Features** - Menu visibility based on subscription tier
  2. **User Permissions** - Individual permission-based access control
- **Bilingual Native Support:** Pre-translated `name_en` and `name_ar` columns
- **Hierarchical Structure:** Unlimited nesting via `parent_key`
- **Real-time Updates:** Language switching updates menu immediately

**Database Table:** `menu_items`
```sql
- key VARCHAR(100) UNIQUE - 'crm_pipelines', 'dashboard', etc.
- parent_key VARCHAR(100) - FK to menu_items(key)
- name_en VARCHAR(255) - 'Pipelines'
- name_ar VARCHAR(255) - 'مسار المبيعات'
- icon VARCHAR(50) - Lucide icon name
- path VARCHAR(500) - Route path
- required_permission VARCHAR(100) - 'pipelines.view'
- required_feature VARCHAR(100) - 'crm'
- is_system BOOLEAN - Core menu items (cannot delete)
```

**Database Function:** `get_user_menu(user_id UUID, lang VARCHAR)`
- Fetches menu for specific user
- Applies package feature filtering
- Applies permission filtering
- Returns pre-translated names

**Backend API:** `GET /api/menu?lang={en|ar}`
- Calls `get_user_menu()` via Supabase RPC
- Builds hierarchical tree structure
- Filters by `has_permission` flag

**Frontend Hook:** `useMenu(lang)` in `Frontend/src/hooks/useMenu.js`
- Auto-refetch on language change
- Error handling with fallback to static menu
- Used by Sidebar component

---

#### 2. **Dynamic Permission Discovery System**

**Before:** Hardcoded `PERMISSION_GROUPS` in `backend/constants/permissions.js`
**After:** Auto-discovered from database roles table

**Problem Solved:**
- Adding new modules required updating 4 places (database + code files)
- Permission matrix and menu showing different Arabic names
- Maintenance overhead for every new feature

**Solution:**
- Permission matrix reads from database roles
- Module names read from `menu_items` table
- **Single source of truth** for all labels
- **Zero code changes** needed for new modules

**Key Algorithm:** `discoverPermissionsFromRoles(roles, menuItems)`

```javascript
Input:
  - Database roles with permissions arrays
  - Menu items with bilingual names

Process:
  1. Collect all unique permissions from all roles
     Example: ["contacts.view", "pipelines.view", "deals.create"]

  2. For each permission:
     - Split into [module, action]
     - Map module → menu_key (pipelines → crm_pipelines)
     - Lookup menu_item by key
     - Extract name_en and name_ar

  3. Build bilingual labels:
     - English: "View" + "Pipelines" = "View Pipelines"
     - Arabic: "عرض" + "مسار المبيعات" = "عرض مسار المبيعات"

  4. Group by category:
     - CRM: contacts, companies, segments, deals, pipelines
     - Settings: tags, statuses, lead_sources
     - Team: users, permissions

Output: Dynamic permission groups with bilingual labels
```

**Backend Implementation:**
- `backend/utils/permissionDiscovery.js` - Discovery algorithm
- `backend/routes/userRoutes.js` - Updated `/api/users/permissions/available` endpoint
- Queries both `roles` and `menu_items` tables

**Frontend Implementation:**
- `Frontend/src/utils/matrixUtils.js` - Extract bilingual labels
- `Frontend/src/components/Permissions/MatrixRow.jsx` - Display based on language
- Fallback to i18n if database labels missing

**Benefits:**
- ✅ **Consistency:** Menu + Permissions use identical names from database
- ✅ **Bilingual:** Arabic/English auto-synchronized
- ✅ **Zero Maintenance:** Add modules without code changes
- ✅ **Scalable:** Unlimited modules supported
- ✅ **Developer Experience:** Fewer files to maintain

**Data Flow:**
```
menu_items table
  ↓
Backend: GET /api/users/permissions/available
  ↓
discoverPermissionsFromRoles(roles, menuItems)
  ↓
Frontend: Permission Matrix
  ↓
Display: Arabic or English based on user language
```

---

### Permission Module Architecture v3.0 (PLANNED - Jan 13, 2025)

**Status:** 📋 Documented, Ready for Implementation
**Impact:** 🔥 High - Enables Super Admin Capabilities
**Documentation:** See `docs/PERMISSION_MODULE_ARCHITECTURE_v3.md`

#### What Is This?

A critical architectural improvement to eliminate the last remaining hardcoded configuration in our permission system. By adding a single `permission_module` column to the `menu_items` table, we achieve **truly 100% database-driven permission categorization**.

#### The Problem

Currently, `backend/utils/permissionDiscovery.js` contains two hardcoded mapping functions totaling **66 lines of configuration code**:

```javascript
// Function 1: mapModuleToMenuKey() - For grouping (42 lines)
function mapModuleToMenuKey(module) {
  const moduleToMenu = {
    'contacts': 'crm_contacts',
    'companies': 'crm_companies',
    'deals': 'crm_deals',
    // ... 13 more hardcoded mappings
  };
  return moduleToMenu[module] || module;
}

// Function 2: mapModuleToLabelMenuKey() - For labels (24 lines)
function mapModuleToLabelMenuKey(module) {
  const moduleToLabelMenu = {
    'contacts': 'crm_contacts',
    'ticket_categories': 'ticket_settings',
    'tags': 'tags',
    // ... 13 more hardcoded mappings
  };
  return moduleToLabelMenu[module] || module;
}
```

**Issues:**
- Configuration in code instead of database
- Adding new modules requires code changes in 2 functions
- Cannot build Super Admin panel for dynamic module management
- Violates "single source of truth" principle

#### The Solution

**Add `permission_module` column to `menu_items` table:**

```sql
ALTER TABLE menu_items
ADD COLUMN permission_module VARCHAR(100);

-- Example data:
-- key='crm_contacts', permission_module='contacts'
-- key='support_tickets', permission_module='tickets'
-- key='ticket_settings', permission_module='ticket_categories'
-- key='tags', permission_module='tags'
```

**Replace hardcoded functions with database lookup:**

```javascript
// NEW: Single lookup function (replaces both hardcoded functions)
function findMenuItemByModule(module, menuItems) {
  return menuItems.find(item => item.permission_module === module) || null;
}

// Usage in formatPermissionLabel():
const menuItem = findMenuItemByModule(module, menuItems);

// Usage in discoverPermissionsFromRoles():
const menuItem = findMenuItemByModule(module, menuItems);
const menuKey = menuItem.key;
```

#### Benefits

| Aspect | Before (v2.1) | After (v3.0) | Improvement |
|--------|--------------|-------------|-------------|
| Hardcoded config | 66 lines | 0 lines | ✅ -100% |
| Steps to add module | 5 steps | 1 step | ✅ -80% |
| Code changes required | Yes | No | ✅ Zero code |
| Backend restart required | Yes | No | ✅ Hot reload |
| Super Admin capable | No | Yes | ✅ Enabled |

#### Super Admin Capabilities Enabled

With v3.0, you can build a Super Admin panel that allows:

✅ **100% Dynamic Management:**
- Add new menu items via UI
- Link permission modules to menus
- Change categorization without code
- Manage permissions graphically
- Control feature flags per package
- Reorganize menu structure with drag-drop

**What Still Requires Code:**
- Page functionality (React components)
- API endpoints (Express routes)
- Database tables (SQL migrations)

**Industry Comparison:** This matches the approach used by WordPress, Salesforce, and ServiceNow - configuration is database-driven, functionality requires code.

#### Implementation Plan

**Phase 1: Foundation (Next Session - 2-3 hours)**
1. Run database migration (add `permission_module` column)
2. Update `permissionDiscovery.js` (remove 66 lines, add 1 function)
3. Test permission matrix UI
4. Verify all existing permissions work

**Phase 2: Super Admin MVP (8 weeks)**
- Menu Manager component
- Permission Manager component
- Module Mapper component
- Package Manager component

**Phase 3: Advanced Features (12 weeks)**
- Organization Manager
- Role Templates
- Audit Log
- Permission Testing Tool

**Phase 4: Low-Code Platform (Future)**
- Page Builder
- API Gateway
- Database Schema Designer
- Rule Engine

#### Related Documentation

- **Technical Details:** `docs/PERMISSION_MODULE_ARCHITECTURE_v3.md` - Complete implementation guide
- **Super Admin Vision:** `docs/SUPER_ADMIN_VISION.md` - Future capabilities and UI designs
- **Action Plan:** `docs/NEXT_SESSION_PLAN.md` - Step-by-step implementation checklist

#### Quick Summary

**What:** Add `permission_module` column to `menu_items` table
**Why:** Eliminate 66 lines of hardcoded config, enable Super Admin
**How:** Database migration + update 1 backend file
**When:** Ready to implement in next session
**Risk:** Low (backward compatible, well-documented)
**Impact:** Foundation for dynamic module management

---

### CRM Deals & Tags System (COMPLETE - Oct 12, 2025)

**Architecture Overview:** Junction table design with bilingual tag support + personalized UX

#### Features Implemented:

1. **Tags Display on Deal Cards**
   - Tags fetched from `deal_tags` junction table joined with `tags` lookup table
   - Color-coded badges with customizable colors
   - Bilingual support (name_en / name_ar)
   - Max 3 tags visible, "+N" badge for overflow
   - Tags persist across drag-and-drop operations

2. **Bilingual Tags in Filters**
   - Tag filter dropdown respects interface language
   - Arabic interface → Arabic tag names (name_ar)
   - English interface → English tag names (name_en)
   - Searchable tag list with language-aware search
   - Multi-select with checkboxes

3. **Group By User Names**
   - When grouping deals by "Assigned To", column headers show real user names
   - Format: "Full Name" or "Email" (fallback)
   - Example: "Walid Abdallah" instead of generic "user" label
   - Unassigned deals grouped in separate column

4. **Default User Filter**
   - On page load, deals auto-filter to logged-in user
   - "Assigned To" dropdown shows user's name by default
   - Filter panel displays "1 filter applied"
   - Users can click "All" or "Clear All" to see everyone's deals
   - Filter resets to user's deals on page refresh

#### Implementation Details:

**Backend (pipelineRoutes.js):**
```javascript
// Helper function to attach tags to deals
async function attachTagsToDeals(deals) {
  const dealIds = deals.map(d => d.id);

  const { data: dealTagsData } = await supabase
    .from('deal_tags')
    .select(`
      deal_id,
      tag:tags(id, name_en, name_ar, color)
    `)
    .in('deal_id', dealIds);

  // Map tags by deal_id and attach to deals
  return deals.map(deal => ({
    ...deal,
    tags: tagsByDeal[deal.id]?.map(t => t.id) || [],
    tag_details: tagsByDeal[deal.id] || []
  }));
}

// GET /api/crm/pipelines/:id/deals endpoint
const dealsWithTags = await attachTagsToDeals(deals || []);
res.json({ success: true, deals: dealsWithTags });
```

**Frontend (Deals.jsx):**
```javascript
// Default filter to logged-in user (runs once on mount)
const initialFilterSetRef = useRef(false);

useEffect(() => {
  if (user && user.id && !initialFilterSetRef.current) {
    setFilters(prev => ({ ...prev, assignedTo: user.id }));
    initialFilterSetRef.current = true;
  }
}, [user]);
```

**Frontend (FilterPanel.jsx):**
```javascript
// Bilingual tag names
const tagName = isRTL && tag.name_ar ? tag.name_ar : tag.name_en;

// Display selected user's name
const selectedUser = users.find(user => user.id === filters.assignedTo);
return selectedUser?.full_name || selectedUser?.email || t('user');
```

**Frontend (DealCard.jsx):**
```javascript
{/* Tags with colors and bilingual names */}
{deal.tag_details && deal.tag_details.length > 0 && (
  <div className="flex flex-wrap gap-1 mt-3">
    {deal.tag_details.slice(0, 3).map((tag) => {
      const tagName = isRTL && tag.name_ar ? tag.name_ar : tag.name_en;
      return (
        <span
          key={tag.id}
          style={{ backgroundColor: tag.color || '#6366f1' }}
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
        >
          {tagName}
        </span>
      );
    })}
    {deal.tag_details.length > 3 && (
      <span className="bg-gray-100 text-gray-500">
        +{deal.tag_details.length - 3}
      </span>
    )}
  </div>
)}
```

#### Key Patterns Used:

1. **Junction Table Query**
   - Single query fetches deal_tags with joined tag details
   - Efficient: One query for all deals (no N+1 problem)

2. **Bilingual Content Pattern**
   - Check `isRTL` flag: `isRTL && tag.name_ar ? tag.name_ar : tag.name_en`
   - Consistent across all components

3. **Initial State with Ref**
   - Use `useRef` to track one-time setup
   - Prevents re-setting filter after user clears it
   - Pattern: `if (!initialFilterSetRef.current) { /* setup */ }`

4. **Property Name Consistency**
   - Backend: `assigned_user` (from JOIN)
   - Frontend: `deal.assigned_user.full_name`
   - Always match backend response structure exactly

#### User Experience:

**Before October 12:**
- ❌ Tags saved but not visible on cards
- ❌ English tags in Arabic interface
- ❌ Generic "user" labels
- ❌ Users saw all deals (no personalization)

**After October 12:**
- ✅ Tags display with colors and correct language
- ✅ All text respects interface language (AR/EN)
- ✅ Real user names throughout
- ✅ Personalized view (user's deals by default)
- ✅ Full flexibility (can still see all deals)

**Files Modified:**
- `backend/routes/pipelineRoutes.js` - Added attachTagsToDeals
- `Frontend/src/pages/Deals.jsx` - Added default user filter
- `Frontend/src/components/Deals/FilterPanel.jsx` - Bilingual tags
- `Frontend/src/components/DealCard.jsx` - Tag display

**Status:** Production-ready, professional UX, fully tested

---

### CRM Deals Dual View System (COMPLETE - Jan 12, 2025)

**Architecture Overview:** Flexible view system with shared filtering logic

#### Features Implemented:

1. **Dual View Toggle**
   - **Cards View (Kanban Board):** Visual drag-and-drop board with stage columns
   - **List View (Table):** Dense table layout with 8 data columns
   - Single button toggle with LayoutGrid and List icons
   - View preference stored in component state (could be persisted to localStorage)

2. **DealListView Component**
   - **Location:** `Frontend/src/components/Deals/DealListView.jsx` (273 lines)
   - **8 Data Columns:**
     1. Deal Title + Value (currency formatted)
     2. Contact / Company info
     3. Stage (color-coded badge with rgba background)
     4. Assigned To (user full name or email)
     5. Expected Close Date (Gregorian calendar format)
     6. Probability (color-coded: red→orange→yellow→green)
     7. Tags (first 2 visible + count)
     8. Actions (Edit/Delete buttons)

   - **Helper Functions:**
     - `formatCurrency()` - Formats deal values as $X,XXX
     - `formatDate()` - Converts dates to 'en-US' locale (Gregorian calendar)
     - `getProbabilityColor()` - Returns Tailwind color class based on percentage
     - `getStageInfo()` - Retrieves stage details by ID from stages array
     - `hexToRgba()` - Converts hex color to rgba with opacity for backgrounds

3. **Shared Filter Logic**
   - Both views use identical filtering: search, assignedTo, tags, probability, value range, date periods
   - `getFilteredDeals()` function applies all filters once
   - Kanban view adds additional grouping logic on top of filtered results
   - No duplication of filter code = single source of truth

4. **UI Enhancements**
   - Group By dropdown automatically hidden in list view (only functional in Kanban)
   - Color-coded stage badges with 15% opacity backgrounds and solid color text
   - Responsive table with horizontal scroll on small screens
   - RTL support with proper text alignment
   - Hover states on table rows for better interactivity

#### Implementation Details:

**Frontend (Deals.jsx):**
```javascript
// View mode state
const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'list'

// Filter function reused by both views
const getFilteredDeals = () => {
  return deals.filter(deal => {
    const matchesSearch = searchTerm ? /* ... */ : true;
    const matchesAssignedTo = filters.assignedTo ? /* ... */ : true;
    const matchesTags = filters.tags?.length > 0 ? /* ... */ : true;
    const matchesProbability = filters.probability ? /* ... */ : true;
    const matchesValueRange = /* ... */;
    const matchesDatePeriods = /* ... */;

    return matchesSearch && matchesAssignedTo && matchesTags &&
           matchesProbability && matchesValueRange && matchesDatePeriods;
  });
};

// View toggle in header
<div className="flex items-center border border-gray-300 rounded-lg">
  <button onClick={() => setViewMode('cards')}
    className={viewMode === 'cards' ? 'bg-indigo-600 text-white' : ''}>
    <LayoutGrid />
  </button>
  <button onClick={() => setViewMode('list')}
    className={viewMode === 'list' ? 'bg-indigo-600 text-white' : ''}>
    <List />
  </button>
</div>

// Conditional rendering
{viewMode === 'list' ? (
  <DealListView deals={getFilteredDeals()} stages={stages} {...props} />
) : (
  <KanbanBoard deals={getDealsByGroup()} stages={stages} {...props} />
)}
```

**Frontend (DealListView.jsx):**
```javascript
// Color conversion helper (fixes white background bug)
const hexToRgba = (hex, opacity) => {
  if (!hex) return `rgba(156, 163, 175, ${opacity})`; // gray-400 fallback
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Stage badge with proper colored background
<span
  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
  style={{
    backgroundColor: hexToRgba(stage.color, 0.15),  // 15% opacity
    color: stage.color || '#374151'                  // Solid color text
  }}
>
  {stage.name}
</span>

// Date formatting (fixes Hijri calendar issue)
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  // Force 'en-US' for Gregorian calendar (not 'ar-SA' which shows Hijri)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
```

#### Bug Fixes:

1. **Hijri Calendar Display**
   - **Problem:** Arabic locale ('ar-SA') defaults to Islamic calendar
   - **Solution:** Force 'en-US' locale for date formatting regardless of interface language
   - **Result:** Dates show as "Jan 15, 2025" consistently

2. **White Stage Badge Backgrounds**
   - **Problem:** `${color}20` syntax doesn't create rgba in CSS
   - **Solution:** Created `hexToRgba()` function to properly convert hex to rgba
   - **Result:** Stage badges have colored 15% opacity backgrounds with high-contrast text

3. **Group By in List View**
   - **Problem:** Group By dropdown shown but non-functional in table view
   - **Solution:** Conditionally render only when `viewMode === 'cards'`
   - **Result:** Cleaner UI without confusing controls

#### Key Patterns Used:

1. **Toggle Pattern**
   ```javascript
   const [viewMode, setViewMode] = useState('cards');
   {viewMode === 'list' ? <ListView /> : <CardView />}
   ```

2. **Filter Reuse Pattern**
   ```javascript
   const getFilteredDeals = () => { /* single filter logic */ };
   // List view uses directly, Kanban adds grouping
   ```

3. **Color Conversion Pattern**
   ```javascript
   const hexToRgba = (hex, opacity) => { /* parse & convert */ };
   backgroundColor: hexToRgba(color, 0.15)
   ```

4. **Conditional UI Pattern**
   ```javascript
   {viewMode === 'cards' && <GroupByDropdown />}
   ```

#### User Experience:

**Before January 12:**
- ❌ Only Kanban board view available
- ❌ Dates showing in Hijri calendar (confusing for non-Muslim users)
- ❌ Stage badges with white backgrounds (color not visible)
- ❌ Group By dropdown visible but broken in list view

**After January 12:**
- ✅ Dual view: Choose between Kanban (visual) and List (dense)
- ✅ Consistent Gregorian calendar dates
- ✅ Proper colored stage badges (15% opacity backgrounds)
- ✅ Clean UI with context-appropriate controls
- ✅ Same filtering logic across both views
- ✅ Professional, polished interface

**Files Modified:**
- `Frontend/src/pages/Deals.jsx` - Added view toggle and getFilteredDeals()
- `Frontend/src/components/Deals/DealListView.jsx` - New 273-line component
- `Frontend/src/components/shared/index.js` - Added DealListView export
- `Frontend/src/components/COMPONENTS.md` - Documented new component

**Status:** Production-ready, professional dual-view system with proper date formatting and color rendering

---

### WhatsApp Integration (Old Code - Needs Migration)
- Uses QR code authentication - scan QR from console or frontend
- Supports both individual contacts and group messaging
- Handles media attachments (images, documents, etc.)
- Session persistence prevents re-authentication on restart
- **Status:** Not yet integrated with new multi-tenant architecture
- **Next Step:** Migrate to organization-based profiles

## Development Notes

### Environment Variables Required
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ... (for frontend + auth operations)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (for backend admin operations)

# JWT
JWT_SECRET=your-secret-key (generate with: openssl rand -base64 32)

# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Email (Optional - for invitations and password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Omnichannel CRM Platform
```

### Database Migrations
Run migrations in Supabase SQL Editor in this order:
1. `supabase/migrations/001_foundation.sql`
2. `supabase/migrations/001a_i18n_support.sql`
3. `supabase/migrations/001b_packages_system.sql`

Or use the combined file: `supabase/migrations/COMBINED_RUN_THIS.sql`

### Multi-tenant Best Practices
- Always use `req.organizationId` from JWT for queries
- Never expose data across organizations
- Use RLS policies as safety net
- Test with multiple organizations

### Translation Best Practices
- Use `t('key')` function, never hardcode text
- Add keys to both `ar` and `en` translation files
- Use logical CSS properties for RTL support
- Test both languages thoroughly

### File Upload Support
Backend supports file uploads via `express-fileupload` for media attachments in campaigns.

### Common Issues & Solutions

**Issue:** "User profile not found" on login
**Solution:** Backend must use `supabaseAuth` (anon key) for login, not `supabase` (service role)

**Issue:** Dashboard not showing after login
**Solution:** Check route paths in `menuConfig.jsx` match login redirect

**Issue:** Language not switching
**Solution:** Ensure all text uses `t()` function and translation keys exist

**Issue:** RLS blocking operations
**Solution:** Backend operations should use `supabase` (service role), not `supabaseAuth`

## Progress Tracking

See these files for detailed information:
- **SESSION_SUMMARY.md** - Complete summary of today's work
- **NEXT_STEPS.md** - Roadmap for continued development
- **CLAUDE.md** - This file (architecture reference)

## Project Status

✅ **Completed Modules:** (~55% overall progress)
- Module 0: Foundation (Auth, Subscriptions, i18n)
- Team Management (Custom Roles, Permissions, Dynamic UI)
- **CRM Backend (Database + 58+ API endpoints)**
- **CRM Contacts & Companies (Full frontend - list, CRUD, filters, modals)**
- **CRM Deals & Pipelines (Dual view: Kanban + List table, drag-drop, full CRUD, stage management, tags)**
- **CRM Segments (Full frontend - visual filter builder, segment cards, contact counts, bilingual)**
- **CRM Settings (Tags, Statuses, Lead Sources, Pipeline Management)**

🔄 **In Progress:**
- Module 2: CRM Activities & Tasks (timeline, follow-ups, reminders)
- Module 2: CRM Interactions (communication history)

⏳ **Planned:**
- Module 1: WhatsApp Integration (migration to multi-tenant)
- Module 3: Ticketing System
- Module 4: Analytics & Reporting
- Module 5: Billing & Payments
- Module 6: Super Admin Panel

**Latest Updates:**

**January 12, 2025 - CRM Segments Frontend Verification:**
- ✅ **Segments Page Verified** - Confirmed Segments.jsx (403 lines) is fully implemented
- ✅ **SegmentBuilderModal Complete** - Visual filter builder (363 lines) with AND/OR logic
- ✅ **Component Extraction** - Uses SegmentHeader, SegmentConditionRow, SegmentValueInput components
- ✅ **Full Feature Set** - Segment cards, CRUD operations, filter summaries, contact counts, bilingual support
- ✅ **Documentation Updated** - CLAUDE.md now reflects 100% CRM completion
- **Result:** CRM module is **100% complete** - All frontend pages (Contacts, Companies, Deals, Pipelines, Segments, Settings) are production-ready!

**January 12, 2025 - CRM Deals Dual View Implementation:**
- ✅ **Dual View System** - Added list/table view alongside Kanban board with toggle button
- ✅ **DealListView Component** - New 273-line table component with 8 data columns
- ✅ **Date Format Fix** - Gregorian calendar display (was showing Hijri calendar in Arabic)
- ✅ **Stage Badge Colors** - Fixed rgba conversion for proper colored backgrounds (15% opacity)
- ✅ **UI Polish** - Hidden Group By dropdown in list view, consistent badge styling
- ✅ **Documentation** - Updated COMPONENTS.md (now 23 components), added barrel exports
- **Result:** CRM Deals module now at **99% completion** - Flexible, professional dual-view UX!

**October 12, 2025 - CRM Deals Tags System & UX Improvements:**
- ✅ **Tags Displaying on Deal Cards** - Fixed pipelineRoutes.js to attach tags from junction table
- ✅ **Bilingual Tags in Filters** - Arabic/English tag names matching interface language
- ✅ **Group By User Names** - Real user names (e.g., "Walid Abdallah") instead of generic "user" label
- ✅ **Default User Filter** - Auto-filter deals to logged-in user on page load (with ability to clear)
- **Result:** CRM Deals module upgraded with professional, polished UX!

**October 11, 2025 - Dynamic Systems:**
- **AM:** Documentation audit revealed Contacts & Companies frontend were already 100% complete with 1,400+ lines of production code
- **PM:** Dynamic menu system implemented - Database-driven with bilingual support and two-layer filtering
- **Evening:** Dynamic permission discovery system - Auto-discover permissions from database with bilingual labels
- **Architecture Achievement:** Single source of truth - menu_items table drives both menu and permission labels