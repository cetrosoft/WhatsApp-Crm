/**
 * EditUserModal Component
 * Modal for admin to edit team member details (requires users.edit permission)
 */

import React, { useState, useEffect } from 'react';
import { X, User, Mail, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EditUserModal = ({
  isOpen,
  onClose,
  onSave,
  user,
  roles = [],
}) => {
  const { t } = useTranslation(['common', 'settings']);

  const [formData, setFormData] = useState({
    fullName: '',
    roleId: '',
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Populate form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.full_name || '',
        roleId: user.roleId || '',
        isActive: user.is_active !== false,
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(user.id, formData);
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('common:editUser')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                value={user.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed text-start"
              />
              <p className="mt-1 text-xs text-gray-500 text-start">
                {t('common:emailCannotBeChanged')}
              </p>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-start">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {t('settings:role')}
                </div>
              </label>
              <select
                value={formData.roleId}
                onChange={(e) => setFormData(prev => ({ ...prev, roleId: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-start"
                required
              >
                <option value="">{t('common:selectRole')}</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                    {!role.is_system && ' (Custom)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Status */}
            <div>
              <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  {formData.isActive ? (
                    <ToggleRight className="w-6 h-6 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                  <div className="text-start">
                    <div className="text-sm font-medium text-gray-900">
                      {t('settings:status')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formData.isActive ? t('settings:active') : t('settings:inactive')}
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="sr-only"
                />
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {t('common:cancel')}
              </button>
              <button
                type="submit"
                disabled={isSaving || !formData.fullName.trim()}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? t('common:saving') : t('common:saveChanges')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;
