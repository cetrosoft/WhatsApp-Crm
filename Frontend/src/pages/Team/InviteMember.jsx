/**
 * Invite Member Page
 * Standalone page for inviting team members
 * Route: /team/invite
 */

import React, { useState } from 'react';
import { Mail, Shield, Send, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUsers } from '../../hooks/useUsers';

const InviteMember = () => {
  const { t } = useTranslation(['common', 'settings']);
  const { inviteUser } = useUsers();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setInviting(true);
      setSuccess(false);
      await inviteUser(email, role);
      setSuccess(true);
      // Reset form after 2 seconds
      setTimeout(() => {
        setEmail('');
        setRole('member');
        setSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Invite error:', error);
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {t('common:inviteMember')}
        </h1>
        <p className="mt-2 text-gray-600">
          {t('common:inviteMemberDescription')}
        </p>
      </div>

      {/* Invitation Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-start">
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
                className="w-full ps-10 pe-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-start"
                placeholder="colleague@example.com"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500 text-start">
              {t('common:inviteEmailHelp')}
            </p>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-start">
              {t('settings:role')}
            </label>
            <div className="space-y-3">
              {['member', 'agent', 'manager', 'admin'].map((roleOption) => (
                <label
                  key={roleOption}
                  className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 transition-colors"
                >
                  <input
                    type="radio"
                    name="role"
                    value={roleOption}
                    checked={role === roleOption}
                    onChange={(e) => setRole(e.target.value)}
                    className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <div className="flex-1 text-start">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900 capitalize">
                        {t(`settings:${roleOption}`)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {roleOption === 'admin' && 'Full access to all features and settings'}
                      {roleOption === 'manager' && 'Manage CRM, view settings, invite team members'}
                      {roleOption === 'agent' && 'Create and edit CRM data, view settings'}
                      {roleOption === 'member' && 'View-only access to CRM data'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={inviting || !email.trim() || success}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {success ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  {t('common:invitationSent')}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {inviting ? t('common:sending') : t('settings:send')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">
          {t('common:whatHappensNext')}
        </h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• {t('common:inviteStep1')}</li>
          <li>• {t('common:inviteStep2')}</li>
          <li>• {t('common:inviteStep3')}</li>
        </ul>
      </div>
    </div>
  );
};

export default InviteMember;
