/**
 * Account Settings Page
 * Unified portal for organization, team, subscription, and preferences
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Users, CreditCard, Settings as SettingsIcon } from 'lucide-react';

// Tab Components (will create these)
import OrganizationTab from '../components/AccountSettings/OrganizationTab';
import TeamTab from '../components/AccountSettings/TeamTab';
import SubscriptionTab from '../components/AccountSettings/SubscriptionTab';
import PreferencesTab from '../components/AccountSettings/PreferencesTab';

const AccountSettings = () => {
  const { t } = useTranslation(['common', 'settings']);
  const [activeTab, setActiveTab] = useState('organization');

  const tabs = [
    {
      id: 'organization',
      name: t('settings:organization'),
      icon: Building2,
      component: OrganizationTab,
    },
    {
      id: 'team',
      name: t('settings:team'),
      icon: Users,
      component: TeamTab,
    },
    {
      id: 'subscription',
      name: t('settings:subscription'),
      icon: CreditCard,
      component: SubscriptionTab,
    },
    {
      id: 'preferences',
      name: t('settings:preferences'),
      icon: SettingsIcon,
      component: PreferencesTab,
    },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {t('settings:accountSettings')}
        </h1>
        <p className="mt-2 text-gray-600">
          {t('settings:manageYourAccount')}
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors
                    ${
                      isActive
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {ActiveComponent && <ActiveComponent />}
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
