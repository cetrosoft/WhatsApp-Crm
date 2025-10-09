/**
 * Preferences Tab
 * Manage account preferences (language, timezone, notifications)
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Clock, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import LanguageSwitcher from '../LanguageSwitcher';

const PreferencesTab = () => {
  const { t, i18n } = useTranslation(['settings', 'common']);
  const [preferences, setPreferences] = useState({
    timezone: 'UTC',
    emailNotifications: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // TODO: API call to save preferences
      toast.success(t('settingsSaved'));
    } catch (error) {
      toast.error(t('failedToSave', { ns: 'common', resource: t('preferences') }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          {t('preferences')}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Customize your account preferences and settings
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Language Preference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 text-start">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {t('defaultLanguage')}
            </div>
          </label>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="lang-ar"
                name="language"
                value="ar"
                checked={i18n.language === 'ar'}
                onChange={() => i18n.changeLanguage('ar')}
                className="w-4 h-4 text-indigo-600"
              />
              <label htmlFor="lang-ar" className="text-sm text-gray-700">
                العربية (Arabic)
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="lang-en"
                name="language"
                value="en"
                checked={i18n.language === 'en'}
                onChange={() => i18n.changeLanguage('en')}
                className="w-4 h-4 text-indigo-600"
              />
              <label htmlFor="lang-en" className="text-sm text-gray-700">
                English
              </label>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 text-start">
            This will be the default language for your organization
          </p>
        </div>

        {/* Timezone */}
        <div>
          <label
            htmlFor="timezone"
            className="block text-sm font-medium text-gray-700 mb-2 text-start"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t('timezone')}
            </div>
          </label>
          <select
            id="timezone"
            value={preferences.timezone}
            onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-start"
          >
            <option value="UTC">UTC (GMT+0)</option>
            <option value="America/New_York">Eastern Time (GMT-5)</option>
            <option value="America/Chicago">Central Time (GMT-6)</option>
            <option value="America/Denver">Mountain Time (GMT-7)</option>
            <option value="America/Los_Angeles">Pacific Time (GMT-8)</option>
            <option value="Europe/London">London (GMT+0)</option>
            <option value="Europe/Paris">Paris (GMT+1)</option>
            <option value="Asia/Dubai">Dubai (GMT+4)</option>
            <option value="Asia/Riyadh">Riyadh (GMT+3)</option>
            <option value="Asia/Cairo">Cairo (GMT+2)</option>
          </select>
        </div>

        {/* Email Notifications */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 text-start">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              {t('notifications')}
            </div>
          </label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={(e) => setPreferences(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <div className="flex-1 text-start">
                <div className="text-sm font-medium text-gray-900">
                  {t('emailNotifications')}
                </div>
                <div className="text-xs text-gray-500">
                  Receive email notifications for important updates
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? t('loading', { ns: 'common' }) : t('saveChanges')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PreferencesTab;
