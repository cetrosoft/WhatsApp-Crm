/**
 * Login Page
 * Bilingual (Arabic RTL / English LTR) authentication page
 */

import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { t, i18n } = useTranslation('auth');
  const { login, isAuthenticated } = useAuth();
  const isRTL = i18n.language === 'ar';
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

    if (!formData.email) {
      newErrors.email = t('emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('invalidCredentials');
    }

    if (!formData.password) {
      newErrors.password = t('passwordRequired');
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
      await login(formData.email, formData.password);
    } catch (error) {
      // Error handled by AuthContext with toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Language Switcher - Fixed top */}
      <div className="fixed top-4 end-4 z-50">
        <LanguageSwitcher />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <LogIn className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('welcomeBack')}
            </h1>
            <p className="text-gray-600">{t('login')}</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  className={`w-full ps-10 pe-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-start ${
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
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full ${isRTL ? 'pe-4' : 'ps-4'} ${isRTL ? 'ps-12' : 'pe-12'} py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  style={{ textAlign: isRTL ? 'right' : 'left' }}
                  placeholder={t('password')}
                  disabled={isLoading}
                />
                <div className={`absolute inset-y-0 ${isRTL ? 'start-3' : 'end-3'} flex items-center pointer-events-none`}>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none pointer-events-auto cursor-pointer"
                    tabIndex="-1"
                    title={showPassword ? t('hidePassword') : t('showPassword')}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 text-start">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('loading') : t('loginButton')}
            </button>
          </form>

          {/* Forgot Password & Register Links */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            {/* Forgot Password */}
            <div className="text-center">
              <Link
                to="/reset-password"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {t('forgotPassword')}
              </Link>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {t('dontHaveAccount')}{' '}
                <Link
                  to="/register"
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {t('createAccount')}
                </Link>
              </p>
            </div>
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

export default Login;
