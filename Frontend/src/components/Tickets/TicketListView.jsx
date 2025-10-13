/**
 * Ticket List View Component
 * Table layout for displaying tickets
 *
 * @reusable
 * @category Tickets
 * @example
 * <TicketListView
 *   tickets={tickets}
 *   categories={categories}
 *   tags={tags}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   deletingId={deletingId}
 * />
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Trash2, User, Calendar, Clock } from 'lucide-react';
import { TicketStatusBadge, TicketPriorityBadge, TicketCategoryBadge } from './index';

const TicketListView = ({ tickets, categories, tags, onEdit, onDelete, deletingId }) => {
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.language === 'ar';

  /**
   * Format date for display (Gregorian calendar)
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    // Use 'en-US' for both languages to ensure Gregorian calendar display
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  /**
   * Format datetime for display
   */
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Get category info by ID
   */
  const getCategoryInfo = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category || null;
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
              <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('ticket')}
              </th>
              <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('ticketStatus')}
              </th>
              <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('ticketPriority')}
              </th>
              <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('ticketCategory')}
              </th>
              <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('assignedTo')}
              </th>
              <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('ticketDueDate')}
              </th>
              <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('ticketCreatedAt')}
              </th>
              <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('ticketTags')}
              </th>
              <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-left' : 'text-right'}`}>
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-4 py-8 text-center text-sm text-gray-500">
                  {t('noTickets')}
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => {
                const category = getCategoryInfo(ticket.category_id);
                const overdueTicket = isOverdue(ticket);

                return (
                  <tr key={ticket.id} className={`hover:bg-gray-50 transition-colors ${overdueTicket ? 'bg-red-50' : ''}`}>
                    {/* Ticket Number + Title */}
                    <td className="px-4 py-3">
                      <div className="min-w-0" style={{ maxWidth: '250px' }}>
                        <div className="text-xs font-mono text-gray-500 mb-1">
                          {ticket.ticket_number}
                        </div>
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {ticket.title}
                        </div>
                        {ticket.contact && (
                          <div className="text-xs text-gray-600 truncate mt-1">
                            {ticket.contact.name}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <TicketStatusBadge status={ticket.status} size="sm" />
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <TicketPriorityBadge priority={ticket.priority} size="sm" />
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {category ? (
                        <TicketCategoryBadge
                          slug={category.slug}
                          nameEn={category.name_en}
                          nameAr={category.name_ar}
                          color={category.color}
                          size="sm"
                        />
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>

                    {/* Assigned To */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {ticket.assigned_user ? (
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="truncate max-w-[150px]">
                            {ticket.assigned_user.full_name || ticket.assigned_user.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">{t('unassigned')}</span>
                      )}
                    </td>

                    {/* Due Date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {ticket.due_date ? (
                        <div className="flex items-center gap-1">
                          <Calendar className={`w-3 h-3 ${overdueTicket ? 'text-red-500' : 'text-gray-400'}`} />
                          <span className={`text-sm ${overdueTicket ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                            {formatDate(ticket.due_date)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>

                    {/* Created At */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{formatDate(ticket.created_at)}</span>
                      </div>
                    </td>

                    {/* Tags */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {ticket.tags && ticket.tags.length > 0 ? (
                          <>
                            {ticket.tags.slice(0, 2).map((tagId) => {
                              const tag = ticket.tag_details?.find(t => t.id === tagId);
                              return tag ? (
                                <span
                                  key={tag.id}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                  style={{
                                    backgroundColor: hexToRgba(tag.color, 0.15),
                                    color: tag.color || '#374151'
                                  }}
                                >
                                  {isRTL && tag.name_ar ? tag.name_ar : tag.name_en}
                                </span>
                              ) : null;
                            })}
                            {ticket.tags.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{ticket.tags.length - 2}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className={`px-4 py-3 whitespace-nowrap ${isRTL ? 'text-left' : 'text-right'}`}>
                      <div className={`flex items-center gap-2 ${isRTL ? 'justify-start' : 'justify-end'}`}>
                        <button
                          onClick={() => onEdit(ticket)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title={t('edit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(ticket)}
                          disabled={deletingId === ticket.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title={t('delete')}
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Results Summary */}
      {tickets.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            {t('results')}: <span className="font-medium">{tickets.length}</span> {t('tickets').toLowerCase()}
          </p>
        </div>
      )}
    </div>
  );
};

export default TicketListView;
