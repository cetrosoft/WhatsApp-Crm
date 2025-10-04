# Module 0: Foundation
## Core Platform - Authentication & Multi-Tenancy

Last Updated: 2025-10-02

---

## 📋 Overview

**Module 0** is the foundation of the entire SaaS platform. It provides:
- Multi-tenant architecture
- User authentication & authorization
- Organization management
- User invitation system
- Role-based permissions (RBAC)

**Duration**: 2 weeks
**Dependencies**: None (starting point)
**Provides**: `organization_id`, `user_id`, `permissions` for all other modules

---

## 🎯 Goals

By the end of this module, you will have:
- ✅ Users can register and create an organization
- ✅ Admin can invite team members via email
- ✅ Invited users can accept and join organization
- ✅ Role-based access control (admin, manager, agent, member)
- ✅ Complete tenant isolation (organizations can't see each other's data)
- ✅ Basic admin dashboard for managing users

---

## 🗄️ Database Tables

### Required Tables (from DATABASE_SCHEMA.md)
1. **organizations** - Tenant/company records
2. **users** - User profiles (extends Supabase auth.users)
3. **invitations** - User invitation tokens

### Migration File: `supabase/migrations/001_foundation.sql`

Copy the SQL for these 3 tables from `docs/DATABASE_SCHEMA.md` (Module 0 section)

---

## 🔧 Backend Implementation

### Step 1: Project Setup

#### 1.1 Initialize Backend
```bash
cd backend
npm init -y
```

#### 1.2 Install Dependencies
```bash
npm install express cors dotenv
npm install @supabase/supabase-js
npm install jsonwebtoken bcryptjs
npm install nodemailer  # For invitation emails
npm install express-validator  # For input validation
```

#### 1.3 Create Folder Structure
```bash
mkdir -p config middleware routes services utils
touch server.js
touch config/supabase.js
touch middleware/auth.js
touch middleware/tenant.js
touch middleware/permissions.js
touch routes/auth.routes.js
touch routes/user.routes.js
touch services/invitationService.js
touch utils/email.js
```

---

### Step 2: Configuration

#### 2.1 Environment Variables (`.env`)
```env
# Supabase
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# App
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### 2.2 Supabase Client (`config/supabase.js`)
```javascript
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Backend uses service role
);

export default supabase;
```

---

### Step 3: Middleware

#### 3.1 Auth Middleware (`middleware/auth.js`)
```javascript
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';

export async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*, organization:organizations(*)')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;
    req.organizationId = user.organization_id;

    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}
```

#### 3.2 Tenant Middleware (`middleware/tenant.js`)
```javascript
import supabase from '../config/supabase.js';

export async function setTenantContext(req, res, next) {
  if (!req.organizationId) {
    return res.status(400).json({ error: 'No organization context' });
  }

  try {
    // Set organization context for RLS
    await supabase.rpc('set_organization_context', {
      org_id: req.organizationId
    });

    next();
  } catch (err) {
    console.error('Tenant context error:', err);
    return res.status(500).json({ error: 'Failed to set organization context' });
  }
}
```

#### 3.3 Permissions Middleware (`middleware/permissions.js`)
```javascript
const PERMISSIONS = {
  admin: {
    users: 'write',
    settings: 'write'
  },
  manager: {
    users: 'read',
    settings: 'read'
  },
  agent: {
    users: 'none',
    settings: 'none'
  },
  member: {
    users: 'none',
    settings: 'none'
  }
};

export function requirePermission(resource, action = 'read') {
  return (req, res, next) => {
    const userRole = req.user.role;
    const permission = PERMISSIONS[userRole]?.[resource];

    if (!permission || permission === 'none') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    if (action === 'write' && permission !== 'write') {
      return res.status(403).json({ error: 'Write permission required' });
    }

    next();
  };
}
```

---

### Step 4: Authentication Routes

#### 4.1 Auth Routes (`routes/auth.routes.js`)
```javascript
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import supabase from '../config/supabase.js';

const router = express.Router();

// Register (creates organization + admin user)
router.post('/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('full_name').notEmpty(),
    body('organization_name').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, full_name, organization_name } = req.body;

      // Create Supabase Auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (authError) {
        return res.status(400).json({ error: authError.message });
      }

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: organization_name,
          slug: organization_name.toLowerCase().replace(/\s+/g, '-'),
          subscription_status: 'trialing'
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Create user profile
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          organization_id: org.id,
          email,
          full_name,
          role: 'admin'
        })
        .select()
        .single();

      if (userError) throw userError;

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, organizationId: org.id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          organization_id: org.id
        },
        organization: org
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// Login
router.post('/login',
  [
    body('email').isEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Login with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Get user profile
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*, organization:organizations(*)')
        .eq('id', authData.user.id)
        .single();

      if (userError || !user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id);

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, organizationId: user.organization_id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          organization_id: user.organization_id
        },
        organization: user.organization
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// Logout
router.post('/logout', async (req, res) => {
  // With JWT, logout is handled client-side (delete token)
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
```

---

### Step 5: User Management Routes

#### 5.1 User Routes (`routes/user.routes.js`)
```javascript
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { inviteUser } from '../services/invitationService.js';
import supabase from '../config/supabase.js';

const router = express.Router();

// Get all users in organization
router.get('/',
  authenticate,
  requirePermission('users', 'read'),
  async (req, res) => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', req.organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({ success: true, users });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Invite user
router.post('/invite',
  authenticate,
  requirePermission('users', 'write'),
  async (req, res) => {
    try {
      const { email, role, permissions } = req.body;

      const invitation = await inviteUser({
        email,
        role: role || 'member',
        permissions: permissions || {},
        organizationId: req.organizationId,
        invitedBy: req.userId
      });

      res.json({ success: true, invitation });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Update user role
router.patch('/:userId/role',
  authenticate,
  requirePermission('users', 'write'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      const { data: user, error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId)
        .eq('organization_id', req.organizationId)
        .select()
        .single();

      if (error) throw error;

      res.json({ success: true, user });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Delete user
router.delete('/:userId',
  authenticate,
  requirePermission('users', 'write'),
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Deactivate instead of delete
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', userId)
        .eq('organization_id', req.organizationId);

      if (error) throw error;

      res.json({ success: true, message: 'User deactivated' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
```

---

### Step 6: Invitation Service

#### 6.1 Invitation Service (`services/invitationService.js`)
```javascript
import crypto from 'crypto';
import supabase from '../config/supabase.js';
import { sendInvitationEmail } from '../utils/email.js';

export async function inviteUser({ email, role, permissions, organizationId, invitedBy }) {
  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  // Create invitation record
  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({
      organization_id: organizationId,
      email,
      role,
      permissions,
      token,
      expires_at: expiresAt.toISOString(),
      invited_by: invitedBy
    })
    .select()
    .single();

  if (error) throw error;

  // Send invitation email
  const inviteLink = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;
  await sendInvitationEmail(email, inviteLink);

  return invitation;
}

export async function acceptInvitation(token, userData) {
  // Get invitation
  const { data: invitation, error: inviteError } = await supabase
    .from('invitations')
    .select('*, organization:organizations(*)')
    .eq('token', token)
    .single();

  if (inviteError || !invitation) {
    throw new Error('Invalid invitation token');
  }

  if (new Date(invitation.expires_at) < new Date()) {
    throw new Error('Invitation expired');
  }

  if (invitation.accepted_at) {
    throw new Error('Invitation already accepted');
  }

  // Create Supabase Auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: invitation.email,
    password: userData.password,
    email_confirm: true
  });

  if (authError) throw authError;

  // Create user profile
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      id: authUser.user.id,
      organization_id: invitation.organization_id,
      email: invitation.email,
      full_name: userData.full_name,
      role: invitation.role,
      permissions: invitation.permissions,
      invited_by: invitation.invited_by,
      invitation_accepted_at: new Date().toISOString()
    })
    .select()
    .single();

  if (userError) throw userError;

  // Mark invitation as accepted
  await supabase
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitation.id);

  return user;
}
```

---

### Step 7: Email Service

#### 7.1 Email Utility (`utils/email.js`)
```javascript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendInvitationEmail(email, inviteLink) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'You\'ve been invited to join our team!',
    html: `
      <h2>Team Invitation</h2>
      <p>You've been invited to join a team on Omnichannel CRM Platform.</p>
      <p>Click the link below to accept the invitation:</p>
      <a href="${inviteLink}" style="padding: 10px 20px; background: #6264a7; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">
        Accept Invitation
      </a>
      <p>This link will expire in 7 days.</p>
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Invitation email sent to:', email);
  } catch (err) {
    console.error('Email send error:', err);
    throw new Error('Failed to send invitation email');
  }
}
```

---

### Step 8: Main Server

#### 8.1 Server Setup (`server.js`)
```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

---

## 🎨 Frontend Implementation

### Step 1: Setup

#### 1.1 Install Dependencies
```bash
cd frontend
npm install @supabase/supabase-js @supabase/auth-helpers-react
npm install react-router-dom
npm install react-hot-toast
```

#### 1.2 Create Supabase Client (`src/config/supabase.js`)
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default supabase;
```

---

### Step 2: Auth Context

#### 2.1 Auth Context (`src/contexts/AuthContext.jsx`)
```javascript
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const orgData = localStorage.getItem('organization');

    if (token && userData && orgData) {
      setUser(JSON.parse(userData));
      setOrganization(JSON.parse(orgData));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('organization', JSON.stringify(data.organization));
      setUser(data.user);
      setOrganization(data.organization);
    }

    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('organization');
    setUser(null);
    setOrganization(null);
  };

  const value = {
    user,
    organization,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
```

---

### Step 3: Pages

#### 3.1 Register Page (`src/pages/Register.jsx`)
```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    organization_name: ''
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Account created successfully!');
        navigate('/login');
      } else {
        toast.error(data.error || 'Registration failed');
      }
    } catch (err) {
      toast.error('An error occurred');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6">Create Account</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            className="w-full mb-4 p-2 border rounded"
            required
          />

          <input
            type="text"
            placeholder="Organization Name"
            value={formData.organization_name}
            onChange={(e) => setFormData({...formData, organization_name: e.target.value})}
            className="w-full mb-4 p-2 border rounded"
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full mb-4 p-2 border rounded"
            required
          />

          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full mb-6 p-2 border rounded"
            required
            minLength="8"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Create Account
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
```

*(Similar pages needed for Login, AcceptInvitation - follow same pattern)*

---

## ✅ Testing Checklist

### Backend Tests
- [ ] User can register (creates org + admin user)
- [ ] User can login (returns JWT + user + org)
- [ ] Admin can invite users (generates token, sends email)
- [ ] Invited user can accept invitation
- [ ] Admin can list users in organization
- [ ] Admin can update user roles
- [ ] RLS policies enforce tenant isolation
- [ ] Permission middleware blocks unauthorized access

### Frontend Tests
- [ ] Register page creates account successfully
- [ ] Login page authenticates user
- [ ] Protected routes redirect to login
- [ ] Accept invitation page works
- [ ] User management page lists users
- [ ] Invite user modal sends invitations

---

## 🚀 Next Steps

After completing Module 0:
1. Update `PROGRESS_TRACKER.md` with completion status
2. Test multi-tenant isolation (create 2 orgs, verify isolation)
3. Proceed to Module 1: WhatsApp Messaging

---

**Last Updated**: 2025-10-02
**Status**: Not Started
**Next Module**: Module 1 - WhatsApp
