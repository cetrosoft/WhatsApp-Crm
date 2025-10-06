/**
 * CRM Settings Page
 * Centralized configuration for CRM module
 * Tags, Statuses, Lead Sources, Pipelines, etc.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tags, ListChecks, Target, Workflow } from 'lucide-react';
import CRMSettingsTab from '../components/AccountSettings/CRMSettingsTab';
import ContactStatusesTab from '../components/AccountSettings/ContactStatusesTab';
import LeadSourcesTab from '../components/AccountSettings/LeadSourcesTab';

const CRMSettings = () => {
  const { t, i18n } = useTranslation(['common', 'settings']);
  const isRTL = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState('tags');

  const tabs = [
    {
      id: 'tags',
      name: t('tags'),
      icon: Tags,
      component: CRMSettingsTab,
    },
    {
      id: 'statuses',
      name: t('contactStatuses'),
      icon: ListChecks,
      component: ContactStatusesTab,
    },
    {
      id: 'lead-sources',
      name: t('leadSources'),
      icon: Target,
      component: LeadSourcesTab,
    },
    {
      id: 'pipelines',
      name: t('salesPipelines'),
      icon: Workflow,
      component: () => <div className="p-6 text-gray-500">{t('salesPipelines')} - {t('comingSoon')}</div>,
    },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {t('crmSettingsTitle')}
        </h1>
        <p className="mt-2 text-gray-600">
          {t('crmSettingsDescription')}
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

export default CRMSettings;
