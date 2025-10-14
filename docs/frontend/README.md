# Frontend Documentation

This folder contains documentation for frontend components, patterns, and architecture.

## 📚 Documentation Files

### [COMPONENTS.md](./COMPONENTS.md)
**Complete catalog of reusable React components**
- 23+ documented components
- Usage examples with props
- Organized by module (Deals, Contacts, Companies, Segments, Team)
- Universal components (SearchableSelect, MultiSelectTags, etc.)

**Last Updated:** January 2025

---

## 🎯 Quick Links

**Component Categories:**
- **Shared/Universal** - Reusable across all modules
- **Deals Module** - Pipeline, stage, deal management components
- **Contacts Module** - Contact forms, filters, tables
- **Companies Module** - Company cards, forms, tabs
- **Segments Module** - Filter builder, condition rows
- **Team Module** - Role cards, permission lists

**Utilities:**
- `filterUtils.js` - Date period utilities
- Component styling guidelines
- Bilingual support patterns

---

## 🚀 Usage

```javascript
// Import from shared barrel
import { SearchableSelect, MultiSelectTags } from '@/components/shared';

// Check COMPONENTS.md for props and examples
```

---

## 📝 Maintenance

**When adding new components:**
1. Document in COMPONENTS.md
2. Add usage example
3. List all props with types
4. Update component count

---

**Related Documentation:**
- [Main Architecture](../../CLAUDE.md)
- [i18n Guide](../I18N_GUIDE.md)
- [Component Patterns](../guides/)
