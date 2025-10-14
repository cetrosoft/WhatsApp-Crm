# Changelog

Project timeline and major updates for the Omnichannel CRM SaaS Platform.

---

## 2025-01-14 - Permission Module Architecture v3.0 ✅ COMPLETE

**Major architectural improvement - 100% database-driven permissions**

### Changes:
- ✅ Added `permission_module` column to `menu_items` table
- ✅ Eliminated 66 lines of hardcoded permission mappings
- ✅ Replaced dual mapping functions with single database lookup
- ✅ Fixed bilingual language switching (tab names + column headers)
- ✅ Full testing - All 60 permissions discovered correctly in both languages

### Files Modified:
- Backend: `permissionDiscovery.js`, `userRoutes.js`
- Frontend: `PermissionMatrix.jsx`, `PermissionModal.jsx`, `RoleQuickEditModal.jsx`, `CreateRole.jsx`, `matrixUtils.js`
- Database: 3 migration scripts

### Impact:
- Zero code changes needed for future modules
- Foundation complete for Super Admin capabilities
- Single source of truth for all module information

**Full Details:** [docs/PERMISSION_MODULE_ARCHITECTURE_v3.md](docs/PERMISSION_MODULE_ARCHITECTURE_v3.md)
**Session:** [docs/sessions/SESSION_SUMMARY_2025-01-13.md](docs/sessions/SESSION_SUMMARY_2025-01-13.md)

---

## 2025-01-12 - CRM Segments Verification & Deals Dual View

### CRM Segments Frontend Verification:
- ✅ Confirmed Segments.jsx fully implemented (403 lines)
- ✅ SegmentBuilderModal complete (363 lines) with AND/OR logic
- ✅ Component extraction (SegmentHeader, SegmentConditionRow, SegmentValueInput)
- ✅ Full feature set: segment cards, CRUD, filter summaries, contact counts, bilingual support

**Result:** CRM module is 100% complete!

### CRM Deals Dual View Implementation:
- ✅ Added list/table view alongside Kanban board with toggle button
- ✅ New DealListView component (273 lines) with 8 data columns
- ✅ Fixed date format to Gregorian calendar (was showing Hijri in Arabic)
- ✅ Fixed stage badge colors with proper rgba conversion (15% opacity backgrounds)
- ✅ Hidden Group By dropdown in list view for cleaner UI

**Result:** Flexible, professional dual-view UX for deals management

**Session:** [docs/sessions/SESSION_SUMMARY_2025-01-12.md](docs/sessions/SESSION_SUMMARY_2025-01-12.md)

---

## 2025-10-12 - CRM Deals Tags System & UX Improvements

### Features Implemented:
- ✅ Tags displaying on deal cards with colors and bilingual names
- ✅ Bilingual tags in filter dropdowns (Arabic/English based on interface language)
- ✅ Group By user names showing real names instead of generic "user" label
- ✅ Default user filter - auto-filter deals to logged-in user on page load

### Implementation:
- Backend: Added `attachTagsToDeals()` helper function in pipelineRoutes.js
- Frontend: Junction table queries, bilingual content pattern, useRef for initial state
- Files: `pipelineRoutes.js`, `Deals.jsx`, `FilterPanel.jsx`, `DealCard.jsx`

**Result:** Production-ready, professional UX with personalized default view

**Session:** [docs/sessions/SESSION_SUMMARY_OCT_12_2025.md](docs/sessions/SESSION_SUMMARY_OCT_12_2025.md)

---

## 2025-10-11 - Dynamic Menu & Permission Systems

**Architecture Achievement:** Single source of truth - database drives everything

### Dynamic Menu System:
- ✅ Fully database-driven from `menu_items` table
- ✅ Two-layer filtering (package features + user permissions)
- ✅ Bilingual native support (name_en, name_ar columns)
- ✅ Real-time language switching

### Dynamic Permission Discovery:
- ✅ Auto-discovered from database roles table
- ✅ Module names read from `menu_items` table
- ✅ Zero code changes needed for new modules
- ✅ Permission matrix + menu use identical bilingual names

### Database Function:
- `get_user_menu(user_id, lang)` - Filters and returns pre-translated menu

**Result:** Zero-maintenance architecture - add modules with SQL only!

**Session:** [docs/sessions/SESSION_SUMMARY_OCT_11_2025_PERMISSIONS.md](docs/sessions/SESSION_SUMMARY_OCT_11_2025_PERMISSIONS.md)

---

## Earlier Sessions

**October 2025:**
- [Oct 10: Deals & Pipelines Progress](docs/sessions/SESSION_SUMMARY_OCT_10_2025.md)
- [Oct 8: Testing Framework](docs/sessions/SESSION_SUMMARY_OCT_8_2025.md)
- [Oct 7: Permission System Updates](docs/sessions/SESSION_SUMMARY_OCT_7_2025.md)
- [Oct 6: CRM Contacts Frontend](docs/sessions/SESSION_SUMMARY_OCT_6_2025.md)
- [Oct 5: Account Settings](docs/sessions/SESSION_SUMMARY_OCT_5_2025.md)
- [Oct 3: CRM Backend](docs/sessions/SESSION_2025-10-03_CRM_BACKEND.md)
- [Oct 2: Foundation](docs/sessions/SESSION_2025-10-02_FOUNDATION.md)

**Archived:**
- See [docs/archive/](docs/archive/) for older session documentation

---

## Project Status

**Completed Modules (~55% overall):**
- ✅ Module 0: Foundation (Auth, Subscriptions, i18n)
- ✅ Team Management (Custom Roles, Permissions, Dynamic UI)
- ✅ CRM Backend (Database + 58+ API endpoints)
- ✅ CRM Contacts & Companies (Full frontend)
- ✅ CRM Deals & Pipelines (Dual view: Kanban + List, tags, filters)
- ✅ CRM Segments (Visual filter builder, bilingual)
- ✅ CRM Settings (Tags, Statuses, Lead Sources, Pipeline Management)

**In Progress:**
- 🔄 Module 2: CRM Activities & Tasks
- 🔄 Module 2: CRM Interactions

**Planned:**
- ⏳ Module 1: WhatsApp Integration (multi-tenant migration)
- ⏳ Module 3: Ticketing System
- ⏳ Module 4: Analytics & Reporting
- ⏳ Module 5: Billing & Payments
- ⏳ Module 6: Super Admin Panel

---

**Last Updated:** January 14, 2025
