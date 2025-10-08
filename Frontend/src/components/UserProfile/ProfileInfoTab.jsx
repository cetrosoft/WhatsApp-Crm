/**
 * ProfileInfoTab Component
 * Allows user to edit their own personal information
 */

import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { userAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ProfileInfoTab = ({ user }) => {
  const { t } = useTranslation(['common', 'settings']);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Populate form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.error(t('common:fullNameRequired'));
      return;
    }

    setIsSaving(true);
    try {
      await userAPI.updateProfile({
        fullName: formData.fullName,
        phone: formData.phone,
      });
      toast.success(t('common:profileUpdated'));
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || t('common:failedToUpdateProfile'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          {t('common:profileInformation')}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {t('common:updateYourPersonalInformation')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 text-start">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {t('common:fullName')}
            </div>
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-start"
            placeholder={t('common:fullName')}
            required
          />
        </div>

        {/* Email (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 text-start">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {t('common:email')}
            </div>
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed text-start"
          />
          <p className="mt-1 text-xs text-gray-500 text-start">
            {t('common:emailCannotBeChanged')}
          </p>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 text-start">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {t('common:phone')}
            </div>
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-start"
            placeholder={t('common:phoneOptional')}
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSaving || !formData.fullName.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSaving ? t('common:saving') : t('common:saveChanges')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileInfoTab;
