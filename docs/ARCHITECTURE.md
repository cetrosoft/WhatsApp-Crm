# System Architecture
## Omnichannel CRM SaaS Platform

Last Updated: 2025-10-02

---

## 📋 Overview

A **multi-tenant Omnichannel CRM SaaS platform** for business communication with integrated WhatsApp messaging, CRM, Ticketing, and Bulk Messaging capabilities.

### Core Principles:
- ✅ **Multi-Tenant Architecture** - Complete data isolation per organization
- ✅ **Modular Design** - Each module works standalone or integrated
- ✅ **Cloud-First** - Supabase for database, auth, and storage
- ✅ **Real-Time** - Live updates via Socket.io and Supabase Realtime
- ✅ **Subscription-Based** - Stripe integration for billing
- ✅ **Multi-Language** - Full Arabic RTL & English LTR support

---

## 🏗️ Technology Stack

### **Backend**
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (JWT)
- **Real-Time**: Socket.io + Supabase Realtime
- **WhatsApp**: whatsapp-web.js + Puppeteer
- **Payments**: Stripe
- **Email**: Nodemailer

### **Frontend**
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: TailwindCSS with RTL support
- **Internationalization**: react-i18next (Arabic RTL + English LTR)
- **State Management**: React Query + Context API
- **Routing**: React Router v6
- **UI Components**: Lucide Icons, React Hot Toast
- **Auth**: Supabase Auth Helpers

### **DevOps & Infrastructure**
- **Version Control**: Git + GitHub
- **Database Hosting**: Supabase Cloud
- **File Storage**: Supabase Storage
- **API Deployment**: Vercel / Railway / DigitalOcean
- **Frontend Deployment**: Vercel / Netlify

---

## 🎯 Multi-Tenancy Architecture

### **Tenant Isolation Strategy**

#### **Database Level (Row Level Security)**
```sql
-- Every table has organization_id
CREATE TABLE example_table (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  -- other fields
);

-- RLS Policy ensures users only see their org's data
CREATE POLICY "Tenant isolation" ON example_table
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id')::UUID);
```

#### **Application Level**
```javascript
// Middleware sets organization context
app.use(async (req, res, next) => {
  const user = await verifyToken(req.headers.authorization);
  req.user = user;
  req.organizationId = user.organization_id;

  // Set Supabase context for RLS
  await supabase.rpc('set_organization_context', {
    org_id: user.organization_id
  });

  next();
});
```

---

## 🌍 Internationalization (i18n) & RTL Support

### **Supported Languages**
- **Arabic (ar)** - Right-to-Left (RTL) - Primary
- **English (en)** - Left-to-Right (LTR) - Secondary

### **Frontend Implementation**

#### **Technology Stack**
```javascript
// Dependencies
- react-i18next       // Translation framework
- i18next             // Core i18n engine
- i18next-browser-languagedetector  // Auto-detect browser language
- i18next-http-backend              // Load translations dynamically
```

#### **RTL/LTR Direction Handling**
```javascript
// Auto-detect and set document direction
useEffect(() => {
  const direction = i18n.language === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = direction;
  document.documentElement.lang = i18n.language;
}, [i18n.language]);
```

#### **TailwindCSS RTL Configuration**
```javascript
// tailwind.config.js
module.exports = {
  plugins: [
    require('tailwindcss-rtl'),
  ],
};

// Usage in components
<div className="ms-4 me-2">  // margin-start (right in RTL, left in LTR)
<div className="text-start">  // text-align: start (adapts to direction)
```

#### **Translation File Structure**
```
Frontend/
└── src/
    └── locales/
        ├── ar/
        │   ├── common.json      // Common UI elements
        │   ├── auth.json        // Login, Register, etc.
        │   ├── dashboard.json   // Dashboard texts
        │   ├── inbox.json       // WhatsApp inbox
        │   ├── crm.json         // CRM module
        │   ├── tickets.json     // Ticketing
        │   ├── campaigns.json   // Bulk messaging
        │   └── billing.json     // Subscriptions
        └── en/
            ├── common.json
            ├── auth.json
            └── ... (same structure)
```

#### **Example Translation Files**
```json
// ar/auth.json
{
  "login": "تسجيل الدخول",
  "register": "إنشاء حساب",
  "email": "البريد الإلكتروني",
  "password": "كلمة المرور",
  "organizationName": "اسم المؤسسة",
  "fullName": "الاسم الكامل",
  "submit": "إرسال",
  "loginSuccess": "تم تسجيل الدخول بنجاح",
  "invalidCredentials": "بيانات الدخول غير صحيحة"
}

// en/auth.json
{
  "login": "Login",
  "register": "Register",
  "email": "Email",
  "password": "Password",
  "organizationName": "Organization Name",
  "fullName": "Full Name",
  "submit": "Submit",
  "loginSuccess": "Login successful",
  "invalidCredentials": "Invalid credentials"
}
```

### **Backend Implementation**

#### **Multi-Language Email Templates**
```javascript
// services/emailService.js
const getEmailTemplate = (language, templateName) => {
  const templates = {
    ar: {
      invitation: {
        subject: 'تمت دعوتك للانضمام إلى',
        greeting: 'مرحباً',
        body: 'لقد تمت دعوتك للانضمام إلى...'
      }
    },
    en: {
      invitation: {
        subject: 'You\'re invited to join',
        greeting: 'Hello',
        body: 'You\'ve been invited to join...'
      }
    }
  };
  return templates[language][templateName];
};
```

### **Database Considerations**

#### **User Language Preference**
```sql
-- Add language column to users table
ALTER TABLE users ADD COLUMN preferred_language VARCHAR(5) DEFAULT 'ar';

-- Organization default language
ALTER TABLE organizations ADD COLUMN default_language VARCHAR(5) DEFAULT 'ar';
```

### **Component Example with i18n**
```javascript
import { useTranslation } from 'react-i18next';

function LoginPage() {
  const { t, i18n } = useTranslation('auth');

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <div className="min-h-screen" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      <select onChange={(e) => changeLanguage(e.target.value)}>
        <option value="ar">العربية</option>
        <option value="en">English</option>
      </select>

      <h1 className="text-2xl font-bold">{t('login')}</h1>
      <input placeholder={t('email')} className="text-start" />
      <button>{t('submit')}</button>
    </div>
  );
}
```

### **Key RTL Considerations**

1. **Icons & Arrows**: Mirror directional icons in RTL
   ```javascript
   const ArrowIcon = i18n.language === 'ar' ? ArrowLeft : ArrowRight;
   ```

2. **Form Layouts**: Use logical properties
   ```css
   /* Instead of margin-left/right, use: */
   margin-inline-start: 1rem;
   margin-inline-end: 0.5rem;
   ```

3. **Text Alignment**: Always use `start`/`end` instead of `left`/`right`
   ```javascript
   <div className="text-start">  // Not text-left
   ```

4. **Flexbox/Grid**: Use logical directions
   ```css
   justify-content: flex-start;  // Not flex-left
   ```

5. **Phone Numbers & Dates**: Use locale-aware formatting
   ```javascript
   const formattedDate = new Date().toLocaleDateString(i18n.language);
   ```

---

## 📦 Module Architecture

### **Module Structure**
The platform consists of **6 standalone modules** that can work independently or integrate seamlessly:

```
Module 0: Foundation (Core Platform)
  ├── Authentication & Authorization
  ├── Organization Management
  ├── User Management & Invitations
  └── Role-Based Permissions

Module 1: WhatsApp Messaging
  ├── QR Code Authentication
  ├── Real-Time Inbox
  ├── Send/Receive Messages
  ├── Media Support
  └── Agent Assignment

Module 2: CRM (Customer Management)
  ├── Customer CRUD
  ├── Sales Pipeline (Kanban)
  ├── Activity Tracking
  └── Lead Scoring

Module 3: Ticketing System
  ├── Support & Sales Tickets
  ├── Assignment Workflow
  ├── Comments & Timeline
  └── SLA Tracking

Module 4: Bulk Messaging (Campaigns)
  ├── Campaign Management
  ├── Scheduling & Delays
  ├── Progress Tracking
  └── Analytics

Module 5: Billing & Subscriptions
  ├── Stripe Integration
  ├── Plan Management
  ├── Automatic Renewals
  └── Usage Tracking
```

### **Module Dependencies**

```
Foundation (Module 0)
   ↓ provides: organization_id, user_id, permissions
   ↓
   ├─→ WhatsApp (Module 1)
   │     ↓
   │     ├─→ CRM (Module 2) ← auto-create customers
   │     │     ↓
   │     │     └─→ Ticketing (Module 3) ← link tickets to customers
   │     │           ↓
   │     └─→ Bulk Sender (Module 4) ← send to CRM segments
   │
   └─→ Billing (Module 5) ← controls access to all modules
```

---

## 🔗 Integration Patterns

### **1. Standalone Mode**
Module works completely independently without other modules.

**Example**: CRM without WhatsApp
```javascript
// Manual customer creation
POST /api/customers
{
  "name": "John Doe",
  "phone": "+1234567890",
  "email": "john@example.com"
}
```

### **2. Loosely Coupled (Optional Integration)**
Module checks if other modules are enabled and adds features accordingly.

**Example**: CRM with WhatsApp enabled
```javascript
// Auto-create customer from WhatsApp contact
if (isModuleEnabled('whatsapp')) {
  const conversation = getConversation(phone);
  customer.whatsapp_conversation_id = conversation.id;
  showWhatsAppChatButton();
}
```

### **3. Event-Driven Integration**
Modules communicate via event bus without direct dependencies.

**Example**: WhatsApp → CRM → Ticketing
```javascript
// WhatsApp emits event
EventBus.emit('message.received', {
  phone: '+1234567890',
  message: 'I need support'
});

// CRM listens and creates/updates customer
EventBus.on('message.received', async (data) => {
  await findOrCreateCustomer(data.phone);
});

// Ticketing checks for keywords
EventBus.on('message.received', async (data) => {
  if (containsSupportKeywords(data.message)) {
    await suggestTicketCreation(data);
  }
});
```

---

## 🔐 Security Architecture

### **Authentication Flow**
```
1. User Login → Supabase Auth
2. Supabase returns JWT token
3. Frontend stores token in localStorage
4. All API requests include: Authorization: Bearer <token>
5. Backend validates token + extracts user + organization_id
6. RLS policies ensure data isolation
```

### **Role-Based Access Control (RBAC)**

#### **Roles**
- **Admin**: Full access to everything
- **Manager**: CRM, Ticketing, WhatsApp, Campaigns (manage team)
- **Agent**: WhatsApp chat, Ticketing (assigned only)
- **Member**: View-only access

#### **Permission Matrix**
```javascript
const PERMISSIONS = {
  admin: {
    users: 'write',
    crm: 'write',
    ticketing: 'write',
    whatsapp: 'write',
    campaigns: 'write',
    billing: 'write',
    settings: 'write'
  },
  manager: {
    users: 'read',
    crm: 'write',
    ticketing: 'write',
    whatsapp: 'write',
    campaigns: 'write',
    billing: 'read',
    settings: 'read'
  },
  agent: {
    users: 'none',
    crm: 'read',
    ticketing: 'write',  // only assigned tickets
    whatsapp: 'write',   // only assigned chats
    campaigns: 'none',
    billing: 'none',
    settings: 'none'
  },
  member: {
    users: 'none',
    crm: 'read',
    ticketing: 'read',
    whatsapp: 'read',
    campaigns: 'none',
    billing: 'none',
    settings: 'none'
  }
};
```

### **Data Security**
- ✅ All database tables protected by Row Level Security (RLS)
- ✅ WhatsApp sessions encrypted before storage
- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens with expiration
- ✅ API rate limiting per organization
- ✅ Input validation & sanitization
- ✅ SQL injection prevention (Supabase ORM)
- ✅ XSS protection (React auto-escaping)

---

## 📊 Database Architecture

### **Shared Tables (Foundation)**
```sql
organizations          -- Tenants
users                  -- Extends Supabase auth.users
invitations           -- User invitation tokens
module_settings       -- Which modules enabled per org
integration_mappings  -- Links between module records
```

### **Module Tables**

**Module 1: WhatsApp**
```sql
whatsapp_profiles     -- Per-org WhatsApp connections
conversations         -- Chat threads
messages              -- Individual messages
```

**Module 2: CRM**
```sql
customers            -- Customer records
sales_stages         -- Pipeline stages
customer_activities  -- Activity timeline
```

**Module 3: Ticketing**
```sql
tickets              -- Support/sales tickets
ticket_comments      -- Comment threads
ticket_attachments   -- File attachments
```

**Module 4: Campaigns**
```sql
campaigns            -- Bulk message campaigns
campaign_recipients  -- Target list
campaign_results     -- Delivery status
```

**Module 5: Billing**
```sql
subscription_plans   -- Free, Starter, Pro, Enterprise
subscriptions        -- Active subscriptions
invoices             -- Payment history
payment_methods      -- Stored cards
usage_records        -- Metered billing data
```

---

## 🌐 API Architecture

### **REST API Endpoints**

#### **Authentication** (`/api/auth`)
```
POST   /api/auth/register           # Create org + admin user
POST   /api/auth/login              # Login with email/password
POST   /api/auth/logout             # Invalidate session
POST   /api/auth/forgot-password    # Password reset
POST   /api/auth/reset-password     # Set new password
POST   /api/auth/accept-invitation  # Accept user invitation
```

#### **Users** (`/api/users`)
```
GET    /api/users                   # List org users
POST   /api/users/invite            # Invite new user
PATCH  /api/users/:id/role          # Update user role
DELETE /api/users/:id               # Remove user
```

#### **WhatsApp** (`/api/whatsapp`)
```
GET    /api/whatsapp/profiles       # List WhatsApp profiles
POST   /api/whatsapp/connect        # Get QR code
GET    /api/whatsapp/conversations  # List chats
POST   /api/whatsapp/send           # Send message
POST   /api/whatsapp/forward        # Forward message
PUT    /api/whatsapp/message        # Edit message
DELETE /api/whatsapp/message        # Delete message
```

#### **CRM** (`/api/crm`)
```
GET    /api/crm/customers           # List customers
POST   /api/crm/customers           # Create customer
GET    /api/crm/customers/:id       # Customer detail
PATCH  /api/crm/customers/:id       # Update customer
DELETE /api/crm/customers/:id       # Delete customer
GET    /api/crm/sales-stages        # Pipeline stages
POST   /api/crm/customers/:id/activity  # Log activity
```

#### **Ticketing** (`/api/tickets`)
```
GET    /api/tickets                 # List tickets
POST   /api/tickets                 # Create ticket
GET    /api/tickets/:id             # Ticket detail
PATCH  /api/tickets/:id             # Update ticket
POST   /api/tickets/:id/comments    # Add comment
POST   /api/tickets/:id/assign      # Assign agent
```

#### **Campaigns** (`/api/campaigns`)
```
GET    /api/campaigns               # List campaigns
POST   /api/campaigns               # Create campaign
POST   /api/campaigns/:id/start     # Start sending
POST   /api/campaigns/:id/pause     # Pause campaign
POST   /api/campaigns/:id/resume    # Resume campaign
GET    /api/campaigns/:id/results   # Campaign analytics
```

#### **Billing** (`/api/billing`)
```
GET    /api/billing/plans           # Available plans
POST   /api/billing/subscribe       # Start subscription
POST   /api/billing/change-plan     # Upgrade/downgrade
POST   /api/billing/cancel          # Cancel subscription
GET    /api/billing/invoices        # Invoice history
POST   /api/billing/payment-method  # Add/update card
POST   /api/billing/webhooks/stripe # Stripe webhooks
```

---

## 🔄 Real-Time Architecture

### **Socket.io Events**

#### **WhatsApp Module**
```javascript
// Server → Client
socket.emit('qrCode', qrCodeData);
socket.emit('clientReady', true);
socket.emit('clientDisconnected', reason);
socket.emit('newMessage', {chatId, message, conversations});
socket.emit('messageSent', {chatId, message});
socket.emit('messageDeleted', {chatId, messageId});

// Client → Server
socket.emit('markAsRead', chatId);
```

#### **Ticketing Module**
```javascript
socket.emit('ticketCreated', ticket);
socket.emit('ticketUpdated', ticket);
socket.emit('ticketAssigned', {ticketId, agentId});
socket.emit('commentAdded', {ticketId, comment});
```

#### **Campaigns Module**
```javascript
socket.emit('campaignProgress', {campaignId, current, total});
socket.emit('campaignCompleted', {campaignId, results});
```

---

## 📁 Project Structure

```
whatsapp-saas-platform/
├── backend/                    # Main API server
│   ├── config/
│   │   ├── supabase.js        # Supabase client
│   │   └── stripe.js          # Stripe client
│   ├── middleware/
│   │   ├── auth.js            # JWT validation
│   │   ├── tenant.js          # Organization context
│   │   ├── permissions.js     # RBAC checks
│   │   └── rateLimit.js       # Rate limiting
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── whatsapp.routes.js
│   │   ├── crm.routes.js
│   │   ├── ticket.routes.js
│   │   ├── campaign.routes.js
│   │   └── billing.routes.js
│   ├── services/
│   │   ├── whatsappService.js
│   │   ├── invitationService.js
│   │   ├── permissionService.js
│   │   └── emailService.js
│   ├── utils/
│   │   ├── eventBus.js        # Module communication
│   │   └── logger.js
│   └── server.js              # Entry point
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── auth/              # Login, Register, Invite
│   │   ├── admin/             # User management, Settings
│   │   ├── pages/             # Main app pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Inbox.jsx      # WhatsApp
│   │   │   ├── Customers.jsx  # CRM
│   │   │   ├── Tickets.jsx    # Ticketing
│   │   │   ├── Campaigns.jsx  # Bulk sender
│   │   │   └── Billing.jsx
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── FeatureGate.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── usePermissions.js
│   │   │   └── useSupabase.js
│   │   └── App.jsx
│   └── package.json
│
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md         # This file
│   ├── ROADMAP.md
│   ├── DATABASE_SCHEMA.md
│   ├── SUPABASE_SETUP.md
│   ├── PROGRESS_TRACKER.md
│   └── modules/
│
├── supabase/                   # Database migrations
│   └── migrations/
│       ├── 001_foundation.sql
│       ├── 002_whatsapp.sql
│       ├── 003_crm.sql
│       ├── 004_ticketing.sql
│       ├── 005_campaigns.sql
│       └── 006_billing.sql
│
├── .env.example
├── README.md
└── CLAUDE.md
```

---

## 🚀 Deployment Architecture

### **Production Setup**

```
┌─────────────────────────────────────────────┐
│           Users (Multiple Organizations)     │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
          ┌────────────────┐
          │  Load Balancer  │ (Cloudflare / Nginx)
          └────────────────┘
                   │
        ┌──────────┴──────────┐
        ↓                     ↓
   ┌─────────┐          ┌──────────┐
   │ Frontend│          │  Backend  │
   │ (Vercel)│          │ (Railway) │
   └─────────┘          └──────────┘
                              │
                    ┌─────────┴─────────┐
                    ↓                   ↓
              ┌──────────┐        ┌─────────┐
              │ Supabase │        │ Stripe  │
              │(Database)│        │(Billing)│
              └──────────┘        └─────────┘
```

### **Environment Variables**
```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=xxx
SMTP_PASS=xxx

# App
NODE_ENV=production
FRONTEND_URL=https://app.yourdomain.com
JWT_SECRET=xxx
```

---

## 📈 Scalability Considerations

### **Database**
- ✅ Supabase auto-scales with usage
- ✅ Connection pooling built-in
- ✅ Indexes on foreign keys and frequently queried fields
- ✅ RLS policies for security + performance

### **Backend**
- ✅ Stateless API (horizontal scaling)
- ✅ Rate limiting per organization
- ✅ Caching for frequently accessed data
- ✅ Background jobs for heavy operations (campaigns)

### **WhatsApp**
- ✅ One WhatsApp client per profile (isolated)
- ✅ Session persistence in database
- ✅ Reconnection handling
- ✅ Multiple profiles per organization

### **File Storage**
- ✅ Supabase Storage for media files
- ✅ CDN for fast delivery
- ✅ Automatic image optimization

---

## 🔧 Development Workflow

### **Branch Strategy**
```
main                    # Production
  ├── develop          # Staging
  │   ├── feature/module-0-foundation
  │   ├── feature/module-1-whatsapp
  │   ├── feature/module-2-crm
  │   └── ...
  └── hotfix/critical-bug
```

### **Testing Strategy**
- **Unit Tests**: Jest for business logic
- **Integration Tests**: Supertest for API endpoints
- **E2E Tests**: Playwright for user flows
- **Manual Testing**: Each module before merge

---

## 📚 Additional Resources

- [Database Schema](./DATABASE_SCHEMA.md)
- [Implementation Roadmap](./ROADMAP.md)
- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [Module Documentation](./modules/)
- [Progress Tracker](./PROGRESS_TRACKER.md)

---

**Last Updated**: 2025-10-02
**Version**: 1.0.0
**Status**: Design Phase
