# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Omnichannel CRM SaaS Platform** - A multi-tenant WhatsApp-based customer relationship management platform with bulk messaging, team collaboration, and subscription management.

**Current Status:** Foundation module complete (authentication, subscriptions, i18n). WhatsApp integration in progress.

**Original:** Simple WhatsApp bulk sender → **Now:** Full-featured multi-tenant SaaS platform

## Development Commands

### Backend (Port 5000)
```bash
cd backend
npm install
npm start
```

### Frontend (Development - Port 5173)
```bash
cd Frontend
npm install
npm run dev
```

### Frontend (Production Build)
```bash
cd Frontend
npm run build
npm run preview
```

## Architecture Overview

### Backend Architecture
- **Express.js server** on port 5000 with CORS enabled
- **Supabase Cloud PostgreSQL** - Multi-tenant database with RLS policies
- **JWT Authentication** - Token-based auth with role-based access control
- **Multi-tenant Isolation** - Organization-based data separation
- **WhatsApp-web.js integration** (in progress) - LocalAuth strategy with session persistence
- **Socket.io** for real-time communication between frontend and backend
- **Two Supabase clients:**
  - Service role key (admin operations, bypasses RLS)
  - Anon key (authentication operations)

### Key Backend Components
```
backend/
├── config/
│   ├── supabase.js - Service role client
│   └── supabaseAuth.js - Anon key client for auth
├── routes/
│   ├── authRoutes.js - Registration, login, password reset
│   ├── userRoutes.js - User management, invitations
│   ├── packageRoutes.js - Subscription packages
│   └── messageRoutes.js - (Old WhatsApp code, needs migration)
├── middleware/
│   ├── auth.js - JWT validation, role authorization
│   └── tenant.js - Organization context setter
├── services/
│   └── invitationService.js - Team invitation logic
└── .env - Environment variables (Supabase, JWT, SMTP)
```

### Frontend Architecture
- **React 18** with Vite as build tool
- **TailwindCSS** with RTL plugin for Arabic support
- **React Router v6** for navigation with protected routes
- **react-i18next** for internationalization (Arabic/English)
- **Socket.io-client** for real-time communication (future use)
- **React Hot Toast** for notifications
- **Lucide React** for icons
- **Axios** for API calls with token management

### Key Frontend Structure
```
Frontend/src/
├── pages/
│   ├── Login.jsx - Bilingual login page
│   ├── Register.jsx - Organization registration
│   ├── ResetPassword.jsx - Password reset flow
│   ├── AcceptInvitation.jsx - Team invitation acceptance
│   ├── dashboard.jsx - Main dashboard with stats
│   ├── AccountSettings.jsx - Tab-based settings portal
│   ├── Campaigns.jsx - (Old code, needs update)
│   ├── Inbox.jsx - (Old code, needs update)
│   └── Settings.jsx - (Old code, to be deprecated)
├── components/
│   ├── Sidebar.jsx - Navigation with language switcher
│   ├── LanguageSwitcher.jsx - Globe icon toggle
│   ├── ProtectedRoute.jsx - Auth guard
│   └── AccountSettings/
│       ├── OrganizationTab.jsx
│       ├── TeamTab.jsx
│       ├── SubscriptionTab.jsx
│       └── PreferencesTab.jsx
├── contexts/
│   ├── AuthContext.jsx - Authentication state
│   └── LanguageContext.jsx - Language state + direction
├── services/
│   └── api.js - HTTP client (authAPI, userAPI, packageAPI)
├── i18n.js - i18next configuration
└── menuConfig.jsx - Sidebar menu configuration
```

## Important Implementation Details

### Authentication System
- **Registration:** Creates organization + admin user, auto-assigns Free package
- **Login:** JWT tokens with 7-day expiry, includes organizationId and role
- **Password Reset:** Token-based flow via email (SMTP config needed)
- **Team Invitations:** Token-based invites with expiry
- **Protected Routes:** All dashboard pages require authentication
- **Multi-tenant Isolation:** RLS policies ensure data separation

### Database Schema (Supabase)
**Tables:**
- `organizations` - Company/tenant data, links to packages
- `users` - User profiles with roles (admin, manager, agent, member)
- `packages` - 5 subscription tiers with features and limits
- `invitations` - Team invitation tokens

**Helper Functions:**
- `get_organization_limits(org_id)` - Returns effective limits
- `organization_has_feature(org_id, feature_name)` - Check feature access

### API Endpoints (Current)
**Auth:**
- `POST /api/auth/register` - Create organization + admin
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - Logout (client-side token removal)
- `POST /api/auth/request-password-reset` - Request reset email
- `POST /api/auth/reset-password` - Reset with token
- `GET /api/auth/me` - Get current user info

**Users:**
- `GET /api/users` - List organization users
- `POST /api/users/invite` - Invite team member
- `POST /api/users/accept-invitation` - Accept invite
- `PATCH /api/users/:userId` - Update user (role, status)

**Packages:**
- `GET /api/packages` - List all active packages
- `GET /api/packages/:slug` - Get single package
- `GET /api/packages/organization/current` - Current org package
- `POST /api/packages/organization/upgrade` - Upgrade/downgrade
- `GET /api/packages/organization/check-feature/:feature` - Check access

### Internationalization (i18n)
- **Languages:** Arabic (RTL) and English (LTR)
- **Translation Files:** `Frontend/public/locales/{ar,en}/{common,auth,settings}.json`
- **70+ Translation Keys** covering all UI text
- **TailwindCSS RTL Plugin** for proper right-to-left layout
- **Logical Properties:** Use `ms`/`me` instead of `ml`/`mr`, `ps`/`pe` instead of `pl`/`pr`
- **Language Switcher:** Globe icon in sidebar footer
- **Direction Auto-Switch:** Document.dir changes based on language

### WhatsApp Integration (Old Code - Needs Migration)
- Uses QR code authentication - scan QR from console or frontend
- Supports both individual contacts and group messaging
- Handles media attachments (images, documents, etc.)
- Session persistence prevents re-authentication on restart
- **Status:** Not yet integrated with new multi-tenant architecture
- **Next Step:** Migrate to organization-based profiles

## Development Notes

### Environment Variables Required
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ... (for frontend + auth operations)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (for backend admin operations)

# JWT
JWT_SECRET=your-secret-key (generate with: openssl rand -base64 32)

# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Email (Optional - for invitations and password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Omnichannel CRM Platform
```

### Database Migrations
Run migrations in Supabase SQL Editor in this order:
1. `supabase/migrations/001_foundation.sql`
2. `supabase/migrations/001a_i18n_support.sql`
3. `supabase/migrations/001b_packages_system.sql`

Or use the combined file: `supabase/migrations/COMBINED_RUN_THIS.sql`

### Multi-tenant Best Practices
- Always use `req.organizationId` from JWT for queries
- Never expose data across organizations
- Use RLS policies as safety net
- Test with multiple organizations

### Translation Best Practices
- Use `t('key')` function, never hardcode text
- Add keys to both `ar` and `en` translation files
- Use logical CSS properties for RTL support
- Test both languages thoroughly

### File Upload Support
Backend supports file uploads via `express-fileupload` for media attachments in campaigns.

### Common Issues & Solutions

**Issue:** "User profile not found" on login
**Solution:** Backend must use `supabaseAuth` (anon key) for login, not `supabase` (service role)

**Issue:** Dashboard not showing after login
**Solution:** Check route paths in `menuConfig.jsx` match login redirect

**Issue:** Language not switching
**Solution:** Ensure all text uses `t()` function and translation keys exist

**Issue:** RLS blocking operations
**Solution:** Backend operations should use `supabase` (service role), not `supabaseAuth`

## Progress Tracking

See these files for detailed information:
- **SESSION_SUMMARY.md** - Complete summary of today's work
- **NEXT_STEPS.md** - Roadmap for continued development
- **CLAUDE.md** - This file (architecture reference)

## Project Status

✅ **Completed Modules:**
- Module 0: Foundation (Auth, Subscriptions, i18n)

🔄 **In Progress:**
- Module 1: WhatsApp Integration (migration needed)

⏳ **Planned:**
- Module 2: CRM System
- Module 3: Ticketing System
- Module 4: Analytics & Reporting
- Module 5: Billing & Payments
- Module 6: Super Admin Panel