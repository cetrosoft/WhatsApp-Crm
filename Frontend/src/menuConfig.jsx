/**
 * Menu Configuration
 * Hierarchical navigation structure for all modules
 * Uses translation keys for bilingual support (EN/AR)
 *
 * NOTE: Menu visibility is controlled by permissions from database, not hardcoded roles
 * - requiredPermission: Permission string to check (e.g., 'contacts.view')
 * - isActive: Boolean to enable/disable menu item (default: true)
 * - requiresFeature: Package feature requirement (optional)
 */

const menuConfig = [
  {
    id: 'dashboard',
    labelKey: 'dashboard',
    label: 'Dashboard', // Fallback
    icon: 'LayoutDashboard',
    path: '/dashboard',
    requiredPermission: null, // Public for all authenticated users
    isActive: true
  },
  {
    id: 'crm',
    labelKey: 'crm',
    label: 'CRM',
    icon: 'Users',
    requiredPermission: 'contacts.view', // At least view contacts
    requiresFeature: 'crm',
    isActive: true,
    children: [
      {
        id: 'contacts',
        labelKey: 'contacts',
        label: 'Contacts',
        icon: 'Contact',
        path: '/crm/contacts',
        requiredPermission: 'contacts.view'
      },
      {
        id: 'companies',
        labelKey: 'companies',
        label: 'Companies',
        icon: 'Building',
        path: '/crm/companies',
        requiredPermission: 'companies.view'
      },
      {
        id: 'segmentation',
        labelKey: 'segmentation',
        label: 'Segmentation',
        icon: 'Target',
        path: '/crm/segmentation',
        requiredPermission: 'segments.view'
      },
      {
        id: 'deals',
        labelKey: 'deals',
        label: 'Deals',
        icon: 'TrendingUp',
        path: '/crm/deals',
        requiredPermission: 'deals.view'
      },
      {
        id: 'pipelines',
        labelKey: 'pipelines',
        label: 'Pipelines',
        icon: 'GitBranch',
        path: '/crm/pipelines',
        requiredPermission: 'pipelines.view'
      },
      {
        id: 'crm-settings',
        labelKey: 'crmSettings',
        label: 'CRM Settings',
        icon: 'Settings',
        path: '/crm/settings',
        requiredPermission: 'statuses.view' // Access to CRM settings
      }
    ]
  },
  {
    id: 'campaigns',
    labelKey: 'campaigns',
    label: 'Campaigns',
    icon: 'Megaphone',
    requiredPermission: 'campaigns.view',
    requiresFeature: 'bulk_sender',
    isActive: true,
    children: [
      {
        id: 'whatsapp-campaigns',
        labelKey: 'whatsappCampaigns',
        label: 'WhatsApp Campaigns',
        icon: 'MessageCircle',
        path: '/campaigns/whatsapp',
        requiredPermission: 'campaigns.view'
      },
      {
        id: 'email-campaigns',
        labelKey: 'emailCampaigns',
        label: 'Email Campaigns',
        icon: 'Mail',
        path: '/campaigns/email',
        requiredPermission: 'campaigns.view'
      },
      {
        id: 'sms-campaigns',
        labelKey: 'smsCampaigns',
        label: 'SMS Campaigns',
        icon: 'MessageSquare',
        path: '/campaigns/sms',
        requiredPermission: 'campaigns.view'
      },
      {
        id: 'campaign-templates',
        labelKey: 'templates',
        label: 'Templates',
        icon: 'FileText',
        path: '/campaigns/templates',
        requiredPermission: 'campaigns.view'
      },
      {
        id: 'campaign-settings',
        labelKey: 'campaignSettings',
        label: 'Campaign Settings',
        icon: 'Settings',
        path: '/campaigns/settings',
        requiredPermission: 'campaigns.create'
      }
    ]
  },
  {
    id: 'conversations',
    labelKey: 'conversations',
    label: 'Conversations',
    icon: 'MessagesSquare',
    requiredPermission: 'conversations.view',
    isActive: true,
    children: [
      {
        id: 'inbox',
        labelKey: 'inbox',
        label: 'Inbox',
        icon: 'Inbox',
        path: '/inbox',
        requiredPermission: 'conversations.view',
        children: [
          {
            id: 'my-messages',
            labelKey: 'myMessages',
            label: 'My Messages',
            icon: 'MessageCircle',
            path: '/inbox/my-messages',
            requiredPermission: 'conversations.view'
          },
          {
            id: 'unassigned',
            labelKey: 'unassigned',
            label: 'Unassigned',
            icon: 'UserX',
            path: '/inbox/unassigned',
            requiredPermission: 'conversations.view'
          },
          {
            id: 'all-conversations',
            labelKey: 'allConversations',
            label: 'All Conversations',
            icon: 'MessagesSquare',
            path: '/inbox/all',
            requiredPermission: 'conversations.view'
          }
        ]
      },
      {
        id: 'whatsapp-profiles',
        labelKey: 'whatsappProfiles',
        label: 'WhatsApp Profiles',
        icon: 'Smartphone',
        path: '/conversations/profiles',
        requiredPermission: 'conversations.manage'
      },
      {
        id: 'quick-replies',
        labelKey: 'quickReplies',
        label: 'Quick Replies',
        icon: 'Zap',
        path: '/conversations/quick-replies',
        requiredPermission: 'conversations.view'
      },
      {
        id: 'conversation-settings',
        labelKey: 'conversationSettings',
        label: 'Conversation Settings',
        icon: 'Settings',
        path: '/conversations/settings',
        requiredPermission: 'conversations.manage'
      }
    ]
  },
  {
    id: 'tickets',
    labelKey: 'tickets',
    label: 'Tickets',
    icon: 'Ticket',
    requiredPermission: 'tickets.view',
    requiresFeature: 'ticketing',
    isActive: false, // Not implemented yet
    children: [
      {
        id: 'all-tickets',
        labelKey: 'allTickets',
        label: 'All Tickets',
        icon: 'ListChecks',
        path: '/tickets/all'
      },
      {
        id: 'my-tickets',
        labelKey: 'myTickets',
        label: 'My Tickets',
        icon: 'UserCircle',
        path: '/tickets/my-tickets'
      },
      {
        id: 'urgent-tickets',
        labelKey: 'urgentTickets',
        label: 'Urgent',
        icon: 'AlertCircle',
        path: '/tickets/urgent'
      },
      {
        id: 'ticket-reports',
        labelKey: 'ticketReports',
        label: 'Reports',
        icon: 'BarChart3',
        path: '/tickets/reports'
      },
      {
        id: 'ticket-settings',
        labelKey: 'ticketSettings',
        label: 'Ticket Settings',
        icon: 'Settings',
        path: '/tickets/settings'
      }
    ]
  },
  {
    id: 'analytics',
    labelKey: 'analytics',
    label: 'Analytics',
    icon: 'BarChart3',
    requiredPermission: 'analytics.view',
    requiresFeature: 'analytics',
    isActive: false, // Not implemented yet
    children: [
      {
        id: 'analytics-overview',
        labelKey: 'overview',
        label: 'Overview',
        icon: 'PieChart',
        path: '/analytics/overview'
      },
      {
        id: 'message-analytics',
        labelKey: 'messageAnalytics',
        label: 'Message Analytics',
        icon: 'MessageSquare',
        path: '/analytics/messages'
      },
      {
        id: 'campaign-performance',
        labelKey: 'campaignPerformance',
        label: 'Campaign Performance',
        icon: 'TrendingUp',
        path: '/analytics/campaigns'
      },
      {
        id: 'customer-insights',
        labelKey: 'customerInsights',
        label: 'Customer Insights',
        icon: 'Users',
        path: '/analytics/customers'
      },
      {
        id: 'custom-reports',
        labelKey: 'customReports',
        label: 'Custom Reports',
        icon: 'FileText',
        path: '/analytics/reports'
      }
    ]
  },
  {
    id: 'team',
    labelKey: 'team',
    label: 'Team',
    icon: 'UsersRound',
    requiredPermission: 'users.view',
    isActive: true,
    children: [
      {
        id: 'team-members',
        labelKey: 'members',
        label: 'Members',
        icon: 'Users',
        path: '/team/members',
        requiredPermission: 'users.view'
      },
      {
        id: 'roles-permissions',
        labelKey: 'rolesPermissions',
        label: 'Roles & Permissions',
        icon: 'Shield',
        path: '/team/roles',
        requiredPermission: 'permissions.manage'
      },
      {
        id: 'activity-logs',
        labelKey: 'activityLogs',
        label: 'Activity Logs',
        icon: 'Activity',
        path: '/team/activity',
        requiredPermission: 'users.view',
        isActive: false // Not implemented yet
      }
    ]
  },
  {
    id: 'settings',
    labelKey: 'settings',
    label: 'Settings',
    icon: 'Settings',
    requiredPermission: 'organization.edit',
    isActive: true,
    children: [
      {
        id: 'account-settings',
        labelKey: 'accountSettings',
        label: 'Account Settings',
        icon: 'UserCog',
        path: '/account-settings',
        requiredPermission: 'organization.edit'
      },
      {
        id: 'integrations',
        labelKey: 'integrations',
        label: 'Integrations',
        icon: 'Plug',
        path: '/settings/integrations',
        requiredPermission: 'organization.edit',
        isActive: false // Not implemented yet
      },
      {
        id: 'notifications',
        labelKey: 'notificationSettings',
        label: 'Notifications',
        icon: 'Bell',
        path: '/settings/notifications',
        requiredPermission: 'organization.edit',
        isActive: false // Not implemented yet
      },
      {
        id: 'preferences',
        labelKey: 'preferences',
        label: 'Preferences',
        icon: 'Sliders',
        path: '/settings/preferences',
        requiredPermission: 'organization.view',
        isActive: false // Not implemented yet
      },
      {
        id: 'security',
        labelKey: 'security',
        label: 'Security',
        icon: 'Lock',
        path: '/settings/security',
        requiredPermission: 'organization.edit',
        isActive: false // Not implemented yet
      }
    ]
  }
];

export default menuConfig;
