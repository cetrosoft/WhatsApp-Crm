# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Omnichannel CRM SaaS Platform** - A multi-tenant WhatsApp-based customer relationship management platform with bulk messaging, team collaboration, and subscription management.

**Current Status:** Foundation complete. Team management complete. **CRM 100% complete** (Contacts, Companies, Deals with dual view (Kanban + List), Pipelines, Segments - all with full frontend + tags system + default user filter). **Tickets Module 100% complete** (Dual view Kanban + List, 9 filters, categories, tags, assignments). WhatsApp integration pending migration.

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
│   ├── messageRoutes.js - (Old WhatsApp code, needs migration)
│   ├── superAdminAuthRoutes.js - Super admin authentication
│   ├── superAdminOrgRoutes.js - Organization management
│   ├── superAdminStatsRoutes.js - Platform statistics
│   └── superAdminMenuRoutes.js - Menu management (Jan 15)
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
│   ├── Settings.jsx - (Old code, to be deprecated)
│   └── SuperAdmin/
│       ├── Dashboard.jsx - ✅ Super admin dashboard
│       ├── Organizations.jsx - ✅ Organization management
│       ├── Menus.jsx - ✅ Menu manager (COMPLETE - Jan 15)
│       └── Login.jsx - ✅ Super admin login
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
│   ├── AccountSettings/
│   │   ├── OrganizationTab.jsx
│   │   ├── TeamTab.jsx
│   │   ├── SubscriptionTab.jsx
│   │   └── PreferencesTab.jsx
│   ├── SuperAdmin/
│   │   ├── SuperAdminLayout.jsx - ✅ Super admin layout wrapper
│   │   └── OrganizationCard.jsx - ✅ Organization display card
│   ├── SuperAdminProtectedRoute.jsx - ✅ Super admin auth guard
│   └── MenuManager/ - ✅ Menu management components (Jan 15)
│       ├── MenuFilters.jsx - Search & filter controls (~100 lines)
│       ├── MenuList.jsx - Tree container (~100 lines)
│       ├── MenuTreeItem.jsx - Single menu row with recursion (~150 lines)
│       ├── MenuForm.jsx - Form modal (~180 lines)
│       ├── MenuFormBasic.jsx - Basic fields sub-form (~80 lines)
│       ├── MenuFormNavigation.jsx - Navigation fields (~140 lines)
│       ├── MenuFormPermissions.jsx - Permission linking (~130 lines)
│       └── IconSelector.jsx - Icon picker with search (~130 lines)
├── hooks/
│   ├── useUsers.js - User management operations
│   ├── useRoles.js - Role fetching from database
│   └── usePermissions.js - Permission checking utilities
├── contexts/
│   ├── AuthContext.jsx - Authentication state
│   ├── LanguageContext.jsx - Language state + direction
│   └── SuperAdminContext.jsx - ✅ Super admin auth state
├── services/
│   ├── api.js - HTTP client (authAPI, userAPI, roleAPI, permissionAPI, packageAPI, crmAPI)
│   └── superAdminAPI.js - ✅ Super admin HTTP client (5 API groups)
├── utils/
│   ├── permissionUtils.js - Permission calculation helpers
│   └── iconList.js - ✅ Lucide icon library (150+ icons, Jan 15)
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

**Super Admin:** (Week 1 implementation) - **27+ endpoints**
- Authentication: 4 endpoints ✅ Login, logout, me, change-password
- Organizations: 7 endpoints ✅ List, get, create, update, status, package, delete
- Statistics: 5 endpoints ✅ Overview, org stats, package stats, growth, activity logs
- Packages: 6 endpoints ✅ List, get, create, update, delete, get package organizations
- Menu Management: 7 endpoints ✅ List, get, create, update, delete, reorder, modules (Jan 15)

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

### Permission Module Architecture v3.0 (✅ COMPLETE - Jan 14, 2025)

**Status:** ✅ Production-Ready | **Impact:** Foundation for Super Admin capabilities

By adding a single `permission_module` column to the `menu_items` table, we achieved **100% database-driven permission categorization**. The system eliminated 66 lines of hardcoded mappings, replacing dual mapping functions with a single database lookup.

**Key Benefits:**
- Zero code changes needed for new modules (just SQL migration)
- Auto-categorization from menu hierarchy
- Bilingual support natively in database
- Hot reload (no backend restart required)

**Full Documentation:** [docs/PERMISSION_MODULE_ARCHITECTURE_v3.md](docs/PERMISSION_MODULE_ARCHITECTURE_v3.md)

---

### CRM Deals & Tags System (COMPLETE - Oct 12, 2025)

**Architecture:** Junction table design with bilingual tag support + personalized UX

**Features:**
- Tags display on deal cards (color-coded, bilingual, max 3 visible + overflow count)
- Bilingual tag filters (respects interface language: name_en / name_ar)
- Group by user names shows real names instead of generic "user" labels
- Default user filter auto-applies logged-in user on page load

**Key Patterns:**
- **Junction Table:** Single query with JOIN avoids N+1 problem
- **Bilingual Content:** `isRTL && item.name_ar ? item.name_ar : item.name_en`
- **Initial State with Ref:** Use `useRef` to prevent filter reset after user clears
- **Property Consistency:** Backend structure matches frontend access pattern

**Files:** `pipelineRoutes.js:attachTagsToDeals()`, `Deals.jsx`, `FilterPanel.jsx`, `DealCard.jsx`

---

### CRM Deals Dual View System (COMPLETE - Jan 12, 2025)

**Architecture:** Flexible view toggle with shared filtering logic

**Features:**
- **Cards View:** Kanban board with drag-and-drop stage columns
- **List View:** Dense table with 8 columns (DealListView.jsx - 273 lines)
- Single toggle button (LayoutGrid/List icons)
- Shared filter logic between both views (no duplication)

**Key Bug Fixes:**
- Date formatting forced to 'en-US' locale (fixes Hijri calendar in Arabic)
- Stage badges use `hexToRgba()` for proper colored backgrounds (15% opacity)
- Group By dropdown hidden in list view (context-appropriate UI)

**Key Patterns:**
- **Toggle:** `viewMode === 'list' ? <ListView /> : <KanbanView />`
- **Filter Reuse:** `getFilteredDeals()` used by both, Kanban adds grouping
- **Color Conversion:** `hexToRgba(color, 0.15)` for rgba with opacity
- **Conditional UI:** `{viewMode === 'cards' && <GroupByDropdown />}`

**Components:** `DealListView.jsx` with helpers: `formatCurrency()`, `formatDate()`, `getProbabilityColor()`, `hexToRgba()`

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

## Documentation Index

### 📚 Core Documentation

**Architecture & Systems:**
- [Database-Driven Architecture](docs/DATABASE_DRIVEN_ARCHITECTURE.md) - Complete guide (v2.1, 42KB)
- [Permission Module v3.0](docs/PERMISSION_MODULE_ARCHITECTURE_v3.md) - Latest architecture (50KB)
- [Super Admin Vision](docs/SUPER_ADMIN_VISION.md) - Future capabilities and roadmap
- [Add New Module Guide](docs/ADD_NEW_MODULE_DYNAMIC.md) - Step-by-step guide (13KB)

**Development Guides:**
- [i18n Guide](docs/I18N_GUIDE.md) - Internationalization patterns (Arabic/English)
- [Quick Start](docs/guides/QUICK_START_NEW_FEATURE.md) - Add new features fast
- [Database Schema](docs/DATABASE_SCHEMA.md) - Complete schema reference
- [Supabase Setup](docs/SUPABASE_SETUP.md) - Database configuration

**Frontend:**
- [Components Catalog](docs/frontend/COMPONENTS.md) - 23+ reusable components
- [Frontend Index](docs/frontend/README.md) - Frontend documentation map

**Project History:**
- [CHANGELOG.md](CHANGELOG.md) - Project timeline with links to sessions
- [Session Summaries](docs/sessions/) - Detailed session documentation

### 🎯 Quick Links by Task

**Adding a New Module:**
1. Read: [Add New Module Guide](docs/ADD_NEW_MODULE_DYNAMIC.md)
2. Reference: [Database-Driven Architecture](docs/DATABASE_DRIVEN_ARCHITECTURE.md)
3. Check: [Components Catalog](docs/frontend/COMPONENTS.md) for reusable components

**Understanding Permissions:**
1. Read: [Permission Module v3.0](docs/PERMISSION_MODULE_ARCHITECTURE_v3.md)
2. Reference: [Database-Driven Architecture](docs/DATABASE_DRIVEN_ARCHITECTURE.md) - Dual Mapping Pattern

**Bilingual Support:**
1. Read: [i18n Guide](docs/I18N_GUIDE.md)
2. Pattern: `isRTL && item.name_ar ? item.name_ar : item.name_en`

**Building UI:**
1. Browse: [Components Catalog](docs/frontend/COMPONENTS.md)
2. Reference: Component usage examples with props

## Project Status

✅ **Completed Modules:** (~67% overall progress)
- Module 0: Foundation (Auth, Subscriptions, i18n)
- Team Management (Custom Roles, Permissions, Dynamic UI)
- **CRM Backend (Database + 58+ API endpoints)**
- **CRM Contacts & Companies (Full frontend - list, CRUD, filters, modals)**
- **CRM Deals & Pipelines (Dual view: Kanban + List table, drag-drop, full CRUD, stage management, tags)**
- **CRM Segments (Full frontend - visual filter builder, segment cards, contact counts, bilingual)**
- **CRM Settings (Tags, Statuses, Lead Sources, Pipeline Management)**
- **Tickets Module (Dual view: Kanban + List, 9 filters, categories, tags, assignments, 8 components, bilingual)**
- **Super Admin Portal - Week 1 (Feature #1: Auth, Feature #2: Menu Manager - 100% complete Jan 15)**

🔄 **In Progress:**
- Super Admin Portal - Week 1 (Feature #3: Package Management, Feature #4: Dashboard debugging)
- Module 2: CRM Activities & Tasks (timeline, follow-ups, reminders)
- Module 2: CRM Interactions (communication history)

⏳ **Planned:**
- Super Admin Portal - Week 2-3 (Organization Mgmt, Billing, Analytics)
- Module 1: WhatsApp Integration (migration to multi-tenant)
- Module 4: Analytics & Reporting
- Module 5: Billing & Payments

**Latest Updates:** See [CHANGELOG.md](CHANGELOG.md) for detailed project timeline.

**Current Status (January 2025):**
- ✅ Permission Module Architecture v3.0 - 100% database-driven
- ✅ CRM Module - 100% complete (Contacts, Companies, Deals, Pipelines, Segments, Settings)
- ✅ Tickets Module - 100% complete (Dual view, 9 filters, 8 components, production-ready)
- ✅ Super Admin Menu Management - 100% complete (8 components, 7 endpoints, production-ready - Jan 15)
- ✅ Dynamic Menu & Permissions - Zero-maintenance architecture
- ✅ Bilingual Support - Native Arabic/English throughout