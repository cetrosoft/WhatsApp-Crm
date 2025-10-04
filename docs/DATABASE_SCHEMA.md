# Database Schema
## Omnichannel CRM SaaS Platform - Complete Table Definitions

Last Updated: 2025-10-02

---

## 🗄️ Database: Supabase (PostgreSQL)

**Multi-Tenant Strategy**: Row Level Security (RLS) with `organization_id` on all tables

---

## 📦 Module 0: Foundation

### Table: `packages`
Subscription plans/packages (Free, Lite, Professional, Business, Enterprise)

```sql
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Info
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,

  -- Pricing
  price_monthly DECIMAL(10,2) DEFAULT 0,
  price_yearly DECIMAL(10,2) DEFAULT 0,

  -- Usage Limits
  max_users INT DEFAULT 3,
  max_whatsapp_profiles INT DEFAULT 1,
  max_customers INT DEFAULT 100,
  max_messages_per_day INT DEFAULT 50,

  -- Features (JSONB for flexibility)
  features JSONB DEFAULT '{}'::jsonb,

  -- Display & Status
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  is_custom BOOLEAN DEFAULT false,

  -- Stripe Integration
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_packages_slug ON packages(slug);
CREATE INDEX idx_packages_active ON packages(is_active);

-- RLS Policies
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Packages are viewable by everyone" ON packages
  FOR SELECT
  USING (is_active = true);
```

**Default Packages:**
- **Free**: $0/mo, 3 users, 1 WhatsApp, CRM only
- **Lite**: $29/mo, 10 users, 2 WhatsApp, CRM + Ticketing
- **Professional**: $99/mo, 50 users, 5 WhatsApp, All features except API
- **Business**: $299/mo, 200 users, 20 WhatsApp, Full features
- **Enterprise**: Custom pricing, unlimited, white-label

### Table: `organizations`
Tenant/organization records

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  domain VARCHAR(255),

  -- Subscription
  package_id UUID REFERENCES packages(id) NOT NULL,
  subscription_status VARCHAR(20) DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),

  -- Custom Limits (for Enterprise)
  custom_limits JSONB DEFAULT '{}'::jsonb,

  -- Language
  default_language VARCHAR(5) DEFAULT 'ar',

  -- Metadata
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_package ON organizations(package_id);
CREATE INDEX idx_organizations_status ON organizations(subscription_status);

-- RLS Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own organization" ON organizations
  FOR SELECT
  USING (id = current_setting('app.current_organization_id', true)::UUID);

CREATE POLICY "Users can update own organization" ON organizations
  FOR UPDATE
  USING (id = current_setting('app.current_organization_id', true)::UUID);
```

**Helper Functions:**
```sql
-- Get effective limits (package limits + custom overrides)
SELECT * FROM get_organization_limits('org-uuid');

-- Check if organization has a feature
SELECT organization_has_feature('org-uuid', 'bulk_sender');
```

### Table: `users`
Extended user profiles (links to Supabase auth.users)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  -- Profile
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  phone VARCHAR(20),

  -- Role & Permissions
  role VARCHAR(50) DEFAULT 'member',  -- admin, manager, agent, member
  permissions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,

  -- Invitation tracking
  invited_by UUID REFERENCES users(id),
  invitation_accepted_at TIMESTAMPTZ,

  -- Activity
  last_login_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org users" ON users
  FOR SELECT
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can manage users" ON users
  FOR ALL
  USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Table: `invitations`
User invitation tokens

```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  permissions JSONB DEFAULT '{}'::jsonb,

  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,

  invited_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_invitations_org ON invitations(organization_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);

-- RLS Policies
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization invitations" ON invitations
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);
```

---

## 📦 Module 1: WhatsApp Messaging

### Table: `whatsapp_profiles`
WhatsApp connections per organization

```sql
CREATE TABLE whatsapp_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),

  -- Session data (encrypted)
  session_data TEXT,
  qr_code TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'disconnected',  -- connected, disconnected, qr_required
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_whatsapp_profiles_org ON whatsapp_profiles(organization_id);
CREATE INDEX idx_whatsapp_profiles_status ON whatsapp_profiles(status);

-- RLS Policies
ALTER TABLE whatsapp_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization profiles" ON whatsapp_profiles
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);
```

### Table: `conversations`
WhatsApp chat threads

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  whatsapp_profile_id UUID REFERENCES whatsapp_profiles(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id),  -- Link to CRM

  -- WhatsApp data
  whatsapp_chat_id VARCHAR(255) NOT NULL,  -- WhatsApp's chat ID
  contact_name VARCHAR(255),
  contact_phone VARCHAR(20),
  is_group BOOLEAN DEFAULT false,

  -- Conversation state
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count INT DEFAULT 0,

  -- Assignment
  assigned_to UUID REFERENCES users(id),

  -- Metadata
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_conversations_org ON conversations(organization_id);
CREATE INDEX idx_conversations_profile ON conversations(whatsapp_profile_id);
CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_conversations_assigned ON conversations(assigned_to);
CREATE INDEX idx_conversations_whatsapp ON conversations(whatsapp_chat_id);

-- RLS Policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization conversations" ON conversations
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);
```

### Table: `messages`
Individual WhatsApp messages

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,

  whatsapp_message_id VARCHAR(255),

  -- Sender info
  sender_type VARCHAR(20),  -- 'customer', 'agent', 'system'
  sender_id UUID REFERENCES users(id),  -- NULL if customer
  sender_name VARCHAR(255),

  -- Message content
  message_text TEXT,

  -- Media
  media_type VARCHAR(50),  -- 'image', 'audio', 'video', 'document', 'location'
  media_url TEXT,  -- Supabase Storage URL
  media_mimetype VARCHAR(100),
  media_filename VARCHAR(255),
  media_size INT,

  -- Metadata
  replied_to_id UUID REFERENCES messages(id),
  forwarded BOOLEAN DEFAULT false,
  edited BOOLEAN DEFAULT false,
  deleted BOOLEAN DEFAULT false,

  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_org ON messages(organization_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX idx_messages_whatsapp ON messages(whatsapp_message_id);

-- RLS Policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization messages" ON messages
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);
```

---

## 📦 Module 2: CRM

### Table: `customers`
Customer/contact records

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  -- Contact info
  whatsapp_phone VARCHAR(20),
  full_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  company VARCHAR(255),
  position VARCHAR(100),

  -- Sales info
  sales_stage_id UUID REFERENCES sales_stages(id),
  lead_score INT DEFAULT 0,
  estimated_value DECIMAL(12,2),
  source VARCHAR(100),  -- 'whatsapp', 'manual', 'import', 'api'

  -- Assignment
  assigned_to UUID REFERENCES users(id),

  -- Metadata
  tags TEXT[],
  notes TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_customers_org ON customers(organization_id);
CREATE INDEX idx_customers_stage ON customers(sales_stage_id);
CREATE INDEX idx_customers_assigned ON customers(assigned_to);
CREATE INDEX idx_customers_phone ON customers(whatsapp_phone);
CREATE INDEX idx_customers_email ON customers(email);

-- RLS Policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization customers" ON customers
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);
```

### Table: `sales_stages`
Sales pipeline stages (configurable per organization)

```sql
CREATE TABLE sales_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  name VARCHAR(100) NOT NULL,
  display_order INT NOT NULL,
  color VARCHAR(7),  -- Hex color code
  probability INT,  -- 0-100 for forecasting
  is_default BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sales_stages_org ON sales_stages(organization_id);
CREATE INDEX idx_sales_stages_order ON sales_stages(display_order);

-- RLS Policies
ALTER TABLE sales_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization stages" ON sales_stages
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

-- Default stages
INSERT INTO sales_stages (organization_id, name, display_order, color, probability, is_default)
SELECT
  o.id,
  stage.name,
  stage.display_order,
  stage.color,
  stage.probability,
  true
FROM organizations o
CROSS JOIN (
  VALUES
    ('Lead', 1, '#6B7280', 10),
    ('Qualified', 2, '#3B82F6', 25),
    ('Proposal', 3, '#F59E0B', 50),
    ('Negotiation', 4, '#8B5CF6', 75),
    ('Won', 5, '#10B981', 100),
    ('Lost', 6, '#EF4444', 0)
) AS stage(name, display_order, color, probability);
```

### Table: `customer_activities`
Activity timeline for customers

```sql
CREATE TABLE customer_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,

  activity_type VARCHAR(50),  -- 'message', 'call', 'note', 'stage_change', 'meeting', 'email'
  description TEXT,

  performed_by UUID REFERENCES users(id),

  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activities_org ON customer_activities(organization_id);
CREATE INDEX idx_activities_customer ON customer_activities(customer_id);
CREATE INDEX idx_activities_created ON customer_activities(created_at DESC);

-- RLS Policies
ALTER TABLE customer_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization activities" ON customer_activities
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);
```

---

## 📦 Module 3: Ticketing

### Table: `tickets`
Support and sales tickets

```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  ticket_number VARCHAR(20) UNIQUE NOT NULL,  -- e.g., TICKET-2024-0001

  customer_id UUID REFERENCES customers(id),
  conversation_id UUID REFERENCES conversations(id),  -- Link to WhatsApp chat

  title VARCHAR(255) NOT NULL,
  description TEXT,

  type VARCHAR(50),  -- 'support', 'sales_offer', 'follow_up', 'bug', 'feature_request'
  status VARCHAR(50) DEFAULT 'open',  -- 'open', 'in_progress', 'waiting', 'resolved', 'closed'
  priority VARCHAR(20) DEFAULT 'medium',  -- 'low', 'medium', 'high', 'urgent'

  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),

  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  tags TEXT[],
  custom_fields JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tickets_org ON tickets(organization_id);
CREATE INDEX idx_tickets_customer ON tickets(customer_id);
CREATE INDEX idx_tickets_conversation ON tickets(conversation_id);
CREATE INDEX idx_tickets_assigned ON tickets(assigned_to);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_number ON tickets(ticket_number);

-- RLS Policies
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization tickets" ON tickets
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

-- Trigger to auto-generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INT;
  year VARCHAR(4);
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');

  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM '\d+$') AS INT)), 0) + 1
  INTO next_number
  FROM tickets
  WHERE organization_id = NEW.organization_id
    AND ticket_number LIKE 'TICKET-' || year || '-%';

  NEW.ticket_number := 'TICKET-' || year || '-' || LPAD(next_number::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW
  WHEN (NEW.ticket_number IS NULL)
  EXECUTE FUNCTION generate_ticket_number();
```

### Table: `ticket_comments`
Comments on tickets

```sql
CREATE TABLE ticket_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,

  user_id UUID REFERENCES users(id),
  comment_text TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,  -- Internal notes vs public comments

  attachments JSONB DEFAULT '[]'::jsonb,  -- [{url, filename, size}]

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ticket_comments_org ON ticket_comments(organization_id);
CREATE INDEX idx_ticket_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_created ON ticket_comments(created_at DESC);

-- RLS Policies
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization comments" ON ticket_comments
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);
```

---

## 📦 Module 4: Bulk Messaging (Campaigns)

### Table: `campaigns`
Bulk message campaigns

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  whatsapp_profile_id UUID REFERENCES whatsapp_profiles(id),

  name VARCHAR(255) NOT NULL,
  message_template TEXT NOT NULL,

  status VARCHAR(20) DEFAULT 'draft',  -- 'draft', 'scheduled', 'running', 'paused', 'completed', 'stopped'

  total_recipients INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  current_index INT DEFAULT 0,

  delay_min INT DEFAULT 2000,  -- Min delay in ms
  delay_max INT DEFAULT 5000,  -- Max delay in ms

  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_campaigns_org ON campaigns(organization_id);
CREATE INDEX idx_campaigns_profile ON campaigns(whatsapp_profile_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created ON campaigns(created_at DESC);

-- RLS Policies
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization campaigns" ON campaigns
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);
```

### Table: `campaign_recipients`
Campaign target list

```sql
CREATE TABLE campaign_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,

  recipient_type VARCHAR(20),  -- 'individual', 'group'
  recipient_id VARCHAR(255) NOT NULL,  -- Phone number or group ID
  recipient_name VARCHAR(255),

  customer_id UUID REFERENCES customers(id),  -- If linked to CRM

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_campaign_recipients_org ON campaign_recipients(organization_id);
CREATE INDEX idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);

-- RLS Policies
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization recipients" ON campaign_recipients
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);
```

### Table: `campaign_results`
Campaign send results

```sql
CREATE TABLE campaign_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,

  recipient_id VARCHAR(255) NOT NULL,
  recipient_type VARCHAR(20),

  status VARCHAR(20),  -- 'sent', 'failed'
  error_message TEXT,

  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_campaign_results_org ON campaign_results(organization_id);
CREATE INDEX idx_campaign_results_campaign ON campaign_results(campaign_id);
CREATE INDEX idx_campaign_results_status ON campaign_results(status);

-- RLS Policies
ALTER TABLE campaign_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization results" ON campaign_results
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);
```

---

## 📦 Module 5: Billing & Subscriptions

### Table: `subscription_plans`
Available subscription plans

```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name VARCHAR(50) NOT NULL,  -- 'Free', 'Starter', 'Professional', 'Enterprise'
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,

  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',

  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),

  -- Limits
  max_users INT NOT NULL,
  max_whatsapp_profiles INT NOT NULL,
  max_customers INT,
  max_tickets_per_month INT,
  max_messages_per_day INT,
  max_campaigns_per_month INT,
  storage_gb INT,

  -- Features
  features JSONB DEFAULT '{}'::jsonb,

  is_active BOOLEAN DEFAULT true,
  display_order INT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_plans_slug ON subscription_plans(slug);
CREATE INDEX idx_plans_active ON subscription_plans(is_active);

-- No RLS needed (public data)
```

### Table: `subscriptions`
Active subscriptions

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES subscription_plans(id),

  -- Stripe integration
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  stripe_subscription_item_id VARCHAR(255),

  -- Status
  status VARCHAR(50) DEFAULT 'active',  -- 'active', 'trialing', 'past_due', 'canceled', 'incomplete', 'unpaid'
  billing_cycle VARCHAR(20) DEFAULT 'monthly',  -- 'monthly', 'yearly'

  -- Dates
  trial_start_at TIMESTAMPTZ,
  trial_end_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Pricing
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- RLS Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization subscriptions" ON subscriptions
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);
```

### Table: `invoices`
Payment invoices

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id),

  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  stripe_invoice_id VARCHAR(255),

  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Status
  status VARCHAR(50) DEFAULT 'draft',  -- 'draft', 'open', 'paid', 'void', 'uncollectible'

  -- Dates
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  -- URLs
  invoice_pdf_url TEXT,
  hosted_invoice_url TEXT,

  -- Payment
  payment_method VARCHAR(50),
  payment_intent_id VARCHAR(255),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- RLS Policies
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization invoices" ON invoices
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);
```

### Table: `payment_methods`
Stored payment methods

```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  stripe_payment_method_id VARCHAR(255) UNIQUE,

  type VARCHAR(50),  -- 'card', 'bank_account'

  -- Card details
  card_brand VARCHAR(50),
  card_last4 VARCHAR(4),
  card_exp_month INT,
  card_exp_year INT,

  -- Bank details
  bank_name VARCHAR(255),
  bank_last4 VARCHAR(4),

  is_default BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payment_methods_org ON payment_methods(organization_id);
CREATE INDEX idx_payment_methods_stripe ON payment_methods(stripe_payment_method_id);

-- RLS Policies
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization payment methods" ON payment_methods
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);
```

### Table: `usage_records`
Usage tracking for metered billing

```sql
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id),

  metric_type VARCHAR(50) NOT NULL,  -- 'messages_sent', 'contacts_added', 'storage_used'
  quantity INT NOT NULL,

  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_usage_org ON usage_records(organization_id);
CREATE INDEX idx_usage_period ON usage_records(period_start, period_end);
CREATE INDEX idx_usage_metric ON usage_records(metric_type);

-- RLS Policies
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization usage" ON usage_records
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);
```

### Table: `billing_events`
Billing event log

```sql
CREATE TABLE billing_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id),

  event_type VARCHAR(100) NOT NULL,
  stripe_event_id VARCHAR(255),

  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_billing_events_org ON billing_events(organization_id);
CREATE INDEX idx_billing_events_type ON billing_events(event_type);
CREATE INDEX idx_billing_events_created ON billing_events(created_at DESC);

-- RLS Policies
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization billing events" ON billing_events
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);
```

---

## 🔗 Cross-Module Integration Table

### Table: `integration_mappings`
Links records across modules

```sql
CREATE TABLE integration_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  -- Source
  source_module VARCHAR(50),  -- 'whatsapp', 'crm', 'ticketing'
  source_record_id UUID,

  -- Target
  target_module VARCHAR(50),
  target_record_id UUID,

  -- Metadata
  mapping_type VARCHAR(50),  -- 'conversation_customer', 'conversation_ticket', 'customer_ticket'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_integration_org ON integration_mappings(organization_id);
CREATE INDEX idx_integration_source ON integration_mappings(source_module, source_record_id);
CREATE INDEX idx_integration_target ON integration_mappings(target_module, target_record_id);

-- RLS Policies
ALTER TABLE integration_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization integrations" ON integration_mappings
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);
```

---

## 🔧 Helper Functions

### Function: Set organization context for RLS

```sql
CREATE OR REPLACE FUNCTION set_organization_context(org_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_organization_id', org_id::TEXT, false);
END;
$$ LANGUAGE plpgsql;
```

### Function: Get organization from user

```sql
CREATE OR REPLACE FUNCTION get_user_organization(user_id UUID)
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = user_id;
$$ LANGUAGE sql STABLE;
```

---

## 📊 Table Summary

| Module | Table Name | Purpose | RLS Enabled |
|--------|------------|---------|-------------|
| 0 | organizations | Tenant records | ✅ |
| 0 | users | User profiles | ✅ |
| 0 | invitations | User invitations | ✅ |
| 1 | whatsapp_profiles | WhatsApp connections | ✅ |
| 1 | conversations | Chat threads | ✅ |
| 1 | messages | Individual messages | ✅ |
| 2 | customers | CRM contacts | ✅ |
| 2 | sales_stages | Pipeline stages | ✅ |
| 2 | customer_activities | Activity log | ✅ |
| 3 | tickets | Support tickets | ✅ |
| 3 | ticket_comments | Ticket comments | ✅ |
| 4 | campaigns | Bulk campaigns | ✅ |
| 4 | campaign_recipients | Target lists | ✅ |
| 4 | campaign_results | Send results | ✅ |
| 5 | subscription_plans | Available plans | ❌ |
| 5 | subscriptions | Active subscriptions | ✅ |
| 5 | invoices | Payment invoices | ✅ |
| 5 | payment_methods | Saved cards | ✅ |
| 5 | usage_records | Usage tracking | ✅ |
| 5 | billing_events | Billing log | ✅ |
| - | integration_mappings | Cross-module links | ✅ |

**Total Tables**: 21

---

## 🚀 Migration Strategy

### Phase 1: Foundation (Module 0)
```bash
supabase db push --file supabase/migrations/001_foundation.sql
```

### Phase 2: WhatsApp (Module 1)
```bash
supabase db push --file supabase/migrations/002_whatsapp.sql
```

### Phase 3: CRM (Module 2)
```bash
supabase db push --file supabase/migrations/003_crm.sql
```

### Phase 4: Ticketing (Module 3)
```bash
supabase db push --file supabase/migrations/004_ticketing.sql
```

### Phase 5: Campaigns (Module 4)
```bash
supabase db push --file supabase/migrations/005_campaigns.sql
```

### Phase 6: Billing (Module 5)
```bash
supabase db push --file supabase/migrations/006_billing.sql
```

---

**Last Updated**: 2025-10-02
**Total Tables**: 21
**Database**: Supabase (PostgreSQL 15)
