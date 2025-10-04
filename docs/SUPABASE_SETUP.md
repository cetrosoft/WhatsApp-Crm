# Supabase Setup Guide
## Cloud Database Configuration

Last Updated: 2025-10-02

---

## 🎯 Overview

This guide walks you through setting up Supabase (cloud PostgreSQL database) for the Omnichannel CRM SaaS platform.

**Estimated Time**: 15-20 minutes

---

## ✅ Prerequisites

- [ ] Email account (for Supabase signup)
- [ ] GitHub account (recommended for OAuth login)
- [ ] Node.js 18+ installed locally
- [ ] Code editor (VS Code recommended)

---

## 📝 Step 1: Create Supabase Account

### 1.1 Sign Up
1. Visit https://supabase.com
2. Click **"Start your project"**
3. Sign up with GitHub (recommended) or email

### 1.2 Verify Email
- Check your email for verification link
- Click to verify your account

---

## 🚀 Step 2: Create New Project

### 2.1 Create Organization (if first time)
1. Click **"New organization"**
2. Enter name: `Omnichannel CRM` (or your company name)
3. Click **"Create organization"**

### 2.2 Create Project
1. Click **"New project"**
2. Fill in details:
   ```
   Name: omnichannel-crm-dev
   Database Password: [Generate strong password - SAVE THIS!]
   Region: [Choose closest to your users]
   Pricing Plan: Free (for development)
   ```
3. Click **"Create new project"**
4. Wait 2-3 minutes for provisioning

### 2.3 Save Credentials
Once project is ready, go to **Settings → API**

**Copy and save these (you'll need them):**
```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon (public) key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx...
service_role (secret) key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx...
```

⚠️ **IMPORTANT**: Never commit `service_role` key to Git!

---

## 🗄️ Step 3: Create Database Schema

### Option A: Using SQL Editor (Recommended for beginners)

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy schema from `docs/DATABASE_SCHEMA.md`
4. Paste into editor
5. Click **"Run"** (or press Ctrl+Enter)

### Option B: Using Supabase CLI (Advanced)

#### 3.1 Install Supabase CLI
```bash
npm install -g supabase
```

#### 3.2 Login to Supabase
```bash
supabase login
```
This opens browser for authentication.

#### 3.3 Link to Your Project
```bash
cd whatsapp-bulk-sender
supabase link --project-ref xxxxxxxxxxxxx
```
Replace `xxxxxxxxxxxxx` with your project ref from URL.

#### 3.4 Create Migration Files
```bash
# Create migrations directory
mkdir -p supabase/migrations

# Create migration files (we'll add SQL later)
touch supabase/migrations/001_foundation.sql
touch supabase/migrations/002_whatsapp.sql
touch supabase/migrations/003_crm.sql
touch supabase/migrations/004_ticketing.sql
touch supabase/migrations/005_campaigns.sql
touch supabase/migrations/006_billing.sql
```

#### 3.5 Add SQL to Migration Files

Copy the relevant SQL from `docs/DATABASE_SCHEMA.md` to each migration file:

**001_foundation.sql** - Organizations, Users, Invitations
**002_whatsapp.sql** - WhatsApp Profiles, Conversations, Messages
**003_crm.sql** - Customers, Sales Stages, Activities
**004_ticketing.sql** - Tickets, Comments
**005_campaigns.sql** - Campaigns, Recipients, Results
**006_billing.sql** - Plans, Subscriptions, Invoices, etc.

#### 3.6 Push to Database
```bash
# Push all migrations
supabase db push

# Or push specific file
supabase db push --file supabase/migrations/001_foundation.sql
```

---

## 🔐 Step 4: Configure Row Level Security (RLS)

### 4.1 Enable RLS on All Tables

The SQL migrations already include RLS policies, but verify:

1. Go to **Database → Tables**
2. For each table, check that **RLS is enabled**
3. Click on table → **Policies** tab to view policies

### 4.2 Test RLS Policies

In SQL Editor, test that RLS works:

```sql
-- This should fail (no organization context set)
SELECT * FROM organizations;

-- Set organization context
SELECT set_config('app.current_organization_id', 'some-uuid', false);

-- This should work now
SELECT * FROM organizations;
```

---

## 🔑 Step 5: Configure Authentication

### 5.1 Enable Email Auth
1. Go to **Authentication → Providers**
2. **Email** should be enabled by default
3. Configure settings:
   ```
   ✅ Enable email confirmations
   ✅ Enable email change confirmations
   Confirm email template: [Customize if needed]
   ```

### 5.2 Configure Email Templates (Optional)
1. Go to **Authentication → Email Templates**
2. Customize:
   - Confirmation email
   - Magic link email
   - Password reset email

### 5.3 Set Site URL
1. Go to **Authentication → URL Configuration**
2. Set:
   ```
   Site URL: http://localhost:5173 (for development)
   Redirect URLs: http://localhost:5173/auth/callback
   ```

For production, add your production URLs.

---

## 📁 Step 6: Configure Storage

### 6.1 Create Storage Bucket for Media
1. Go to **Storage**
2. Click **"New bucket"**
3. Settings:
   ```
   Name: media
   Public bucket: ✅ (for public media access)
   File size limit: 50 MB
   Allowed MIME types: image/*, audio/*, video/*, application/pdf
   ```
4. Click **"Create bucket"**

### 6.2 Set Storage Policies

Create policies for the `media` bucket:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Allow public to view
CREATE POLICY "Public can view media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

-- Users can delete own org's files
CREATE POLICY "Users can delete own org files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = current_setting('app.current_organization_id', true)
);
```

### 6.3 Organize Storage by Organization

Structure files like: `media/{organization_id}/{file_name}`

This ensures tenant isolation at storage level.

---

## 🔄 Step 7: Enable Realtime

### 7.1 Enable Realtime for Tables
1. Go to **Database → Replication**
2. Enable replication for tables that need real-time updates:
   ```
   ✅ messages
   ✅ conversations
   ✅ tickets
   ✅ ticket_comments
   ✅ campaign_results
   ```

### 7.2 Configure Realtime Filters

In your application code:

```javascript
// Subscribe to organization's messages only
const channel = supabase
  .channel('messages')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `organization_id=eq.${organizationId}`
    },
    (payload) => {
      console.log('New message:', payload);
    }
  )
  .subscribe();
```

---

## 💻 Step 8: Local Development Setup

### 8.1 Create `.env` File

In project root:

```bash
touch .env
```

Add credentials (see `.env.example` for full template):

```env
# Supabase Configuration
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# App Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### 8.2 Install Supabase Client

```bash
# Backend
cd backend
npm install @supabase/supabase-js dotenv

# Frontend
cd ../frontend
npm install @supabase/supabase-js @supabase/auth-helpers-react
```

### 8.3 Initialize Supabase Client

**Backend** (`backend/config/supabase.js`):
```javascript
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Use service role for backend
);

export default supabase;
```

**Frontend** (`frontend/src/config/supabase.js`):
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY  // Use anon key for frontend
);

export default supabase;
```

### 8.4 Test Connection

Create `backend/test-supabase.js`:

```javascript
import supabase from './config/supabase.js';

async function testConnection() {
  try {
    // Test query
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);

    if (error) throw error;

    console.log('✅ Supabase connected successfully!');
    console.log('Data:', data);
  } catch (err) {
    console.error('❌ Supabase connection failed:', err.message);
  }
}

testConnection();
```

Run:
```bash
node test-supabase.js
```

---

## 🔍 Step 9: Database Management Tools

### 9.1 Supabase Dashboard (Web UI)
- **SQL Editor**: Run queries, create functions
- **Table Editor**: View/edit data visually
- **Database → Roles**: Manage database users
- **Database → Extensions**: Enable PostgreSQL extensions

### 9.2 pgAdmin (Desktop App)

1. Download: https://www.pgadmin.org/download/
2. Install and open
3. Right-click **Servers** → **Register** → **Server**
4. Get connection string from Supabase:
   - Go to **Settings → Database**
   - Copy connection string
5. Configure in pgAdmin:
   ```
   Name: Supabase WhatsApp SaaS
   Host: db.xxxxxxxxxxxxx.supabase.co
   Port: 5432
   Database: postgres
   Username: postgres
   Password: [your database password]
   ```

### 9.3 DBeaver (Alternative)

1. Download: https://dbeaver.io/download/
2. New Connection → PostgreSQL
3. Same settings as pgAdmin

---

## 📊 Step 10: Monitoring & Optimization

### 10.1 Enable Database Monitoring

1. Go to **Reports**
2. View:
   - Query Performance
   - Slow Queries
   - Database Size
   - API Usage

### 10.2 Create Indexes

Ensure indexes exist (already in schema, but verify):

```sql
-- Check existing indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### 10.3 Set Up Alerts

1. Go to **Settings → Integrations**
2. Add Slack/Discord webhook for alerts
3. Configure:
   - Database size > 80%
   - High query latency
   - Failed connections

---

## 🔒 Step 11: Security Checklist

- [ ] ✅ RLS enabled on all tables
- [ ] ✅ Service role key stored in `.env` (not in code)
- [ ] ✅ `.env` added to `.gitignore`
- [ ] ✅ Strong database password set
- [ ] ✅ Email confirmations enabled
- [ ] ✅ Storage policies configured
- [ ] ✅ Only necessary tables have realtime enabled
- [ ] ✅ API rate limiting enabled (Supabase does this automatically)

---

## 🚀 Step 12: Production Setup

When ready for production:

### 12.1 Upgrade Plan
- Free tier: Development only
- Pro tier ($25/mo): Production recommended
- Enterprise: High scale

### 12.2 Set Production URLs
1. Go to **Authentication → URL Configuration**
2. Update:
   ```
   Site URL: https://app.yourdomain.com
   Redirect URLs: https://app.yourdomain.com/auth/callback
   ```

### 12.3 Configure Custom Domain (Optional)
1. Go to **Settings → Custom Domains**
2. Add your domain
3. Update DNS records as instructed

### 12.4 Enable Point-in-Time Recovery
1. Go to **Settings → Database**
2. Enable **Point-in-time Recovery** (Pro plan)
3. Set retention period

### 12.5 Set Up Backups
1. Go to **Settings → Database**
2. Enable daily backups
3. Test restore process

---

## 🐛 Troubleshooting

### Issue: "relation does not exist"
**Solution**: Tables not created. Run migrations again.

### Issue: "permission denied for table"
**Solution**: RLS policies blocking access. Check policies or set organization context.

### Issue: "jwt expired"
**Solution**: Token expired. Refresh token in frontend.

### Issue: "too many connections"
**Solution**: Connection pooling issue. Use Supabase's built-in pooler.

### Issue: "storage bucket not found"
**Solution**: Create `media` bucket (Step 6).

---

## 📚 Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security
- **Realtime Guide**: https://supabase.com/docs/guides/realtime
- **Storage Guide**: https://supabase.com/docs/guides/storage

---

## ✅ Setup Complete!

You should now have:
- ✅ Supabase project created
- ✅ Database schema deployed
- ✅ RLS policies active
- ✅ Authentication configured
- ✅ Storage bucket ready
- ✅ Realtime enabled
- ✅ Local environment connected

**Next Steps**:
1. Review [MODULE_0_FOUNDATION.md](./modules/MODULE_0_FOUNDATION.md)
2. Start implementing authentication
3. Update [PROGRESS_TRACKER.md](./PROGRESS_TRACKER.md) as you build

---

**Last Updated**: 2025-10-02
**Supabase Version**: Cloud (Latest)
**PostgreSQL Version**: 15
