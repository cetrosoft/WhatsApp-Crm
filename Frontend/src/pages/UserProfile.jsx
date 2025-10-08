/**
 * User Profile Page
 * Personal settings for logged-in user (self-service)
 * Route: /profile
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Tab Components
import ProfileInfoTab from '../components/UserProfile/ProfileInfoTab';
import SecurityTab from '../components/UserProfile/SecurityTab';

const UserProfile = () => {
  const { t } = useTranslation(['common', 'settings']);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    {
      id: 'profile',
      name: t('common:myProfile'),
      icon: User,
      component: ProfileInfoTab,
    },
    {
      id: 'security',
      name: t('common:security'),
      icon: Lock,
      component: SecurityTab,
    },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  if (!user) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {t('common:myProfile')}
        </h1>
        <p className="mt-2 text-gray-600">
          {t('common:manageYourPersonalSettings')}
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
          {ActiveComponent && <ActiveComponent user={user} />}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
