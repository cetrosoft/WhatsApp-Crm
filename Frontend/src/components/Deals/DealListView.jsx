/**
 * Deal List View Component
 * Table layout for displaying deals
 *
 * @reusable
 * @category Deals
 * @example
 * <DealListView
 *   deals={deals}
 *   stages={stages}
 *   tags={tags}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   deletingId={deletingId}
 * />
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Trash2, DollarSign, User, Calendar, TrendingUp, Tag } from 'lucide-react';

const DealListView = ({ deals, stages, tags, onEdit, onDelete, deletingId }) => {
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.language === 'ar';

  /**
   * Format currency value
   */
  const formatCurrency = (value) => {
    if (!value) return '$0';
    return `$${parseFloat(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  /**
   * Format date for display (Gregorian/Melady calendar)
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    // Use 'en-US' for both languages to ensure Gregorian calendar display
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  /**
   * Get probability color based on value
   */
  const getProbabilityColor = (probability) => {
    if (!probability) return 'text-gray-400';
    if (probability >= 76) return 'text-green-600';
    if (probability >= 51) return 'text-yellow-600';
    if (probability >= 26) return 'text-orange-600';
    return 'text-red-600';
  };

  /**
   * Get stage info by ID
   */
  const getStageInfo = (stageId) => {
    const stage = stages.find(s => s.id === stageId);
    return stage || { name: '-', color: '#9CA3AF' };
  };

  /**
   * Convert hex color to rgba with opacity
   */
  const hexToRgba = (hex, opacity) => {
    if (!hex) return `rgba(156, 163, 175, ${opacity})`; // gray-400 fallback

    // Remove # if present
    hex = hex.replace('#', '');

    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" dir={isRTL ? 'rtl' : 'ltr'}>
          <thead className="bg-gray-50">
            <tr>
              <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('deal')}
              </th>
              <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('contact')} / {t('company')}
              </th>
              <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('stage')}
              </th>
              <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('assignedTo')}
              </th>
              <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('expectedCloseDate')}
              </th>
              <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('probability')}
              </th>
              <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('tags')}
              </th>
              <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-left' : 'text-right'}`}>
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {deals.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-sm text-gray-500">
                  {t('noDealsFound')}
                </td>
              </tr>
            ) : (
              deals.map((deal) => {
                const stage = getStageInfo(deal.stage_id);
                return (
                  <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                    {/* Deal Title + Value */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {deal.title}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <DollarSign className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600 font-medium">
                            {formatCurrency(deal.value)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact / Company */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm">
                        {deal.contact && (
                          <div className="text-gray-900 font-medium truncate">
                            {deal.contact.name}
                          </div>
                        )}
                        {deal.company && (
                          <div className="text-gray-500 text-xs truncate mt-1">
                            {deal.company.name}
                          </div>
                        )}
                        {!deal.contact && !deal.company && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>

                    {/* Stage */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: hexToRgba(stage.color, 0.15),
                          color: stage.color || '#374151'
                        }}
                      >
                        {stage.name}
                      </span>
                    </td>

                    {/* Assigned To */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {deal.assigned_user ? (
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="truncate">
                            {deal.assigned_user.full_name || deal.assigned_user.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>

                    {/* Expected Close Date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {deal.expected_close_date ? (
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span>{formatDate(deal.expected_close_date)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>

                    {/* Probability */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <TrendingUp className={`w-3 h-3 ${getProbabilityColor(deal.probability)}`} />
                        <span className={`text-sm font-medium ${getProbabilityColor(deal.probability)}`}>
                          {deal.probability || 0}%
                        </span>
                      </div>
                    </td>

                    {/* Tags */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {deal.tags && deal.tags.length > 0 ? (
                          <>
                            {deal.tags.slice(0, 2).map((tagId) => {
                              const tag = deal.tag_details?.find(t => t.id === tagId);
                              return tag ? (
                                <span
                                  key={tag.id}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                  style={{
                                    backgroundColor: hexToRgba(tag.color, 0.15),
                                    color: tag.color || '#374151'
                                  }}
                                >
                                  {isRTL && tag.name_ar ? tag.name_ar : tag.name_en}
                                </span>
                              ) : null;
                            })}
                            {deal.tags.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{deal.tags.length - 2}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className={`px-4 py-3 whitespace-nowrap ${isRTL ? 'text-left' : 'text-right'}`}>
                      <div className={`flex items-center gap-2 ${isRTL ? 'justify-start' : 'justify-end'}`}>
                        <button
                          onClick={() => onEdit(deal)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title={t('edit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(deal)}
                          disabled={deletingId === deal.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title={t('delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DealListView;
