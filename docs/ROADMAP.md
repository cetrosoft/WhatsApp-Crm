# Implementation Roadmap
## Omnichannel CRM SaaS Platform

Last Updated: 2025-10-02

---

## 🎯 Project Timeline

**Total Duration**: 12 weeks to MVP
**Approach**: Modular, phase-by-phase development
**Deployment**: Incremental (each module goes live when ready)

---

## 📦 Module Overview

| Module | Name | Duration | Dependencies | Status |
|--------|------|----------|--------------|--------|
| 0 | Foundation | 2 weeks | None | Not Started |
| 1 | WhatsApp Messaging | 2 weeks | Module 0 | Not Started |
| 2 | CRM | 2 weeks | Module 0, 1 | Not Started |
| 3 | Ticketing | 2 weeks | Module 0, 1, 2 | Not Started |
| 4 | Bulk Sender | 2 weeks | Module 0, 1, 2 | Not Started |
| 5 | Billing & Subscriptions | 2 weeks | All modules | Not Started |

---

## 🚀 Phase 1: Foundation (Week 1-2)
### Module 0: Core Platform & Authentication

#### 📋 Goals
- [x] Multi-tenant database architecture
- [x] User authentication & authorization
- [x] Organization management
- [x] User invitation system
- [x] Role-based permissions
- [x] Basic admin dashboard

#### 📊 Database Tables
```sql
- organizations
- users (extends Supabase auth.users)
- invitations
- module_settings
```

#### 🔧 Backend Features
- **Authentication**
  - [x] User registration (creates organization)
  - [x] Login with email/password
  - [x] Logout & session management
  - [x] Password reset flow
  - [x] JWT token validation

- **User Management**
  - [x] Invite users via email
  - [x] Invitation token generation
  - [x] Accept invitation flow
  - [x] User CRUD operations
  - [x] Role assignment (admin, manager, agent, member)

- **Organization**
  - [x] Organization creation
  - [x] Organization settings
  - [x] Tenant isolation (RLS policies)

#### 🎨 Frontend Features
- **Auth Pages**
  - [x] Login page
  - [x] Register page (org creation)
  - [x] Accept invitation page
  - [x] Forgot password page
  - [x] Reset password page

- **Admin Dashboard**
  - [x] User management page
    - List all users
    - Invite new users
    - Edit user roles
    - Deactivate users
  - [x] Organization settings
    - Company info
    - Branding (logo, colors)
  - [x] Basic navigation sidebar

#### 📡 API Endpoints
```javascript
POST   /api/auth/register           // Create org + admin user
POST   /api/auth/login              // Login
POST   /api/auth/logout             // Logout
POST   /api/auth/forgot-password    // Request reset
POST   /api/auth/reset-password     // Set new password
POST   /api/auth/accept-invitation  // Accept invite

GET    /api/users                   // List org users
POST   /api/users/invite            // Send invitation
PATCH  /api/users/:id/role          // Update role
DELETE /api/users/:id               // Remove user

GET    /api/organizations/settings  // Get org settings
PATCH  /api/organizations/settings  // Update settings
```

#### ✅ Success Criteria
- ✓ User can register and create organization
- ✓ Admin can invite 3+ users successfully
- ✓ Invited users receive email and can accept
- ✓ Users can login and see appropriate dashboard
- ✓ Roles enforce correct permissions
- ✓ Complete tenant isolation (RLS working)

#### 🧪 Testing Checklist
- [ ] Unit tests for auth logic
- [ ] Integration tests for invitation flow
- [ ] E2E test for complete registration → invite → accept flow
- [ ] Test RLS policies (users can't see other orgs)

---

## 🚀 Phase 2: WhatsApp Messaging (Week 3-4)
### Module 1: Core Messaging Platform

#### 📋 Goals
- [x] WhatsApp Web integration per organization
- [x] QR code authentication
- [x] Real-time message inbox
- [x] Send/receive messages
- [x] Media support (images, audio, video, documents)
- [x] Group chat support
- [x] Message operations (forward, reply, edit, delete)
- [x] Agent assignment to conversations

#### 📊 Database Tables
```sql
- whatsapp_profiles    // Per-org WhatsApp connections
- conversations        // Chat threads
- messages             // Individual messages
```

#### 🔧 Backend Features
- **WhatsApp Integration**
  - [x] whatsapp-web.js setup
  - [x] Session persistence per organization
  - [x] QR code generation
  - [x] Connection status tracking
  - [x] Automatic reconnection

- **Messaging**
  - [x] Receive messages (individual + group)
  - [x] Send text messages
  - [x] Send media (images, audio, video, documents)
  - [x] Forward messages
  - [x] Reply to messages
  - [x] Edit messages (within 15 min)
  - [x] Delete messages

- **Conversation Management**
  - [x] List conversations
  - [x] Unread message count
  - [x] Mark as read
  - [x] Assign to agent
  - [x] Search conversations

#### 🎨 Frontend Features
- **WhatsApp Pages**
  - [x] WhatsApp profile management
    - QR code display
    - Connection status
    - Disconnect/reconnect
  - [x] Inbox page
    - Conversation list
    - Real-time message updates
    - Unread badges
    - Search & filter
  - [x] Chat interface
    - Message thread
    - Send text/media
    - Forward/reply/edit/delete
    - Media preview
    - Group member list

#### 📡 API Endpoints
```javascript
// WhatsApp Profiles
GET    /api/whatsapp/profiles           // List profiles
POST   /api/whatsapp/connect            // Initialize QR
DELETE /api/whatsapp/disconnect/:id     // Disconnect

// Conversations
GET    /api/whatsapp/conversations      // List chats
GET    /api/whatsapp/conversations/:id  // Chat detail
POST   /api/whatsapp/conversations/:id/assign  // Assign agent

// Messages
POST   /api/whatsapp/send               // Send message
POST   /api/whatsapp/forward            // Forward message
PUT    /api/whatsapp/message            // Edit message
DELETE /api/whatsapp/message            // Delete message
POST   /api/whatsapp/reply              // Reply to message
```

#### 🔄 Socket.io Events
```javascript
// Server → Client
'qrCode'              // QR code data
'clientReady'         // WhatsApp connected
'clientDisconnected'  // WhatsApp disconnected
'newMessage'          // New message received
'messageSent'         // Message sent confirmation
'messageEdited'       // Message edited
'messageDeleted'      // Message deleted

// Client → Server
'markAsRead'          // Mark conversation as read
```

#### 🔗 Integration Points
- **Standalone**: Works as pure messaging tool
- **With CRM** (Module 2): Auto-create customers from contacts
- **With Ticketing** (Module 3): Create ticket from conversation

#### ✅ Success Criteria
- ✓ Organization can connect WhatsApp profile via QR
- ✓ Messages appear in real-time inbox
- ✓ Can send text and media messages
- ✓ Forward, reply, edit, delete work correctly
- ✓ Group chats display properly with member names
- ✓ Agent assignment works
- ✓ Multiple organizations have isolated WhatsApp sessions

#### 🧪 Testing Checklist
- [ ] Test QR authentication flow
- [ ] Test message send/receive
- [ ] Test media upload (image, audio, video, document)
- [ ] Test forward with attachment
- [ ] Test group message handling
- [ ] Test multi-tenant isolation (2 orgs, different chats)

---

## 🚀 Phase 3: CRM (Week 5-6)
### Module 2: Customer Relationship Management

#### 📋 Goals
- [x] Customer database & CRUD
- [x] Sales pipeline (Kanban board)
- [x] Activity tracking & timeline
- [x] Lead scoring
- [x] Custom fields support
- [x] Integration with WhatsApp conversations

#### 📊 Database Tables
```sql
- customers            // Customer records
- sales_stages         // Pipeline stages (configurable)
- customer_activities  // Activity log
```

#### 🔧 Backend Features
- **Customer Management**
  - [x] Create customer (manual + auto from WhatsApp)
  - [x] Update customer info
  - [x] Delete customer
  - [x] Search & filter customers
  - [x] Customer detail with full history

- **Sales Pipeline**
  - [x] Configurable stages (Lead → Qualified → Proposal → Won/Lost)
  - [x] Move customers between stages
  - [x] Stage-based filtering
  - [x] Conversion rate tracking

- **Activity Tracking**
  - [x] Auto-log WhatsApp messages
  - [x] Manual notes
  - [x] Task creation
  - [x] Meeting logs
  - [x] Activity timeline

- **Auto-Creation from WhatsApp**
  - [x] Detect new contacts from messages
  - [x] Create customer record automatically
  - [x] Link WhatsApp conversation to customer

#### 🎨 Frontend Features
- **CRM Pages**
  - [x] Customers list
    - Table/card view
    - Search & filters (stage, assigned, date range)
    - Bulk actions
  - [x] Sales pipeline (Kanban)
    - Drag & drop between stages
    - Customer cards with key info
    - Stage statistics
  - [x] Customer detail page
    - Contact information
    - Sales stage & value
    - Activity timeline
    - WhatsApp chat history (if linked)
    - Notes & tasks
    - Custom fields
  - [x] Stage management
    - Create/edit/delete stages
    - Reorder stages
    - Set stage colors & probabilities

#### 📡 API Endpoints
```javascript
// Customers
GET    /api/crm/customers              // List customers
POST   /api/crm/customers              // Create customer
GET    /api/crm/customers/:id          // Customer detail
PATCH  /api/crm/customers/:id          // Update customer
DELETE /api/crm/customers/:id          // Delete customer
PATCH  /api/crm/customers/:id/stage    // Move to stage

// Sales Stages
GET    /api/crm/sales-stages           // List stages
POST   /api/crm/sales-stages           // Create stage
PATCH  /api/crm/sales-stages/:id       // Update stage
DELETE /api/crm/sales-stages/:id       // Delete stage
POST   /api/crm/sales-stages/reorder   // Reorder stages

// Activities
GET    /api/crm/customers/:id/activities     // Activity timeline
POST   /api/crm/customers/:id/activities     // Log activity
```

#### 🔗 Integration Points
- **Standalone**: Manual customer entry, CSV import
- **With WhatsApp (Module 1)**:
  - Auto-create customer when new contact messages
  - Show WhatsApp chat on customer detail page
  - Link customer to conversation
  - Auto-log messages as activities
- **With Ticketing (Module 3)**: Link tickets to customers

#### ✅ Success Criteria
- ✓ Can create/edit/delete customers manually
- ✓ Kanban board with drag & drop works
- ✓ Custom sales stages configurable
- ✓ Activity timeline shows all interactions
- ✓ New WhatsApp contacts auto-create customers
- ✓ Customer detail shows linked chat history
- ✓ Search & filters work efficiently

#### 🧪 Testing Checklist
- [ ] Test customer CRUD operations
- [ ] Test Kanban drag & drop (move between stages)
- [ ] Test auto-customer creation from WhatsApp
- [ ] Test activity auto-logging from messages
- [ ] Test custom fields functionality
- [ ] Test search with various filters

---

## 🚀 Phase 4: Ticketing System (Week 7-8)
### Module 3: Support & Sales Ticketing

#### 📋 Goals
- [x] Ticket management (support, sales, follow-up)
- [x] Assignment workflow
- [x] Priority & status tracking
- [x] Comment threads
- [x] SLA tracking (optional)
- [x] Create tickets from WhatsApp conversations

#### 📊 Database Tables
```sql
- tickets              // Ticket records
- ticket_comments      // Comment threads
- ticket_attachments   // File attachments
```

#### 🔧 Backend Features
- **Ticket Management**
  - [x] Create ticket (manual + from WhatsApp message)
  - [x] Update ticket details
  - [x] Assign to agent
  - [x] Change status (open → in_progress → resolved → closed)
  - [x] Set priority (low, medium, high, urgent)
  - [x] Add tags
  - [x] Link to customer
  - [x] Link to WhatsApp conversation

- **Comments & Collaboration**
  - [x] Add comments
  - [x] Internal vs public notes
  - [x] File attachments
  - [x] @mention team members

- **Workflow**
  - [x] Auto-assign based on keywords
  - [x] Escalation rules
  - [x] SLA timer tracking
  - [x] Automated responses

#### 🎨 Frontend Features
- **Ticketing Pages**
  - [x] Tickets list
    - Filters (status, priority, assigned, type)
    - Search by ticket number/customer
    - Kanban view by status
  - [x] Ticket detail page
    - Ticket info (title, description, type, priority)
    - Status timeline
    - Assignment
    - Comment thread
    - Link to customer
    - Link to WhatsApp chat
    - File attachments
  - [x] Create ticket modal
    - From scratch
    - From WhatsApp message (pre-filled)
    - Select customer
    - Set type, priority

#### 📡 API Endpoints
```javascript
// Tickets
GET    /api/tickets                    // List tickets
POST   /api/tickets                    // Create ticket
GET    /api/tickets/:id                // Ticket detail
PATCH  /api/tickets/:id                // Update ticket
POST   /api/tickets/:id/assign         // Assign agent
POST   /api/tickets/from-conversation  // Create from WhatsApp

// Comments
GET    /api/tickets/:id/comments       // List comments
POST   /api/tickets/:id/comments       // Add comment
PATCH  /api/tickets/comments/:id       // Edit comment
DELETE /api/tickets/comments/:id       // Delete comment

// Attachments
POST   /api/tickets/:id/attachments    // Upload file
DELETE /api/tickets/attachments/:id    // Delete file
```

#### 🔗 Integration Points
- **Standalone**: Manual ticket creation
- **With WhatsApp (Module 1)**:
  - "Create ticket" button in message context menu
  - Auto-fill ticket with message content
  - Link ticket to conversation
  - Reply to ticket updates customer via WhatsApp
- **With CRM (Module 2)**:
  - Link tickets to customers
  - Show tickets on customer detail page
  - Auto-suggest customer based on phone number

#### ✅ Success Criteria
- ✓ Can create tickets manually
- ✓ Can create ticket from WhatsApp message
- ✓ Assignment workflow works
- ✓ Comment thread with attachments
- ✓ Status changes tracked in timeline
- ✓ Tickets linked to customers and conversations
- ✓ Filters and search work efficiently

#### 🧪 Testing Checklist
- [ ] Test ticket creation (manual + from WhatsApp)
- [ ] Test assignment to agents
- [ ] Test status workflow (open → resolved → closed)
- [ ] Test comment thread with attachments
- [ ] Test ticket-customer linking
- [ ] Test ticket-conversation linking
- [ ] Test filters (status, priority, assigned)

---

## 🚀 Phase 5: Bulk Messaging (Week 9-10)
### Module 4: Campaign Management

#### 📋 Goals
- [x] Bulk message campaigns
- [x] Recipient management (manual, CRM segments, groups)
- [x] Scheduling & delays
- [x] Media attachments
- [x] Campaign pause/resume/stop
- [x] Real-time progress tracking
- [x] Campaign analytics

#### 📊 Database Tables
```sql
- campaigns            // Campaign records
- campaign_recipients  // Target list
- campaign_results     // Delivery results
```

#### 🔧 Backend Features
- **Campaign Creation**
  - [x] Create campaign with template
  - [x] Select recipients:
    - Manual phone list
    - WhatsApp groups
    - CRM customer segments (e.g., all "Hot Leads")
  - [x] Attach media files
  - [x] Configure delays (min/max between messages)
  - [x] Schedule for later or send now

- **Campaign Execution**
  - [x] Send messages with delays
  - [x] Track delivery status (sent, failed)
  - [x] Pause/resume/stop controls
  - [x] Error handling & retry logic
  - [x] Rate limiting per WhatsApp profile

- **Analytics**
  - [x] Sent vs failed count
  - [x] Delivery rate
  - [x] Response rate (if tracked)
  - [x] Campaign history

#### 🎨 Frontend Features
- **Campaign Pages**
  - [x] Campaigns list
    - Active, scheduled, completed
    - Progress indicators
  - [x] Create campaign wizard
    - Step 1: Name & message template
    - Step 2: Select recipients
    - Step 3: Media & delay settings
    - Step 4: Schedule or send now
  - [x] Campaign detail/monitor
    - Real-time progress bar
    - Sent/failed stats
    - Pause/resume/stop buttons
    - Recipient delivery status
  - [x] Campaign analytics
    - Charts for sent/failed/pending
    - Timeline of sends

#### 📡 API Endpoints
```javascript
// Campaigns
GET    /api/campaigns                  // List campaigns
POST   /api/campaigns                  // Create campaign
GET    /api/campaigns/:id              // Campaign detail
POST   /api/campaigns/:id/start        // Start campaign
POST   /api/campaigns/:id/pause        // Pause campaign
POST   /api/campaigns/:id/resume       // Resume campaign
POST   /api/campaigns/:id/stop         // Stop campaign
GET    /api/campaigns/:id/results      // Get results
```

#### 🔄 Socket.io Events
```javascript
'campaignProgress'    // {campaignId, current, total, result}
'campaignCompleted'   // {campaignId, results}
'campaignPaused'      // {campaignId}
'campaignResumed'     // {campaignId}
'campaignStopped'     // {campaignId}
```

#### 🔗 Integration Points
- **Standalone**: Manual recipient list
- **With WhatsApp (Module 1)**:
  - Use connected WhatsApp profiles for sending
  - Send to groups from WhatsApp
- **With CRM (Module 2)**:
  - Send to customer segments (e.g., stage = "Hot Lead")
  - Use customer data for personalization ({name}, {company})

#### ✅ Success Criteria
- ✓ Can create campaign with message + media
- ✓ Can select recipients from manual list, groups, CRM segments
- ✓ Messages send with configured delays
- ✓ Pause/resume/stop controls work
- ✓ Real-time progress updates
- ✓ Analytics show accurate delivery stats
- ✓ Failed messages logged with reasons

#### 🧪 Testing Checklist
- [ ] Test campaign creation with all recipient types
- [ ] Test message sending with delays
- [ ] Test pause/resume/stop functionality
- [ ] Test media attachment in campaign
- [ ] Test CRM segment targeting
- [ ] Test multi-tenant isolation (campaigns don't cross orgs)

---

## 🚀 Phase 6: Billing & Subscriptions (Week 11-12)
### Module 5: Monetization

#### 📋 Goals
- [x] Subscription plans (Free, Starter, Professional, Enterprise)
- [x] Stripe integration
- [x] Trial period (14 days)
- [x] Automatic renewals
- [x] Payment failure handling (dunning)
- [x] Plan upgrade/downgrade
- [x] Invoice generation
- [x] Usage tracking & limits
- [x] Feature gating based on plan

#### 📊 Database Tables
```sql
- subscription_plans   // Plan definitions
- subscriptions        // Active subscriptions
- invoices             // Payment history
- payment_methods      // Stored cards
- usage_records        // Metered billing data
- billing_events       // Audit log
```

#### 🔧 Backend Features
- **Subscription Management**
  - [x] Create subscription (with trial)
  - [x] Stripe customer creation
  - [x] Stripe subscription lifecycle
  - [x] Handle webhooks (payment.succeeded, payment.failed, subscription.updated)
  - [x] Trial → Paid conversion
  - [x] Auto-renewal logic
  - [x] Cancellation (immediate or at period end)

- **Plan Management**
  - [x] Plan upgrade/downgrade
  - [x] Proration handling
  - [x] Feature gating middleware
  - [x] Usage limit enforcement

- **Payment Processing**
  - [x] Add/update payment method
  - [x] Invoice generation (PDF)
  - [x] Receipt emails
  - [x] Failed payment retry (dunning)
  - [x] Suspend account after 3 failed attempts

- **Usage Tracking**
  - [x] Track messages sent per day
  - [x] Track users count
  - [x] Track customers count
  - [x] Track storage used
  - [x] Enforce limits per plan

#### 🎨 Frontend Features
- **Billing Pages**
  - [x] Plans page (public)
    - Plan comparison table
    - Feature matrix
    - Pricing (monthly/yearly toggle)
    - "Start Free Trial" CTA
  - [x] Billing dashboard (admin only)
    - Current plan & next billing date
    - Usage metrics with progress bars
    - Payment method
    - Invoice history
    - "Upgrade Plan" button
  - [x] Checkout flow
    - Stripe Elements (card input)
    - Billing address
    - Apply coupon
  - [x] Upgrade/downgrade modal
    - Plan comparison
    - Proration preview
    - Confirm change
  - [x] Cancel subscription flow
    - Reasons for cancellation
    - Offer to downgrade instead
    - Confirm cancellation

- **Feature Gates**
  - [x] `<FeatureGate>` component
    - Shows upgrade prompt if feature not in plan
    - Hides features completely on lower plans
  - [x] Usage limit warnings
    - Show warnings at 80%, 90%, 100%
    - Prompt to upgrade

#### 📡 API Endpoints
```javascript
// Plans
GET    /api/billing/plans              // List plans

// Subscriptions
POST   /api/billing/subscribe          // Start subscription
POST   /api/billing/change-plan        // Upgrade/downgrade
POST   /api/billing/cancel             // Cancel subscription
GET    /api/billing/subscription       // Current subscription

// Payment Methods
GET    /api/billing/payment-methods    // List saved cards
POST   /api/billing/payment-methods    // Add card
DELETE /api/billing/payment-methods/:id // Remove card
PATCH  /api/billing/payment-methods/:id/default // Set default

// Invoices
GET    /api/billing/invoices           // Invoice history
GET    /api/billing/invoices/:id/pdf   // Download PDF

// Webhooks
POST   /api/billing/webhooks/stripe    // Stripe webhooks

// Usage
GET    /api/billing/usage              // Current usage stats
```

#### 🔗 Integration with All Modules
- **Module 0 (Foundation)**: Enforce user limits
- **Module 1 (WhatsApp)**: Enforce message/day limits, profile limits
- **Module 2 (CRM)**: Enforce customer limits, hide analytics on free
- **Module 3 (Ticketing)**: Disable on free plan
- **Module 4 (Bulk Sender)**: Disable on free plan
- **Module 5 (Billing)**: Control access to all features

#### ✅ Success Criteria
- ✓ User can start free trial
- ✓ Trial converts to paid after adding card
- ✓ Automatic renewal works
- ✓ Failed payments trigger dunning emails
- ✓ Account suspends after 3 failed payments
- ✓ Plan upgrade/downgrade with proration
- ✓ Invoices generated and emailed
- ✓ Usage limits enforced per plan
- ✓ Feature gates hide unavailable features

#### 🧪 Testing Checklist
- [ ] Test subscription creation with trial
- [ ] Test Stripe webhook handling (all events)
- [ ] Test payment success/failure flows
- [ ] Test plan upgrade/downgrade with proration
- [ ] Test usage limit enforcement (messages, users, customers)
- [ ] Test feature gating (free vs paid features)
- [ ] Test cancellation (immediate + at period end)

---

## 🎯 Subscription Plans

| Feature | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| **Price** | $0 | $29/mo | $99/mo | $299/mo |
| **Users** | 3 | 10 | 50 | Unlimited |
| **WhatsApp Profiles** | 1 | 2 | 5 | 20 |
| **Customers** | 100 | 1,000 | 10,000 | Unlimited |
| **Messages/Day** | 50 | 500 | 5,000 | 50,000 |
| **CRM** | ✅ | ✅ | ✅ | ✅ |
| **Ticketing** | ❌ | ✅ | ✅ | ✅ |
| **Bulk Sender** | ❌ | ✅ | ✅ | ✅ |
| **Analytics** | ❌ | ✅ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | ✅ | ✅ |
| **White Label** | ❌ | ❌ | ❌ | ✅ |
| **Support** | Community | Email | Priority | Dedicated |

---

## 📅 Milestones & Deliverables

### **Week 2** - Foundation Complete
- ✅ Auth system working
- ✅ User invitations functional
- ✅ Multi-tenant database ready

### **Week 4** - WhatsApp Live
- ✅ Organizations can connect WhatsApp
- ✅ Messages send/receive in real-time
- ✅ Media support working

### **Week 6** - CRM Ready
- ✅ Customer management functional
- ✅ Sales pipeline operational
- ✅ WhatsApp auto-creates customers

### **Week 8** - Ticketing Active
- ✅ Tickets created from chats
- ✅ Assignment workflow complete
- ✅ Linked to customers

### **Week 10** - Campaigns Running
- ✅ Bulk messaging operational
- ✅ CRM segment targeting works
- ✅ Real-time progress tracking

### **Week 12** - Billing & Launch
- ✅ Stripe integration complete
- ✅ Trial & subscriptions working
- ✅ Usage limits enforced
- ✅ **MVP LAUNCH** 🚀

---

## 🔄 Post-MVP Roadmap (Optional)

### **Phase 7: Analytics & Reports** (Week 13-14)
- Message volume charts
- Sales conversion funnel
- Ticket resolution time
- Revenue forecasting
- Custom reports

### **Phase 8: Automation** (Week 15-16)
- Chatbots & auto-replies
- Workflow automation (if X then Y)
- Scheduled messages
- Drip campaigns

### **Phase 9: Integrations** (Week 17-18)
- Zapier integration
- API webhooks
- Export/import (CSV, Excel)
- Third-party CRMs sync

### **Phase 10: Mobile Apps** (Week 19-24)
- React Native app (iOS + Android)
- Push notifications
- Offline mode

---

## 📊 Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| WhatsApp bans accounts | High | Rate limiting, user education, terms of service |
| Stripe integration issues | Medium | Thorough testing in test mode, handle all webhook events |
| Database performance | Medium | Proper indexing, RLS optimization, Supabase monitoring |
| Scope creep | High | Strict module boundaries, MVP focus, post-MVP features later |
| Team burnout | Medium | Realistic timeline, buffer weeks, celebrate milestones |

---

## ✅ Next Steps

**Immediate Actions:**
1. [ ] Create Supabase project (cloud)
2. [ ] Set up Stripe account (test mode)
3. [ ] Initialize Git repository
4. [ ] Create Module 0 database schema
5. [ ] Begin authentication implementation

**Resources Needed:**
- [ ] Supabase account (free tier)
- [ ] Stripe account (test mode, no card needed)
- [ ] Email service (Gmail/SendGrid for invitations)
- [ ] Domain name (for production)

---

**Last Updated**: 2025-10-02
**Current Phase**: Planning Complete
**Next Phase**: Module 0 - Foundation
