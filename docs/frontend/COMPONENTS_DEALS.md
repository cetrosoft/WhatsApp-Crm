# 💼 Deals Module Components

Complete documentation for all Deals module reusable components.

**Module:** Sales Pipeline & Deals Management
**Total Components:** 12
**Status:** Production Ready ✅

---

## 📋 Component Overview

| Component | Purpose | Lines | Complexity |
|-----------|---------|-------|------------|
| DealModal | Create/edit modal | 335 | High |
| DealFormFields | Comprehensive form (11 fields) | 290 | Medium |
| DealListView | Table view with 8 columns | 275 | Medium |
| DealCard | Drag-droppable card | 180 | Medium |
| FilterPanel | Advanced filters (7 types) | 210 | Medium |
| KanbanColumn | Sortable column | 220 | Medium |
| QuickAddDealCard | Inline creation form | 200 | Medium |
| QuickAddFormFields | Quick form (4 fields) | 160 | Low |
| ContactSearchDropdown | Contact autocomplete | 250 | Medium |
| DealsHeader | Page header with stats | 120 | Low |
| DealsKanban | Kanban container | 100 | Low |
| DealsGroupBy | Group dropdown | 80 | Low |

---

## 🎨 Main Components

### DealModal

**Location:** `components/Deals/DealModal.jsx`
**Purpose:** Full-featured modal for creating and editing deals

**Props:**
- `deal` - Deal object for edit mode (null for create)
- `pipeline` - Current pipeline object
- `stages` - Array of stage objects for the pipeline
- `onSave` - Save callback (no args, parent refreshes)
- `onClose` - Close callback

**Features:**
- Auto-loads 4 dropdown sources: contacts, companies, users, tags
- Tag auto-creation with permission check
- Form validation (title, value, pipeline, stage required)
- Loading states for dropdowns
- Sticky header and footer with scrollable content
- Parse value and probability to numbers before save

**Form Fields (11):**
1. Title* (required)
2. Value* (required, numeric)
3. Currency (default: SAR)
4. Pipeline* (readonly if provided)
5. Stage* (dropdown from pipeline stages)
6. Contact (searchable select)
7. Company (searchable select)
8. Assigned To (searchable select)
9. Expected Close Date (date picker)
10. Probability (slider, 0-100%)
11. Tags (multi-input with auto-create)
12. Notes (textarea)

**Usage:**
```jsx
{showModal && (
  <DealModal
    deal={editingDeal}
    pipeline={selectedPipeline}
    stages={stages}
    onSave={handleSaveSuccess}
    onClose={() => setShowModal(false)}
  />
)}
```

---

### DealListView

**Location:** `components/Deals/DealListView.jsx`
**Purpose:** Dense table view displaying deals with all key information

**Props:**
- `deals` - Array of deal objects with joined data
- `stages` - Array of stage objects for lookups
- `tags` - Array of tag objects for display
- `onEdit` - Edit callback `(deal) => void`
- `onDelete` - Delete callback `(deal) => void`
- `deletingId` - UUID of deal being deleted

**Features:**
- 8 columns: title/contact, stage, value, probability, expected close, assigned to, tags, actions
- Stage badges with colored backgrounds (15% opacity)
- Currency formatting with locale support
- Date formatting forced to 'en-US' (prevents Hijri)
- Probability color coding (green >75%, yellow 50-75%, red <50%)
- Tags display (first 2 + overflow count)
- Responsive with horizontal scroll

**Column Details:**
- **Deal:** Title (medium font) + Contact name (gray, small)
- **Stage:** Badge with stage color background
- **Value:** Currency symbol + formatted number
- **Probability:** Colored percentage (green/yellow/red)
- **Expected Close:** Calendar icon + date
- **Assigned To:** User icon + name/email
- **Tags:** Colored badges (first 2 + count)
- **Actions:** Edit + Delete buttons

**Helper Functions:**
```javascript
formatCurrency(value) // $1,234.56
formatDate(date) // Jan 15, 2025
getProbabilityColor(prob) // green/yellow/red
hexToRgba(hex, opacity) // rgba(59, 130, 246, 0.15)
```

**Usage:**
```jsx
<DealListView
  deals={filteredDeals}
  stages={stages}
  tags={allTags}
  onEdit={handleEditDeal}
  onDelete={handleDeleteDeal}
  deletingId={deletingDealId}
/>
```

---

### FilterPanel

**Location:** `components/Deals/FilterPanel.jsx`
**Purpose:** Advanced filtering panel with 7 filter types (Odoo-style)

**Props:**
- `filters` - Current filters object
- `onFiltersChange` - Callback `(newFilters) => void`
- `isOpen` - Panel visibility boolean

**Features:**
- Auto-loads users and tags on open
- Active filter count with clear all button
- Compact 2-row grid layout
- SearchableFilterDropdown for complex selects
- Date period selector with presets (months, quarters, years)
- Value range input (min/max)

**Filter Types:**
1. **Assigned To** - Single select dropdown (users)
2. **Tags** - Multi-select dropdown (tags, bilingual)
3. **Probability** - Single select (4 ranges: 0-25%, 25-50%, 50-75%, 75-100%)
4. **Value Min** - Number input
5. **Value Max** - Number input
6. **Expected Close Period** - Date period selector
7. **Created Date Period** - Date period selector

**Usage:**
```jsx
<FilterPanel
  filters={filters}
  onFiltersChange={setFilters}
  isOpen={showFilters}
/>
```

**Filter Object Structure:**
```javascript
{
  assignedTo: 'uuid' | null,
  tags: ['uuid', ...],
  probability: '0-25' | '25-50' | '50-75' | '75-100' | null,
  valueMin: number | null,
  valueMax: number | null,
  expectedClosePeriod: 'month-2025-0' | 'q1' | 'thisYear' | null,
  createdPeriod: 'month-2025-0' | 'q1' | 'thisYear' | null
}
```

---

### DealCard

**Location:** `components/DealCard.jsx`
**Purpose:** Draggable card component for Kanban board with @dnd-kit

**Props:**
- `deal` - Deal object with all joined data
- `canEdit` - Boolean permission flag
- `canDelete` - Boolean permission flag
- `onEdit` - Edit callback
- `onDelete` - Delete callback
- `groupBy` - Current grouping mode (for conditional display)

**Features:**
- Drag handle with 6-dot icon
- Hover shadow effect
- Smart field hiding based on groupBy
- Tags display (first 3 + overflow count)
- Color-coded probability bar
- Bilingual tag names

**Card Layout:**
- Drag handle (top-left)
- Title (bold, line-clamp-2)
- Contact name (gray, small)
- Value (large, currency formatted)
- Probability bar (colored, full width)
- Expected close date (if set)
- Assigned user (if not grouped by user)
- Tags (colored badges, max 3)
- Actions on hover (edit/delete)

**Usage:**
```jsx
<DealCard
  deal={deal}
  canEdit={canEdit}
  canDelete={canDelete}
  onEdit={handleEditDeal}
  onDelete={handleDeleteDeal}
  groupBy={groupBy}
/>
```

**Used with @dnd-kit:**
```jsx
<SortableContext items={dealIds}>
  {deals.map(deal => (
    <SortableItem key={deal.id} id={deal.id}>
      <DealCard deal={deal} ... />
    </SortableItem>
  ))}
</SortableContext>
```

---

### KanbanColumn

**Location:** `components/Deals/KanbanColumn.jsx`
**Purpose:** Sortable column for Kanban board with quick-add functionality

**Props:**
- `stage` - Column definition `{id, name, color, type}`
- `deals` - Deals for this column
- `totalValue` - Sum of deal values in column
- `canEdit` - Boolean permission
- `canDelete` - Boolean permission
- `onAddDeal` - Full add callback
- `onQuickAddDeal` - Quick add callback
- `onContactSearch` - Contact search function
- `onEditDeal` - Edit callback
- `onDeleteDeal` - Delete callback
- `groupBy` - Current grouping mode
- `quickAddSaving` - Saving state for quick add

**Features:**
- Column header with stage color dot
- Deal count badge
- Total value display
- Add button (opens full modal)
- Quick add form (expandable)
- @dnd-kit drop zone
- Empty state

**Column Header:**
- Color dot indicator
- Stage name
- Deal count badge
- Total value (formatted currency)
- Add button

**Usage:**
```jsx
<KanbanColumn
  stage={{id: 'stage-1', name: 'Qualified', color: '#3b82f6'}}
  deals={dealsByStage}
  totalValue={calculateTotal(dealsByStage)}
  canEdit={canEdit}
  canDelete={canDelete}
  onAddDeal={handleAddDeal}
  onQuickAddDeal={handleQuickAdd}
  onContactSearch={searchContacts}
  onEditDeal={handleEdit}
  onDeleteDeal={handleDelete}
  groupBy="stage"
  quickAddSaving={saving}
/>
```

---

### QuickAddDealCard

**Location:** `components/Deals/QuickAddDealCard.jsx`
**Purpose:** Inline deal creation form within Kanban column

**Props:**
- `stageId` - Target stage UUID
- `onSave` - Save callback `(formData) => Promise<void>`
- `onCancel` - Cancel callback
- `onContactSearch` - Contact search function
- `saving` - Saving state boolean

**Features:**
- Compact 4-field form
- Contact search with autocomplete
- Auto-create contact option
- Phone validation with country code selector
- Inline error display
- Cancel button clears form

**Form Fields:**
1. Contact name (searchable, required)
2. Phone (with country code, required if creating contact)
3. Email (for new contact)
4. Value (required, numeric)

**Usage:**
```jsx
<QuickAddDealCard
  stageId={stage.id}
  onSave={handleQuickSave}
  onCancel={() => setShowQuickAdd(false)}
  onContactSearch={searchContacts}
  saving={saving}
/>
```

---

## 📝 Form Components

### DealFormFields

**Location:** `components/Deals/DealFormFields.jsx`
**Purpose:** Comprehensive form fields for deal creation/editing

**Props:**
- `formData` - Form state object
- `handleChange` - Change handler
- `errors` - Validation errors object
- `pipeline` - Pipeline object
- `stages` - Array of stage options
- `contacts` - Array of contact options
- `companies` - Array of company options
- `users` - Array of user options
- `tags` - Array of tag options
- `tagInput` - Tag input string
- `setTagInput` - Tag input setter
- `handleTagKeyDown` - Key handler
- `addTag` - Add tag function
- `removeTag` - Remove tag function
- `loadingDropdowns` - Loading state

**Features:**
- Grid layout (2-3 columns responsive)
- SearchableSelect integration
- Tag chips with remove buttons
- Probability slider with percentage display
- Currency selector
- Date picker for expected close
- Textarea for notes

**Field Groups:**
- **Basic:** Title, Value, Currency
- **Pipeline:** Pipeline (readonly), Stage
- **Relationships:** Contact, Company, Assigned To
- **Timeline:** Expected Close Date, Probability
- **Metadata:** Tags, Notes

**Usage:**
```jsx
<DealFormFields
  formData={formData}
  handleChange={handleChange}
  errors={errors}
  pipeline={pipeline}
  stages={stages}
  contacts={contacts}
  companies={companies}
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

### QuickAddFormFields

**Location:** `components/Deals/QuickAddFormFields.jsx`
**Purpose:** Compact 4-field form for quick deal creation

**Props:**
- `formData` - Form state object
- `onChange` - Callback `(updates) => void` (receives partial object)
- `errors` - Validation errors object
- `disabled` - Disabled state

**Features:**
- Contact name input
- Phone input with country code
- Email input (optional)
- Value input (required)
- Compact single-column layout

**Usage:**
```jsx
<QuickAddFormFields
  formData={formData}
  onChange={(updates) => setFormData({...formData, ...updates})}
  errors={errors}
  disabled={saving}
/>
```

---

### ContactSearchDropdown

**Location:** `components/Deals/ContactSearchDropdown.jsx`
**Purpose:** Searchable contact dropdown with autocomplete and create option

**Props:**
- `value` - Contact name string
- `onChange` - Callback `(data) => void` (receives object with contactName, contactId, email, phone, phone_country_code)
- `onContactSearch` - Async function `(query) => Promise<Contact[]>`
- `disabled` - Disabled state
- `error` - Error message string

**Features:**
- Real-time search with debounce
- Dropdown with search results
- "Create new contact" option at bottom
- Populates related fields (email, phone) on select
- Loading indicator
- Keyboard navigation (arrow keys, enter)

**Usage:**
```jsx
<ContactSearchDropdown
  value={formData.contactName}
  onChange={(data) => setFormData({...formData, ...data})}
  onContactSearch={async (term) => {
    const res = await contactAPI.getContacts({search: term, limit: 10});
    return res.data;
  }}
  error={errors.contact}
/>
```

**onChange Data Structure:**
```javascript
{
  contactName: string,
  contactId: uuid | null,
  email: string,
  phone: string,
  phone_country_code: string
}
```

---

## 🎛️ Supporting Components

### DealsHeader

**Location:** `components/Deals/DealsHeader.jsx` (embedded in Deals.jsx)
**Purpose:** Page header with title, stats, and action buttons

**Features:**
- Module icon + title
- Deal count + stage count
- Stats grid (4 cards):
  - Total deals count
  - Total value (sum)
  - Average deal size
  - Weighted value (value × probability)
- View toggle (cards/list)
- Add deal button (with permission)

---

### DealsKanban

**Location:** `components/Deals/DealsKanban.jsx` (embedded in Deals.jsx)
**Purpose:** DndContext wrapper for Kanban board

**Features:**
- @dnd-kit/core DndContext
- Drag sensors (PointerSensor with 8px threshold)
- Collision detection (closestCorners)
- DragOverlay for active card
- Handles drag events (onDragStart, onDragOver, onDragEnd)

---

### DealsGroupBy

**Location:** Embedded in Deals.jsx
**Purpose:** Dropdown for changing Kanban grouping mode

**Features:**
- 6 grouping options:
  - By Stage (default)
  - By Assigned To
  - By Tags
  - By Expected Close Date
  - By Created Date
  - By Probability Range
- Search within options
- Icons for each option
- Checkmark for selected option

---

## 📌 Integration Notes

### With Main Deals Page
Components imported from barrel export:
```javascript
import {
  DealModal,
  DealFormFields,
  DealListView,
  DealCard,
  FilterPanel,
  KanbanColumn,
  QuickAddDealCard
} from '../components/Deals';
```

### Component Hierarchy
```
Deals.jsx (page)
├── DealsHeader (stats)
├── FilterPanel
├── DealsGroupBy
├── DealListView (list mode)
│   └── DealCard (rows)
└── DealsKanban (kanban mode)
    └── KanbanColumn × N
        ├── QuickAddDealCard
        └── DealCard × N (sortable)
└── DealModal
    ├── DealFormFields
    └── ContactSearchDropdown
```

### State Management
Page handles all state:
- Deals data array
- Pipelines and stages
- Filter state object
- Group by mode
- View mode (cards/list)
- Modal visibility
- Active deal (for drag overlay)
- CRUD handlers

---

## 🎨 Design Patterns

### Drag and Drop
Using @dnd-kit library:
```jsx
import { DndContext, closestCorners, PointerSensor } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';

const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 }
  })
);
```

### Optimistic Updates
Update UI immediately, revert on error:
```javascript
// Move deal to new stage optimistically
setDeals(prev => prev.map(d =>
  d.id === dealId ? {...d, stage_id: newStageId} : d
));

try {
  await dealAPI.moveDealToStage(dealId, newStageId);
} catch (error) {
  // Revert on error
  setDeals(prev => prev.map(d =>
    d.id === dealId ? {...d, stage_id: originalStageId} : d
  ));
}
```

### Filter Logic
Shared filter function used by both views:
```javascript
const getFilteredDeals = () => {
  return deals.filter(deal => {
    const matchesSearch = searchTerm
      ? deal.title.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    const matchesAssignedTo = filters.assignedTo
      ? deal.assigned_to === filters.assignedTo
      : true;

    // ... more filters

    return matchesSearch && matchesAssignedTo && ...;
  });
};
```

### Grouping Logic
Dynamic columns based on groupBy mode:
```javascript
const getGroupedColumns = () => {
  switch (groupBy) {
    case 'stage':
      return stages.map(stage => ({id: stage.id, name: stage.name, ...}));
    case 'assignedTo':
      return users.map(user => ({id: user.id, name: user.name, ...}));
    // ... more cases
  }
};
```

---

**Last Updated:** January 2025
**Maintainer:** Development Team
**Related Docs:** [COMPONENTS.md](COMPONENTS.md), [COMPONENTS_TICKETS.md](COMPONENTS_TICKETS.md)
