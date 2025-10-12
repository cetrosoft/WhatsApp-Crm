/**
 * Kanban Column Component
 * Stage column for drag-and-drop deals
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, DollarSign } from 'lucide-react';
import DealCard from '../DealCard';
import QuickAddDealCard from './QuickAddDealCard';

const KanbanColumn = ({
  stage,
  deals,
  totalValue,
  canEdit,
  canDelete,
  onAddDeal,
  onQuickAddDeal,
  onContactSearch,
  onEditDeal,
  onDeleteDeal,
  groupBy,
  quickAddSaving
}) => {
  const { t, i18n } = useTranslation(['common']);
  const isRTL = i18n.language === 'ar';

  // Quick add state
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  console.log('🔍 [KanbanColumn] Rendering:', {
    stageName: stage.name,
    stageId: stage.id,
    dealsCount: deals.length,
    totalValue,
    canEdit
  });

  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  /**
   * Format currency
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  /**
   * Get stage color classes
   */
  const getStageColor = () => {
    if (stage.color) {
      return {
        bg: `bg-${stage.color}-100`,
        text: `text-${stage.color}-700`,
        border: `border-${stage.color}-200`,
      };
    }
    return {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-200',
    };
  };

  const colors = getStageColor();

  return (
    <div className="flex-shrink-0 w-64">
      {/* Column Header */}
      <div className={`rounded-lg border-2 ${colors.border} ${colors.bg} p-4 mb-3`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`font-semibold ${colors.text} text-sm uppercase tracking-wide`}>
            {stage.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${colors.bg} ${colors.text} text-xs font-bold`}>
              {deals.length}
            </span>
            {canEdit && (
              <button
                onClick={() => setShowQuickAdd(true)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm"
                title={t('quickAddDeal')}
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Total Value */}
        {totalValue > 0 && (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <DollarSign className="w-4 h-4" />
            <span className="font-medium">{formatCurrency(totalValue)}</span>
          </div>
        )}
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[500px] rounded-lg p-3 transition-all duration-200 ${
          isOver
            ? 'bg-indigo-50 border-2 border-dashed border-indigo-400 shadow-inner'
            : 'bg-gray-50 border-2 border-transparent'
        }`}
      >
        {/* Quick Add Form */}
        {showQuickAdd && (
          <QuickAddDealCard
            stageId={stage.id}
            stageName={stage.name}
            onSubmit={(data) => {
              onQuickAddDeal(data);
              setShowQuickAdd(false);
            }}
            onCancel={() => setShowQuickAdd(false)}
            onContactSearch={onContactSearch}
            saving={quickAddSaving}
          />
        )}

        {deals.length === 0 && !showQuickAdd ? (
          <div className="flex items-center justify-center h-32 text-center">
            <p className="text-sm text-gray-400">
              {isOver ? t('dropHere') : t('noDeals')}
            </p>
          </div>
        ) : deals.length > 0 ? (
          <div className="space-y-0">
            <SortableContext items={deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
              {deals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={onEditDeal}
                  onDelete={onDeleteDeal}
                  groupBy={groupBy}
                />
              ))}
            </SortableContext>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default KanbanColumn;
