/**
 * Category List View Component
 * Table layout for displaying ticket categories
 *
 * @reusable
 * @category Tickets
 * @example
 * <CategoryListView
 *   categories={categories}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   deletingId={deletingId}
 * />
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Trash2, FolderOpen } from 'lucide-react';

const CategoryListView = ({ categories, onEdit, onDelete, deletingId }) => {
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.language === 'ar';

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
              <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('category')}
              </th>
              <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('color')}
              </th>
              <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('sortOrder')}
              </th>
              <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-left' : 'text-right'}`}>
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">
                  {t('noCategories')}
                </td>
              </tr>
            ) : (
              categories.map((category) => {
                return (
                  <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                    {/* Category Name + Icon */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: hexToRgba(category.color, 0.15) }}
                        >
                          <FolderOpen
                            className="w-5 h-5"
                            style={{ color: category.color || '#6366f1' }}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900">
                            {isRTL && category.name_ar ? category.name_ar : category.name_en}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {isRTL && category.name_ar ? category.name_en : category.name_ar}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Color */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: category.color || '#6366f1' }}
                        />
                        <span className="text-sm font-mono text-gray-600">
                          {category.color || '#6366f1'}
                        </span>
                      </div>
                    </td>

                    {/* Sort Order */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {category.sort_order ?? 0}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-left' : 'text-right'}`}>
                      <div className={`flex items-center gap-2 ${isRTL ? 'justify-start' : 'justify-end'}`}>
                        <button
                          onClick={() => onEdit(category)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title={t('edit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(category)}
                          disabled={deletingId === category.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title={t('delete')}
                        >
                          {deletingId === category.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
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

export default CategoryListView;
