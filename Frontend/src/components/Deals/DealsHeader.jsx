// Frontend/src/components/Deals/DealsHeader.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, DollarSign, TrendingUp, Target } from 'lucide-react';

export const DealsHeader = ({
  pipelines,
  selectedPipeline,
  setSelectedPipeline,
  deals,
  onAddDeal,
  hasPermission
}) => {
  const { t } = useTranslation();

  // Calculate stats
  const totalValue = deals.reduce((sum, deal) => sum + (parseFloat(deal.value) || 0), 0);
  const avgDealSize = deals.length > 0 ? totalValue / deals.length : 0;
  const weightedValue = deals.reduce((sum, deal) => {
    const value = parseFloat(deal.value) || 0;
    const probability = parseInt(deal.probability) || 0;
    return sum + (value * probability / 100);
  }, 0);

  return (
    <div className="mb-6">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('deals.title')}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('deals.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Pipeline Selector */}
          <select
            value={selectedPipeline?.id || ''}
            onChange={(e) => {
              const pipeline = pipelines.find(p => p.id === e.target.value);
              setSelectedPipeline(pipeline);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {pipelines.map(pipeline => (
              <option key={pipeline.id} value={pipeline.id}>
                {pipeline.name}
              </option>
            ))}
          </select>

          {/* Add Deal Button */}
          {hasPermission('deals.create') && (
            <button
              onClick={onAddDeal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('deals.addDeal')}
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('deals.stats.total')}
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {deals.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('deals.stats.totalValue')}
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                ${totalValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('deals.stats.avgDealSize')}
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                ${avgDealSize.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('deals.stats.weightedValue')}
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                ${weightedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
