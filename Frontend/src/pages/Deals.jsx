/**
 * Deals Page (Kanban Board) - Refactored
 * Manage sales deals with drag-and-drop pipeline view
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { dealAPI, pipelineAPI, contactAPI } from '../services/api';
import { Plus, Search, Filter, TrendingUp, Grid3x3, ChevronDown, DollarSign, Target, LayoutGrid, List } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissionUtils';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import KanbanColumn from '../components/Deals/KanbanColumn';
import DealCard from '../components/DealCard';
import DealModal from '../components/Deals/DealModal';
import FilterPanel from '../components/Deals/FilterPanel';
import DealListView from '../components/Deals/DealListView';

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
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'list'
  const [filters, setFilters] = useState({
    assignedTo: null,
    tags: [],
    probability: null,
    valueMin: null,
    valueMax: null,
    expectedClosePeriod: null,
    createdPeriod: null,
  });
  const [groupBy, setGroupBy] = useState('stage');
  const [showGroupByDropdown, setShowGroupByDropdown] = useState(false);
  const [groupBySearchTerm, setGroupBySearchTerm] = useState('');
  const groupByDropdownRef = useRef(null);
  const [quickAddSaving, setQuickAddSaving] = useState(false);
  const initialFilterSetRef = useRef(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Check permissions
  const canView = hasPermission(user, 'deals.view');
  const canCreate = hasPermission(user, 'deals.create');
  const canEdit = hasPermission(user, 'deals.edit');
  const canDelete = hasPermission(user, 'deals.delete');

  // Set default filter to logged-in user's deals (only on initial mount)
  useEffect(() => {
    if (user && user.id && !initialFilterSetRef.current) {
      setFilters(prev => ({
        ...prev,
        assignedTo: user.id
      }));
      initialFilterSetRef.current = true;
    }
  }, [user]);

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

  // Load pipelines on mount
  useEffect(() => {
    if (canView) {
      loadPipelines();
    }
  }, [canView]);

  // Load deals when pipeline changes
  useEffect(() => {
    if (selectedPipeline) {
      loadDeals();
    }
  }, [selectedPipeline]);

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
      to = new Date(year, monthIndex + 1, 0);
      return { from, to };
    }

    switch (period) {
      case 'q1':
        from = new Date(currentYear, 0, 1);
        to = new Date(currentYear, 2, 31);
        break;
      case 'q2':
        from = new Date(currentYear, 3, 1);
        to = new Date(currentYear, 5, 30);
        break;
      case 'q3':
        from = new Date(currentYear, 6, 1);
        to = new Date(currentYear, 8, 30);
        break;
      case 'q4':
        from = new Date(currentYear, 9, 1);
        to = new Date(currentYear, 11, 31);
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
        const users = [...new Set(deals.map(d => d.assigned_to).filter(Boolean))];
        const userColumns = users.map(userId => {
          const deal = deals.find(d => d.assigned_to === userId);
          return {
            id: userId,
            name: deal?.assigned_user?.full_name || deal?.assigned_user?.email || t('user'),
            type: 'user'
          };
        });
        userColumns.push({
          id: 'unassigned',
          name: t('unassigned'),
          type: 'unassigned'
        });
        return userColumns;

      case 'tags':
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
   * Calculate overall statistics
   */
  const getStats = () => {
    const totalValue = deals.reduce((sum, deal) => sum + (parseFloat(deal.value) || 0), 0);
    const avgDealSize = deals.length > 0 ? totalValue / deals.length : 0;
    const weightedValue = deals.reduce((sum, deal) => {
      const value = parseFloat(deal.value) || 0;
      const probability = parseInt(deal.probability) || 0;
      return sum + (value * probability / 100);
    }, 0);

    return { totalValue, avgDealSize, weightedValue };
  };

  /**
   * Load all pipelines
   */
  const loadPipelines = async () => {
    try {
      const response = await pipelineAPI.getPipelines();
      const pipelineList = response.data || [];
      setPipelines(pipelineList);

      if (pipelineList.length > 0) {
        const defaultPipeline = pipelineList.find(p => p.is_default) || pipelineList[0];
        setSelectedPipeline(defaultPipeline);
        setStages(defaultPipeline.stages || []);
      }
    } catch (error) {
      console.error('Error loading pipelines:', error);
      toast.error(t('failedToLoad', { resource: t('pipelines') }));
    }
  };

  /**
   * Load deals for selected pipeline
   */
  const loadDeals = async () => {
    try {
      setLoading(true);
      const response = await pipelineAPI.getPipelineDeals(selectedPipeline.id);
      setDeals(response.data || []);
    } catch (error) {
      console.error('Error loading deals:', error);
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
   * Handle deal drag over (no state updates - just visual feedback)
   */
  const handleDragOver = (event) => {
    // Visual feedback handled by KanbanColumn's isOver state
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

    // Case 1: Reordering within the same stage
    if (overDeal && activeDeal.stage_id === overDeal.stage_id) {
      const oldIndex = deals.findIndex(d => d.id === active.id);
      const newIndex = deals.findIndex(d => d.id === over.id);

      if (oldIndex === newIndex) return;

      const reorderedDeals = arrayMove(deals, oldIndex, newIndex);
      setDeals(reorderedDeals);

      const stageDeals = reorderedDeals.filter(d => d.stage_id === activeDeal.stage_id);
      const newStageOrder = stageDeals.findIndex(d => d.id === active.id);

      try {
        await dealAPI.updateDeal(active.id, { stage_order: newStageOrder });
      } catch (error) {
        console.error('Error reordering deal:', error);
        toast.error(t('failedToUpdate', { resource: t('deal') }));
        setDeals(deals);
      }

      return;
    }

    // Case 2: Moving between stages
    const newStageId = overDeal && overDeal.stage_id !== activeDeal.stage_id
      ? overDeal.stage_id
      : over.id;

    if (activeDeal.stage_id === newStageId) return;

    const originalStageId = activeDeal.stage_id;

    setDeals(prev => prev.map(d =>
      d.id === active.id ? { ...d, stage_id: newStageId } : d
    ));

    try {
      await dealAPI.moveDealToStage(active.id, newStageId);
      toast.success(t('dealMoved'));
    } catch (error) {
      console.error('Error moving deal:', error);
      toast.error(t('failedToUpdate', { resource: t('deal') }));

      setDeals(prev => prev.map(d =>
        d.id === active.id ? { ...d, stage_id: originalStageId } : d
      ));
    }
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
    if (!canCreate) {
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
  const handleDeleteDeal = async (deal) => {
    if (!canDelete) {
      toast.error(t('insufficientPermissions'));
      return;
    }

    if (!confirm(t('confirmDelete', { resource: deal.title }))) return;

    try {
      await dealAPI.deleteDeal(deal.id);
      toast.success(t('deleted', { resource: t('deal') }));
      setDeals(prev => prev.filter(d => d.id !== deal.id));
    } catch (error) {
      console.error('Error deleting deal:', error);
      toast.error(t('failedToDelete', { resource: t('deal') }));
    }
  };

  /**
   * Get all filtered deals (used by list view)
   */
  const getFilteredDeals = () => {
    return deals.filter(deal => {
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
  };

  /**
   * Handle contact search for quick-add
   */
  const handleContactSearch = async (query) => {
    try {
      const response = await contactAPI.getContacts({ search: query, limit: 10 });
      return response.data || [];
    } catch (error) {
      console.error('Error searching contacts:', error);
      return [];
    }
  };

  /**
   * Handle quick add deal from inline form
   */
  const handleQuickAddDeal = async (formData) => {
    try {
      setQuickAddSaving(true);

      let contactId = formData.contactId;

      // Create new contact if needed
      if (formData.createContact && !contactId) {
        try {
          const contactResponse = await contactAPI.createContact({
            name: formData.contactName,
            email: formData.email,
            phone: formData.phone,
            phone_country_code: formData.phone_country_code,
          });

          contactId = contactResponse.data.id;
          toast.success(t('contactCreated'));
        } catch (contactError) {
          if (contactError.response?.status === 409) {
            toast.error(t('contactPhoneExists'));
          } else {
            toast.error(t('failedToCreate', { resource: t('contact') }));
          }
          return;
        }
      }

      // Create deal
      const dealData = {
        title: formData.title,
        value: formData.value,
        currency: 'SAR',
        pipeline_id: selectedPipeline.id,
        stage_id: formData.stageId,
        contact_id: contactId,
        probability: 50,
      };

      await dealAPI.createDeal(dealData);
      toast.success(t('dealCreated'));
      loadDeals();
    } catch (error) {
      console.error('Error creating deal:', error);
      toast.error(t('failedToCreate', { resource: t('deal') }));
    } finally {
      setQuickAddSaving(false);
    }
  };

  const stats = getStats();

  // Permission guard
  if (!canView) {
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
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

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
            {/* View Toggle */}
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 text-sm transition ${
                  viewMode === 'cards'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title={t('cardView')}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm transition ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title={t('listView')}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

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

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-white border border-gray-200 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded">
                <Target className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">{t('deals')}</p>
                <p className="text-lg font-bold text-gray-900">{deals.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">{t('totalValue')}</p>
                <p className="text-lg font-bold text-gray-900">${stats.totalValue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded">
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">{t('avgDealSize')}</p>
                <p className="text-lg font-bold text-gray-900">${stats.avgDealSize.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded">
                <DollarSign className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">{t('weightedValue')}</p>
                <p className="text-lg font-bold text-gray-900">${stats.weightedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
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

          {/* Group By Selector - Only show in cards view */}
          {viewMode === 'cards' && (
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

        {/* Filter Panel */}
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          isOpen={showFilters}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-x-auto overflow-y-auto bg-gray-50" style={{ minHeight: '600px' }}>
        {viewMode === 'list' ? (
          /* List View */
          <div className="p-6">
            <DealListView
              deals={getFilteredDeals()}
              stages={stages}
              tags={[]}
              onEdit={handleEditDeal}
              onDelete={handleDeleteDeal}
              deletingId={null}
            />
          </div>
        ) : (
          /* Kanban Board View */
          <>
            {stages.length === 0 && groupBy === 'stage' ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('noStages')}</h2>
                  <p className="text-gray-600 mb-4">{t('addFirstStage')}</p>
                </div>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <div className="flex gap-4 p-6 h-full">
                  {getGroupedColumns().map((column) => (
                    <KanbanColumn
                      key={column.id}
                      stage={column}
                      deals={getDealsByGroup(column.id)}
                      totalValue={getGroupTotal(column.id)}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      onAddDeal={handleAddDeal}
                      onQuickAddDeal={handleQuickAddDeal}
                      onContactSearch={handleContactSearch}
                      onEditDeal={handleEditDeal}
                      onDeleteDeal={handleDeleteDeal}
                      groupBy={groupBy}
                      quickAddSaving={quickAddSaving}
                    />
                  ))}
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
            )}
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
