/**
 * Accept Invitation Page
 * Allow invited users to create their account
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { userAPI } from '../services/api';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { User, Lock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AcceptInvitation = () => {
  const { t } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    // Verify invitation token
    const verifyToken = async () => {
      try {
        const data = await userAPI.verifyInvitation(token);
        if (data.valid) {
          setInvitation(data.invitation);
        } else {
          setError(data.error || 'Invalid invitation');
        }
      } catch (err) {
        setError(err.message || 'Invalid or expired invitation');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName) {
      newErrors.fullName = t('fullNameRequired');
    }

    if (!formData.password) {
      newErrors.password = t('passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('passwordMinLength');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('passwordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('passwordMismatch');
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await userAPI.acceptInvitation(token, formData.password, formData.fullName);
      toast.success(t('accountCreated'));
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || t('loginError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading', { ns: 'common' })}</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('error', { ns: 'common' })}
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            {t('login')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Language Switcher */}
      <div className="fixed top-4 end-4 z-50">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('welcomeBack')}
            </h1>
            <p className="text-gray-600 mb-2">
              {invitation.organizationName}
            </p>
            <p className="text-sm text-gray-500">{invitation.email}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 mb-1 text-start"
              >
                {t('fullName')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full ps-10 pe-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-start ${
                    formErrors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('fullName')}
                  disabled={isSubmitting}
                />
              </div>
              {formErrors.fullName && (
                <p className="mt-1 text-sm text-red-600 text-start">
                  {formErrors.fullName}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1 text-start"
              >
                {t('password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full ps-10 pe-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-start ${
                    formErrors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('password')}
                  disabled={isSubmitting}
                />
              </div>
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-600 text-start">
                  {formErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1 text-start"
              >
                {t('confirmPassword')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full ps-10 pe-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-start ${
                    formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('confirmPassword')}
                  disabled={isSubmitting}
                />
              </div>
              {formErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 text-start">
                  {formErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t('loading', { ns: 'common' }) : t('createAccount')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;
