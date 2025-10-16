# 🏢 CRM Module Components

Complete documentation for all CRM module reusable components (Contacts, Companies, Segments).

**Module:** Customer Relationship Management
**Total Components:** 11
**Status:** Production Ready ✅

---

## 📋 Component Overview

| Component | Purpose | Lines | Module |
|-----------|---------|-------|--------|
| ContactsTable | Table with actions | 280 | Contacts |
| ContactsFilters | Filter panel | 220 | Contacts |
| ContactFormFields | Form fields | 250 | Contacts |
| CompanyBasicTab | Basic info tab | 180 | Companies |
| CompanyLegalTab | Legal info tab | 160 | Companies |
| CompanyLocationTab | Location tab | 140 | Companies |
| CompanyCardView | Card grid view | 200 | Companies |
| CompanyListView | Table view | 190 | Companies |
| SegmentHeader | Name/description fields | 80 | Segments |
| SegmentValueInput | Dynamic value input | 150 | Segments |
| SegmentConditionRow | Filter condition row | 180 | Segments |

---

## 👥 Contacts Module Components

### ContactsTable

**Location:** `components/Contacts/ContactsTable.jsx`
**Purpose:** Contacts data table with actions and responsive design

**Props:**
- `contacts` - Array of contact objects
- `onEdit` - Edit callback `(contact) => void`
- `onDelete` - Delete callback `(contact) => void`
- `getStatusBadge` - Function to render status badge
- `getCountryDisplay` - Function to get country display
- `loading` - Loading state boolean

**Features:**
- Responsive table with 8 columns
- Status badges with custom colors
- Phone numbers with country display
- Email with mailto link
- Lead source display
- Assigned user with avatar option
- Tags display (if applicable)
- Inline actions (edit/delete)
- Loading skeleton
- Empty state

**Columns:**
1. Name (with avatar placeholder)
2. Phone (with country code/name)
3. Email (clickable link)
4. Company (if linked)
5. Status (badge)
6. Lead Source
7. Assigned To (user name)
8. Actions (edit/delete buttons)

**Usage:**
```jsx
<ContactsTable
  contacts={contacts}
  onEdit={handleEditContact}
  onDelete={handleDeleteContact}
  getStatusBadge={(status) => (
    <span className="badge" style={{backgroundColor: status.color}}>
      {status.name}
    </span>
  )}
  getCountryDisplay={(country) => country.name}
  loading={loading}
/>
```

---

### ContactsFilters

**Location:** `components/Contacts/ContactsFilters.jsx`
**Purpose:** Advanced filtering panel for contacts with multiple filter types

**Props:**
- `searchTerm` - Search value string
- `onSearchChange` - Search change handler
- `tagFilter` - Selected tag IDs array
- `onTagFilterChange` - Tag filter change handler
- `statusFilter` - Selected status ID
- `onStatusFilterChange` - Status filter change handler
- `leadSourceFilter` - Selected lead source
- `onLeadSourceFilterChange` - Lead source filter change handler
- `tags` - Array of tag objects
- `statuses` - Array of status objects
- `leadSources` - Array of lead source objects
- `loading` - Loading state boolean

**Features:**
- Search input with icon
- Multi-select tags filter
- Status dropdown (single select)
- Lead source dropdown
- Clear all filters button
- Active filter count badge
- Responsive grid layout
- Loading states

**Filter Types:**
1. **Search** - Free text (name, phone, email)
2. **Tags** - Multi-select (with bilingual names)
3. **Status** - Single select dropdown
4. **Lead Source** - Single select dropdown

**Usage:**
```jsx
<ContactsFilters
  searchTerm={search}
  onSearchChange={setSearch}
  tagFilter={selectedTags}
  onTagFilterChange={setSelectedTags}
  statusFilter={statusId}
  onStatusFilterChange={setStatusId}
  leadSourceFilter={sourceId}
  onLeadSourceFilterChange={setSourceId}
  tags={tags}
  statuses={statuses}
  leadSources={leadSources}
  loading={loadingFilters}
/>
```

---

### ContactFormFields

**Location:** `components/Contacts/ContactFormFields.jsx`
**Purpose:** Complete form fields for contact creation/editing

**Props:**
- `formData` - Form state object
- `handleChange` - Change handler `(e) => void`
- `handlePhoneChange` - Phone change handler (with country code)
- `errors` - Validation errors object
- `lookupData` - Lookup data object `{statuses, countries, sources, users, tags}`

**Features:**
- Grid layout (2-3 columns responsive)
- Phone input with country code selector
- Email validation
- Company search/link
- Status dropdown with colors
- Lead source dropdown
- Assigned user dropdown
- Tags multi-select
- Notes textarea
- Inline error messages

**Form Fields:**
1. Name* (required)
2. Phone* (with country code, required)
3. Email
4. Company (search/link)
5. Job Title
6. Status* (required, dropdown)
7. Lead Source (dropdown)
8. Assigned To (user dropdown)
9. Tags (multi-select)
10. Address
11. City
12. Country
13. Notes

**Usage:**
```jsx
<ContactFormFields
  formData={formData}
  handleChange={handleChange}
  handlePhoneChange={(code, number) => {
    setFormData({
      ...formData,
      phone_country_code: code,
      phone: number
    });
  }}
  errors={errors}
  lookupData={{
    statuses: contactStatuses,
    countries: countries,
    sources: leadSources,
    users: users,
    tags: tags
  }}
/>
```

---

## 🏢 Companies Module Components

### CompanyBasicTab

**Location:** `components/Companies/CompanyBasicTab.jsx`
**Purpose:** Basic company information tab with logo upload

**Props:**
- `formData` - Form state object
- `setFormData` - Form data setter function
- `lookupData` - Lookup data `{statuses, tags}`
- `uploading` - Upload state boolean
- `handleLogoUpload` - Logo upload handler `(file) => Promise<void>`

**Features:**
- Logo upload with preview
- Company name (required)
- Industry dropdown
- Status dropdown with colors
- Tags multi-select
- Website URL input
- Phone input
- Email input
- Company size dropdown
- Established year

**Form Fields:**
1. Logo (image upload with preview)
2. Company Name* (required)
3. Industry (dropdown)
4. Status (dropdown with colors)
5. Tags (multi-select)
6. Website (URL validation)
7. Phone
8. Email
9. Company Size (Small/Medium/Large/Enterprise)
10. Established Year

**Usage:**
```jsx
<CompanyBasicTab
  formData={formData}
  setFormData={setFormData}
  lookupData={{statuses, tags}}
  uploading={uploadingLogo}
  handleLogoUpload={async (file) => {
    const url = await uploadToStorage(file);
    setFormData({...formData, logo_url: url});
  }}
/>
```

---

### CompanyLegalTab

**Location:** `components/Companies/CompanyLegalTab.jsx`
**Purpose:** Legal company information and document management

**Props:**
- `formData` - Form state object
- `setFormData` - Form data setter function
- `uploading` - Upload state boolean
- `handleDocumentUpload` - Document upload handler
- `handleDeleteDocument` - Document delete handler

**Features:**
- Tax ID input
- Commercial registration ID
- License number
- Document upload (multiple files)
- Document list with download/delete
- File type validation (PDF, JPG, PNG)
- File size validation

**Form Fields:**
1. Tax ID / VAT Number
2. Commercial Registration Number
3. License Number
4. License Expiry Date
5. Documents (file upload, multi)

**Document Management:**
- Upload button (accepts PDF, images)
- Document list with:
  - File name
  - File size
  - Upload date
  - Download button
  - Delete button

**Usage:**
```jsx
<CompanyLegalTab
  formData={formData}
  setFormData={setFormData}
  uploading={uploadingDoc}
  handleDocumentUpload={async (file) => {
    const url = await uploadToStorage(file);
    const newDoc = {name: file.name, url, size: file.size, uploaded_at: new Date()};
    setFormData({
      ...formData,
      documents: [...formData.documents, newDoc]
    });
  }}
  handleDeleteDocument={(docIndex) => {
    setFormData({
      ...formData,
      documents: formData.documents.filter((_, i) => i !== docIndex)
    });
  }}
/>
```

---

### CompanyLocationTab

**Location:** `components/Companies/CompanyLocationTab.jsx`
**Purpose:** Company location and address information

**Props:**
- `formData` - Form state object
- `setFormData` - Form data setter function
- `lookupData` - Lookup data `{countries}`

**Features:**
- Address textarea
- City input
- Country dropdown (searchable)
- Postal code
- State/Province
- Notes textarea
- Map integration placeholder

**Form Fields:**
1. Address (textarea)
2. City
3. State / Province
4. Postal Code
5. Country (searchable dropdown)
6. Notes (textarea)

**Usage:**
```jsx
<CompanyLocationTab
  formData={formData}
  setFormData={setFormData}
  lookupData={{countries}}
/>
```

---

### CompanyCardView

**Location:** `components/Companies/CompanyCardView.jsx`
**Purpose:** Company card grid view with logo and quick stats

**Props:**
- `companies` - Array of company objects
- `onEdit` - Edit callback `(company) => void`
- `onDelete` - Delete callback `(company) => void`
- `getStatusBadge` - Function to render status badge

**Features:**
- Grid layout (responsive: 1-4 columns)
- Company logo display
- Company name and industry
- Status badge
- Quick stats:
  - Contacts count
  - Deals count
  - Total value
- Tags display
- Hover actions (edit/delete)
- Empty state

**Card Layout:**
- Logo (top, centered)
- Company name (bold)
- Industry (gray text)
- Status badge
- Stats row (3 metrics)
- Tags (bottom)
- Action buttons (hover overlay)

**Usage:**
```jsx
<CompanyCardView
  companies={companies}
  onEdit={handleEditCompany}
  onDelete={handleDeleteCompany}
  getStatusBadge={(status) => (
    <span className="badge" style={{backgroundColor: status.color}}>
      {status.name}
    </span>
  )}
/>
```

---

### CompanyListView

**Location:** `components/Companies/CompanyListView.jsx`
**Purpose:** Company table/list view with sortable columns

**Props:**
- `companies` - Array of company objects
- `onEdit` - Edit callback `(company) => void`
- `onDelete` - Delete callback `(company) => void`
- `getStatusBadge` - Function to render status badge

**Features:**
- Sortable table
- 7 columns:
  - Logo + Name
  - Industry
  - Status
  - Contacts count
  - Deals count
  - Total value
  - Actions
- Responsive design
- Empty state
- Loading skeleton

**Usage:**
```jsx
<CompanyListView
  companies={companies}
  onEdit={handleEditCompany}
  onDelete={handleDeleteCompany}
  getStatusBadge={(status) => (
    <span className="badge" style={{backgroundColor: status.color}}>
      {status.name}
    </span>
  )}
/>
```

---

## 🎯 Segments Module Components

### SegmentHeader

**Location:** `components/Segments/SegmentHeader.jsx`
**Purpose:** Bilingual segment name and description fields

**Props:**
- `formData` - Form data object `{name_en, name_ar, description_en, description_ar}`
- `onChange` - Callback function `(updatedData) => void`

**Features:**
- Dual language inputs (English + Arabic)
- Name fields (required)
- Description fields (optional, textarea)
- Character count indicators
- Validation display
- Responsive 2-column layout

**Form Fields:**
1. Name (English)* (required)
2. Name (Arabic)* (required)
3. Description (English)
4. Description (Arabic)

**Usage:**
```jsx
<SegmentHeader
  formData={{
    name_en: 'High Value Customers',
    name_ar: 'العملاء ذوو القيمة العالية',
    description_en: 'Customers with total purchases > $10,000',
    description_ar: 'العملاء الذين تزيد مشترياتهم عن 10,000 دولار'
  }}
  onChange={(data) => setFormData({...formData, ...data})}
/>
```

---

### SegmentValueInput

**Location:** `components/Segments/SegmentValueInput.jsx`
**Purpose:** Dynamic value input that changes based on field type

**Props:**
- `condition` - Condition object `{field, operator, value}`
- `index` - Condition index number
- `lookupData` - Lookup data `{statuses, countries, users, tags, leadSources}`
- `onUpdate` - Update callback `(index, field, value) => void`

**Features:**
- Dynamic input type based on field:
  - Status → Dropdown
  - Country → Searchable dropdown
  - Tags → Multi-select
  - Date fields → Date picker
  - Numeric fields → Number input
  - Text fields → Text input
- Bilingual option labels
- Validation feedback
- Loading states

**Field Type Mapping:**
```javascript
{
  'status': 'dropdown',       // Contact/company status
  'country': 'searchable',    // Countries list
  'tags': 'multiselect',      // Tags multi-select
  'created_at': 'date',       // Date picker
  'phone': 'text',            // Text input
  'deal_value': 'number',     // Number input
  'assigned_to': 'user',      // User dropdown
  'lead_source': 'dropdown'   // Lead sources
}
```

**Usage:**
```jsx
<SegmentValueInput
  condition={{
    field: 'status',
    operator: 'equals',
    value: 'active-uuid'
  }}
  index={0}
  lookupData={{
    statuses: contactStatuses,
    countries: allCountries,
    users: allUsers,
    tags: allTags,
    leadSources: leadSources
  }}
  onUpdate={(index, field, value) => {
    updateCondition(index, {[field]: value});
  }}
/>
```

---

### SegmentConditionRow

**Location:** `components/Segments/SegmentConditionRow.jsx`
**Purpose:** Single filter condition row with field, operator, and value

**Props:**
- `condition` - Condition object `{field, operator, value}`
- `index` - Condition index number
- `fieldOptions` - Array of available field options
- `getOperatorOptions` - Function to get operators for field type
- `lookupData` - Lookup data for value input
- `onUpdate` - Update callback `(index, updates) => void`
- `onRemove` - Remove callback `(index) => void`

**Features:**
- 3-column layout: Field | Operator | Value
- Dynamic operator list based on field type
- Remove button (X icon)
- Validation feedback
- Responsive design
- Drag handle (for reordering, optional)

**Condition Structure:**
```javascript
{
  field: 'status' | 'country' | 'tags' | 'created_at' | ...,
  operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'between' | ...,
  value: any // Type depends on field
}
```

**Operator Options by Field Type:**
```javascript
{
  text: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with'],
  number: ['equals', 'not_equals', 'greater_than', 'less_than', 'between'],
  date: ['equals', 'before', 'after', 'between', 'last_n_days'],
  dropdown: ['equals', 'not_equals', 'in', 'not_in'],
  boolean: ['is_true', 'is_false']
}
```

**Usage:**
```jsx
<SegmentConditionRow
  condition={{
    field: 'status',
    operator: 'equals',
    value: 'active-uuid'
  }}
  index={0}
  fieldOptions={[
    {value: 'status', label: 'Status', type: 'dropdown'},
    {value: 'country', label: 'Country', type: 'searchable'},
    {value: 'tags', label: 'Tags', type: 'multiselect'},
    {value: 'created_at', label: 'Created Date', type: 'date'}
  ]}
  getOperatorOptions={(fieldType) => {
    return operatorsByType[fieldType] || [];
  }}
  lookupData={{...}}
  onUpdate={(index, updates) => {
    setConditions(prev => prev.map((c, i) =>
      i === index ? {...c, ...updates} : c
    ));
  }}
  onRemove={(index) => {
    setConditions(prev => prev.filter((_, i) => i !== index));
  }}
/>
```

---

## 📌 Integration Notes

### Module Relationships
```
CRM Module
├── Contacts (3 components)
│   ├── ContactsTable
│   ├── ContactsFilters
│   └── ContactFormFields
├── Companies (5 components)
│   ├── CompanyBasicTab
│   ├── CompanyLegalTab
│   ├── CompanyLocationTab
│   ├── CompanyCardView
│   └── CompanyListView
└── Segments (3 components)
    ├── SegmentHeader
    ├── SegmentValueInput
    └── SegmentConditionRow
```

### Common Patterns

**Status Badge Rendering:**
```javascript
const getStatusBadge = (status) => (
  <span
    className="px-2 py-1 text-xs font-medium rounded-full"
    style={{
      backgroundColor: `${status.color}20`,
      color: status.color
    }}
  >
    {isRTL && status.name_ar ? status.name_ar : status.name_en}
  </span>
);
```

**Phone Display with Country:**
```javascript
const getCountryDisplay = (country) => {
  if (!country) return '';
  return isRTL && country.name_ar ? country.name_ar : country.name_en;
};

// Usage in table
<td>
  {contact.phone_country_code && (
    <span className="text-gray-500">{getCountryDisplay(contact.country)} </span>
  )}
  {contact.phone}
</td>
```

**Bilingual Content:**
```javascript
const displayName = isRTL && item.name_ar ? item.name_ar : item.name_en;
```

---

## 🎨 Design Patterns

### Tab-Based Forms (Companies)
```jsx
const [activeTab, setActiveTab] = useState('basic');

<div className="tabs">
  <button onClick={() => setActiveTab('basic')}>Basic Info</button>
  <button onClick={() => setActiveTab('legal')}>Legal Info</button>
  <button onClick={() => setActiveTab('location')}>Location</button>
</div>

{activeTab === 'basic' && <CompanyBasicTab ... />}
{activeTab === 'legal' && <CompanyLegalTab ... />}
{activeTab === 'location' && <CompanyLocationTab ... />}
```

### Segment Filter Builder
```jsx
// AND/OR Logic
const [logic, setLogic] = useState('AND');
const [conditions, setConditions] = useState([
  {field: '', operator: '', value: null}
]);

// Add condition
const addCondition = () => {
  setConditions([...conditions, {field: '', operator: '', value: null}]);
};

// Render rows
{conditions.map((condition, index) => (
  <div key={index}>
    {index > 0 && (
      <div className="logic-selector">
        <button onClick={() => setLogic('AND')}>AND</button>
        <button onClick={() => setLogic('OR')}>OR</button>
      </div>
    )}
    <SegmentConditionRow
      condition={condition}
      index={index}
      onUpdate={updateCondition}
      onRemove={removeCondition}
      {...props}
    />
  </div>
))}
```

---

**Last Updated:** January 2025
**Maintainer:** Development Team
**Related Docs:** [COMPONENTS.md](COMPONENTS.md), [COMPONENTS_TICKETS.md](COMPONENTS_TICKETS.md), [COMPONENTS_DEALS.md](COMPONENTS_DEALS.md)
