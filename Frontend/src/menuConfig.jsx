/**
 * Menu Configuration
 * Hierarchical navigation structure for all modules
 * Uses translation keys for bilingual support (EN/AR)
 */

const menuConfig = [
  {
    id: 'dashboard',
    labelKey: 'dashboard',
    label: 'Dashboard', // Fallback
    icon: 'LayoutDashboard',
    path: '/dashboard',
    roles: ['admin', 'manager', 'agent', 'member']
  },
  {
    id: 'crm',
    labelKey: 'crm',
    label: 'CRM',
    icon: 'Users',
    roles: ['admin', 'manager', 'agent'],
    requiresFeature: 'crm',
    children: [
      {
        id: 'contacts',
        labelKey: 'contacts',
        label: 'Contacts',
        icon: 'Contact',
        path: '/crm/contacts'
      },
      {
        id: 'companies',
        labelKey: 'companies',
        label: 'Companies',
        icon: 'Building',
        path: '/crm/companies'
      },
      {
        id: 'segmentation',
        labelKey: 'segmentation',
        label: 'Segmentation',
        icon: 'Target',
        path: '/crm/segmentation'
      },
      {
        id: 'deals',
        labelKey: 'deals',
        label: 'Deals',
        icon: 'TrendingUp',
        path: '/crm/deals'
      },
      {
        id: 'crm-settings',
        labelKey: 'crmSettings',
        label: 'CRM Settings',
        icon: 'Settings',
        path: '/crm/settings'
      }
    ]
  },
  {
    id: 'campaigns',
    labelKey: 'campaigns',
    label: 'Campaigns',
    icon: 'Megaphone',
    roles: ['admin', 'manager'],
    requiresFeature: 'bulk_sender',
    children: [
      {
        id: 'whatsapp-campaigns',
        labelKey: 'whatsappCampaigns',
        label: 'WhatsApp Campaigns',
        icon: 'MessageCircle',
        path: '/campaigns/whatsapp'
      },
      {
        id: 'email-campaigns',
        labelKey: 'emailCampaigns',
        label: 'Email Campaigns',
        icon: 'Mail',
        path: '/campaigns/email'
      },
      {
        id: 'sms-campaigns',
        labelKey: 'smsCampaigns',
        label: 'SMS Campaigns',
        icon: 'MessageSquare',
        path: '/campaigns/sms'
      },
      {
        id: 'campaign-templates',
        labelKey: 'templates',
        label: 'Templates',
        icon: 'FileText',
        path: '/campaigns/templates'
      },
      {
        id: 'campaign-settings',
        labelKey: 'campaignSettings',
        label: 'Campaign Settings',
        icon: 'Settings',
        path: '/campaigns/settings'
      }
    ]
  },
  {
    id: 'conversations',
    labelKey: 'conversations',
    label: 'Conversations',
    icon: 'MessagesSquare',
    roles: ['admin', 'manager', 'agent'],
    children: [
      {
        id: 'inbox',
        labelKey: 'inbox',
        label: 'Inbox',
        icon: 'Inbox',
        path: '/inbox',
        children: [
          {
            id: 'my-messages',
            labelKey: 'myMessages',
            label: 'My Messages',
            icon: 'MessageCircle',
            path: '/inbox/my-messages'
          },
          {
            id: 'unassigned',
            labelKey: 'unassigned',
            label: 'Unassigned',
            icon: 'UserX',
            path: '/inbox/unassigned'
          },
          {
            id: 'all-conversations',
            labelKey: 'allConversations',
            label: 'All Conversations',
            icon: 'MessagesSquare',
            path: '/inbox/all'
          }
        ]
      },
      {
        id: 'whatsapp-profiles',
        labelKey: 'whatsappProfiles',
        label: 'WhatsApp Profiles',
        icon: 'Smartphone',
        path: '/conversations/profiles'
      },
      {
        id: 'quick-replies',
        labelKey: 'quickReplies',
        label: 'Quick Replies',
        icon: 'Zap',
        path: '/conversations/quick-replies'
      },
      {
        id: 'conversation-settings',
        labelKey: 'conversationSettings',
        label: 'Conversation Settings',
        icon: 'Settings',
        path: '/conversations/settings'
      }
    ]
  },
  {
    id: 'tickets',
    labelKey: 'tickets',
    label: 'Tickets',
    icon: 'Ticket',
    roles: ['admin', 'manager', 'agent'],
    requiresFeature: 'ticketing',
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
    roles: ['admin', 'manager'],
    requiresFeature: 'analytics',
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
    roles: ['admin', 'manager'],
    children: [
      {
        id: 'team-members',
        labelKey: 'members',
        label: 'Members',
        icon: 'Users',
        path: '/team/members'
      },
      {
        id: 'roles-permissions',
        labelKey: 'rolesPermissions',
        label: 'Roles & Permissions',
        icon: 'Shield',
        path: '/team/roles'
      },
      {
        id: 'activity-logs',
        labelKey: 'activityLogs',
        label: 'Activity Logs',
        icon: 'Activity',
        path: '/team/activity'
      }
    ]
  },
  {
    id: 'settings',
    labelKey: 'settings',
    label: 'Settings',
    icon: 'Settings',
    roles: ['admin'],
    children: [
      {
        id: 'account-settings',
        labelKey: 'accountSettings',
        label: 'Account Settings',
        icon: 'UserCog',
        path: '/account-settings'
      },
      {
        id: 'integrations',
        labelKey: 'integrations',
        label: 'Integrations',
        icon: 'Plug',
        path: '/settings/integrations'
      },
      {
        id: 'notifications',
        labelKey: 'notificationSettings',
        label: 'Notifications',
        icon: 'Bell',
        path: '/settings/notifications'
      },
      {
        id: 'preferences',
        labelKey: 'preferences',
        label: 'Preferences',
        icon: 'Sliders',
        path: '/settings/preferences'
      },
      {
        id: 'security',
        labelKey: 'security',
        label: 'Security',
        icon: 'Lock',
        path: '/settings/security'
      }
    ]
  }
];

export default menuConfig;
