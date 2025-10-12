/**
 * Deal Card Component
 * Draggable card for Kanban board
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreVertical, Edit2, Trash2, User, Building2, DollarSign, Calendar, Target, Clock } from 'lucide-react';
import { dealAPI } from '../services/api';
import toast from 'react-hot-toast';

const DealCard = ({ deal, canEdit, canDelete, onEdit, onDelete, isDragging, groupBy }) => {
  const { t, i18n } = useTranslation(['common']);
  const isRTL = i18n.language === 'ar';
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);

  console.log('🔍 [DealCard] Rendering:', {
    title: deal.title,
    value: deal.value,
    currency: deal.currency,
    stageId: deal.stage_id,
    tags: deal.tags,
    tag_details: deal.tag_details
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: deal.id, disabled: !canEdit });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0 : 1, // Hide original card when dragging
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: deal.currency || 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  /**
   * Format date (Gregorian calendar for both languages)
   */
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Calculate deal age (days since creation)
   */
  const getDealAge = () => {
    if (!deal.created_at) return null;
    const days = Math.floor((Date.now() - new Date(deal.created_at)) / (1000 * 60 * 60 * 24));
    if (days === 0) return isRTL ? 'اليوم' : 'Today';
    if (days === 1) return isRTL ? 'أمس' : '1d';
    return isRTL ? `${days} يوم` : `${days}d`;
  };

  /**
   * Get probability color
   */
  const getProbabilityColor = (probability) => {
    if (probability >= 75) return 'bg-green-500';
    if (probability >= 50) return 'bg-yellow-500';
    if (probability >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  /**
   * Handle edit
   */
  const handleEdit = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onEdit) {
      onEdit(deal);
    }
  };

  /**
   * Handle delete
   */
  const handleDelete = async (e) => {
    e.stopPropagation();
    setShowMenu(false);

    if (!confirm(t('confirmDeleteDeal'))) {
      return;
    }

    try {
      setDeleting(true);
      await dealAPI.deleteDeal(deal.id);
      toast.success(t('dealDeleted'));
      if (onDelete) onDelete(deal.id);
    } catch (error) {
      console.error('Error deleting deal:', error);
      toast.error(t('failedToDelete', { resource: t('deal') }));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow pointer-events-auto ${
        deleting ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 flex flex-col gap-2">
          {/* Username Badge (when grouped by assignedTo) */}
          {groupBy === 'assignedTo' && deal.assigned_to_user && (
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-600">
                <User className="w-3 h-3" />
                {deal.assigned_to_user.full_name || deal.assigned_to_user.email}
              </span>
            </div>
          )}
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
            {deal.title}
          </h3>
          {/* Age Badge */}
          {getDealAge() && (
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                <Clock className="w-3 h-3" />
                {getDealAge()}
              </span>
            </div>
          )}
        </div>
        {(canEdit || canDelete) && (
          <div className="relative ms-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className={`absolute top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[120px] ${isRTL ? 'left-0' : 'right-0'}`}>
                  {canEdit && (
                    <button
                      onClick={handleEdit}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-start"
                    >
                      <Edit2 className="w-4 h-4" />
                      {t('edit')}
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-start"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t('delete')}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-4 h-4 text-green-600" />
        <span className="font-medium text-base text-green-600">
          {formatCurrency(deal.value)}
        </span>
      </div>

      {/* Contact & Company */}
      <div className="space-y-2 mb-3">
        {deal.contact && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4 text-gray-400" />
            <span className="truncate">{deal.contact.name}</span>
          </div>
        )}
        {deal.company && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="w-4 h-4 text-gray-400" />
            <span className="truncate">{deal.company.name}</span>
          </div>
        )}
      </div>

      {/* Expected Close Date */}
      {deal.expected_close_date && (
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(deal.expected_close_date)}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        {/* Probability */}
        {deal.probability != null && (
          <div className="flex items-center gap-2">
            <Target className="w-3 h-3 text-gray-400" />
            <div className="flex items-center gap-1">
              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProbabilityColor(deal.probability)}`}
                  style={{ width: `${deal.probability}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{deal.probability}%</span>
            </div>
          </div>
        )}

        {/* Assigned User Avatar */}
        {deal.assigned_to && (
          <div className="flex items-center">
            {deal.assigned_user?.avatar_url ? (
              <img
                src={deal.assigned_user.avatar_url}
                alt={deal.assigned_user.full_name}
                className="w-6 h-6 rounded-full border-2 border-white"
                title={deal.assigned_user.full_name}
              />
            ) : (
              <div
                className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-medium border-2 border-white"
                title={deal.assigned_user?.full_name || t('unassigned')}
              >
                {deal.assigned_user?.full_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tags */}
      {deal.tag_details && deal.tag_details.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {deal.tag_details.slice(0, 3).map((tag) => {
            const tagName = isRTL && tag.name_ar ? tag.name_ar : tag.name_en;
            return (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
                style={{ backgroundColor: tag.color || '#6366f1' }}
              >
                {tagName}
              </span>
            );
          })}
          {deal.tag_details.length > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
              +{deal.tag_details.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default DealCard;
