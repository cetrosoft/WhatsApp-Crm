/**
 * Subscription Tab
 * Show current package, usage limits, and upgrade options
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { packageAPI } from '../../services/api';
import { CreditCard, TrendingUp, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const SubscriptionTab = () => {
  const { t } = useTranslation(['settings', 'common']);
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentPackage();
  }, []);

  const fetchCurrentPackage = async () => {
    try {
      const data = await packageAPI.getCurrentPackage();
      setPackageData(data);
    } catch (error) {
      toast.error(t('failedToLoad', { ns: 'common', resource: t('packageInformation') }));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const limits = packageData?.effective_limits || {};
  const features = packageData?.package?.features || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          {t('currentPackage')}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Manage your subscription and billing
        </p>
      </div>

      {/* Current Package Card */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-indigo-900">
              {packageData?.package?.name}
            </h3>
            <p className="text-indigo-700 mt-1">
              {packageData?.package?.description}
            </p>
          </div>
          <div className="text-end">
            {packageData?.package?.price_monthly ? (
              <>
                <div className="text-3xl font-bold text-indigo-900">
                  ${packageData.package.price_monthly}
                </div>
                <div className="text-sm text-indigo-700">per month</div>
              </>
            ) : (
              <div className="text-2xl font-bold text-indigo-900">Free</div>
            )}
          </div>
        </div>

        {/* Trial Info */}
        {packageData?.subscription_status === 'trialing' && packageData?.trial_ends_at && (
          <div className="bg-white bg-opacity-50 rounded-lg p-3 mt-4">
            <p className="text-sm text-indigo-800">
              <strong>{t('trialEnds')}:</strong>{' '}
              {new Date(packageData.trial_ends_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Usage Limits */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('usageLimits')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Users */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{t('users')}</span>
              <span className="text-sm text-gray-500">
                0 {t('of')} {limits.max_users || t('unlimited')}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '0%' }}></div>
            </div>
          </div>

          {/* WhatsApp Profiles */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{t('whatsappProfiles')}</span>
              <span className="text-sm text-gray-500">
                0 {t('of')} {limits.max_whatsapp_profiles || t('unlimited')}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '0%' }}></div>
            </div>
          </div>

          {/* Customers */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{t('customers')}</span>
              <span className="text-sm text-gray-500">
                0 {t('of')} {limits.max_customers || t('unlimited')}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
            </div>
          </div>

          {/* Messages Per Day */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{t('messagesPerDay')}</span>
              <span className="text-sm text-gray-500">
                0 {t('of')} {limits.max_messages_per_day || t('unlimited')}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '0%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Package Features */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('packageFeatures')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(features).map(([feature, enabled]) => (
            <div key={feature} className="flex items-center gap-2">
              {enabled ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <X className="w-5 h-5 text-gray-400" />
              )}
              <span className={enabled ? 'text-gray-900' : 'text-gray-400'}>
                {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Button */}
      {packageData?.package?.slug !== 'business' && packageData?.package?.slug !== 'enterprise' && (
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              // TODO: Navigate to packages page or open upgrade modal
              toast.info(t('upgradeFeatureComingSoon', { ns: 'common' }));
            }}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <TrendingUp className="w-4 h-4" />
            {t('upgradePackage')}
          </button>
        </div>
      )}
    </div>
  );
};

export default SubscriptionTab;
