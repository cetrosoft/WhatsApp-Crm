# 👥 Team Module Components

Complete documentation for all Team module reusable components.

**Module:** Team Management & Role-Based Access Control
**Total Components:** 3
**Status:** Production Ready ✅

---

## 📋 Component Overview

| Component | Purpose | Lines | Complexity |
|-----------|---------|-------|------------|
| RoleCard | Role display card with actions | 140 | Medium |
| DeleteRoleModal | Delete confirmation dialog | 85 | Low |
| UserPermissionsList | Custom permissions list | 120 | Medium |

---

## 🎨 Main Components

### RoleCard

**Location:** `components/Team/RoleCard.jsx`
**Purpose:** Display role information with badge, statistics, and action buttons

**Props:**
- `role` - Role object with all details
- `onEdit` - Edit callback `(roleId) => void`
- `onDuplicate` - Duplicate callback `(roleId) => void`
- `onDelete` - Delete callback `(roleId) => void`
- `duplicating` - UUID of role being duplicated (for loading state)
- `getRoleBadgeColor` - Function `(slug) => string` returns Tailwind color class

**Features:**
- System role badge (non-deletable indicator)
- User count display
- Permission count display
- Bilingual role descriptions
- Hover action menu (edit, duplicate, delete)
- Loading state for duplicate action
- Color-coded badges based on role type
- Disabled delete button for system roles

**Role Object Structure:**
```javascript
{
  id: 'uuid',
  name: 'Manager',
  slug: 'manager',
  description: 'Can manage team and settings',
  is_system: true,
  user_count: 5,
  permission_count: 24,
  permissions: ['contacts.view', 'deals.edit', ...]
}
```

**Usage:**
```jsx
<RoleCard
  role={role}
  onEdit={(roleId) => navigate(`/team/roles/edit/${roleId}`)}
  onDuplicate={handleDuplicateRole}
  onDelete={handleDeleteRole}
  duplicating={duplicatingRoleId}
  getRoleBadgeColor={(slug) => {
    switch(slug) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }}
/>
```

**Badge Colors by Role:**
- **admin** → Red (#ef4444)
- **manager** → Blue (#3b82f6)
- **agent** → Green (#22c55e)
- **member** → Gray (#6b7280)
- **custom** → Purple (#a855f7)

**Card Layout:**
- Top: Role name + system badge
- Middle: Description (gray text, 2-line truncation)
- Bottom: User count + Permission count stats
- Hover: Action menu overlay (edit, duplicate, delete)

---

### DeleteRoleModal

**Location:** `components/Team/DeleteRoleModal.jsx`
**Purpose:** Confirmation dialog for deleting custom roles with safety checks

**Props:**
- `role` - Role object to be deleted
- `onConfirm` - Confirm callback `(roleId) => void`
- `onCancel` - Cancel callback
- `deleting` - Boolean loading state during deletion

**Features:**
- Bilingual confirmation message
- Role name display for clarity
- Warning icon with red styling
- User count warning if role has assigned users
- Loading state on confirm button
- Disabled state during deletion
- Keyboard support (Escape to cancel, Enter to confirm)

**Safety Checks:**
- Shows warning if `role.user_count > 0`
- Prevents accidental deletion of roles in use
- Suggests reassigning users first

**Usage:**
```jsx
{showDeleteModal && (
  <DeleteRoleModal
    role={roleToDelete}
    onConfirm={async (roleId) => {
      await roleAPI.deleteRole(roleId);
      toast.success('Role deleted successfully');
      setShowDeleteModal(false);
    }}
    onCancel={() => setShowDeleteModal(false)}
    deleting={deleting}
  />
)}
```

**Modal Structure:**
- Overlay: Semi-transparent backdrop
- Modal: Centered, max-width 500px
- Header: Warning icon + title
- Body: Role name + user count warning
- Footer: Cancel (gray) + Delete (red) buttons

---

### UserPermissionsList

**Location:** `components/Team/UserPermissionsList.jsx`
**Purpose:** Display list of users with custom permission overrides (grants/revokes)

**Props:**
- `users` - Array of user objects with custom permissions
- `onManagePermissions` - Callback `(userId) => void` to open permission editor

**Features:**
- Filtered list (only users with custom permissions)
- User avatar with fallback initials
- Grant count badge (green)
- Revoke count badge (red)
- Role name display
- "Manage" button per user
- Empty state message
- Responsive grid layout

**User Object Structure:**
```javascript
{
  id: 'uuid',
  name: 'John Doe',
  email: 'john@example.com',
  avatar_url: 'https://...',
  role: 'manager',
  permissions: {
    grant: ['contacts.delete', 'deals.approve'],
    revoke: ['settings.billing']
  }
}
```

**Usage:**
```jsx
<UserPermissionsList
  users={users.filter(u =>
    u.permissions &&
    (u.permissions.grant?.length > 0 || u.permissions.revoke?.length > 0)
  )}
  onManagePermissions={(userId) => {
    setSelectedUser(userId);
    setShowPermissionModal(true);
  }}
/>
```

**List Item Layout:**
- Left: User avatar (48x48px, rounded-full)
- Center: Name (bold) + Email (gray) + Role badge
- Right: Grant badge + Revoke badge + Manage button
- Hover: Background highlight

**Empty State:**
- Icon: Shield with check mark
- Message: "No users with custom permissions"
- Suggestion: "Use the permission matrix to customize user access"

---

## 📌 Integration Notes

### With Team Pages

Components imported from barrel export:
```javascript
import { RoleCard, DeleteRoleModal, UserPermissionsList } from '../components/Team';
```

### Component Hierarchy
```
Team/RolesPermissions.jsx (page)
├── RoleCard × N (grid of roles)
│   └── DeleteRoleModal (conditional)
└── UserPermissionsList
    └── (triggers PermissionModal from parent)
```

### State Management Pattern

**RolesPermissions Page:**
```javascript
const [roles, setRoles] = useState([]);
const [users, setUsers] = useState([]);
const [duplicatingId, setDuplicatingId] = useState(null);
const [deletingRole, setDeletingRole] = useState(null);
const [showDeleteModal, setShowDeleteModal] = useState(false);

// Load roles and users on mount
useEffect(() => {
  fetchRoles();
  fetchUsers();
}, []);
```

**Action Handlers:**
```javascript
const handleDuplicate = async (roleId) => {
  setDuplicatingId(roleId);
  const role = roles.find(r => r.id === roleId);
  const duplicate = {
    name: `${role.name} (Copy)`,
    permissions: [...role.permissions]
  };
  await roleAPI.createRole(duplicate);
  await fetchRoles(); // Refresh list
  setDuplicatingId(null);
};

const handleDelete = async (roleId) => {
  setDeletingRole(roleId);
  await roleAPI.deleteRole(roleId);
  setShowDeleteModal(false);
  await fetchRoles(); // Refresh list
  setDeletingRole(null);
};
```

---

## 🎨 Design Patterns

### Badge Color System

Consistent color mapping across roles:
```javascript
const getRoleBadgeColor = (slug) => {
  const colors = {
    admin: 'bg-red-100 text-red-800',
    manager: 'bg-blue-100 text-blue-800',
    agent: 'bg-green-100 text-green-800',
    member: 'bg-gray-100 text-gray-800'
  };
  return colors[slug] || 'bg-purple-100 text-purple-800'; // Custom roles = purple
};
```

### Permission Count Badges

Visual indicators for custom permissions:
```javascript
// Grant badge (green)
{grantCount > 0 && (
  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
    +{grantCount}
  </span>
)}

// Revoke badge (red)
{revokeCount > 0 && (
  <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
    -{revokeCount}
  </span>
)}
```

### System Role Protection

Prevent deletion of core roles:
```javascript
const canDelete = !role.is_system;

<button
  onClick={() => onDelete(role.id)}
  disabled={!canDelete}
  className={`${!canDelete ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50'}`}
  title={!canDelete ? 'System roles cannot be deleted' : 'Delete role'}
>
  <Trash2 className="w-4 h-4" />
</button>
```

### User Avatar with Fallback

Graceful handling of missing avatars:
```javascript
{user.avatar_url ? (
  <img
    src={user.avatar_url}
    alt={user.name}
    className="w-12 h-12 rounded-full object-cover"
  />
) : (
  <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold">
    {user.name.charAt(0).toUpperCase()}
  </div>
)}
```

---

## 🔐 Permission Context

These components work within the **Permission Module Architecture v3.0**:

- **Database-Driven Roles:** All roles stored in `roles` table
- **Dual Column Strategy:** `users.role` (slug) + `users.role_id` (UUID FK)
- **Effective Permissions:** `(Role Permissions + Custom Grants) - Custom Revokes`
- **Multi-tenant Isolation:** Roles scoped to organization

**Related Components:**
- `PermissionMatrix.jsx` - Permission grid editor
- `RoleBuilder.jsx` - Custom role creator
- `PermissionModal.jsx` - User permission override editor

**Database Tables:**
- `roles` - System + custom roles
- `users` - Role assignment + custom permissions (JSONB)
- `organizations` - Tenant isolation

---

**Last Updated:** January 2025
**Maintainer:** Development Team
**Related Docs:** [COMPONENTS.md](COMPONENTS.md), [PERMISSION_MODULE_ARCHITECTURE_v3.md](../PERMISSION_MODULE_ARCHITECTURE_v3.md)
