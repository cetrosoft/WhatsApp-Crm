# 🎫 Tickets Module Components

Complete documentation for all Tickets module reusable components.

**Module:** Ticketing System
**Total Components:** 8
**Status:** Production Ready ✅

---

## 📋 Component Overview

| Component | Purpose | Lines | Complexity |
|-----------|---------|-------|------------|
| TicketListView | Table view with 9 columns | 290 | Medium |
| TicketKanbanView | Board with 4 grouping options | 270 | Medium |
| TicketModal | Create/edit modal | 330 | High |
| TicketFormFields | Form fields (10 fields) | 280 | Medium |
| TicketFilters | Advanced filters (9 types) | 325 | High |
| TicketStatusBadge | Status badge (5 states) | 60 | Low |
| TicketPriorityBadge | Priority badge (4 levels) | 70 | Low |
| TicketCategoryBadge | Category badge (bilingual) | 50 | Low |

---

## 🖼️ Main View Components

### TicketListView

**Location:** `components/Tickets/TicketListView.jsx`
**Purpose:** Dense table view displaying tickets with all key information across 9 columns

**Props:**
- `tickets` - Array of ticket objects with joined data
- `categories` - Array of category objects for lookups
- `tags` - Array of tag objects for display
- `onEdit` - Edit callback `(ticket) => void`
- `onDelete` - Delete callback `(ticket) => void`
- `deletingId` - UUID of ticket being deleted (for loading state)

**Features:**
- 9 columns: ticket#/title, status, priority, category, assignee, due date, created, tags, actions
- Overdue highlighting (red background for past due dates)
- Bilingual category/tag names (respects i18n.language)
- Date formatting forced to 'en-US' (prevents Hijri calendar in Arabic)
- Truncated text with max widths
- Responsive design with horizontal scroll

**Usage:**
```jsx
<TicketListView
  tickets={filteredTickets}
  categories={categories}
  tags={allTags}
  onEdit={handleEditTicket}
  onDelete={handleDeleteTicket}
  deletingId={deletingTicketId}
/>
```

**Column Details:**
- **Ticket:** Number (mono font) + Title (truncated, 250px max) + Contact name
- **Status:** Badge component (5 states)
- **Priority:** Badge component (4 levels)
- **Category:** Badge with bilingual name
- **Assigned To:** User icon + name/email (150px max)
- **Due Date:** Calendar icon + formatted date (overdue = red)
- **Created:** Clock icon + formatted date
- **Tags:** First 2 tags + overflow count
- **Actions:** Edit (indigo) + Delete (red) buttons

---

### TicketKanbanView

**Location:** `components/Tickets/TicketKanbanView.jsx`
**Purpose:** Column-based board for visual ticket management with flexible grouping

**Props:**
- `tickets` - Full array of tickets
- `columns` - Array of column definitions `[{id, name, color, type}]`
- `groupBy` - Current grouping mode: 'status' | 'priority' | 'category' | 'assignedTo'
- `getTicketsByGroup` - Function `(groupId) => tickets[]` (handles filtering)
- `onEdit` - Edit callback `(ticket) => void`
- `onDelete` - Delete callback `(ticket) => void`
- `onAddTicket` - Add new ticket callback
- `canEdit` - Boolean permission flag
- `canDelete` - Boolean permission flag

**Features:**
- Dynamic columns based on grouping mode
- Smart badge hiding (don't show status badge when grouped by status)
- Overdue detection with visual indicators
- Tags display (first 2 + overflow count)
- Hover actions (edit/delete buttons)
- Empty state per column
- Add ticket button in column header

**Usage:**
```jsx
<TicketKanbanView
  tickets={allTickets}
  columns={getGroupedColumns()}
  groupBy={groupBy}
  getTicketsByGroup={getTicketsByGroup}
  onEdit={handleEditTicket}
  onDelete={handleDeleteTicket}
  onAddTicket={handleAddTicket}
  canEdit={canEdit}
  canDelete={canDelete}
/>
```

**Grouping Options:**
- **By Status:** open, in_progress, waiting, resolved, closed
- **By Priority:** low, medium, high, urgent
- **By Category:** Dynamic from categories table
- **By Assignee:** Dynamic from users + unassigned column

**Ticket Card Layout:**
- Ticket number (mono font)
- Title (line-clamp-2)
- Priority badge (if not grouped by priority)
- Status badge (if not grouped by status)
- Category badge (if not grouped by category)
- Due date with icon (red if overdue)
- Assigned user (if not grouped by assignee)
- Contact name
- Tags (first 2 + count)
- Actions (hover to show)

---

## 📝 Form Components

### TicketModal

**Location:** `components/Tickets/TicketModal.jsx`
**Purpose:** Full-featured modal for creating and editing tickets with comprehensive validation

**Props:**
- `ticket` - Ticket object for edit mode (null for create)
- `onSave` - Save callback (no args, parent refreshes data)
- `onClose` - Close callback

**Features:**
- Auto-loads 6 dropdown sources: categories, contacts, companies, deals, users, tags
- Tag auto-creation with permission check
- Form validation (title, status, priority, category required)
- Loading states for dropdowns
- Error handling with toast notifications
- Fixed height with scrollable content
- Sticky header and footer

**Internal State:**
- Form data (10 fields)
- Tag input buffer
- Saving/loading states
- Validation errors

**Usage:**
```jsx
{showModal && (
  <TicketModal
    ticket={editingTicket}
    onSave={handleSaveSuccess}
    onClose={() => setShowModal(false)}
  />
)}
```

**Form Fields (via TicketFormFields):**
1. Title* (required)
2. Description (textarea)
3. Status* (dropdown, 5 options)
4. Priority* (dropdown, 4 options)
5. Category* (searchable select)
6. Assigned To (searchable select)
7. Contact (searchable select)
8. Company (searchable select)
9. Deal (searchable select)
10. Due Date (date picker)
11. Tags (multi-input with auto-create)

---

### TicketFormFields

**Location:** `components/Tickets/TicketFormFields.jsx`
**Purpose:** Reusable form fields component for ticket creation/editing

**Props:**
- `formData` - Form state object
- `handleChange` - Change handler `(e) => void`
- `errors` - Validation errors object
- `categories` - Array of category options
- `contacts` - Array of contact options
- `companies` - Array of company options
- `deals` - Array of deal options
- `users` - Array of user options
- `tags` - Array of tag options
- `tagInput` - Tag input string
- `setTagInput` - Tag input setter
- `handleTagKeyDown` - Key handler for tag input
- `addTag` - Add tag function
- `removeTag` - Remove tag function `(tagId) => void`
- `loadingDropdowns` - Loading state boolean

**Features:**
- Bilingual labels and placeholders
- Red asterisk for required fields
- Inline error messages (red text below fields)
- Tag chips with color backgrounds and remove buttons
- SearchableSelect integration for dropdowns
- Grid layout (2-column for status/priority)

**Usage:**
```jsx
<TicketFormFields
  formData={formData}
  handleChange={handleChange}
  errors={errors}
  categories={categories}
  contacts={contacts}
  companies={companies}
  deals={deals}
  users={users}
  tags={tags}
  tagInput={tagInput}
  setTagInput={setTagInput}
  handleTagKeyDown={handleTagKeyDown}
  addTag={addTag}
  removeTag={removeTag}
  loadingDropdowns={loading}
/>
```

---

### TicketFilters

**Location:** `components/Tickets/TicketFilters.jsx`
**Purpose:** Advanced filtering panel with 9 filter types

**Props:**
- `filters` - Current filters object
- `onFiltersChange` - Callback `(newFilters) => void`
- `isOpen` - Panel visibility boolean

**Features:**
- Auto-loads dropdown options on open (users, tags, categories)
- Active filter count badge
- Clear all filters button
- Collapsible panel (controlled by parent)
- Grid layout (responsive: 1 column mobile, 2-3 desktop)

**Filter Types:**
1. **Status** - Single select dropdown (5 options)
2. **Priority** - Single select dropdown (4 options)
3. **Category** - Single select dropdown (dynamic from DB)
4. **Assigned To** - Single select dropdown (dynamic users)
5. **Tags** - Multi-select (native, hold Ctrl/Cmd)
6. **Due Date From** - Date input
7. **Due Date To** - Date input
8. **Show Overdue** - Checkbox (due_date < today AND status != closed)
9. **Show Unassigned** - Checkbox (assigned_to IS NULL)

**Usage:**
```jsx
<TicketFilters
  filters={filters}
  onFiltersChange={setFilters}
  isOpen={showFilters}
/>
```

**Filter Object Structure:**
```javascript
{
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed' | null,
  priority: 'low' | 'medium' | 'high' | 'urgent' | null,
  category: 'uuid' | null,
  assignedTo: 'uuid' | null,
  tags: ['uuid', ...],
  dueDateFrom: 'YYYY-MM-DD' | null,
  dueDateTo: 'YYYY-MM-DD' | null,
  showOverdue: boolean,
  showUnassigned: boolean
}
```

---

## 🏷️ Badge Components

### TicketStatusBadge

**Location:** `components/Tickets/TicketStatusBadge.jsx`
**Purpose:** Colored badge for ticket status with 5 states

**Props:**
- `status` - Status string: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed'
- `size` - Size variant: 'sm' | 'md' | 'lg' (default: 'md')

**Color Mapping:**
- **open** → Blue (#3b82f6)
- **in_progress** → Yellow (#eab308)
- **waiting** → Purple (#a855f7)
- **resolved** → Green (#22c55e)
- **closed** → Gray (#6b7280)

**Usage:**
```jsx
<TicketStatusBadge status="in_progress" size="sm" />
```

---

### TicketPriorityBadge

**Location:** `components/Tickets/TicketPriorityBadge.jsx`
**Purpose:** Colored badge for ticket priority with 4 levels

**Props:**
- `priority` - Priority string: 'low' | 'medium' | 'high' | 'urgent'
- `size` - Size variant: 'sm' | 'md' | 'lg' (default: 'md')
- `showIcon` - Show icon flag (default: true)

**Color Mapping:**
- **low** → Green (#22c55e)
- **medium** → Yellow (#eab308)
- **high** → Orange (#f97316)
- **urgent** → Red (#ef4444)

**Usage:**
```jsx
<TicketPriorityBadge priority="urgent" size="sm" showIcon={false} />
```

---

### TicketCategoryBadge

**Location:** `components/Tickets/TicketCategoryBadge.jsx`
**Purpose:** Bilingual category badge with custom colors

**Props:**
- `slug` - Category slug (for icon/logic)
- `nameEn` - English name
- `nameAr` - Arabic name
- `color` - Hex color code (e.g., '#6366f1')
- `size` - Size variant: 'sm' | 'md' | 'lg' (default: 'md')
- `showIcon` - Show icon flag (default: true)

**Features:**
- Auto-selects name based on `i18n.language`
- Custom background color with 15% opacity
- Fallback to gray if no color provided

**Usage:**
```jsx
<TicketCategoryBadge
  slug="technical_support"
  nameEn="Technical Support"
  nameAr="الدعم الفني"
  color="#3b82f6"
  size="sm"
  showIcon={false}
/>
```

---

## 📌 Integration Notes

### With Main Tickets Page
All components are imported from barrel export:
```javascript
import {
  TicketListView,
  TicketKanbanView,
  TicketModal,
  TicketFilters
} from '../components/Tickets';
```

### Component Hierarchy
```
Tickets.jsx (page)
├── TicketFilters
├── TicketListView
│   ├── TicketStatusBadge
│   ├── TicketPriorityBadge
│   └── TicketCategoryBadge
├── TicketKanbanView
│   ├── TicketStatusBadge
│   ├── TicketPriorityBadge
│   └── TicketCategoryBadge
└── TicketModal
    └── TicketFormFields
```

### State Management Pattern
Page handles all state and passes callbacks:
- Tickets data array
- Filter state object
- Modal visibility
- Editing ticket reference
- CRUD handlers (create, edit, delete)

---

## 🎨 Design Patterns

### Bilingual Support
All components respect `i18n.language`:
```javascript
const isRTL = i18n.language === 'ar';
const displayName = isRTL && item.name_ar ? item.name_ar : item.name_en;
```

### Date Formatting
Force Gregorian calendar (not Hijri in Arabic):
```javascript
date.toLocaleDateString('en-US', { ... })
```

### Overdue Detection
```javascript
const isOverdue = (ticket) => {
  if (!ticket.due_date || ticket.status === 'closed' || ticket.status === 'resolved') {
    return false;
  }
  return new Date(ticket.due_date) < new Date();
};
```

### Color with Opacity
```javascript
const hexToRgba = (hex, opacity) => {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
```

---

## 🔧 Technical Notes & Best Practices

### Backend Response Structure Patterns

**Important:** Different endpoints return data in different wrapper structures. Always verify the response structure for each API endpoint:

```javascript
// Categories endpoint returns:
{ success: true, data: [...] }
// Access with: response.data

// Companies endpoint returns:
{ success: true, companies: [...] }
// Access with: response.companies

// Tickets endpoint returns:
{ success: true, data: [...] }
// Access with: response.data
```

**Implementation in TicketModal.jsx:**
```javascript
const [categoriesRes, contactsRes, companiesRes, dealsRes, usersRes, tagsRes] = await Promise.all([
  ticketAPI.getCategories(),      // Returns { data: [...] }
  contactAPI.getContacts(...),    // Returns { data: [...] }
  companyAPI.getCompanies(...),   // Returns { companies: [...] }
  dealAPI.getDeals(...),          // Returns { data: [...] }
  userAPI.getUsers(),             // Returns { users: [...] }
  tagAPI.getTags(),               // Returns { tags: [...] }
]);

setCategories(categoriesRes.data || []);           // Use .data
setContacts(contactsRes.data || []);               // Use .data
setCompanies(companiesRes.companies || []);        // Use .companies
setDeals(dealsRes.data || []);                     // Use .data
setUsers(usersRes.users || []);                    // Use .users
setTags(tagsRes.tags || []);                       // Use .tags
```

### Tag Data Transformation

**Backend Structure:** The backend returns tags in a nested junction table structure:
```javascript
{
  id: 'uuid',
  title: 'Ticket title',
  ticket_tags: [
    { tag_id: 'uuid-1', tags: { id: 'uuid-1', name_en: 'Bug', name_ar: 'خطأ', color: '#ef4444' } },
    { tag_id: 'uuid-2', tags: { id: 'uuid-2', name_en: 'Urgent', name_ar: 'عاجل', color: '#f97316' } }
  ]
}
```

**Frontend Expectation:** Components expect flat arrays:
```javascript
{
  id: 'uuid',
  title: 'Ticket title',
  tags: ['uuid-1', 'uuid-2'],                         // Array of tag IDs
  tag_details: [                                       // Array of tag objects
    { id: 'uuid-1', name_en: 'Bug', name_ar: 'خطأ', color: '#ef4444' },
    { id: 'uuid-2', name_en: 'Urgent', name_ar: 'عاجل', color: '#f97316' }
  ]
}
```

**Transformation (in Tickets.jsx loadTickets function):**
```javascript
const transformedTickets = (response.data || []).map(ticket => {
  // Transform tags from nested structure to flat arrays
  const tagData = ticket.ticket_tags || [];
  const tags = tagData.map(tt => tt.tag_id).filter(Boolean);
  const tag_details = tagData.map(tt => tt.tags).filter(Boolean);

  return {
    ...ticket,
    tags,
    tag_details
  };
});
```

### UI Optimization: Column Width

**Screen Space Management:** Kanban columns use `w-64` (256px) instead of `w-80` (320px) for better screen utilization:

```javascript
// TicketKanbanView.jsx line 214
<div className="flex-shrink-0 w-64">  // Optimized width
  {/* Column content */}
</div>
```

**Benefits:**
- Shows 5 columns on 1920px screens vs 4 with `w-80`
- Better horizontal space utilization
- More visible information without scrolling

### Dropdown Labeling Clarity

**Group By Dropdown:** Uses "Categories by" instead of "Filter by" for better UX clarity:

```javascript
// Tickets.jsx
const getGroupByOptions = () => {
  const prefix = isRTL ? 'التصنيف حسب' : 'Categories by';  // Not "Filter by"
  return [
    { value: 'status', label: `${prefix} ${t('status')}`, icon: '📊' },
    { value: 'priority', label: `${prefix} ${t('priority')}`, icon: '⚡' },
    { value: 'category', label: `${prefix} ${t('category')}`, icon: '📁' },
    { value: 'assignedTo', label: `${prefix} ${t('assignee')}`, icon: '👤' },
  ];
};
```

**Rationale:** "Categories by" more accurately describes the grouping functionality than "Filter by", reducing user confusion.

---

**Last Updated:** January 15, 2025
**Maintainer:** Development Team
**Related Docs:** [COMPONENTS.md](COMPONENTS.md), [ADD_NEW_MODULE_DYNAMIC.md](../ADD_NEW_MODULE_DYNAMIC.md)
