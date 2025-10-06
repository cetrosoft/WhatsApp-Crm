# Next Steps - October 7, 2025

## Priority Task List

### 🎯 Priority 1: Sales Pipelines & Deals Module (CRITICAL)

This is the core functionality for CRM sales tracking. Complete this before moving forward.

---

## Step-by-Step Implementation Plan

### Phase 1: Database Schema (30 minutes)

#### Task 1.1: Create Pipelines & Stages Migration
**File:** `supabase/migrations/014_sales_pipelines.sql`

```sql
-- Create deal_pipelines table
CREATE TABLE deal_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 999,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create deal_stages table
CREATE TABLE deal_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES deal_pipelines(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug TEXT NOT NULL,
  probability INTEGER DEFAULT 0, -- 0-100%
  display_order INTEGER DEFAULT 999,
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create deals table
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES deal_pipelines(id),
  stage_id UUID NOT NULL REFERENCES deal_stages(id),
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  value DECIMAL(15,2),
  currency TEXT DEFAULT 'SAR',
  expected_close_date DATE,
  actual_close_date DATE,
  status TEXT DEFAULT 'open', -- open, won, lost
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create deal_activities table
CREATE TABLE deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  activity_type TEXT NOT NULL, -- call, meeting, email, note, task
  subject TEXT,
  notes TEXT,
  activity_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_deal_pipelines_org ON deal_pipelines(organization_id);
CREATE INDEX idx_deal_stages_pipeline ON deal_stages(pipeline_id);
CREATE INDEX idx_deals_org ON deals(organization_id);
CREATE INDEX idx_deals_pipeline ON deals(pipeline_id);
CREATE INDEX idx_deals_stage ON deals(stage_id);
CREATE INDEX idx_deals_contact ON deals(contact_id);
CREATE INDEX idx_deals_company ON deals(company_id);
CREATE INDEX idx_deals_assigned ON deals(assigned_to);
CREATE INDEX idx_deal_activities_deal ON deal_activities(deal_id);

-- RLS Policies
ALTER TABLE deal_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;

-- Insert default pipeline and stages
-- Will be added after policies
```

**Checklist:**
- [ ] Create migration file
- [ ] Run in Supabase SQL Editor
- [ ] Verify tables created
- [ ] Test RLS policies

---

### Phase 2: Backend API Routes (60 minutes)

#### Task 2.1: Pipeline Routes
**File:** `backend/routes/pipelineRoutes.js` (NEW)

Create endpoints:
```javascript
GET    /api/crm/pipelines              // List all pipelines
POST   /api/crm/pipelines              // Create pipeline
PUT    /api/crm/pipelines/:id          // Update pipeline
DELETE /api/crm/pipelines/:id          // Delete pipeline
GET    /api/crm/pipelines/:id/stages   // Get stages
POST   /api/crm/stages                 // Create stage
PUT    /api/crm/stages/:id             // Update stage
DELETE /api/crm/stages/:id             // Delete stage
PATCH  /api/crm/stages/reorder         // Reorder stages
```

**Checklist:**
- [ ] Create file with all endpoints
- [ ] Add authentication middleware
- [ ] Add organization context
- [ ] Test with Postman/Thunder Client
- [ ] Register routes in server.js

#### Task 2.2: Deal Routes
**File:** `backend/routes/dealRoutes.js` (NEW)

Create endpoints:
```javascript
GET    /api/crm/deals                  // List deals with filters
POST   /api/crm/deals                  // Create deal
GET    /api/crm/deals/:id              // Get deal details
PUT    /api/crm/deals/:id              // Update deal
DELETE /api/crm/deals/:id              // Delete deal
PATCH  /api/crm/deals/:id/stage        // Move to different stage
GET    /api/crm/deals/:id/activities   // Get activities
POST   /api/crm/deals/:id/activities   // Add activity
```

**Checklist:**
- [ ] Create file with all endpoints
- [ ] Include contact & company joins
- [ ] Add stage movement validation
- [ ] Test all CRUD operations
- [ ] Register routes in server.js

#### Task 2.3: Register Routes
**File:** `backend/server.js`

Add:
```javascript
const pipelineRoutes = require('./routes/pipelineRoutes');
const dealRoutes = require('./routes/dealRoutes');

app.use('/api/crm/pipelines', pipelineRoutes);
app.use('/api/crm/deals', dealRoutes);
```

---

### Phase 3: Frontend API Service (15 minutes)

#### Task 3.1: Add Deal & Pipeline APIs
**File:** `Frontend/src/services/api.js`

Add:
```javascript
// Pipeline API
export const pipelineAPI = {
  getPipelines: () => authAPI.get('/api/crm/pipelines'),
  getPipeline: (id) => authAPI.get(`/api/crm/pipelines/${id}`),
  createPipeline: (data) => authAPI.post('/api/crm/pipelines', data),
  updatePipeline: (id, data) => authAPI.put(`/api/crm/pipelines/${id}`, data),
  deletePipeline: (id) => authAPI.delete(`/api/crm/pipelines/${id}`),
  getStages: (pipelineId) => authAPI.get(`/api/crm/pipelines/${pipelineId}/stages`),
  createStage: (data) => authAPI.post('/api/crm/stages', data),
  updateStage: (id, data) => authAPI.put(`/api/crm/stages/${id}`, data),
  deleteStage: (id) => authAPI.delete(`/api/crm/stages/${id}`),
};

// Deal API
export const dealAPI = {
  getDeals: (params) => authAPI.get('/api/crm/deals', { params }),
  getDeal: (id) => authAPI.get(`/api/crm/deals/${id}`),
  createDeal: (data) => authAPI.post('/api/crm/deals', data),
  updateDeal: (id, data) => authAPI.put(`/api/crm/deals/${id}`, data),
  deleteDeal: (id) => authAPI.delete(`/api/crm/deals/${id}`),
  moveDealToStage: (id, stageId) => authAPI.patch(`/api/crm/deals/${id}/stage`, { stage_id: stageId }),
  getActivities: (dealId) => authAPI.get(`/api/crm/deals/${dealId}/activities`),
  addActivity: (dealId, data) => authAPI.post(`/api/crm/deals/${dealId}/activities`, data),
};
```

---

### Phase 4: Frontend - Deals Page (Kanban View) (90 minutes)

#### Task 4.1: Create Deals Page with Kanban Board
**File:** `Frontend/src/pages/Deals.jsx` (NEW)

Features to implement:
- [ ] Pipeline selector dropdown
- [ ] Kanban columns (one per stage)
- [ ] Deal cards with drag & drop
- [ ] Search bar
- [ ] Filters: assigned to, date range, value range
- [ ] "Add Deal" button
- [ ] Click card → open DealModal

UI Structure:
```jsx
<div className="page">
  <header>
    <h1>Deals</h1>
    <PipelineSelector />
    <AddDealButton />
  </header>

  <Filters>
    <SearchBar />
    <AssignedToFilter />
    <DateRangeFilter />
  </Filters>

  <KanbanBoard>
    {stages.map(stage => (
      <StageColumn key={stage.id}>
        <StageHeader>{stage.name} - ${totalValue}</StageHeader>
        <DealCards>
          {deals.filter(d => d.stage_id === stage.id).map(deal => (
            <DealCard
              key={deal.id}
              deal={deal}
              draggable
              onClick={() => openModal(deal)}
            />
          ))}
        </DealCards>
      </StageColumn>
    ))}
  </KanbanBoard>
</div>
```

#### Task 4.2: Create Deal Modal
**File:** `Frontend/src/components/DealModal.jsx` (NEW)

Form fields:
- [ ] Deal Title (required)
- [ ] Contact (SearchableSelect)
- [ ] Company (SearchableSelect)
- [ ] Pipeline & Stage dropdowns
- [ ] Value (number) + Currency (dropdown)
- [ ] Expected Close Date (date picker)
- [ ] Assigned To (SearchableSelect)
- [ ] Description (textarea)
- [ ] Tags (MultiSelectTags)
- [ ] Activities timeline (if editing)

#### Task 4.3: Create Deal Card Component
**File:** `Frontend/src/components/DealCard.jsx` (NEW)

Display:
- Deal title
- Value (formatted with currency)
- Contact name & avatar
- Company name
- Assigned user avatar
- Days until expected close
- Progress indicator

---

### Phase 5: Sales Pipelines Settings (60 minutes)

#### Task 5.1: Add Pipeline Management to CRM Settings
**File:** `Frontend/src/pages/CRMSettings.jsx` (UPDATE)

Add new tab: "Sales Pipelines"

Features:
- [ ] List all pipelines
- [ ] Create/Edit/Delete pipeline
- [ ] For each pipeline: show stages
- [ ] Create/Edit/Delete stages
- [ ] Drag & drop stage reordering
- [ ] Set default pipeline
- [ ] Stage properties: name, probability, color

#### Task 5.2: Create Pipeline Settings Component
**File:** `Frontend/src/components/AccountSettings/PipelinesTab.jsx` (NEW)

Similar structure to:
- TagsManagement
- ContactStatusesManagement
- LeadSourcesManagement

---

### Phase 6: Translations (30 minutes)

#### Task 6.1: Create Deal Translations
**File:** `Frontend/public/locales/en/deals.json` (NEW)

Add all deal-related translations (see yesterday's summary for full list)

**File:** `Frontend/public/locales/ar/deals.json` (NEW)

Add Arabic translations

#### Task 6.2: Update Common Translations
Add to `common.json`:
```json
{
  "deals": "Deals",
  "pipeline": "Pipeline",
  "stage": "Stage",
  "value": "Value",
  "currency": "Currency",
  "expectedCloseDate": "Expected Close Date",
  "wonDeals": "Won",
  "lostDeals": "Lost",
  "openDeals": "Open"
}
```

---

### Phase 7: Update Menu Configuration (5 minutes)

#### Task 7.1: Add Deals to Sidebar Menu
**File:** `Frontend/src/menuConfig.jsx`

Add under CRM section:
```javascript
{
  name: 'deals',
  translationKey: 'deals',
  icon: TrendingUp,
  path: '/deals'
}
```

---

### Phase 8: Testing & Bug Fixes (45 minutes)

#### Test Checklist
- [ ] Create pipeline with stages
- [ ] Create deal in different stages
- [ ] Drag deal between stages
- [ ] Edit deal and update value
- [ ] Delete deal
- [ ] Filter deals by assigned user
- [ ] Search deals by title
- [ ] Test RTL layout in Arabic
- [ ] Test with multiple pipelines
- [ ] Test stage probability calculation
- [ ] Test deal activities timeline

---

## Alternative: If Time is Limited

### Quick Win: Start with Pipeline Settings Only

If you have limited time tomorrow, focus on just the pipeline management:

**Minimal Viable Product (MVP):**
1. ✅ Database migration (pipelines + stages only)
2. ✅ Backend pipeline routes only
3. ✅ CRM Settings → Pipelines tab
4. ✅ Basic CRUD for pipelines & stages

**Skip for now:**
- Deals page (postpone to next session)
- Kanban board
- Deal modal

This allows you to set up the foundation and test it before building the full deals interface.

---

## Estimated Time Investment

| Phase | Task | Time |
|-------|------|------|
| 1 | Database Schema | 30 min |
| 2 | Backend API | 60 min |
| 3 | Frontend API Service | 15 min |
| 4 | Deals Page (Kanban) | 90 min |
| 5 | Pipeline Settings | 60 min |
| 6 | Translations | 30 min |
| 7 | Menu Config | 5 min |
| 8 | Testing | 45 min |
| **TOTAL** | | **5.5 hours** |

**MVP Only:** ~2 hours (Phases 1, 2, 3, 5, 6)

---

## Resources & References

### Drag & Drop Libraries (if needed)
- **@hello-pangea/dnd** (React DnD) - recommended for Kanban
- **react-beautiful-dnd** - simpler option
- **dnd-kit** - modern, lightweight

### Date Picker
- **react-datepicker** - simple and effective
- Or use HTML5 `<input type="date">` for MVP

### Currency Formatting
```javascript
// Use Intl.NumberFormat
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'SAR',
});
formatter.format(1000); // "SAR 1,000.00"
```

---

## Success Criteria

By end of tomorrow's session:

✅ **Must Have:**
- [ ] Pipelines & stages management working
- [ ] Backend API endpoints functional
- [ ] Can create/edit/delete pipelines
- [ ] Can create/edit/delete stages

✅ **Nice to Have:**
- [ ] Deals page with Kanban board
- [ ] Create/edit deals
- [ ] Drag & drop between stages
- [ ] Deal activities timeline

✅ **Stretch Goals:**
- [ ] Advanced filters
- [ ] Deal analytics (total value per stage)
- [ ] Email notifications on stage change

---

## Important Reminders

1. **Always use organizationId** in all queries (multi-tenancy)
2. **Add RLS policies** to new tables
3. **Test in both languages** (EN/AR)
4. **Use existing components** where possible (SearchableSelect, etc.)
5. **Follow naming conventions** (name_en, name_ar for bilingual fields)
6. **Add indexes** on foreign keys for performance
7. **Toast notifications** for all CRUD operations
8. **Error handling** in try-catch blocks

---

## Quick Start Commands

### Tomorrow Morning:
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd Frontend
npm run dev

# Terminal 3 - Supabase (if needed)
# Open browser: https://app.supabase.com/project/YOUR_PROJECT_ID/editor
```

---

## Contact Information

If you encounter issues:
1. Check browser console for errors (F12)
2. Check backend terminal for API errors
3. Check Supabase logs for database errors
4. Review migration scripts for syntax errors

---

Good luck tomorrow! Focus on getting the pipeline management working first, then build the deals interface. 🚀

**InshAllah, you'll make great progress!** ✨
