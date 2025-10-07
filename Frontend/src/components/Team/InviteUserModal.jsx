/**
 * Invite User Modal Component
 * Reusable modal for inviting team members
 */

import React, { useState } from 'react';
import { X, Mail, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const InviteUserModal = ({
  isOpen,
  onClose,
  onInvite,
  roles = []
}) => {
  const { t } = useTranslation(['common', 'settings']);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [inviting, setInviting] = useState(false);

  // Set default role when roles are loaded
  React.useEffect(() => {
    if (roles.length > 0 && !role) {
      // Default to 'member' role if it exists, otherwise first role
      const memberRole = roles.find(r => r.slug === 'member');
      setRole(memberRole?.slug || roles[0]?.slug || '');
    }
  }, [roles, role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setInviting(true);
      await onInvite(email, role);
      // Reset form
      setEmail('');
      const memberRole = roles.find(r => r.slug === 'member');
      setRole(memberRole?.slug || roles[0]?.slug || '');
      onClose();
    } catch (error) {
      console.error('Invite error:', error);
    } finally {
      setInviting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('settings:inviteUser')}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
              {t('common:email')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                <Mail className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full ps-10 pe-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-start"
                placeholder={t('settings:enterEmail')}
              />
            </div>
          </div>

          {/* Role Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
              {t('settings:role')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                <Shield className="w-5 h-5 text-gray-400" />
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full ps-10 pe-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-start appearance-none bg-white"
              >
                {roles.map((roleOption) => (
                  <option key={roleOption.id} value={roleOption.slug}>
                    {roleOption.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('common:cancel')}
            </button>
            <button
              type="submit"
              disabled={inviting || !email.trim()}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {inviting ? t('common:loading') : t('settings:send')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteUserModal;
