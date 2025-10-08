/**
 * SecurityTab Component
 * Password change for logged-in users (self-service)
 */

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const SecurityTab = ({ user }) => {
  const { t } = useTranslation(['common', 'settings']);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChanging, setIsChanging] = useState(false);

  // Password strength validation
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const labels = ['', t('common:weak'), t('common:fair'), t('common:good'), t('common:strong')];
    const colors = ['', 'text-red-600', 'text-orange-600', 'text-yellow-600', 'text-green-600'];
    const bgColors = ['', 'bg-red-600', 'bg-orange-600', 'bg-yellow-600', 'bg-green-600'];

    return {
      strength: Math.min(strength, 4),
      label: labels[Math.min(strength, 4)],
      color: colors[Math.min(strength, 4)],
      bgColor: bgColors[Math.min(strength, 4)],
    };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);
  const passwordsMatch = formData.newPassword && formData.newPassword === formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.currentPassword) {
      toast.error(t('common:currentPasswordRequired'));
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error(t('common:passwordMinLength'));
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error(t('common:passwordsDoNotMatch'));
      return;
    }

    setIsChanging(true);
    try {
      await authAPI.changePassword(formData.currentPassword, formData.newPassword);
      toast.success(t('common:passwordChangedSuccessfully'));

      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.message || t('common:failedToChangePassword'));
    } finally {
      setIsChanging(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          {t('common:changePassword')}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {t('common:updateYourPasswordRegularly')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 text-start">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {t('common:currentPassword')}
            </div>
          </label>
          <div className="relative">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
              className="w-full px-4 py-2 pe-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-start"
              placeholder={t('common:enterCurrentPassword')}
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('current')}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 text-start">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {t('common:newPassword')}
            </div>
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
              className="w-full px-4 py-2 pe-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-start"
              placeholder={t('common:enterNewPassword')}
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('new')}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {formData.newPassword && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${passwordStrength.bgColor}`}
                    style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                  />
                </div>
                <span className={`text-xs font-medium ${passwordStrength.color}`}>
                  {passwordStrength.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 text-start">
                {t('common:passwordRequirements')}
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 text-start">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {t('common:confirmPassword')}
            </div>
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-4 py-2 pe-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-start"
              placeholder={t('common:confirmNewPassword')}
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirm')}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Password Match Indicator */}
          {formData.confirmPassword && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              {passwordsMatch ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">{t('common:passwordsMatch')}</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-red-600">{t('common:passwordsDoNotMatch')}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isChanging || !formData.currentPassword || !formData.newPassword || !passwordsMatch}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChanging ? t('common:changing') : t('common:changePassword')}
          </button>
        </div>
      </form>

      {/* Security Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2 text-start">
          {t('common:securityTips')}
        </h3>
        <ul className="space-y-1 text-sm text-blue-800 text-start list-disc list-inside">
          <li>{t('common:securityTip1')}</li>
          <li>{t('common:securityTip2')}</li>
          <li>{t('common:securityTip3')}</li>
        </ul>
      </div>
    </div>
  );
};

export default SecurityTab;
