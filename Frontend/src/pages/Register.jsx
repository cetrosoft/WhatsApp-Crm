/**
 * Register Page
 * Bilingual (Arabic RTL / English LTR) registration page for creating new organization
 */

import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { Mail, Lock, User, Building2 } from 'lucide-react';

const Register = () => {
  const { t, i18n } = useTranslation('auth');
  const { register, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    organizationName: '',
    email: '',
    password: '',
    fullName: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.organizationName) {
      newErrors.organizationName = t('organizationRequired');
    }

    if (!formData.email) {
      newErrors.email = t('emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('invalidCredentials');
    }

    if (!formData.password) {
      newErrors.password = t('passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('passwordMinLength');
    }

    if (!formData.fullName) {
      newErrors.fullName = t('fullNameRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      await register({
        ...formData,
        language: i18n.language, // Send preferred language
      });
    } catch (error) {
      // Error handled by AuthContext with toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
      {/* Language Switcher - Fixed top */}
      <div className="fixed top-4 end-4 z-50">
        <LanguageSwitcher />
      </div>

      {/* Register Card */}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <Building2 className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('getStarted')}
            </h1>
            <p className="text-gray-600">{t('createAccount')}</p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Organization Name */}
            <div>
              <label
                htmlFor="organizationName"
                className="block text-sm font-medium text-gray-700 mb-1 text-start"
              >
                {t('organizationName')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                  <Building2 className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="organizationName"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  className={`w-full ps-10 pe-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-start ${
                    errors.organizationName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('organizationName')}
                  disabled={isLoading}
                />
              </div>
              {errors.organizationName && (
                <p className="mt-1 text-sm text-red-600 text-start">
                  {errors.organizationName}
                </p>
              )}
            </div>

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
                  className={`w-full ps-10 pe-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-start ${
                    errors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('fullName')}
                  disabled={isLoading}
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600 text-start">{errors.fullName}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1 text-start"
              >
                {t('email')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full ps-10 pe-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-start ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('email')}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 text-start">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
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
                  className={`w-full ps-10 pe-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-start ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('password')}
                  disabled={isLoading}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 text-start">{errors.password}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 text-start">
                {t('passwordMinLength')}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('loading', { ns: 'common' }) : t('registerButton')}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              {t('alreadyHaveAccount')}{' '}
              <Link
                to="/login"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                {t('login')}
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-sm text-gray-600">
          {t('appName', { ns: 'common' })}
        </p>
      </div>
    </div>
  );
};

export default Register;
