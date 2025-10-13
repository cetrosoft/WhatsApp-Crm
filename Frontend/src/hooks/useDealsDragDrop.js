// Frontend/src/hooks/useDealsDragDrop.js
import { useState, useCallback } from 'react';
import { PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { crmAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const useDealsDragDrop = (deals, setDeals, selectedPipeline) => {
  const { t } = useTranslation();
  const [activeDeal, setActiveDeal] = useState(null);
  const [previousDeals, setPreviousDeals] = useState(null);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  );

  // Handle drag start
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    const deal = deals.find(d => d.id === active.id);

    if (deal) {
      setActiveDeal(deal);
      // Save current state for rollback
      setPreviousDeals([...deals]);
    }
  }, [deals]);

  // Handle drag end with optimistic update
  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over || active.id === over.id) {
      return;
    }

    const dealId = active.id;
    const newStageId = over.id;

    // Find the deal being moved
    const deal = deals.find(d => d.id === dealId);
    if (!deal || deal.stageId === newStageId) {
      return;
    }

    // Optimistic update
    const updatedDeals = deals.map(d =>
      d.id === dealId ? { ...d, stageId: newStageId } : d
    );
    setDeals(updatedDeals);

    try {
      // Update on server
      await crmAPI.patch(`/deals/${dealId}`, { stageId: newStageId });
      toast.success(t('deals.success.moved'));
    } catch (error) {
      console.error('Error moving deal:', error);
      toast.error(t('deals.errors.move'));

      // Rollback on error
      if (previousDeals) {
        setDeals(previousDeals);
      }
    } finally {
      setPreviousDeals(null);
    }
  }, [deals, setDeals, previousDeals, t]);

  // Handle drag cancel
  const handleDragCancel = useCallback(() => {
    setActiveDeal(null);

    // Rollback if drag was cancelled
    if (previousDeals) {
      setDeals(previousDeals);
      setPreviousDeals(null);
    }
  }, [previousDeals, setDeals]);

  return {
    // DnD state
    activeDeal,
    sensors,

    // DnD handlers
    handleDragStart,
    handleDragEnd,
    handleDragCancel,

    // DnD config
    collisionDetection: closestCorners,
  };
};
