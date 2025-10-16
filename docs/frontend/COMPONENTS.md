# 📦 Reusable Components Catalog

Complete catalog of all reusable components available for building new modules and pages.

**Total Components:** 39
**Modules Documented:** 6 (Shared, Tickets, Deals, Contacts, Companies, Segments, Team)
**Status:** Production Ready ✅

---

## 📚 Module Documentation

Detailed component documentation has been organized into module-specific files for better performance and maintainability:

### 🎫 [Tickets Module Components](COMPONENTS_TICKETS.md)
**8 Components:** TicketListView, TicketKanbanView, TicketModal, TicketFormFields, TicketFilters, TicketStatusBadge, TicketPriorityBadge, TicketCategoryBadge

**Key Features:** Dual view (Kanban + List), 9 advanced filters, overdue detection, 5 status states, 4 priority levels, bilingual categories

---

### 💼 [Deals Module Components](COMPONENTS_DEALS.md)
**12 Components:** DealModal, DealFormFields, DealListView, DealCard, FilterPanel, KanbanColumn, QuickAddDealCard, QuickAddFormFields, ContactSearchDropdown, DealsHeader, DealsKanban, DealsGroupBy

**Key Features:** Drag-and-drop Kanban, dual view toggle, 7 filter types, 6 grouping options, quick-add form, contact autocomplete, pipeline management

---

### 👥 [CRM Components](COMPONENTS_CRM.md)
**11 Components:** Contacts (3), Companies (5), Segments (3)

**Key Features:**
- **Contacts:** Table view, advanced filters, form fields with phone validation
- **Companies:** Card/List toggle, 3-tab form (Basic, Legal, Location), logo upload
- **Segments:** Visual filter builder, AND/OR logic, bilingual support, contact counts

---

### 🏢 [Team Module Components](COMPONENTS_TEAM.md)
**3 Components:** RoleCard, DeleteRoleModal, UserPermissionsList

**Key Features:** Custom role management, permission override display, system role protection, user count warnings, duplicate functionality

---

## 📦 Shared/Universal Components

Components that can be used across any module without dependencies.

### SearchableSelect
**Location:** `components/SearchableSelect.jsx`
**Purpose:** Dropdown with search functionality for single selection
**Props:**
- `value` - Current selected value
- `onChange` - Callback function
- `options` - Array of options
- `placeholder` - Placeholder text
- `displayKey` - Key to display from options
- `valueKey` - Key to use as value

**Usage:**
```jsx
<SearchableSelect
  value={selectedId}
  onChange={setSelectedId}
  options={users}
  placeholder="Select user"
  displayKey="name"
  valueKey="id"
/>
```

---

### MultiSelectTags
**Location:** `components/MultiSelectTags.jsx`
**Purpose:** Multi-select dropdown with tag display
**Props:**
- `selectedTags` - Array of selected tag IDs
- `onChange` - Callback function
- `options` - Array of tag objects
- `placeholder` - Placeholder text
- `className` - Additional CSS classes

**Usage:**
```jsx
<MultiSelectTags
  selectedTags={selectedTags}
  onChange={setSelectedTags}
  options={allTags}
  placeholder="Select tags"
/>
```

---

### SearchableFilterDropdown
**Location:** `components/Deals/SearchableFilterDropdown.jsx`
**Purpose:** Advanced searchable dropdown for filtering with single/multi-select support
**Props:**
- `label` - Filter label
- `icon` - Lucide icon component
- `value` - Current value (string or array)
- `onChange` - Callback function
- `options` - Array of options
- `loading` - Loading state
- `multiSelect` - Enable multi-select (default: false)
- `getDisplayValue` - Function to get display text
- `renderOption` - Function to render each option

**Usage:**
```jsx
<SearchableFilterDropdown
  label="Assigned To"
  icon={User}
  value={selectedUser}
  onChange={setSelectedUser}
  options={users}
  getDisplayValue={() => 'Selected User'}
  renderOption={(user) => user.name}
/>
```

---

### FilterValueRange
**Location:** `components/Deals/FilterValueRange.jsx`
**Purpose:** Min/Max value range input for filtering
**Props:**
- `valueMin` - Minimum value
- `valueMax` - Maximum value
- `onChange` - Callback function (receives key and value)

**Usage:**
```jsx
<FilterValueRange
  valueMin={filters.min}
  valueMax={filters.max}
  onChange={(key, value) => setFilters({...filters, [key]: value})}
/>
```

---

### FilterDatePeriod
**Location:** `components/Deals/FilterDatePeriod.jsx`
**Purpose:** Date period selector with preset options (months, quarters, years)
**Props:**
- `label` - Field label
- `value` - Selected period value
- `onChange` - Callback function

**Usage:**
```jsx
<FilterDatePeriod
  label="Created Date"
  value={selectedPeriod}
  onChange={setPeriod}
/>
```

---

### CountryCodeSelector
**Location:** `components/Deals/CountryCodeSelector.jsx`
**Purpose:** Searchable country phone code selector with bilingual support
**Props:**
- `value` - Current phone code (e.g., "+966")
- `onChange` - Callback function
- `disabled` - Disabled state
- `error` - Error message

**Usage:**
```jsx
<CountryCodeSelector
  value={phoneCode}
  onChange={setPhoneCode}
  disabled={false}
  error={errors.phone}
/>
```

---

## 🔧 Utilities

### filterUtils.js
**Location:** `utils/filterUtils.js`
**Purpose:** Date period utilities for filters
**Functions:**
- `getMonthName(monthIndex, language)` - Get localized month name
- `getLastThreeMonths(language)` - Get last 3 months as options
- `getPeriodOptions(language)` - Get all period options (months, quarters, years)
- `countActiveFilters(filters)` - Count active filter values

**Usage:**
```javascript
import { getPeriodOptions, countActiveFilters } from '../../utils/filterUtils';

const periods = getPeriodOptions('en');
const activeCount = countActiveFilters(filters);
```

---

## 📝 Design System

### Common Patterns

**Bilingual Support:**
```javascript
const isRTL = i18n.language === 'ar';
const displayName = isRTL && item.name_ar ? item.name_ar : item.name_en;
```

**Date Formatting (Gregorian):**
```javascript
// Force Gregorian calendar (prevents Hijri in Arabic)
date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
```

**Color with Opacity:**
```javascript
const hexToRgba = (hex, opacity) => {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
```

**RTL-Aware Styling:**
```javascript
// Use logical properties (auto-switch with direction)
className="ms-4 me-2 ps-3 pe-1" // Instead of ml-4 mr-2 pl-3 pr-1
```

---

## 🎨 Component Guidelines

### Props Best Practices

1. **Data Props:** `items`, `data`, `options` (arrays/objects)
2. **Action Props:** `onSave`, `onEdit`, `onDelete`, `onChange` (callbacks)
3. **State Props:** `loading`, `saving`, `disabled`, `error` (booleans/strings)
4. **Display Props:** `label`, `placeholder`, `icon`, `className` (strings/components)

### Callback Signatures

```javascript
// Simple callbacks (no data)
onClose={() => void}

// Single ID callbacks
onEdit((itemId: string) => void)

// Full object callbacks
onSave((item: object) => void)

// Multi-parameter callbacks
onChange((key: string, value: any) => void)
```

### Error Handling

```javascript
// Component prop
<Input error={errors.email} />

// Component implementation
{error && (
  <p className="text-sm text-red-600 mt-1">{error}</p>
)}
```

### Loading States

```javascript
// Button with loading
<button disabled={loading}>
  {loading ? 'Saving...' : 'Save'}
</button>

// Dropdown with loading
<SearchableSelect loading={loading} />

// Table with loading
{loading ? <Spinner /> : <Table data={data} />}
```

---

## 🚀 Quick Start Guide

### 1. Find the Right Component

Browse module-specific docs:
- **Forms & Modals:** Check Deals or Tickets docs
- **Tables & Views:** Check CRM docs (Contacts, Companies)
- **Filters:** Check Deals FilterPanel or Tickets TicketFilters
- **Badges & Tags:** Check Tickets or Deals docs

### 2. Import the Component

```javascript
// Shared components
import { SearchableSelect } from '../components/SearchableSelect';

// Module components (barrel export)
import { TicketModal, TicketFilters } from '../components/Tickets';
import { DealCard, KanbanColumn } from '../components/Deals';
import { ContactsTable } from '../components/Contacts';
```

### 3. Copy Usage Example

Each component doc includes working examples with props.

### 4. Customize for Your Module

- Replace data props with your module's data
- Update callbacks to match your handlers
- Adjust styling with className prop if needed

---

## 📊 Component Statistics

| Category | Components | Documentation |
|----------|------------|---------------|
| Shared/Universal | 7 | ✅ This file |
| Tickets | 8 | ✅ [COMPONENTS_TICKETS.md](COMPONENTS_TICKETS.md) |
| Deals | 12 | ✅ [COMPONENTS_DEALS.md](COMPONENTS_DEALS.md) |
| CRM (Contacts, Companies, Segments) | 11 | ✅ [COMPONENTS_CRM.md](COMPONENTS_CRM.md) |
| Team | 3 | ✅ [COMPONENTS_TEAM.md](COMPONENTS_TEAM.md) |
| **Total** | **39** | **100% Complete** |

---

## 🎯 Architecture Principles

### 1. Database-Driven
All dynamic content (menu, permissions, roles) comes from Supabase tables, not hardcoded constants.

### 2. Bilingual by Default
Components support Arabic (RTL) and English (LTR) with `i18n.language` detection.

### 3. Permission-Aware
Components accept `canEdit`, `canDelete` props to conditionally render actions.

### 4. Reusable & Composable
Components are designed to be data-agnostic and composable into larger views.

### 5. Consistent Patterns
Shared prop signatures, callback patterns, and styling conventions across all modules.

---

## 🔗 Related Documentation

- [Database-Driven Architecture](../DATABASE_DRIVEN_ARCHITECTURE.md) - System architecture overview
- [Permission Module v3.0](../PERMISSION_MODULE_ARCHITECTURE_v3.md) - Permission system details
- [Add New Module Guide](../ADD_NEW_MODULE_DYNAMIC.md) - Step-by-step module creation
- [i18n Guide](../I18N_GUIDE.md) - Internationalization patterns
- [Frontend README](README.md) - Frontend documentation index

---

**Last Updated:** January 2025
**Maintainer:** Development Team
**Total Components:** 39 reusable components across 6 modules
