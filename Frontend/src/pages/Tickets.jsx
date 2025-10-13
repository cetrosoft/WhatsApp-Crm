/**
 * Tickets Page - Dual View (Kanban + List)
 * Manage support tickets with drag-and-drop status board
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Filter, Ticket as TicketIcon, Grid3x3, ChevronDown, LayoutGrid, List, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissionUtils';
import { ticketAPI, userAPI } from '../services/api';

// Import components
import { TicketListView, TicketKanbanView, TicketModal, TicketFilters } from '../components/Tickets';

const Tickets = () => {
  const { t, i18n } = useTranslation(['common']);
  const isRTL = i18n.language === 'ar';
  const { user } = useAuth();

  // State
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'list'
  const [filters, setFilters] = useState({
    status: null,
    priority: null,
    category: null,
    assignedTo: null,
    tags: [],
    showOverdue: false,
    showUnassigned: false,
    dueDateFrom: null,
    dueDateTo: null,
  });
  const [groupBy, setGroupBy] = useState('status');
  const [showGroupByDropdown, setShowGroupByDropdown] = useState(false);
  const [groupBySearchTerm, setGroupBySearchTerm] = useState('');
  const groupByDropdownRef = useRef(null);
  const initialFilterSetRef = useRef(false);

  // Check permissions
  const canView = hasPermission(user, 'tickets.view');
  const canCreate = hasPermission(user, 'tickets.create');
  const canEdit = hasPermission(user, 'tickets.edit');
  const canDelete = hasPermission(user, 'tickets.delete');

  // Set default filter to logged-in user's tickets (only on initial mount)
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

  // Load tickets on mount
  useEffect(() => {
    if (canView) {
      loadTickets();
      loadCategories();
      loadUsers();
    }
  }, [canView]);

  /**
   * Get Group By options with labels
   */
  const getGroupByOptions = () => {
    return [
      { value: 'status', label: t('filterByStatus'), icon: '📊' },
      { value: 'priority', label: t('filterByPriority'), icon: '⚡' },
      { value: 'category', label: t('filterByCategory'), icon: '📁' },
      { value: 'assignedTo', label: t('filterByAssignee'), icon: '👤' },
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
    return option ? `${option.icon} ${option.label}` : t('filterByStatus');
  };

  /**
   * Get grouped columns based on groupBy selection
   */
  const getGroupedColumns = () => {
    switch (groupBy) {
      case 'status':
        return [
          { id: 'open', name: t('statusOpen'), color: '#3b82f6', type: 'status' },
          { id: 'in_progress', name: t('statusInProgress'), color: '#eab308', type: 'status' },
          { id: 'waiting', name: t('statusWaiting'), color: '#a855f7', type: 'status' },
          { id: 'resolved', name: t('statusResolved'), color: '#22c55e', type: 'status' },
          { id: 'closed', name: t('statusClosed'), color: '#6b7280', type: 'status' },
        ];

      case 'priority':
        return [
          { id: 'low', name: t('priorityLow'), color: '#22c55e', type: 'priority' },
          { id: 'medium', name: t('priorityMedium'), color: '#eab308', type: 'priority' },
          { id: 'high', name: t('priorityHigh'), color: '#f97316', type: 'priority' },
          { id: 'urgent', name: t('priorityUrgent'), color: '#ef4444', type: 'priority' },
        ];

      case 'category':
        const categoryColumns = categories.map(cat => ({
          id: cat.id,
          name: isRTL && cat.name_ar ? cat.name_ar : cat.name_en,
          color: cat.color || '#6b7280',
          type: 'category'
        }));
        return categoryColumns;

      case 'assignedTo':
        const assignedUsers = [...new Set(tickets.map(t => t.assigned_to).filter(Boolean))];
        const userColumns = assignedUsers.map(userId => {
          const ticket = tickets.find(t => t.assigned_to === userId);
          const assignedUser = users.find(u => u.id === userId);
          return {
            id: userId,
            name: assignedUser?.full_name || assignedUser?.email || ticket?.assigned_user?.full_name || ticket?.assigned_user?.email || t('user'),
            type: 'user'
          };
        });
        userColumns.push({
          id: 'unassigned',
          name: t('unassigned'),
          type: 'unassigned'
        });
        return userColumns;

      default:
        return [];
    }
  };

  /**
   * Get tickets for a specific group
   */
  const getTicketsByGroup = (groupId) => {
    // First apply all filters
    let filteredTickets = getFilteredTickets();

    // Then apply grouping filter
    switch (groupBy) {
      case 'status':
        return filteredTickets.filter(ticket => ticket.status === groupId);

      case 'priority':
        return filteredTickets.filter(ticket => ticket.priority === groupId);

      case 'category':
        return filteredTickets.filter(ticket => ticket.category_id === groupId);

      case 'assignedTo':
        if (groupId === 'unassigned') {
          return filteredTickets.filter(ticket => !ticket.assigned_to);
        }
        return filteredTickets.filter(ticket => ticket.assigned_to === groupId);

      default:
        return filteredTickets;
    }
  };

  /**
   * Get all filtered tickets (used by list view and grouping)
   */
  const getFilteredTickets = () => {
    return tickets.filter(ticket => {
      // Search filter
      const matchesSearch = searchTerm
        ? ticket.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      // Status filter
      const matchesStatus = filters.status
        ? ticket.status === filters.status
        : true;

      // Priority filter
      const matchesPriority = filters.priority
        ? ticket.priority === filters.priority
        : true;

      // Category filter
      const matchesCategory = filters.category
        ? ticket.category_id === filters.category
        : true;

      // Assigned To filter
      const matchesAssignedTo = filters.assignedTo
        ? ticket.assigned_to === filters.assignedTo
        : true;

      // Tags filter
      const matchesTags = filters.tags && filters.tags.length > 0
        ? ticket.tags?.some(tagId => filters.tags.includes(tagId))
        : true;

      // Show Overdue filter
      const matchesOverdue = filters.showOverdue
        ? ticket.due_date && new Date(ticket.due_date) < new Date() && ticket.status !== 'closed'
        : true;

      // Show Unassigned filter
      const matchesUnassigned = filters.showUnassigned
        ? !ticket.assigned_to
        : true;

      // Due Date Range filter
      const matchesDueDateFrom = filters.dueDateFrom
        ? ticket.due_date && new Date(ticket.due_date) >= new Date(filters.dueDateFrom)
        : true;

      const matchesDueDateTo = filters.dueDateTo
        ? ticket.due_date && new Date(ticket.due_date) <= new Date(filters.dueDateTo)
        : true;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesCategory &&
        matchesAssignedTo &&
        matchesTags &&
        matchesOverdue &&
        matchesUnassigned &&
        matchesDueDateFrom &&
        matchesDueDateTo
      );
    });
  };

  /**
   * Calculate statistics
   */
  const getStats = () => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'open').length;
    const inProgress = tickets.filter(t => t.status === 'in_progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    const overdue = tickets.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'closed').length;

    return { total, open, inProgress, resolved, overdue };
  };

  /**
   * Load all tickets
   */
  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketAPI.getTickets();
      setTickets(response.tickets || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error(t('failedToLoad', { resource: t('tickets') }));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load categories
   */
  const loadCategories = async () => {
    try {
      const response = await ticketAPI.getCategories();
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  /**
   * Load users for assignment
   */
  const loadUsers = async () => {
    try {
      const response = await userAPI.getUsers();
      setUsers(response.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  /**
   * Handle add ticket
   */
  const handleAddTicket = () => {
    if (!canCreate) {
      toast.error(t('insufficientPermissions'));
      return;
    }

    setEditingTicket(null);
    setShowModal(true);
  };

  /**
   * Handle edit ticket
   */
  const handleEditTicket = (ticket) => {
    if (!canEdit) {
      toast.error(t('insufficientPermissions'));
      return;
    }

    setEditingTicket(ticket);
    setShowModal(true);
  };

  /**
   * Handle save ticket (create/update)
   */
  const handleSaveTicket = () => {
    setShowModal(false);
    setEditingTicket(null);
    loadTickets();
  };

  /**
   * Handle delete ticket
   */
  const handleDeleteTicket = async (ticket) => {
    if (!canDelete) {
      toast.error(t('insufficientPermissions'));
      return;
    }

    if (!confirm(t('confirmDeleteTicket'))) return;

    try {
      await ticketAPI.deleteTicket(ticket.id);
      toast.success(t('ticketDeleted'));
      setTickets(prev => prev.filter(t => t.id !== ticket.id));
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error(t('failedToDelete', { resource: t('ticket') }));
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

  if (loading && tickets.length === 0) {
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
              <TicketIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('tickets')}</h1>
              <p className="text-sm text-gray-600">
                {tickets.length} {t('tickets').toLowerCase()}
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
                onClick={handleAddTicket}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{t('createTicket')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-white border border-gray-200 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded">
                <TicketIcon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">{t('tickets')}</p>
                <p className="text-lg font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded">
                <AlertCircle className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">{t('statusOpen')}</p>
                <p className="text-lg font-bold text-gray-900">{stats.open}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-100 rounded">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">{t('statusInProgress')}</p>
                <p className="text-lg font-bold text-gray-900">{stats.inProgress}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">{t('overdue')}</p>
                <p className="text-lg font-bold text-gray-900">{stats.overdue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4">
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
        <TicketFilters
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
            <TicketListView
              tickets={getFilteredTickets()}
              categories={categories}
              tags={[]}
              onEdit={handleEditTicket}
              onDelete={handleDeleteTicket}
              deletingId={null}
            />
          </div>
        ) : (
          /* Kanban Board View */
          <div className="p-6">
            <TicketKanbanView
              tickets={tickets}
              columns={getGroupedColumns()}
              groupBy={groupBy}
              getTicketsByGroup={getTicketsByGroup}
              onEdit={handleEditTicket}
              onDelete={handleDeleteTicket}
              onAddTicket={handleAddTicket}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          </div>
        )}
      </div>

      {/* Ticket Modal */}
      {showModal && (
        <TicketModal
          ticket={editingTicket}
          onSave={handleSaveTicket}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default Tickets;
