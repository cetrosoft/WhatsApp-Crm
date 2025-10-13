# Reusable Components Catalog

This document catalogs all reusable components available for building new modules and pages.

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

## 💼 Deals Module Components

### ContactSearchDropdown
**Location:** `components/Deals/ContactSearchDropdown.jsx`
**Purpose:** Searchable contact dropdown with autocomplete and "create new" option
**Props:**
- `value` - Contact name string
- `onChange` - Callback function (receives object with contactName, contactId, email, phone, phone_country_code)
- `onContactSearch` - Async function to search contacts
- `disabled` - Disabled state
- `error` - Error message

**Usage:**
```jsx
<ContactSearchDropdown
  value={contactName}
  onChange={(data) => setFormData({...formData, ...data})}
  onContactSearch={async (term) => await searchContacts(term)}
  error={errors.contact}
/>
```

---

### QuickAddFormFields
**Location:** `components/Deals/QuickAddFormFields.jsx`
**Purpose:** Grouped form fields for quick deal creation (title, phone, email, revenue)
**Props:**
- `formData` - Form data object
- `onChange` - Callback function (receives partial update object)
- `errors` - Error object
- `disabled` - Disabled state

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

### DealFormFields
**Location:** `components/Deals/DealFormFields.jsx`
**Purpose:** Complete deal form fields including pipeline, stage, contacts, companies, tags
**Props:**
- `formData` - Form data object
- `handleChange` - Change handler
- `errors` - Error object
- `pipeline` - Pipeline object
- `stages` - Array of stages
- `contacts` - Array of contacts
- `companies` - Array of companies
- `users` - Array of users
- `tags` - Array of tags
- `tagInput` - Tag input value
- `setTagInput` - Tag input setter
- `handleTagKeyDown` - Tag input key handler
- `addTag` - Add tag function
- `removeTag` - Remove tag function
- `loadingDropdowns` - Loading state

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

### DealListView
**Location:** `components/Deals/DealListView.jsx`
**Purpose:** Table layout for displaying deals with all key information
**Props:**
- `deals` - Array of deal objects
- `stages` - Array of stage objects
- `tags` - Array of tag objects
- `onEdit` - Edit callback
- `onDelete` - Delete callback
- `deletingId` - ID of deal being deleted

**Usage:**
```jsx
<DealListView
  deals={deals}
  stages={stages}
  tags={tags}
  onEdit={handleEdit}
  onDelete={handleDelete}
  deletingId={deletingId}
/>
```

---

## 👥 Contacts Module Components

### ContactsTable
**Location:** `components/Contacts/ContactsTable.jsx`
**Purpose:** Contacts data table with actions
**Props:**
- `contacts` - Array of contact objects
- `onEdit` - Edit callback
- `onDelete` - Delete callback
- `getStatusBadge` - Function to render status badge
- `getCountryDisplay` - Function to get country display
- `loading` - Loading state

**Usage:**
```jsx
<ContactsTable
  contacts={contacts}
  onEdit={handleEdit}
  onDelete={handleDelete}
  getStatusBadge={(status) => <span>{status}</span>}
  getCountryDisplay={(country) => country.name}
  loading={loading}
/>
```

---

### ContactsFilters
**Location:** `components/Contacts/ContactsFilters.jsx`
**Purpose:** Contact filtering panel with search, tags, status, lead source
**Props:**
- `searchTerm` - Search value
- `onSearchChange` - Search change handler
- `tagFilter` - Selected tag IDs
- `onTagFilterChange` - Tag filter change handler
- `statusFilter` - Selected status ID
- `onStatusFilterChange` - Status filter change handler
- `leadSourceFilter` - Selected lead source
- `onLeadSourceFilterChange` - Lead source filter change handler
- `tags` - Array of tags
- `statuses` - Array of statuses
- `leadSources` - Array of lead sources
- `loading` - Loading state

**Usage:**
```jsx
<ContactsFilters
  searchTerm={search}
  onSearchChange={setSearch}
  tagFilter={selectedTags}
  onTagFilterChange={setSelectedTags}
  tags={tags}
  statuses={statuses}
  leadSources={leadSources}
/>
```

---

### ContactFormFields
**Location:** `components/Contacts/ContactFormFields.jsx`
**Purpose:** Contact form fields (name, email, phone, etc.)
**Props:**
- `formData` - Form data object
- `handleChange` - Change handler
- `handlePhoneChange` - Phone change handler
- `errors` - Error object
- `lookupData` - Lookup data (statuses, countries, sources, users, tags)

**Usage:**
```jsx
<ContactFormFields
  formData={formData}
  handleChange={handleChange}
  handlePhoneChange={handlePhoneChange}
  errors={errors}
  lookupData={lookupData}
/>
```

---

## 🏢 Companies Module Components

### CompanyBasicTab
**Location:** `components/Companies/CompanyBasicTab.jsx`
**Purpose:** Basic company info tab (logo, name, industry, status, tags)
**Props:**
- `formData` - Form data object
- `setFormData` - Form data setter
- `lookupData` - Lookup data (statuses, tags)
- `uploading` - Upload state
- `handleLogoUpload` - Logo upload handler

**Usage:**
```jsx
<CompanyBasicTab
  formData={formData}
  setFormData={setFormData}
  lookupData={lookupData}
  uploading={uploading}
  handleLogoUpload={handleLogoUpload}
/>
```

---

### CompanyLegalTab
**Location:** `components/Companies/CompanyLegalTab.jsx`
**Purpose:** Legal company info tab (tax ID, commercial ID, documents)
**Props:**
- `formData` - Form data object
- `setFormData` - Form data setter
- `uploading` - Upload state
- `handleDocumentUpload` - Document upload handler
- `handleDeleteDocument` - Document delete handler

**Usage:**
```jsx
<CompanyLegalTab
  formData={formData}
  setFormData={setFormData}
  uploading={uploading}
  handleDocumentUpload={handleDocumentUpload}
  handleDeleteDocument={handleDeleteDocument}
/>
```

---

### CompanyLocationTab
**Location:** `components/Companies/CompanyLocationTab.jsx`
**Purpose:** Company location tab (address, city, country, notes)
**Props:**
- `formData` - Form data object
- `setFormData` - Form data setter
- `lookupData` - Lookup data (countries)

**Usage:**
```jsx
<CompanyLocationTab
  formData={formData}
  setFormData={setFormData}
  lookupData={lookupData}
/>
```

---

### CompanyCardView
**Location:** `components/Companies/CompanyCardView.jsx`
**Purpose:** Company card grid view with logo, stats, actions
**Props:**
- `companies` - Array of company objects
- `onEdit` - Edit callback
- `onDelete` - Delete callback
- `getStatusBadge` - Function to render status badge

**Usage:**
```jsx
<CompanyCardView
  companies={companies}
  onEdit={handleEdit}
  onDelete={handleDelete}
  getStatusBadge={(status) => <span>{status}</span>}
/>
```

---

### CompanyListView
**Location:** `components/Companies/CompanyListView.jsx`
**Purpose:** Company list/table view
**Props:**
- `companies` - Array of company objects
- `onEdit` - Edit callback
- `onDelete` - Delete callback
- `getStatusBadge` - Function to render status badge

**Usage:**
```jsx
<CompanyListView
  companies={companies}
  onEdit={handleEdit}
  onDelete={handleDelete}
  getStatusBadge={(status) => <span>{status}</span>}
/>
```

---

## 🎯 Segments Module Components

### SegmentHeader
**Location:** `components/Segments/SegmentHeader.jsx`
**Purpose:** Segment name and description fields (bilingual)
**Props:**
- `formData` - Form data object (name_en, name_ar, description_en, description_ar)
- `onChange` - Callback function

**Usage:**
```jsx
<SegmentHeader
  formData={formData}
  onChange={setFormData}
/>
```

---

### SegmentValueInput
**Location:** `components/Segments/SegmentValueInput.jsx`
**Purpose:** Dynamic value input based on field type (status, country, tags, date, etc.)
**Props:**
- `condition` - Condition object (field, operator, value)
- `index` - Condition index
- `lookupData` - Lookup data (statuses, countries, users, tags, leadSources)
- `onUpdate` - Update callback (index, field, value)

**Usage:**
```jsx
<SegmentValueInput
  condition={condition}
  index={0}
  lookupData={lookupData}
  onUpdate={(index, field, value) => updateCondition(index, field, value)}
/>
```

---

### SegmentConditionRow
**Location:** `components/Segments/SegmentConditionRow.jsx`
**Purpose:** Single filter condition row (field, operator, value) with remove button
**Props:**
- `condition` - Condition object
- `index` - Condition index
- `fieldOptions` - Array of field options
- `getOperatorOptions` - Function to get operators for field
- `lookupData` - Lookup data
- `onUpdate` - Update callback
- `onRemove` - Remove callback

**Usage:**
```jsx
<SegmentConditionRow
  condition={condition}
  index={0}
  fieldOptions={fieldOptions}
  getOperatorOptions={getOperatorOptions}
  lookupData={lookupData}
  onUpdate={updateCondition}
  onRemove={removeCondition}
/>
```

---

## 👤 Team Module Components

### RoleCard
**Location:** `components/Team/RoleCard.jsx`
**Purpose:** Role card with badge, stats, and action buttons
**Props:**
- `role` - Role object (id, name, slug, is_system, user_count, permission_count)
- `onEdit` - Edit callback
- `onDuplicate` - Duplicate callback
- `onDelete` - Delete callback
- `duplicating` - ID of role being duplicated
- `getRoleBadgeColor` - Function to get badge color

**Usage:**
```jsx
<RoleCard
  role={role}
  onEdit={handleEdit}
  onDuplicate={handleDuplicate}
  onDelete={handleDelete}
  duplicating={duplicatingId}
  getRoleBadgeColor={(slug) => 'bg-blue-100'}
/>
```

---

### DeleteRoleModal
**Location:** `components/Team/DeleteRoleModal.jsx`
**Purpose:** Delete confirmation dialog for roles
**Props:**
- `role` - Role object to delete
- `onConfirm` - Confirm callback (receives roleId)
- `onCancel` - Cancel callback
- `deleting` - Deleting state

**Usage:**
```jsx
<DeleteRoleModal
  role={selectedRole}
  onConfirm={handleDelete}
  onCancel={() => setSelectedRole(null)}
  deleting={deleting}
/>
```

---

### UserPermissionsList
**Location:** `components/Team/UserPermissionsList.jsx`
**Purpose:** List of users with custom permissions (grants/revokes)
**Props:**
- `users` - Array of user objects with permissions
- `onManagePermissions` - Callback to manage user permissions

**Usage:**
```jsx
<UserPermissionsList
  users={usersWithCustomPermissions}
  onManagePermissions={handleManagePermissions}
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

## 📝 Notes

- **Bilingual Support:** Most components support Arabic/English via `i18n.language`
- **RTL Support:** Components handle RTL layout automatically
- **Error Handling:** Components accept `error` prop for validation messages
- **Loading States:** Components accept `loading` or `disabled` props
- **Styling:** All components use Tailwind CSS utility classes

---

## 🚀 Quick Start

1. **Import from shared barrel:** `import { SearchableSelect } from '@/components/shared'`
2. **Check props:** Review this file for required/optional props
3. **Copy usage example:** Start with the example and customize
4. **Test with your data:** Components are designed to be data-agnostic

---

**Last Updated:** January 2025
**Total Components:** 23 reusable components
