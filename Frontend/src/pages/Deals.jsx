/**
 * Deals Page (Kanban Board)
 * Manage sales deals with drag-and-drop pipeline view
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { dealAPI, pipelineAPI } from '../services/api';
import { Plus, Search, Filter, TrendingUp, DollarSign, Target, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissionUtils';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanColumn from '../components/Deals/KanbanColumn';
import DealCard from '../components/DealCard';

const Deals = () => {
  const { t, i18n } = useTranslation(['common']);
  const isRTL = i18n.language === 'ar';
  const { user } = useAuth();

  // State
  const [deals, setDeals] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeDeal, setActiveDeal] = useState(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Check permission
  const canView = hasPermission(user, 'deals.view');
  const canCreate = hasPermission(user, 'deals.create');
  const canEdit = hasPermission(user, 'deals.edit');
  const canDelete = hasPermission(user, 'deals.delete');
  const canExport = hasPermission(user, 'deals.export');

  // Debug permissions
  console.log('🔍 [DEBUG] User permissions:', {
    canView,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    user: user?.email
  });

  useEffect(() => {
    console.log('🔍 [DEBUG] useEffect triggered, canView:', canView);
    if (canView) {
      loadPipelines();
      loadStats();
    }
  }, [canView]);

  useEffect(() => {
    if (selectedPipeline) {
      loadDeals();
    }
  }, [selectedPipeline]);

  /**
   * Load all pipelines
   */
  const loadPipelines = async () => {
    try {
      console.log('🔍 [DEBUG] Fetching pipelines...');
      const response = await pipelineAPI.getPipelines();
      console.log('🔍 [DEBUG] API Response:', response);

      const pipelineList = response.pipelines || [];
      console.log('🔍 [DEBUG] Pipelines found:', pipelineList.length, pipelineList);

      setPipelines(pipelineList);

      // Auto-select default or first pipeline
      if (pipelineList.length > 0) {
        const defaultPipeline = pipelineList.find(p => p.is_default) || pipelineList[0];
        console.log('🔍 [DEBUG] Selected pipeline:', defaultPipeline.name, 'Stages:', defaultPipeline.stages?.length);
        setSelectedPipeline(defaultPipeline);
        setStages(defaultPipeline.stages || []);
      } else {
        console.warn('⚠️ [DEBUG] No pipelines found! User may need to create one.');
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error loading pipelines:', error);
      toast.error(t('failedToLoad', { resource: t('pipelines') }));
    }
  };

  /**
   * Load deals for selected pipeline
   */
  const loadDeals = async () => {
    try {
      setLoading(true);
      console.log('🔍 [DEBUG] Loading deals for pipeline:', selectedPipeline.id);
      const response = await pipelineAPI.getPipelineDeals(selectedPipeline.id);
      console.log('🔍 [DEBUG] Deals response:', response.deals?.length, 'deals');
      setDeals(response.deals || []);
    } catch (error) {
      console.error('❌ [DEBUG] Error loading deals:', error);
      toast.error(t('failedToLoad', { resource: t('deals') }));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load deal statistics
   */
  const loadStats = async () => {
    try {
      console.log('🔍 [DEBUG] Loading stats...');
      const response = await dealAPI.getDealStats();
      console.log('🔍 [DEBUG] Stats response:', response.stats);
      setStats(response.stats || null);
    } catch (error) {
      console.error('❌ [DEBUG] Error loading stats:', error);
    }
  };

  /**
   * Handle deal drag start
   */
  const handleDragStart = (event) => {
    const { active } = event;
    const deal = deals.find(d => d.id === active.id);
    setActiveDeal(deal);
  };

  /**
   * Handle deal drag over
   * NOTE: No state updates here - just visual feedback via KanbanColumn isOver
   */
  const handleDragOver = (event) => {
    // Removed optimistic updates to prevent card disappearing during drag
    // Visual feedback is handled by KanbanColumn's isOver state
  };

  /**
   * Handle deal drag end
   */
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    setActiveDeal(null);

    if (!over || !canEdit) return;

    const dealId = active.id;
    const newStageId = over.id;
    const deal = deals.find(d => d.id === dealId);

    if (!deal || deal.stage_id === newStageId) return;

    // Save original state for rollback
    const originalStageId = deal.stage_id;

    // Optimistic update - move card immediately for smooth UX
    setDeals(prev => prev.map(d =>
      d.id === dealId ? { ...d, stage_id: newStageId } : d
    ));

    try {
      await dealAPI.moveDealToStage(dealId, newStageId);
      toast.success(t('dealMoved'));
      loadStats(); // Refresh stats
    } catch (error) {
      console.error('Error moving deal:', error);
      toast.error(t('failedToUpdate', { resource: t('deal') }));

      // Rollback - move card back to original stage
      setDeals(prev => prev.map(d =>
        d.id === dealId ? { ...d, stage_id: originalStageId } : d
      ));
    }
  };

  /**
   * Get deals for a specific stage
   */
  const getDealsByStage = (stageId) => {
    return deals.filter(deal => {
      const matchesStage = deal.stage_id === stageId;
      const matchesSearch = searchTerm
        ? deal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          deal.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          deal.company?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      return matchesStage && matchesSearch;
    });
  };

  /**
   * Calculate stage total value
   */
  const getStageTotal = (stageId) => {
    return getDealsByStage(stageId).reduce((sum, deal) => sum + (deal.value || 0), 0);
  };

  /**
   * Handle pipeline change
   */
  const handlePipelineChange = (pipeline) => {
    setSelectedPipeline(pipeline);
    setStages(pipeline.stages || []);
    setDeals([]);
  };

  /**
   * Handle add deal
   */
  const handleAddDeal = () => {
    console.log('🔍 [DEBUG] Add Deal clicked. canCreate:', canCreate);
    if (!canCreate) {
      console.warn('⚠️ [DEBUG] Insufficient permissions to create deal');
      toast.error(t('insufficientPermissions'));
      return;
    }
    // TODO: Open deal modal (Session 2)
    console.log('✅ [DEBUG] Showing placeholder toast for Session 2');
    toast('Deal modal coming in Session 2', { icon: 'ℹ️' });
  };

  /**
   * Handle export
   */
  const handleExport = () => {
    if (!canExport) {
      toast.error(t('insufficientPermissions'));
      return;
    }
    // TODO: Implement export (Session 3)
    toast('Export feature coming in Session 3', { icon: 'ℹ️' });
  };

  // Debug state
  console.log('🔍 [DEBUG] Current state:', {
    pipelines: pipelines.length,
    stages: stages.length,
    deals: deals.length,
    selectedPipeline: selectedPipeline?.name,
    loading
  });

  // Permission guard
  if (!canView) {
    console.warn('⚠️ [DEBUG] No view permission - showing permission denied page');
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('insufficientPermissions')}</h2>
          <p className="text-gray-600">{t('contactAdmin')}</p>
        </div>
      </div>
    );
  }

  if (loading && deals.length === 0) {
    console.log('🔍 [DEBUG] Showing loading spinner');
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  console.log('🔍 [DEBUG] Rendering Deals page with stages:', stages.length);

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('deals')}</h1>
              <p className="text-sm text-gray-600">
                {deals.length} {t('deals').toLowerCase()} • {stages.length} {t('stages').toLowerCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canCreate && (
              <button
                onClick={handleAddDeal}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{t('addDeal')}</span>
              </button>
            )}
            {canExport && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">{t('export')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">{t('open')}</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.open_count || 0}</p>
                </div>
                <Target className="w-8 h-8 text-blue-600 opacity-50" />
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">{t('wonDeals')}</p>
                  <p className="text-2xl font-bold text-green-900">{stats.won_count || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600 opacity-50" />
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">{t('totalRevenue')}</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(stats.total_revenue || 0)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600 opacity-50" />
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">{t('averageDealSize')}</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(stats.average_deal_size || 0)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-orange-600 opacity-50" />
              </div>
            </div>
          </div>
        )}

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4">
          {/* Pipeline Selector */}
          {pipelines.length > 1 && (
            <select
              value={selectedPipeline?.id || ''}
              onChange={(e) => {
                const pipeline = pipelines.find(p => p.id === e.target.value);
                if (pipeline) handlePipelineChange(pipeline);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {pipelines.map(pipeline => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>
          )}

          {/* Search */}
          <div className="flex-1 relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('search')}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${isRTL ? 'pr-10' : 'pl-10'}`}
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">{t('filter')}</span>
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-gray-50" style={{ minHeight: '600px' }}>
        {stages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">📋</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('noStages')}</h2>
              <p className="text-gray-600 mb-4">{t('addFirstStage')}</p>
            </div>
          </div>
        ) : (
          <>
            {console.log('🔍 [DEBUG] Rendering Kanban board, stages:', stages)}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 p-6 h-full">
                {console.log('🔍 [DEBUG] About to map stages:', stages.length)}
                {stages.map((stage) => {
                  console.log('🔍 [DEBUG] Mapping stage:', stage.name, stage.id);
                  return (
                    <KanbanColumn
                      key={stage.id}
                      stage={stage}
                      deals={getDealsByStage(stage.id)}
                      totalValue={getStageTotal(stage.id)}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      onAddDeal={handleAddDeal}
                    />
                  );
                })}
              </div>

              <DragOverlay>
                {activeDeal ? (
                  <div
                    style={{
                      transform: 'rotate(3deg) scale(1.05)',
                      cursor: 'grabbing',
                    }}
                    className="shadow-2xl"
                  >
                    <DealCard deal={activeDeal} canEdit={false} canDelete={false} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </>
        )}
      </div>
    </div>
  );
};

export default Deals;
