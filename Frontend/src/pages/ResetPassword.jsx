/**
 * Reset Password Page - 5-Step Flow
 * Step 1: Enter email
 * Step 2: Backend sends verification code
 * Step 3: Enter verification code
 * Step 4: Backend verifies code
 * Step 5: Enter new password
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import LanguageSwitcher from '../components/LanguageSwitcher';

const ResetPassword = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();

  // State management
  const [step, setStep] = useState(1); // 1 = email, 3 = code, 5 = password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step 1: Request verification code
  const handleRequestCode = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error(t('emailRequired'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send code');
      }

      toast.success(t('verificationCodeSent'));

      // Show dev code in development mode
      if (data.devCode) {
        toast.success(`Dev Code: ${data.devCode}`, { duration: 10000 });
      }

      setStep(3); // Move to code entry screen
    } catch (error) {
      console.error('Request code error:', error);
      toast.error(error.message || t('loginError'));
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify code
  const handleVerifyCode = async (e) => {
    e.preventDefault();

    if (!code || code.length !== 6) {
      toast.error(t('enterValidCode'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid code');
      }

      setTempToken(data.tempToken);
      toast.success(t('codeVerified'));
      setStep(5); // Move to password entry screen
    } catch (error) {
      console.error('Verify code error:', error);
      toast.error(error.message || t('invalidCode'));
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error(t('passwordTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('passwordsDoNotMatch'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, tempToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      toast.success(t('passwordResetSuccess'));
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error.message || t('loginError'));
    } finally {
      setLoading(false);
    }
  };

  // Resend code
  const handleResendCode = async () => {
    setCode('');
    await handleRequestCode({ preventDefault: () => {} });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Language Switcher */}
      <div className="fixed top-4 end-4 z-50">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              {step === 1 && <Mail className="w-8 h-8 text-indigo-600" />}
              {step === 3 && <KeyRound className="w-8 h-8 text-indigo-600" />}
              {step === 5 && <Lock className="w-8 h-8 text-indigo-600" />}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('resetPassword')}
            </h1>
            <p className="text-gray-600">
              {step === 1 && t('enterYourEmail')}
              {step === 3 && t('enterVerificationCode')}
              {step === 5 && t('enterNewPassword')}
            </p>
          </div>

          {/* Step 1: Email Input */}
          {step === 1 && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 text-start">
                  {t('email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full ps-10 pe-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-start"
                    placeholder={t('email')}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('loading', { ns: 'common' }) : t('sendVerificationCode')}
              </button>
            </form>
          )}

          {/* Step 3: Code Input */}
          {step === 3 && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1 text-start">
                  {t('verificationCode')}
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  maxLength={6}
                  required
                  disabled={loading}
                />
                <p className="mt-2 text-sm text-gray-500 text-center">
                  {t('codeSentTo')} <span className="font-medium">{email}</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('loading', { ns: 'common' }) : t('verifyCode')}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
                >
                  {t('resendCode')}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('backToEmail')}
              </button>
            </form>
          )}

          {/* Step 5: Password Input */}
          {step === 5 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* New Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 text-start">
                  {t('newPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pe-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-start"
                    placeholder={t('passwordPlaceholder')}
                    required
                    minLength={8}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    title={showPassword ? t('hidePassword') : t('showPassword')}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1 text-start">
                  {t('confirmPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pe-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-start"
                    placeholder={t('confirmPasswordPlaceholder')}
                    required
                    minLength={8}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    title={showConfirmPassword ? t('hidePassword') : t('showPassword')}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 rounded-lg p-3 text-start">
                <p className="text-xs text-gray-600 mb-1">{t('passwordRequirements')}:</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• {t('minCharacters', { count: 8 })}</li>
                  <li>• {t('passwordMatch')}</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('loading', { ns: 'common' }) : t('resetPasswordButton')}
              </button>
            </form>
          )}

          {/* Back to Login */}
          <div className="text-center pt-4 border-t border-gray-200">
            <Link
              to="/login"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {t('backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
