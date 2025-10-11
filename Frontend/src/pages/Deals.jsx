/**
 * Deals Page (Kanban Board)
 * Manage sales deals with drag-and-drop pipeline view
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { dealAPI, pipelineAPI } from '../services/api';
import { Plus, Search, Filter, TrendingUp, Grid3x3, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissionUtils';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import KanbanColumn from '../components/Deals/KanbanColumn';
import DealCard from '../components/DealCard';
import DealModal from '../components/Deals/DealModal';
import FilterPanel from '../components/Deals/FilterPanel';

const Deals = () => {
  const { t, i18n } = useTranslation(['common']);
  const isRTL = i18n.language === 'ar';
  const { user } = useAuth();

  // State
  const [deals, setDeals] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeDeal, setActiveDeal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [filters, setFilters] = useState({
    assignedTo: null,
    tags: [],
    probability: null,
    valueMin: null,
    valueMax: null,
    expectedClosePeriod: null,
    createdPeriod: null,
  });
  const [groupBy, setGroupBy] = useState('stage'); // stage, assignedTo, tags, expectedCloseDate, createdDate, probability
  const [showGroupByDropdown, setShowGroupByDropdown] = useState(false);
  const [groupBySearchTerm, setGroupBySearchTerm] = useState('');
  const groupByDropdownRef = useRef(null);

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

  // Debug permissions
  console.log('🔍 [DEBUG] User permissions:', {
    canView,
    canCreate,
    canEdit,
    canDelete,
    user: user?.email
  });

  useEffect(() => {
    console.log('🔍 [DEBUG] useEffect triggered, canView:', canView);
    if (canView) {
      loadPipelines();
    }
  }, [canView]);

  useEffect(() => {
    if (selectedPipeline) {
      loadDeals();
    }
  }, [selectedPipeline]);

  // Click outside to close Group By dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (groupByDropdownRef.current && !groupByDropdownRef.current.contains(event.target)) {
        setShowGroupByDropdown(false);
        setGroupBySearchTerm('');
      }
    };

    if (showGroupByDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showGroupByDropdown]);

  /**
   * Get Group By options with labels
   */
  const getGroupByOptions = () => {
    return [
      { value: 'stage', label: t('groupByStage'), icon: '📊' },
      { value: 'assignedTo', label: t('groupByAssignedTo'), icon: '👤' },
      { value: 'tags', label: t('groupByTags'), icon: '🏷️' },
      { value: 'expectedCloseDate', label: t('groupByExpectedClose'), icon: '📅' },
      { value: 'createdDate', label: t('groupByCreatedDate'), icon: '🕐' },
      { value: 'probability', label: t('groupByProbability'), icon: '📈' },
    ];
  };

  /**
   * Get filtered Group By options based on search
   */
  const getFilteredGroupByOptions = () => {
    const options = getGroupByOptions();
    if (!groupBySearchTerm) return options;

    return options.filter(option =>
      option.label.toLowerCase().includes(groupBySearchTerm.toLowerCase())
    );
  };

  /**
   * Get selected Group By label
   */
  const getSelectedGroupByLabel = () => {
    const option = getGroupByOptions().find(opt => opt.value === groupBy);
    return option ? `${option.icon} ${option.label}` : t('groupByStage');
  };

  /**
   * Convert period string to date range
   */
  const getPeriodDateRange = (period) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    let from, to;

    // Handle month-based periods (format: month-YEAR-MONTHINDEX)
    if (period && period.startsWith('month-')) {
      const parts = period.split('-');
      const year = parseInt(parts[1]);
      const monthIndex = parseInt(parts[2]);
      from = new Date(year, monthIndex, 1);
      // Get last day of month
      to = new Date(year, monthIndex + 1, 0);
      return { from, to };
    }

    switch (period) {
      case 'q1':
        from = new Date(currentYear, 0, 1); // Jan 1
        to = new Date(currentYear, 2, 31); // Mar 31
        break;
      case 'q2':
        from = new Date(currentYear, 3, 1); // Apr 1
        to = new Date(currentYear, 5, 30); // Jun 30
        break;
      case 'q3':
        from = new Date(currentYear, 6, 1); // Jul 1
        to = new Date(currentYear, 8, 30); // Sep 30
        break;
      case 'q4':
        from = new Date(currentYear, 9, 1); // Oct 1
        to = new Date(currentYear, 11, 31); // Dec 31
        break;
      case 'thisYear':
        from = new Date(currentYear, 0, 1);
        to = new Date(currentYear, 11, 31);
        break;
      case 'lastYear':
        from = new Date(currentYear - 1, 0, 1);
        to = new Date(currentYear - 1, 11, 31);
        break;
      default:
        return null;
    }

    return { from, to };
  };

  /**
   * Get grouped columns based on groupBy selection
   */
  const getGroupedColumns = () => {
    switch (groupBy) {
      case 'stage':
        return stages.map(stage => ({
          id: stage.id,
          name: stage.name,
          color: stage.color,
          type: 'stage'
        }));

      case 'assignedTo':
        // Get unique users from deals
        const users = [...new Set(deals.map(d => d.assigned_to).filter(Boolean))];
        const userColumns = users.map(userId => {
          const deal = deals.find(d => d.assigned_to === userId);
          return {
            id: userId,
            name: deal?.assigned_to_user?.full_name || deal?.assigned_to_user?.email || t('user'),
            type: 'user'
          };
        });
        // Add "Unassigned" column
        userColumns.push({
          id: 'unassigned',
          name: t('unassigned'),
          type: 'unassigned'
        });
        return userColumns;

      case 'tags':
        // Get unique tags from deals (filter out null/undefined values)
        const tagIds = [...new Set(
          deals.flatMap(d => (d.tags || []).filter(Boolean))
        )];

        const tagColumns = tagIds.map(tagId => {
          const deal = deals.find(d => d.tags?.includes(tagId));
          const tag = deal?.tag_details?.find(t => t.id === tagId);
          return {
            id: tagId,
            name: tag?.name || tag?.name_en || t('tag'),
            color: tag?.color,
            type: 'tag'
          };
        });

        // Add "No Tags" column
        tagColumns.push({
          id: 'notags',
          name: t('noTags'),
          type: 'notags'
        });
        return tagColumns;

      case 'expectedCloseDate':
        return [
          { id: 'overdue', name: t('overdue'), color: 'red', type: 'date' },
          { id: 'thisWeek', name: t('thisWeek'), color: 'orange', type: 'date' },
          { id: 'thisMonth', name: t('thisMonth'), color: 'yellow', type: 'date' },
          { id: 'later', name: t('later'), color: 'green', type: 'date' },
          { id: 'noDate', name: t('noDate'), color: 'gray', type: 'date' }
        ];

      case 'createdDate':
        return [
          { id: 'today', name: t('today'), color: 'green', type: 'date' },
          { id: 'thisWeek', name: t('thisWeek'), color: 'blue', type: 'date' },
          { id: 'thisMonth', name: t('thisMonth'), color: 'indigo', type: 'date' },
          { id: 'older', name: t('older'), color: 'gray', type: 'date' }
        ];

      case 'probability':
        return [
          { id: '0-25', name: '0-25%', color: 'red', type: 'probability' },
          { id: '26-50', name: '26-50%', color: 'orange', type: 'probability' },
          { id: '51-75', name: '51-75%', color: 'yellow', type: 'probability' },
          { id: '76-100', name: '76-100%', color: 'green', type: 'probability' }
        ];

      default:
        return [];
    }
  };

  /**
   * Get deals for a specific group
   */
  const getDealsByGroup = (groupId) => {
    // First apply all filters (search + advanced filters)
    let filteredDeals = deals.filter(deal => {
      // Search filter
      const matchesSearch = searchTerm
        ? deal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          deal.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          deal.company?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      // Assigned To filter
      const matchesAssignedTo = filters.assignedTo
        ? deal.assigned_to === filters.assignedTo
        : true;

      // Tags filter
      const matchesTags = filters.tags && filters.tags.length > 0
        ? deal.tags?.some(tagId => filters.tags.includes(tagId))
        : true;

      // Probability filter
      const matchesProbability = filters.probability
        ? (() => {
            const [min, max] = filters.probability.split('-').map(Number);
            const prob = deal.probability || 0;
            return prob >= min && prob <= max;
          })()
        : true;

      // Value range filter
      const matchesValueMin = filters.valueMin !== null
        ? (deal.value || 0) >= filters.valueMin
        : true;

      const matchesValueMax = filters.valueMax !== null
        ? (deal.value || 0) <= filters.valueMax
        : true;

      // Expected close date period filter
      const matchesExpectedClosePeriod = (() => {
        if (!filters.expectedClosePeriod) return true;
        const dateRange = getPeriodDateRange(filters.expectedClosePeriod);
        if (!dateRange || !deal.expected_close_date) return false;
        const dealDate = new Date(deal.expected_close_date);
        return dealDate >= dateRange.from && dealDate <= dateRange.to;
      })();

      // Created date period filter
      const matchesCreatedPeriod = (() => {
        if (!filters.createdPeriod) return true;
        const dateRange = getPeriodDateRange(filters.createdPeriod);
        if (!dateRange || !deal.created_at) return false;
        const dealDate = new Date(deal.created_at);
        return dealDate >= dateRange.from && dealDate <= dateRange.to;
      })();

      return (
        matchesSearch &&
        matchesAssignedTo &&
        matchesTags &&
        matchesProbability &&
        matchesValueMin &&
        matchesValueMax &&
        matchesExpectedClosePeriod &&
        matchesCreatedPeriod
      );
    });

    // Then apply grouping filter
    switch (groupBy) {
      case 'stage':
        return filteredDeals.filter(deal => deal.stage_id === groupId);

      case 'assignedTo':
        if (groupId === 'unassigned') {
          return filteredDeals.filter(deal => !deal.assigned_to);
        }
        return filteredDeals.filter(deal => deal.assigned_to === groupId);

      case 'tags':
        if (groupId === 'notags') {
          return filteredDeals.filter(deal => !deal.tags || deal.tags.length === 0);
        }
        // Show deal only in its FIRST tag's column (to avoid duplicates)
        return filteredDeals.filter(deal => {
          const firstTag = (deal.tags || []).filter(Boolean)[0];
          return firstTag === groupId;
        });

      case 'expectedCloseDate':
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        return filteredDeals.filter(deal => {
          if (!deal.expected_close_date && groupId === 'noDate') return true;
          if (!deal.expected_close_date) return false;

          const closeDate = new Date(deal.expected_close_date);

          switch (groupId) {
            case 'overdue':
              return closeDate < today;
            case 'thisWeek':
              return closeDate >= today && closeDate <= weekEnd;
            case 'thisMonth':
              return closeDate > weekEnd && closeDate <= monthEnd;
            case 'later':
              return closeDate > monthEnd;
            case 'noDate':
              return false;
            default:
              return false;
          }
        });

      case 'createdDate':
        return filteredDeals.filter(deal => {
          if (!deal.created_at) return false;

          const createdDate = new Date(deal.created_at);
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const weekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

          switch (groupId) {
            case 'today':
              return createdDate >= today;
            case 'thisWeek':
              return createdDate >= weekStart && createdDate < today;
            case 'thisMonth':
              return createdDate >= monthStart && createdDate < weekStart;
            case 'older':
              return createdDate < monthStart;
            default:
              return false;
          }
        });

      case 'probability':
        const [min, max] = groupId.split('-').map(Number);
        return filteredDeals.filter(deal => {
          const prob = deal.probability || 0;
          return prob >= min && prob <= max;
        });

      default:
        return filteredDeals;
    }
  };

  /**
   * Calculate group total value
   */
  const getGroupTotal = (groupId) => {
    return getDealsByGroup(groupId).reduce((sum, deal) => sum + (deal.value || 0), 0);
  };

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

    const activeDeal = deals.find(d => d.id === active.id);
    const overDeal = deals.find(d => d.id === over.id);

    if (!activeDeal) return;

    // Case 1: Reordering within the same stage (dropped on another deal)
    if (overDeal && activeDeal.stage_id === overDeal.stage_id) {
      console.log('🔄 [DEBUG] Reordering within stage:', activeDeal.stage_id);

      const oldIndex = deals.findIndex(d => d.id === active.id);
      const newIndex = deals.findIndex(d => d.id === over.id);

      if (oldIndex === newIndex) return;

      // Optimistic update - reorder immediately
      const reorderedDeals = arrayMove(deals, oldIndex, newIndex);
      setDeals(reorderedDeals);

      // Calculate new stage_order for the moved deal
      const stageDeals = reorderedDeals.filter(d => d.stage_id === activeDeal.stage_id);
      const newStageOrder = stageDeals.findIndex(d => d.id === active.id);

      try {
        await dealAPI.updateDeal(active.id, { stage_order: newStageOrder });
        console.log('✅ [DEBUG] Deal reordered successfully, new stage_order:', newStageOrder);
      } catch (error) {
        console.error('❌ [DEBUG] Error reordering deal:', error);
        toast.error(t('failedToUpdate', { resource: t('deal') }));

        // Rollback - restore original order
        setDeals(deals);
      }

      return;
    }

    // Case 2: Moving between stages (dropped on stage droppable zone)
    const newStageId = over.id;

    if (activeDeal.stage_id === newStageId) return;

    console.log('➡️ [DEBUG] Moving between stages:', activeDeal.stage_id, '→', newStageId);

    // Save original state for rollback
    const originalStageId = activeDeal.stage_id;

    // Optimistic update - move card immediately for smooth UX
    setDeals(prev => prev.map(d =>
      d.id === active.id ? { ...d, stage_id: newStageId } : d
    ));

    try {
      await dealAPI.moveDealToStage(active.id, newStageId);
      toast.success(t('dealMoved'));
    } catch (error) {
      console.error('❌ [DEBUG] Error moving deal:', error);
      toast.error(t('failedToUpdate', { resource: t('deal') }));

      // Rollback - move card back to original stage
      setDeals(prev => prev.map(d =>
        d.id === active.id ? { ...d, stage_id: originalStageId } : d
      ));
    }
  };

  /**
   * Get deals for a specific stage
   */
  const getDealsByStage = (stageId) => {
    return deals.filter(deal => {
      const matchesStage = deal.stage_id === stageId;

      // Search filter
      const matchesSearch = searchTerm
        ? deal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          deal.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          deal.company?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      // Assigned To filter
      const matchesAssignedTo = filters.assignedTo
        ? deal.assigned_to === filters.assignedTo
        : true;

      // Tags filter (deal must have at least one of the selected tags)
      const matchesTags = filters.tags && filters.tags.length > 0
        ? deal.tags?.some(tagId => filters.tags.includes(tagId))
        : true;

      // Probability filter
      const matchesProbability = filters.probability
        ? (() => {
            const [min, max] = filters.probability.split('-').map(Number);
            const prob = deal.probability || 0;
            return prob >= min && prob <= max;
          })()
        : true;

      // Value range filter
      const matchesValueMin = filters.valueMin !== null
        ? (deal.value || 0) >= filters.valueMin
        : true;

      const matchesValueMax = filters.valueMax !== null
        ? (deal.value || 0) <= filters.valueMax
        : true;

      // Expected close date period filter
      const matchesExpectedClosePeriod = (() => {
        if (!filters.expectedClosePeriod) return true;
        const dateRange = getPeriodDateRange(filters.expectedClosePeriod);
        if (!dateRange || !deal.expected_close_date) return false;
        const dealDate = new Date(deal.expected_close_date);
        return dealDate >= dateRange.from && dealDate <= dateRange.to;
      })();

      // Created date period filter
      const matchesCreatedPeriod = (() => {
        if (!filters.createdPeriod) return true;
        const dateRange = getPeriodDateRange(filters.createdPeriod);
        if (!dateRange || !deal.created_at) return false;
        const dealDate = new Date(deal.created_at);
        return dealDate >= dateRange.from && dealDate <= dateRange.to;
      })();

      return (
        matchesStage &&
        matchesSearch &&
        matchesAssignedTo &&
        matchesTags &&
        matchesProbability &&
        matchesValueMin &&
        matchesValueMax &&
        matchesExpectedClosePeriod &&
        matchesCreatedPeriod
      );
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

    setEditingDeal(null);
    setShowModal(true);
  };

  /**
   * Handle edit deal
   */
  const handleEditDeal = (deal) => {
    console.log('🔍 [DEBUG] Edit Deal clicked. Deal:', deal.title);
    if (!canEdit) {
      toast.error(t('insufficientPermissions'));
      return;
    }

    setEditingDeal(deal);
    setShowModal(true);
  };

  /**
   * Handle save deal (create/update)
   */
  const handleSaveDeal = () => {
    setShowModal(false);
    setEditingDeal(null);
    loadDeals();
  };

  /**
   * Handle delete deal
   */
  const handleDeleteDeal = (dealId) => {
    setDeals(prev => prev.filter(d => d.id !== dealId));
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
          </div>
        </div>

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
                  {i18n.language === 'ar' && pipeline.name_ar ? pipeline.name_ar : pipeline.name}
                </option>
              ))}
            </select>
          )}

          {/* Group By Selector - Searchable */}
          <div className="relative" ref={groupByDropdownRef}>
            <button
              onClick={() => setShowGroupByDropdown(!showGroupByDropdown)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition bg-white min-w-[220px] justify-between"
            >
              <div className="flex items-center gap-2">
                <Grid3x3 className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{getSelectedGroupByLabel()}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showGroupByDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showGroupByDropdown && (
              <div className={`absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 ${isRTL ? 'left-0' : 'right-0'}`}>
                {/* Search Box */}
                <div className="p-2 border-b border-gray-200">
                  <div className="relative">
                    <Search className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 ${isRTL ? 'right-2' : 'left-2'}`} />
                    <input
                      type="text"
                      value={groupBySearchTerm}
                      onChange={(e) => setGroupBySearchTerm(e.target.value)}
                      placeholder={t('search')}
                      className={`w-full text-xs py-1.5 border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${isRTL ? 'pr-7 pl-2' : 'pl-7 pr-2'}`}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Options List */}
                <div className="max-h-64 overflow-y-auto">
                  {getFilteredGroupByOptions().length === 0 ? (
                    <div className="px-3 py-2 text-xs text-gray-500 text-center">
                      {t('noResults')}
                    </div>
                  ) : (
                    getFilteredGroupByOptions().map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setGroupBy(option.value);
                          setShowGroupByDropdown(false);
                          setGroupBySearchTerm('');
                        }}
                        className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-50 flex items-center gap-2 ${
                          groupBy === option.value ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                        {groupBy === option.value && (
                          <span className={`${isRTL ? 'mr-auto' : 'ml-auto'} text-indigo-600`}>✓</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

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

        {/* Filter Panel */}
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          isOpen={showFilters}
        />
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-gray-50" style={{ minHeight: '600px' }}>
        {stages.length === 0 && groupBy === 'stage' ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">📋</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('noStages')}</h2>
              <p className="text-gray-600 mb-4">{t('addFirstStage')}</p>
            </div>
          </div>
        ) : (
          <>
            {console.log('🔍 [DEBUG] Rendering Kanban board, groupBy:', groupBy)}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 p-6 h-full">
                {console.log('🔍 [DEBUG] About to map grouped columns')}
                {getGroupedColumns().map((column) => {
                  console.log('🔍 [DEBUG] Mapping column:', column.name, column.id);
                  return (
                    <KanbanColumn
                      key={column.id}
                      stage={column}
                      deals={getDealsByGroup(column.id)}
                      totalValue={getGroupTotal(column.id)}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      onAddDeal={handleAddDeal}
                      onEditDeal={handleEditDeal}
                      onDeleteDeal={handleDeleteDeal}
                      groupBy={groupBy}
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
                    <DealCard deal={activeDeal} canEdit={false} canDelete={false} groupBy={groupBy} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </>
        )}
      </div>

      {/* Deal Modal */}
      {showModal && (
        <DealModal
          deal={editingDeal}
          pipeline={selectedPipeline}
          stages={stages}
          onSave={handleSaveDeal}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default Deals;
