// Frontend/src/components/Deals/DealsKanban.jsx
import React from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import { KanbanColumn } from './KanbanColumn';
import { DealCard } from './DealCard';

export const DealsKanban = ({
  columns,
  getDealsByColumn,
  sensors,
  handleDragStart,
  handleDragEnd,
  handleDragCancel,
  collisionDetection,
  activeDeal,
  onEditDeal,
  onDeleteDeal,
  hasPermission,
  users
}) => {
  const { t } = useTranslation();

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {/* Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(column => {
          const columnDeals = getDealsByColumn(column.id);
          const columnValue = columnDeals.reduce(
            (sum, deal) => sum + (parseFloat(deal.value) || 0),
            0
          );

          return (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.name}
              count={columnDeals.length}
              value={columnValue}
              color={column.color}
              deals={columnDeals}
              onEditDeal={onEditDeal}
              onDeleteDeal={onDeleteDeal}
              hasPermission={hasPermission}
              users={users}
            />
          );
        })}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeDeal ? (
          <div className="opacity-80 transform rotate-2 scale-105">
            <DealCard
              deal={activeDeal}
              users={users}
              isDragging={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
