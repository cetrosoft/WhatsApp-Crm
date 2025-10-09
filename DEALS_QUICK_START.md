# 🚀 Deals Module - Quick Start Guide

## ⚡ **3 STEPS TO GET STARTED**

### **Step 1: Install Dependencies** (1 minute)
```bash
cd Frontend
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### **Step 2: Restart Frontend** (30 seconds)
```bash
npm run dev
```

### **Step 3: Create Test Pipeline** (2 minutes)

**Option A - Quick SQL (Supabase SQL Editor):**
```sql
-- 1. Create Pipeline
INSERT INTO pipelines (organization_id, name, description, is_default, is_active)
VALUES (
  'YOUR_ORG_ID_HERE',
  'Sales Pipeline',
  'Main sales pipeline',
  true,
  true
) RETURNING id;

-- 2. Create Stages (use pipeline id from above)
INSERT INTO pipeline_stages (pipeline_id, name, display_order, color) VALUES
  ('PIPELINE_ID_HERE', 'Lead', 1, 'blue'),
  ('PIPELINE_ID_HERE', 'Qualified', 2, 'purple'),
  ('PIPELINE_ID_HERE', 'Proposal', 3, 'yellow'),
  ('PIPELINE_ID_HERE', 'Negotiation', 4, 'orange'),
  ('PIPELINE_ID_HERE', 'Closed Won', 5, 'green'),
  ('PIPELINE_ID_HERE', 'Closed Lost', 6, 'red');

-- 3. Create Sample Deal
INSERT INTO deals (
  organization_id,
  pipeline_id,
  stage_id,
  name,
  amount,
  probability,
  currency,
  created_at
)
VALUES (
  'YOUR_ORG_ID_HERE',
  'PIPELINE_ID_HERE',
  (SELECT id FROM pipeline_stages WHERE pipeline_id = 'PIPELINE_ID_HERE' AND name = 'Lead'),
  'Sample Deal - Acme Corp',
  50000,
  25,
  'SAR',
  NOW()
);
```

**How to get your ORG_ID:**
```sql
-- Run this query in Supabase
SELECT id, name FROM organizations;
```

---

## ✅ **WHAT'S WORKING NOW (Session 1)**

### **You Can:**
- ✅ View deals in Kanban board
- ✅ Drag-and-drop deals between stages
- ✅ See statistics (Open, Won, Revenue, Avg Deal)
- ✅ Search deals
- ✅ Switch pipelines
- ✅ View deal cards with all info
- ✅ Delete deals (with permission)
- ✅ Switch languages (EN/AR)
- ✅ Test all permissions

### **You Cannot Yet (Coming in Session 2):**
- ❌ Create new deal (button shows placeholder)
- ❌ Edit deal details (button shows placeholder)
- ❌ Create/edit pipelines (page doesn't exist yet)
- ❌ Advanced filters (UI ready, logic pending)
- ❌ Export deals (button shows placeholder)

---

## 🎯 **TESTING CHECKLIST**

- [ ] Navigate to **CRM → Deals**
- [ ] See pipeline with stages
- [ ] See sample deal in "Lead" stage
- [ ] Drag deal to "Qualified" stage → Should move
- [ ] See statistics update
- [ ] Search for deal name → Should filter
- [ ] Switch language to Arabic → UI flips to RTL
- [ ] Try "Add Deal" button → Shows "Coming in Session 2" toast
- [ ] Delete deal → Confirms and removes
- [ ] Login as Agent (without permissions) → Shows permission denied page

---

## 🔐 **PERMISSION TESTING**

### **Admin Role (Full Access):**
```sql
-- Check admin permissions include deals
SELECT permissions FROM roles WHERE slug = 'admin';
-- Should include: deals.view, deals.create, deals.edit, deals.delete, deals.export
```

### **Manager Role (Edit Access):**
```sql
-- Grant deals permissions to Manager
UPDATE roles
SET permissions = array_append(permissions, 'deals.view')
WHERE slug = 'manager';

UPDATE roles
SET permissions = array_append(permissions, 'deals.edit')
WHERE slug = 'manager';
```

### **Agent Role (View Only):**
```sql
-- Grant only view permission
UPDATE roles
SET permissions = array_append(permissions, 'deals.view')
WHERE slug = 'agent';
```

---

## 🐛 **TROUBLESHOOTING**

### **Problem: "Cannot find module '@dnd-kit/core'"**
**Solution:** Run `npm install` in Frontend folder

### **Problem: "No pipelines found"**
**Solution:** Run the SQL from Step 3 to create pipeline

### **Problem: "Permission denied" page appears**
**Solution:**
1. Check user role has `deals.view` permission
2. Run SQL:
   ```sql
   UPDATE roles
   SET permissions = array_append(permissions, 'deals.view')
   WHERE slug = 'YOUR_ROLE';
   ```
3. Logout and login again

### **Problem: Drag-and-drop not working**
**Solution:**
1. Check you have `deals.edit` permission
2. Try hard refresh (Ctrl+Shift+R)

### **Problem: Stats showing zero**
**Solution:** Create some test deals with the SQL above

---

## 📞 **NEED HELP?**

1. Check `SESSION_1_COMPLETE.md` for full documentation
2. Check `DEALS_SETUP_INSTRUCTIONS.md` for setup details
3. Check browser console for errors (F12)

---

## 🔜 **WHAT'S NEXT?**

**Session 2** will add:
- DealModal (Create/Edit deals with full form)
- Pipelines page (Manage pipelines and stages)
- Stage management (Add/edit/delete/reorder stages)
- Full CRUD functionality

**Session 3** will add:
- Statistics dashboard
- Charts and reports
- Advanced filters
- Export functionality
- Bulk actions

---

**Enjoy your new Kanban board!** 🎉
