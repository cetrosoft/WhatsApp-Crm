/**
 * Dashboard - Main landing page after login
 * Shows overview statistics and quick actions
 */

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import {
  Users,
  MessageSquare,
  TrendingUp,
  Package,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

// Stats Card Component
const StatCard = ({ title, value, icon: Icon, color, trend }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <h3 className={`text-2xl font-bold text-gray-900 mb-1`}>{value}</h3>
      <p className={`text-sm text-gray-600`}>{title}</p>
    </div>
  );
};

// Activity Item Component
const ActivityItem = ({ icon: Icon, title, time, status }) => {
  const statusColors = {
    success: "text-green-600 bg-green-50",
    warning: "text-orange-600 bg-orange-50",
    error: "text-red-600 bg-red-50",
  };

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className={`p-2 rounded-lg flex-shrink-0 ${statusColors[status]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
          <Clock className="w-3 h-3" />
          {time}
        </p>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { t } = useTranslation('common');
  const { user, organization } = useAuth();
  const { isRTL } = useLanguage();
  const [stats, setStats] = useState({
    totalUsers: 1,
    totalMessages: 0,
    activeProfiles: 0,
    totalCustomers: 0,
  });

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          {t('welcome')}, {user?.fullName || user?.email}! 👋
        </h1>
        <p className="text-indigo-100">
          {organization?.name} - {t('appName')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('teamMembers')}
          value={stats.totalUsers}
          icon={Users}
          color="blue"
          trend={0}
        />
        <StatCard
          title={t('messagesSent')}
          value={stats.totalMessages}
          icon={MessageSquare}
          color="green"
          trend={0}
        />
        <StatCard
          title={t('whatsappProfiles')}
          value={stats.activeProfiles}
          icon={Activity}
          color="purple"
          trend={0}
        />
        <StatCard
          title={t('totalCustomers')}
          value={stats.totalCustomers}
          icon={TrendingUp}
          color="orange"
          trend={0}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('recentActivity')}
          </h2>
          <div className="space-y-2">
            <ActivityItem
              icon={CheckCircle}
              title={t('accountCreatedSuccessfully')}
              time={t('justNow')}
              status="success"
            />
            <ActivityItem
              icon={Package}
              title={t('freePackageActivated')}
              time={t('justNow')}
              status="success"
            />
            <div className="text-center py-8 text-gray-500 text-sm">
              {t('noAdditionalActivity')}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('quickActions')}
          </h2>
          <div className="space-y-3">
            <button className={`w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}>
              <MessageSquare className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">{t('startCampaign')}</div>
                <div className="text-xs text-gray-500">{t('startCampaignDesc')}</div>
              </div>
            </button>
            <button className={`w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}>
              <Users className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">{t('inviteTeamMember')}</div>
                <div className="text-xs text-gray-500">{t('inviteTeamMemberDesc')}</div>
              </div>
            </button>
            <button className={`w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}>
              <Package className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">{t('upgradePackage')}</div>
                <div className="text-xs text-gray-500">{t('upgradePackageDesc')}</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Getting Started Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">
          🚀 {t('gettingStarted')}
        </h2>
        <div className="space-y-3">
          <div className={`flex items-start gap-3 ${isRTL ? 'text-right' : 'text-left'}`}>
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">{t('accountCreated')}</p>
              <p className="text-sm text-gray-600">{t('accountCreatedDesc')}</p>
            </div>
          </div>
          <div className={`flex items-start gap-3 ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className="w-5 h-5 rounded-full border-2 border-gray-300 mt-0.5 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-gray-900">{t('connectWhatsApp')}</p>
              <p className="text-sm text-gray-600">{t('connectWhatsAppDesc')}</p>
            </div>
          </div>
          <div className={`flex items-start gap-3 ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className="w-5 h-5 rounded-full border-2 border-gray-300 mt-0.5 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-gray-900">{t('inviteYourTeam')}</p>
              <p className="text-sm text-gray-600">{t('inviteYourTeamDesc')}</p>
            </div>
          </div>
          <div className={`flex items-start gap-3 ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className="w-5 h-5 rounded-full border-2 border-gray-300 mt-0.5 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-gray-900">{t('sendFirstCampaign')}</p>
              <p className="text-sm text-gray-600">{t('sendFirstCampaignDesc')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
