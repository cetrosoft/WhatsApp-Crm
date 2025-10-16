/**
 * Ticket Kanban View Component
 * Column-based board for displaying tickets grouped by status/priority/category/assignee
 *
 * @reusable
 * @category Tickets
 * @example
 * <TicketKanbanView
 *   tickets={tickets}
 *   columns={columns}
 *   groupBy="status"
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onAddTicket={handleAdd}
 *   canEdit={canEdit}
 *   canDelete={canDelete}
 * />
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, User, Calendar, Clock, Edit2, Trash2 } from 'lucide-react';
import { TicketStatusBadge, TicketPriorityBadge, TicketCategoryBadge, TicketQuickActions, QuickAddTicketCard } from './index';

const TicketKanbanView = ({
  tickets,
  columns,
  groupBy,
  getTicketsByGroup,
  onViewTicket,
  onEdit,
  onDelete,
  onAddTicket,
  onQuickAddTicket,
  onStatusChange,
  onPriorityChange,
  categories,
  users,
  contacts,
  companies,
  deals,
  quickAddSaving,
  canEdit,
  canDelete
}) => {
  const { t, i18n } = useTranslation(['common']);
  const isRTL = i18n.language === 'ar';

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if today
    if (date.toDateString() === today.toDateString()) {
      return t('today');
    }

    // Check if tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }

    // Otherwise show short date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  /**
   * Check if ticket is overdue
   */
  const isOverdue = (ticket) => {
    if (!ticket.due_date || ticket.status === 'closed' || ticket.status === 'resolved') {
      return false;
    }
    return new Date(ticket.due_date) < new Date();
  };

  /**
   * Get ticket age badge with color coding
   * Returns badge data including age text, colors, and overdue status
   */
  const getTicketAgeBadge = (ticket) => {
    if (!ticket.created_at) return null;

    const days = Math.floor((Date.now() - new Date(ticket.created_at)) / (1000 * 60 * 60 * 24));
    const overdueCheck = ticket.due_date &&
                         new Date(ticket.due_date) < new Date() &&
                         ticket.status !== 'closed' &&
                         ticket.status !== 'resolved';

    // Determine badge color based on age and overdue status
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-600';

    if (overdueCheck) {
      bgColor = 'bg-red-100';
      textColor = 'text-red-600';
    } else if (days >= 7) {
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-700';
    }

    // Format age text
    let ageText;
    if (days === 0) ageText = isRTL ? 'اليوم' : 'Today';
    else if (days === 1) ageText = isRTL ? 'أمس' : '1d';
    else ageText = isRTL ? `${days} يوم` : `${days}d`;

    return { ageText, bgColor, textColor, isOverdue: overdueCheck };
  };

  /**
   * Render ticket card
   */
  const TicketCard = ({ ticket }) => {
    const overdueTicket = isOverdue(ticket);
    const ageBadge = getTicketAgeBadge(ticket);

    return (
      <div
        className={`bg-white border rounded-lg p-3 mb-2 hover:shadow-md transition-shadow cursor-pointer ${
          overdueTicket ? 'border-red-300' : 'border-gray-200'
        }`}
        onClick={() => onViewTicket ? onViewTicket(ticket) : onEdit(ticket)}
      >
        {/* Ticket Number */}
        <div className="text-xs font-mono text-gray-500 mb-1">
          {ticket.ticket_number}
        </div>

        {/* Title */}
        <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
          {ticket.title}
        </h4>

        {/* Age Badge (with overdue indicator) */}
        {ageBadge && (
          <div className="flex items-center gap-1 mb-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ageBadge.bgColor} ${ageBadge.textColor}`}>
              <Clock className="w-3 h-3" />
              {ageBadge.ageText}
              {ageBadge.isOverdue && <span>⚠️</span>}
            </span>
          </div>
        )}

        {/* Quick Actions (Status + Priority) */}
        {onStatusChange && onPriorityChange && (
          <div className="mb-2" onClick={(e) => e.stopPropagation()}>
            <TicketQuickActions
              ticket={ticket}
              onStatusChange={onStatusChange}
              onPriorityChange={onPriorityChange}
              canEdit={canEdit}
            />
          </div>
        )}

        {/* Priority Badge (if not grouping by priority and no quick actions) */}
        {groupBy !== 'priority' && !onStatusChange && (
          <div className="mb-2">
            <TicketPriorityBadge priority={ticket.priority} size="sm" showIcon={false} />
          </div>
        )}

        {/* Status Badge (if not grouping by status and no quick actions) */}
        {groupBy !== 'status' && !onStatusChange && (
          <div className="mb-2">
            <TicketStatusBadge status={ticket.status} size="sm" />
          </div>
        )}

        {/* Category Badge (if not grouping by category) */}
        {groupBy !== 'category' && ticket.category && (
          <div className="mb-2">
            <TicketCategoryBadge
              slug={ticket.category.slug}
              nameEn={ticket.category.name_en}
              nameAr={ticket.category.name_ar}
              color={ticket.category.color}
              size="sm"
              showIcon={false}
            />
          </div>
        )}

        {/* Close Date */}
        {ticket.due_date && (
          <div className={`flex items-center gap-1 text-xs mb-2 ${overdueTicket ? 'text-red-600' : 'text-gray-600'}`}>
            <Calendar className="w-3 h-3" />
            <span>{formatDate(ticket.due_date)}</span>
          </div>
        )}

        {/* Assigned User (if not grouping by assigned_to) */}
        {groupBy !== 'assignedTo' && ticket.assigned_user && (
          <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
            <User className="w-3 h-3" />
            <span className="truncate">
              {ticket.assigned_user.full_name || ticket.assigned_user.email}
            </span>
          </div>
        )}

        {/* Contact */}
        {ticket.contact && (
          <div className="text-xs text-gray-500 truncate">
            {ticket.contact.name}
          </div>
        )}

        {/* Tags */}
        {ticket.tags && ticket.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {ticket.tags.slice(0, 2).map((tagId) => {
              const tag = ticket.tag_details?.find(t => t.id === tagId);
              return tag ? (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs"
                  style={{
                    backgroundColor: tag.color ? `${tag.color}20` : '#e5e7eb',
                    color: tag.color || '#374151'
                  }}
                >
                  {isRTL && tag.name_ar ? tag.name_ar : tag.name_en}
                </span>
              ) : null;
            })}
            {ticket.tags.length > 2 && (
              <span className="text-xs text-gray-500">+{ticket.tags.length - 2}</span>
            )}
          </div>
        )}

        {/* Actions (always visible) */}
        <div className="flex items-center justify-end gap-1 mt-2">
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(ticket);
              }}
              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
              title={t('edit')}
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(ticket);
              }}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title={t('delete')}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  };

  /**
   * Quick Add Card State per Column
   */
  const [showQuickAddForColumn, setShowQuickAddForColumn] = useState(null);

  /**
   * Render column
   */
  const Column = ({ column }) => {
    const ticketsInColumn = getTicketsByGroup(column.id);

    return (
      <div className="flex-shrink-0 w-64">
        {/* Column Header */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: column.color || '#6b7280' }}
              ></div>
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                {column.name}
              </h3>
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
                {ticketsInColumn.length}
              </span>
            </div>

            {canEdit && (
              <button
                onClick={() => setShowQuickAddForColumn(column.id)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm"
                title={t('quickAdd')}
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Column Content */}
        <div className="bg-gray-50 rounded-lg border-2 border-transparent p-3 min-h-[500px]">
          {/* Quick Add Card */}
          {showQuickAddForColumn === column.id && (
            <QuickAddTicketCard
              columnId={column.id}
              columnName={column.name}
              groupBy={groupBy}
              onSubmit={(data) => {
                onQuickAddTicket(data);
                setShowQuickAddForColumn(null);
              }}
              onCancel={() => setShowQuickAddForColumn(null)}
              categories={categories}
              users={users}
              contacts={contacts}
              companies={companies}
              deals={deals}
              saving={quickAddSaving}
            />
          )}

          {ticketsInColumn.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-center">
              <p className="text-sm text-gray-400">{t('noTickets')}</p>
            </div>
          ) : (
            <div className="space-y-0">
              {ticketsInColumn.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <Column key={column.id} column={column} />
      ))}
    </div>
  );
};

export default TicketKanbanView;
