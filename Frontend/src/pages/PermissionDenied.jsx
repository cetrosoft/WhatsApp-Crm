import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldX, ArrowLeft } from 'lucide-react';

/**
 * Permission Denied Page
 * Shown when user tries to access a page they don't have permission for
 */
const PermissionDenied = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 p-6">
            <ShieldX className="w-16 h-16 text-red-600" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {t('accessDenied') || 'Access Denied'}
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-8">
          {t('noPermissionMessage') || "You don't have permission to access this page. Please contact your administrator if you believe this is a mistake."}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft size={20} />
            {t('goBack') || 'Go Back'}
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {t('goToDashboard') || 'Go to Dashboard'}
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>{t('note')}:</strong> {t('permissionDeniedNote') || 'Your account role determines which pages you can access. To request additional permissions, contact your organization administrator.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PermissionDenied;
