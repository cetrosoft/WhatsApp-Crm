/**
 * Permission Constants
 * Defines all available permissions and default role mappings
 */

// ==============================================
// Permission Definitions
// ==============================================

export const PERMISSIONS = {
  // CRM - Contacts
  CONTACTS_VIEW: 'contacts.view',
  CONTACTS_CREATE: 'contacts.create',
  CONTACTS_EDIT: 'contacts.edit',
  CONTACTS_DELETE: 'contacts.delete',
  CONTACTS_EXPORT: 'contacts.export',

  // CRM - Companies
  COMPANIES_VIEW: 'companies.view',
  COMPANIES_CREATE: 'companies.create',
  COMPANIES_EDIT: 'companies.edit',
  COMPANIES_DELETE: 'companies.delete',
  COMPANIES_EXPORT: 'companies.export',

  // CRM - Segments
  SEGMENTS_VIEW: 'segments.view',
  SEGMENTS_CREATE: 'segments.create',
  SEGMENTS_EDIT: 'segments.edit',
  SEGMENTS_DELETE: 'segments.delete',

  // CRM - Deals
  DEALS_VIEW: 'deals.view',
  DEALS_CREATE: 'deals.create',
  DEALS_EDIT: 'deals.edit',
  DEALS_DELETE: 'deals.delete',
  DEALS_EXPORT: 'deals.export',

  // Campaigns
  CAMPAIGNS_VIEW: 'campaigns.view',
  CAMPAIGNS_CREATE: 'campaigns.create',
  CAMPAIGNS_EDIT: 'campaigns.edit',
  CAMPAIGNS_DELETE: 'campaigns.delete',
  CAMPAIGNS_SEND: 'campaigns.send',

  // Conversations
  CONVERSATIONS_VIEW: 'conversations.view',
  CONVERSATIONS_REPLY: 'conversations.reply',
  CONVERSATIONS_ASSIGN: 'conversations.assign',
  CONVERSATIONS_MANAGE: 'conversations.manage',

  // Tickets
  TICKETS_VIEW: 'tickets.view',
  TICKETS_CREATE: 'tickets.create',
  TICKETS_EDIT: 'tickets.edit',
  TICKETS_DELETE: 'tickets.delete',
  TICKETS_ASSIGN: 'tickets.assign',

  // Analytics
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',

  // Settings - Tags
  TAGS_VIEW: 'tags.view',
  TAGS_CREATE: 'tags.create',
  TAGS_EDIT: 'tags.edit',
  TAGS_DELETE: 'tags.delete',

  // Settings - Contact Statuses
  STATUSES_VIEW: 'statuses.view',
  STATUSES_CREATE: 'statuses.create',
  STATUSES_EDIT: 'statuses.edit',
  STATUSES_DELETE: 'statuses.delete',

  // Settings - Lead Sources
  LEAD_SOURCES_VIEW: 'lead_sources.view',
  LEAD_SOURCES_CREATE: 'lead_sources.create',
  LEAD_SOURCES_EDIT: 'lead_sources.edit',
  LEAD_SOURCES_DELETE: 'lead_sources.delete',

  // Team Management
  USERS_VIEW: 'users.view',
  USERS_INVITE: 'users.invite',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  PERMISSIONS_MANAGE: 'permissions.manage',

  // Organization
  ORGANIZATION_VIEW: 'organization.view',
  ORGANIZATION_EDIT: 'organization.edit',
  ORGANIZATION_DELETE: 'organization.delete',
};

// ==============================================
// Role-Based Default Permissions
// ==============================================

export const ROLE_PERMISSIONS = {
  admin: [
    // CRM - Full access
    PERMISSIONS.CONTACTS_VIEW,
    PERMISSIONS.CONTACTS_CREATE,
    PERMISSIONS.CONTACTS_EDIT,
    PERMISSIONS.CONTACTS_DELETE,
    PERMISSIONS.CONTACTS_EXPORT,

    PERMISSIONS.COMPANIES_VIEW,
    PERMISSIONS.COMPANIES_CREATE,
    PERMISSIONS.COMPANIES_EDIT,
    PERMISSIONS.COMPANIES_DELETE,
    PERMISSIONS.COMPANIES_EXPORT,

    PERMISSIONS.SEGMENTS_VIEW,
    PERMISSIONS.SEGMENTS_CREATE,
    PERMISSIONS.SEGMENTS_EDIT,
    PERMISSIONS.SEGMENTS_DELETE,

    PERMISSIONS.DEALS_VIEW,
    PERMISSIONS.DEALS_CREATE,
    PERMISSIONS.DEALS_EDIT,
    PERMISSIONS.DEALS_DELETE,
    PERMISSIONS.DEALS_EXPORT,

    // Campaigns - Full access
    PERMISSIONS.CAMPAIGNS_VIEW,
    PERMISSIONS.CAMPAIGNS_CREATE,
    PERMISSIONS.CAMPAIGNS_EDIT,
    PERMISSIONS.CAMPAIGNS_DELETE,
    PERMISSIONS.CAMPAIGNS_SEND,

    // Conversations - Full access
    PERMISSIONS.CONVERSATIONS_VIEW,
    PERMISSIONS.CONVERSATIONS_REPLY,
    PERMISSIONS.CONVERSATIONS_ASSIGN,
    PERMISSIONS.CONVERSATIONS_MANAGE,

    // Tickets - Full access
    PERMISSIONS.TICKETS_VIEW,
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_EDIT,
    PERMISSIONS.TICKETS_DELETE,
    PERMISSIONS.TICKETS_ASSIGN,

    // Analytics - Full access
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,

    // Settings - Full access
    PERMISSIONS.TAGS_VIEW,
    PERMISSIONS.TAGS_CREATE,
    PERMISSIONS.TAGS_EDIT,
    PERMISSIONS.TAGS_DELETE,

    PERMISSIONS.STATUSES_VIEW,
    PERMISSIONS.STATUSES_CREATE,
    PERMISSIONS.STATUSES_EDIT,
    PERMISSIONS.STATUSES_DELETE,

    PERMISSIONS.LEAD_SOURCES_VIEW,
    PERMISSIONS.LEAD_SOURCES_CREATE,
    PERMISSIONS.LEAD_SOURCES_EDIT,
    PERMISSIONS.LEAD_SOURCES_DELETE,

    // Team - Full access
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_INVITE,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.PERMISSIONS_MANAGE,

    // Organization - Full access
    PERMISSIONS.ORGANIZATION_VIEW,
    PERMISSIONS.ORGANIZATION_EDIT,
    PERMISSIONS.ORGANIZATION_DELETE,
  ],

  manager: [
    // CRM - Full access
    PERMISSIONS.CONTACTS_VIEW,
    PERMISSIONS.CONTACTS_CREATE,
    PERMISSIONS.CONTACTS_EDIT,
    PERMISSIONS.CONTACTS_DELETE,
    PERMISSIONS.CONTACTS_EXPORT,

    PERMISSIONS.COMPANIES_VIEW,
    PERMISSIONS.COMPANIES_CREATE,
    PERMISSIONS.COMPANIES_EDIT,
    PERMISSIONS.COMPANIES_DELETE,
    PERMISSIONS.COMPANIES_EXPORT,

    PERMISSIONS.SEGMENTS_VIEW,
    PERMISSIONS.SEGMENTS_CREATE,
    PERMISSIONS.SEGMENTS_EDIT,
    PERMISSIONS.SEGMENTS_DELETE,

    PERMISSIONS.DEALS_VIEW,
    PERMISSIONS.DEALS_CREATE,
    PERMISSIONS.DEALS_EDIT,
    PERMISSIONS.DEALS_DELETE,
    PERMISSIONS.DEALS_EXPORT,

    // Campaigns - Full access
    PERMISSIONS.CAMPAIGNS_VIEW,
    PERMISSIONS.CAMPAIGNS_CREATE,
    PERMISSIONS.CAMPAIGNS_EDIT,
    PERMISSIONS.CAMPAIGNS_DELETE,
    PERMISSIONS.CAMPAIGNS_SEND,

    // Conversations - Full access
    PERMISSIONS.CONVERSATIONS_VIEW,
    PERMISSIONS.CONVERSATIONS_REPLY,
    PERMISSIONS.CONVERSATIONS_ASSIGN,
    PERMISSIONS.CONVERSATIONS_MANAGE,

    // Tickets - Full access
    PERMISSIONS.TICKETS_VIEW,
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_EDIT,
    PERMISSIONS.TICKETS_ASSIGN,

    // Analytics - View and export
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,

    // Settings - View only (cannot create/edit/delete)
    PERMISSIONS.TAGS_VIEW,
    PERMISSIONS.STATUSES_VIEW,
    PERMISSIONS.LEAD_SOURCES_VIEW,

    // Team - View and invite only
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_INVITE,

    // Organization - View only
    PERMISSIONS.ORGANIZATION_VIEW,
  ],

  agent: [
    // CRM - View, create, edit only (no delete)
    PERMISSIONS.CONTACTS_VIEW,
    PERMISSIONS.CONTACTS_CREATE,
    PERMISSIONS.CONTACTS_EDIT,

    PERMISSIONS.COMPANIES_VIEW,
    PERMISSIONS.COMPANIES_CREATE,
    PERMISSIONS.COMPANIES_EDIT,

    PERMISSIONS.SEGMENTS_VIEW,

    PERMISSIONS.DEALS_VIEW,
    PERMISSIONS.DEALS_CREATE,
    PERMISSIONS.DEALS_EDIT,

    // Conversations - View and reply only
    PERMISSIONS.CONVERSATIONS_VIEW,
    PERMISSIONS.CONVERSATIONS_REPLY,

    // Tickets - View, create, edit
    PERMISSIONS.TICKETS_VIEW,
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_EDIT,

    // Settings - View only
    PERMISSIONS.TAGS_VIEW,
    PERMISSIONS.STATUSES_VIEW,
    PERMISSIONS.LEAD_SOURCES_VIEW,

    // Team - View only
    PERMISSIONS.USERS_VIEW,

    // Organization - View only
    PERMISSIONS.ORGANIZATION_VIEW,
  ],

  member: [
    // View-only access
    PERMISSIONS.CONTACTS_VIEW,
    PERMISSIONS.COMPANIES_VIEW,
    PERMISSIONS.SEGMENTS_VIEW,
    PERMISSIONS.DEALS_VIEW,
    PERMISSIONS.CONVERSATIONS_VIEW,
    PERMISSIONS.TICKETS_VIEW,
    PERMISSIONS.TAGS_VIEW,
    PERMISSIONS.STATUSES_VIEW,
    PERMISSIONS.LEAD_SOURCES_VIEW,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.ORGANIZATION_VIEW,
  ],
};

// ==============================================
// Permission Groups (for UI organization)
// ==============================================

export const PERMISSION_GROUPS = {
  crm: {
    label: 'CRM',
    permissions: [
      { key: PERMISSIONS.CONTACTS_VIEW, label: 'View Contacts' },
      { key: PERMISSIONS.CONTACTS_CREATE, label: 'Create Contacts' },
      { key: PERMISSIONS.CONTACTS_EDIT, label: 'Edit Contacts' },
      { key: PERMISSIONS.CONTACTS_DELETE, label: 'Delete Contacts' },
      { key: PERMISSIONS.CONTACTS_EXPORT, label: 'Export Contacts' },

      { key: PERMISSIONS.COMPANIES_VIEW, label: 'View Companies' },
      { key: PERMISSIONS.COMPANIES_CREATE, label: 'Create Companies' },
      { key: PERMISSIONS.COMPANIES_EDIT, label: 'Edit Companies' },
      { key: PERMISSIONS.COMPANIES_DELETE, label: 'Delete Companies' },
      { key: PERMISSIONS.COMPANIES_EXPORT, label: 'Export Companies' },

      { key: PERMISSIONS.SEGMENTS_VIEW, label: 'View Segments' },
      { key: PERMISSIONS.SEGMENTS_CREATE, label: 'Create Segments' },
      { key: PERMISSIONS.SEGMENTS_EDIT, label: 'Edit Segments' },
      { key: PERMISSIONS.SEGMENTS_DELETE, label: 'Delete Segments' },

      { key: PERMISSIONS.DEALS_VIEW, label: 'View Deals' },
      { key: PERMISSIONS.DEALS_CREATE, label: 'Create Deals' },
      { key: PERMISSIONS.DEALS_EDIT, label: 'Edit Deals' },
      { key: PERMISSIONS.DEALS_DELETE, label: 'Delete Deals' },
      { key: PERMISSIONS.DEALS_EXPORT, label: 'Export Deals' },
    ],
  },

  campaigns: {
    label: 'Campaigns',
    permissions: [
      { key: PERMISSIONS.CAMPAIGNS_VIEW, label: 'View Campaigns' },
      { key: PERMISSIONS.CAMPAIGNS_CREATE, label: 'Create Campaigns' },
      { key: PERMISSIONS.CAMPAIGNS_EDIT, label: 'Edit Campaigns' },
      { key: PERMISSIONS.CAMPAIGNS_DELETE, label: 'Delete Campaigns' },
      { key: PERMISSIONS.CAMPAIGNS_SEND, label: 'Send Campaigns' },
    ],
  },

  conversations: {
    label: 'Conversations',
    permissions: [
      { key: PERMISSIONS.CONVERSATIONS_VIEW, label: 'View Conversations' },
      { key: PERMISSIONS.CONVERSATIONS_REPLY, label: 'Reply to Conversations' },
      { key: PERMISSIONS.CONVERSATIONS_ASSIGN, label: 'Assign Conversations' },
      { key: PERMISSIONS.CONVERSATIONS_MANAGE, label: 'Manage Conversation Settings' },
    ],
  },

  tickets: {
    label: 'Tickets',
    permissions: [
      { key: PERMISSIONS.TICKETS_VIEW, label: 'View Tickets' },
      { key: PERMISSIONS.TICKETS_CREATE, label: 'Create Tickets' },
      { key: PERMISSIONS.TICKETS_EDIT, label: 'Edit Tickets' },
      { key: PERMISSIONS.TICKETS_DELETE, label: 'Delete Tickets' },
      { key: PERMISSIONS.TICKETS_ASSIGN, label: 'Assign Tickets' },
    ],
  },

  analytics: {
    label: 'Analytics',
    permissions: [
      { key: PERMISSIONS.ANALYTICS_VIEW, label: 'View Analytics' },
      { key: PERMISSIONS.ANALYTICS_EXPORT, label: 'Export Analytics' },
    ],
  },

  settings: {
    label: 'Settings',
    permissions: [
      { key: PERMISSIONS.TAGS_VIEW, label: 'View Tags' },
      { key: PERMISSIONS.TAGS_CREATE, label: 'Create Tags' },
      { key: PERMISSIONS.TAGS_EDIT, label: 'Edit Tags' },
      { key: PERMISSIONS.TAGS_DELETE, label: 'Delete Tags' },

      { key: PERMISSIONS.STATUSES_VIEW, label: 'View Contact Statuses' },
      { key: PERMISSIONS.STATUSES_CREATE, label: 'Create Contact Statuses' },
      { key: PERMISSIONS.STATUSES_EDIT, label: 'Edit Contact Statuses' },
      { key: PERMISSIONS.STATUSES_DELETE, label: 'Delete Contact Statuses' },

      { key: PERMISSIONS.LEAD_SOURCES_VIEW, label: 'View Lead Sources' },
      { key: PERMISSIONS.LEAD_SOURCES_CREATE, label: 'Create Lead Sources' },
      { key: PERMISSIONS.LEAD_SOURCES_EDIT, label: 'Edit Lead Sources' },
      { key: PERMISSIONS.LEAD_SOURCES_DELETE, label: 'Delete Lead Sources' },
    ],
  },

  team: {
    label: 'Team Management',
    permissions: [
      { key: PERMISSIONS.USERS_VIEW, label: 'View Users' },
      { key: PERMISSIONS.USERS_INVITE, label: 'Invite Users' },
      { key: PERMISSIONS.USERS_EDIT, label: 'Edit Users' },
      { key: PERMISSIONS.USERS_DELETE, label: 'Delete Users' },
      { key: PERMISSIONS.PERMISSIONS_MANAGE, label: 'Manage Permissions' },
    ],
  },

  organization: {
    label: 'Organization',
    permissions: [
      { key: PERMISSIONS.ORGANIZATION_VIEW, label: 'View Organization' },
      { key: PERMISSIONS.ORGANIZATION_EDIT, label: 'Edit Organization' },
      { key: PERMISSIONS.ORGANIZATION_DELETE, label: 'Delete Organization' },
    ],
  },
};

export default {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  PERMISSION_GROUPS,
};
