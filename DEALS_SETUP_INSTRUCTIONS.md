# Deals & Pipelines Module - Setup Instructions

## 🚀 Quick Start

### **Step 1: Install Dependencies**
```bash
cd Frontend
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**What these do:**
- `@dnd-kit/core` - Core drag-and-drop functionality
- `@dnd-kit/sortable` - Sortable lists (for stage columns)
- `@dnd-kit/utilities` - Utility functions for drag-and-drop

---

### **Step 2: Restart Frontend**
```bash
cd Frontend
npm run dev
```

---

### **Step 3: Test the Module**

1. **Login** at `http://localhost:5173/login`
2. **Navigate to Deals** (new menu item in sidebar)
3. **Create a Pipeline** first (go to Pipelines page)
4. **Create some Deals** and test drag-and-drop

---

## ✅ What's Been Implemented

### **Session 1 - Kanban Board (In Progress)**
- ✅ Translation keys (EN/AR)
- ✅ API service layer (dealAPI, pipelineAPI)
- ✅ Deals.jsx (Kanban board main page)
- ✅ DealCard.jsx (draggable deal cards)
- ✅ KanbanColumn.jsx (stage columns)
- ✅ Menu integration
- ✅ Route setup
- ⏳ Dependencies (manual install needed)

---

## 🔐 Permission Testing

Test with different roles:
- **Admin**: Full access (view, create, edit, delete, export)
- **Manager**: Edit access (if granted in role)
- **Agent**: View only (default)

---

## 📋 Next Steps

**Session 2** will add:
- DealModal.jsx (Create/Edit deal form)
- Pipelines.jsx (Pipeline management)
- PipelineModal.jsx (Pipeline form)
- StageBuilder.jsx (Stage manager)

**Session 3** will add:
- Deal statistics
- Charts
- Advanced filters
- Export functionality

---

*Created: October 9, 2025*
